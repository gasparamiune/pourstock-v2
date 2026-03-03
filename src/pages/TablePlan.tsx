import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PdfUploader } from '@/components/tableplan/PdfUploader';
import { FloorPlan, TABLE_LAYOUT, assignTablesToReservations, type Assignments, type MergeGroup } from '@/components/tableplan/FloorPlan';
import { PreparationSummary } from '@/components/tableplan/PreparationSummary';
import { AddReservationDialog } from '@/components/tableplan/AddReservationDialog';
import { ReservationDetailDialog } from '@/components/tableplan/ReservationDetailDialog';
import type { Reservation } from '@/components/tableplan/TableCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save, Loader2, FolderOpen, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

function stripB(id: string) { return id.replace('B', ''); }

// Serialization helpers for Map
function serializeAssignments(a: Assignments): object {
  const singlesObj: Record<string, Reservation> = {};
  a.singles.forEach((v, k) => { singlesObj[k] = v; });
  return { singles: singlesObj, merges: a.merges };
}

function deserializeAssignments(obj: any): Assignments {
  const singles = new Map<string, Reservation>();
  if (obj.singles) {
    for (const [k, v] of Object.entries(obj.singles)) {
      singles.set(k, v as Reservation);
    }
  }
  return { singles, merges: obj.merges || [] };
}

export default function TablePlan() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignments | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [undoMap, setUndoMap] = useState<Map<string, Reservation>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastSaveRef = useRef<number>(0);

  // Dialog state
  const [addDialogTable, setAddDialogTable] = useState<string | null>(null);
  const [detailDialogTable, setDetailDialogTable] = useState<string | null>(null);

  // Auto-save preference
  const autoSaveEnabled = localStorage.getItem('pourstock-autosave-tableplan') !== 'false';

  // Load saved plans on mount
  useEffect(() => {
    loadSavedPlans();
  }, []);

  // Auto-load today's plan on mount
  useEffect(() => {
    const loadToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('table_plans')
        .select('*')
        .eq('plan_date', today)
        .maybeSingle();
      if (data) {
        setAssignments(deserializeAssignments(data.assignments_json));
      }
    };
    loadToday();
  }, []);

  // Realtime subscription for table_plans
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const channel = supabase
      .channel('table-plan-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_plans', filter: `plan_date=eq.${today}` },
        (payload) => {
          // Skip echo: ignore events within 2s of our own save
          if (Date.now() - lastSaveRef.current < 2000) return;
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = (payload as any).new;
            if (newData?.assignments_json) {
              setAssignments(deserializeAssignments(newData.assignments_json));
            }
          }
          loadSavedPlans();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadSavedPlans = async () => {
    const { data } = await supabase
      .from('table_plans')
      .select('*')
      .order('plan_date', { ascending: false })
      .limit(20);
    if (data) setSavedPlans(data);
  };

  // Auto-save with 500ms debounce for near-instant sync
  const triggerAutoSave = useCallback((newAssignments: Assignments) => {
    if (!autoSaveEnabled || !user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('idle');
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const today = new Date().toISOString().split('T')[0];
      const name = `${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })} - Aften`;
      lastSaveRef.current = Date.now();
      const { error } = await supabase.from('table_plans').upsert(
        {
          plan_date: today,
          created_by: user.id,
          name,
          assignments_json: serializeAssignments(newAssignments) as any,
        } as any,
        { onConflict: 'plan_date' }
      );
      setSaveStatus(error ? 'idle' : 'saved');
      if (!error) loadSavedPlans();
    }, 500);
  }, [autoSaveEnabled, user]);

  // Wrapper to update assignments + trigger auto-save
  const updateAssignments = useCallback((updater: (prev: Assignments | null) => Assignments | null) => {
    setAssignments(prev => {
      const next = updater(prev);
      if (next) triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  // Merge coffee-only entries into their parent reservation by room number
  const mergeCoffeeEntries = (reservations: Reservation[]): Reservation[] => {
    const coffeeOnly: Reservation[] = [];
    const regular: Reservation[] = [];
    for (const r of reservations) {
      // A coffee-only entry: has coffeeOnly or coffeeTeaSweet, and typically has dishCount 0 or reservationType bordreservation with no real food
      const isCoffeeEntry = (r.coffeeOnly || r.coffeeTeaSweet) && r.roomNumber && r.reservationType === 'bordreservation' && r.dishCount <= 1;
      if (isCoffeeEntry) {
        coffeeOnly.push(r);
      } else {
        regular.push(r);
      }
    }
    // Merge coffee entries into matching room reservations
    for (const coffee of coffeeOnly) {
      const match = regular.find(r => r.roomNumber === coffee.roomNumber);
      if (match) {
        match.coffeeOnly = coffee.coffeeOnly || match.coffeeOnly;
        match.coffeeTeaSweet = coffee.coffeeTeaSweet || match.coffeeTeaSweet;
      } else {
        // No match found, keep as standalone
        regular.push(coffee);
      }
    }
    return regular;
  };

  const handleUpload = async (pdfBase64: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-table-plan', {
        body: { pdfBase64 },
      });
      if (error) throw error;
      const parsed: Reservation[] = Array.isArray(data) ? data : [];
      const merged = mergeCoffeeEntries(parsed);
      const result = assignTablesToReservations(merged);
      setAssignments(result);
      triggerAutoSave(result);
      toast({
        title: t('tablePlan.extracted'),
        description: `${merged.length} ${t('tablePlan.reservationsFound')}`,
      });
    } catch (err) {
      console.error('PDF parse error:', err);
      toast({ title: t('tablePlan.error'), description: t('tablePlan.errorDesc'), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => setAssignments(null);

  const handleLoadPlan = (plan: any) => {
    const loaded = deserializeAssignments(plan.assignments_json);
    setAssignments(loaded);
    toast({ title: t('tablePlan.saved'), description: plan.name });
  };

  const handleDeletePlan = async (planId: string) => {
    await supabase.from('table_plans').delete().eq('id', planId);
    loadSavedPlans();
  };

  // --- Editable callbacks ---

  const findReservationForTable = useCallback((tableId: string): Reservation | undefined => {
    if (!assignments) return undefined;
    if (assignments.singles.has(tableId)) return assignments.singles.get(tableId);
    for (const mg of assignments.merges) {
      if (mg.tables.some(t => t.id === tableId) && mg.reservation) return mg.reservation;
    }
    return undefined;
  }, [assignments]);

  const findMergeGroupForTable = useCallback((tableId: string): { mg: MergeGroup; index: number } | null => {
    if (!assignments) return null;
    for (let i = 0; i < assignments.merges.length; i++) {
      const mg = assignments.merges[i];
      if (mg.tables.some(t => t.id === tableId)) return { mg, index: i };
    }
    return null;
  }, [assignments]);

  // Fixed: handles both singles and merges for source and target
  const onMoveReservation = useCallback((fromId: string, toId: string) => {
    if (!assignments) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      const newMerges = [...prev.merges];

      // Helper to get/remove reservation from source
      const getFromSource = (id: string): Reservation | null => {
        if (newSingles.has(id)) {
          const r = newSingles.get(id)!;
          newSingles.delete(id);
          return r;
        }
        for (let i = 0; i < newMerges.length; i++) {
          if (newMerges[i].tables[0].id === id && newMerges[i].reservation) {
            const r = newMerges[i].reservation!;
            newMerges[i] = { ...newMerges[i], reservation: null };
            return r;
          }
        }
        return null;
      };

      const getToTarget = (id: string): Reservation | null => {
        if (newSingles.has(id)) {
          const r = newSingles.get(id)!;
          newSingles.delete(id);
          return r;
        }
        for (let i = 0; i < newMerges.length; i++) {
          if (newMerges[i].tables[0].id === id && newMerges[i].reservation) {
            const r = newMerges[i].reservation!;
            newMerges[i] = { ...newMerges[i], reservation: null };
            return r;
          }
        }
        return null;
      };

      const fromRes = getFromSource(fromId);
      const toRes = getToTarget(toId);

      // Place reservations in target locations
      const placeRes = (id: string, res: Reservation) => {
        for (let i = 0; i < newMerges.length; i++) {
          if (newMerges[i].tables[0].id === id) {
            newMerges[i] = { ...newMerges[i], reservation: res };
            return;
          }
        }
        newSingles.set(id, res);
      };

      if (fromRes) placeRes(toId, fromRes);
      if (toRes) placeRes(fromId, toRes);

      return { singles: newSingles, merges: newMerges };
    });
  }, [assignments, updateAssignments]);

  // Handles both new merges and extending existing ones
  const onMerge = useCallback((tableId1: string, tableId2: string) => {
    if (!assignments) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      const newMerges = [...prev.merges];

      // Check if either table is already in a merge group
      let existingIdx = -1;
      let newTableId: string | null = null;
      for (let i = 0; i < newMerges.length; i++) {
        const ids = newMerges[i].tables.map(t => t.id);
        if (ids.includes(tableId1) && !ids.includes(tableId2)) {
          existingIdx = i;
          newTableId = tableId2;
          break;
        }
        if (ids.includes(tableId2) && !ids.includes(tableId1)) {
          existingIdx = i;
          newTableId = tableId1;
          break;
        }
      }

      if (existingIdx >= 0 && newTableId) {
        // Extend existing merge group
        const mg = newMerges[existingIdx];
        const newTable = TABLE_LAYOUT.find(t => t.id === newTableId)!;
        const tables = [...mg.tables, newTable].sort((a, b) => a.col - b.col);
        const combinedCapacity = tables.reduce((s, t) => s + t.capacity, 0);

        // Collect any single reservation from the new table
        let reservation = mg.reservation;
        if (newSingles.has(newTableId)) {
          if (!reservation) reservation = newSingles.get(newTableId)!;
          newSingles.delete(newTableId);
        }

        newMerges[existingIdx] = {
          tables,
          combinedCapacity,
          reservation,
          startCol: tables[0].col,
          colSpan: tables.length,
          row: tables[0].row,
        };
      } else {
        // New 2-table merge
        const t1 = TABLE_LAYOUT.find(t => t.id === tableId1)!;
        const t2 = TABLE_LAYOUT.find(t => t.id === tableId2)!;
        const tables = [t1, t2].sort((a, b) => a.col - b.col);
        const combinedCapacity = tables.reduce((s, t) => s + t.capacity, 0);

        let reservation: Reservation | null = null;
        for (const t of tables) {
          if (newSingles.has(t.id)) {
            if (!reservation) reservation = newSingles.get(t.id)!;
            newSingles.delete(t.id);
          }
        }

        newMerges.push({
          tables,
          combinedCapacity,
          reservation,
          startCol: tables[0].col,
          colSpan: tables.length,
          row: tables[0].row,
        });
      }

      return { singles: newSingles, merges: newMerges };
    });
  }, [assignments, updateAssignments]);

  const onUnmerge = useCallback((mergeIndex: number) => {
    if (!assignments) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      const newMerges = [...prev.merges];
      const removed = newMerges.splice(mergeIndex, 1)[0];
      const newSingles = new Map(prev.singles);
      if (removed.reservation) {
        newSingles.set(removed.tables[0].id, removed.reservation);
      }
      return { singles: newSingles, merges: newMerges };
    });
  }, [assignments, updateAssignments]);

  const onClickFreeTable = useCallback((tableId: string) => {
    setAddDialogTable(tableId);
  }, []);

  const onClickOccupiedTable = useCallback((tableId: string) => {
    setDetailDialogTable(tableId);
  }, []);

  const handleAddReservation = useCallback((reservation: Reservation) => {
    if (!assignments || !addDialogTable) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables.some(t => t.id === addDialogTable)) {
          const newMerges = [...prev.merges];
          newMerges[i] = { ...newMerges[i], reservation };
          return { ...prev, merges: newMerges };
        }
      }
      const newSingles = new Map(prev.singles);
      newSingles.set(addDialogTable, reservation);
      return { ...prev, singles: newSingles };
    });
    setAddDialogTable(null);
  }, [assignments, addDialogTable, updateAssignments]);

  const handleEditReservation = useCallback((reservation: Reservation) => {
    if (!assignments || !detailDialogTable) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables.some(t => t.id === detailDialogTable)) {
          const newMerges = [...prev.merges];
          newMerges[i] = { ...newMerges[i], reservation };
          return { ...prev, merges: newMerges };
        }
      }
      const newSingles = new Map(prev.singles);
      newSingles.set(detailDialogTable, reservation);
      return { ...prev, singles: newSingles };
    });
    setDetailDialogTable(null);
  }, [assignments, detailDialogTable, updateAssignments]);

  const handleRemoveReservation = useCallback(() => {
    if (!assignments || !detailDialogTable) return;
    updateAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables.some(t => t.id === detailDialogTable)) {
          const newMerges = [...prev.merges];
          newMerges[i] = { ...newMerges[i], reservation: null };
          return { ...prev, merges: newMerges };
        }
      }
      const newSingles = new Map(prev.singles);
      newSingles.delete(detailDialogTable);
      return { ...prev, singles: newSingles };
    });
    setDetailDialogTable(null);
  }, [assignments, detailDialogTable, updateAssignments]);

  // Service mode callbacks
  const onMarkArrived = useCallback((tableId: string) => {
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      if (newSingles.has(tableId)) {
        const r = newSingles.get(tableId)!;
        newSingles.set(tableId, { ...r, arrivedAt: new Date().toISOString() });
        return { ...prev, singles: newSingles };
      }
      const newMerges = [...prev.merges];
      for (let i = 0; i < newMerges.length; i++) {
        if (newMerges[i].tables[0].id === tableId && newMerges[i].reservation) {
          newMerges[i] = { ...newMerges[i], reservation: { ...newMerges[i].reservation!, arrivedAt: new Date().toISOString() } };
          return { ...prev, merges: newMerges };
        }
      }
      return prev;
    });
  }, [updateAssignments]);

  // Course tracking: advance to next course
  const onAdvanceCourse = useCallback((tableId: string) => {
    updateAssignments(prev => {
      if (!prev) return prev;

      const advanceRes = (res: Reservation): Reservation => {
        const now = new Date().toISOString();
        const is4ret = res.reservationType === '4-ret' || res.dishCount === 4;
        if (!res.starterServedAt) return { ...res, starterServedAt: now };
        if (is4ret && !res.interServedAt) return { ...res, interServedAt: now };
        if (!res.mainServedAt) return { ...res, mainServedAt: now };
        if (!res.dessertServedAt) return { ...res, dessertServedAt: now };
        return res;
      };

      const newSingles = new Map(prev.singles);
      if (newSingles.has(tableId)) {
        const r = newSingles.get(tableId)!;
        newSingles.set(tableId, advanceRes(r));
        return { ...prev, singles: newSingles };
      }
      const newMerges = [...prev.merges];
      for (let i = 0; i < newMerges.length; i++) {
        if (newMerges[i].tables[0].id === tableId && newMerges[i].reservation) {
          newMerges[i] = { ...newMerges[i], reservation: advanceRes(newMerges[i].reservation!) };
          return { ...prev, merges: newMerges };
        }
      }
      return prev;
    });
  }, [updateAssignments]);

  const onClearTable = useCallback((tableId: string) => {
    if (!assignments) return;
    // Capture the reservation before clearing for undo
    let clearedRes: Reservation | null = null;
    
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      if (newSingles.has(tableId)) {
        clearedRes = newSingles.get(tableId)!;
        newSingles.delete(tableId);
        return { ...prev, singles: newSingles };
      }
      const newMerges = [...prev.merges];
      for (let i = 0; i < newMerges.length; i++) {
        if (newMerges[i].tables[0].id === tableId) {
          clearedRes = newMerges[i].reservation;
          newMerges[i] = { ...newMerges[i], reservation: null };
          return { ...prev, merges: newMerges };
        }
      }
      return prev;
    });

    // Set up undo with 10-second window
    if (clearedRes) {
      setUndoMap(prev => {
        const next = new Map(prev);
        next.set(tableId, clearedRes!);
        return next;
      });
      // Clear any existing timer for this table
      const existingTimer = undoTimersRef.current.get(tableId);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => {
        setUndoMap(prev => {
          const next = new Map(prev);
          next.delete(tableId);
          return next;
        });
        undoTimersRef.current.delete(tableId);
      }, 10000);
      undoTimersRef.current.set(tableId, timer);
    }
  }, [assignments, updateAssignments]);

  const onUndoClear = useCallback((tableId: string) => {
    const res = undoMap.get(tableId);
    if (!res) return;
    // Clear the undo timer
    const timer = undoTimersRef.current.get(tableId);
    if (timer) clearTimeout(timer);
    undoTimersRef.current.delete(tableId);
    setUndoMap(prev => {
      const next = new Map(prev);
      next.delete(tableId);
      return next;
    });
    // Restore reservation
    updateAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables[0].id === tableId) {
          const newMerges = [...prev.merges];
          newMerges[i] = { ...newMerges[i], reservation: res };
          return { ...prev, merges: newMerges };
        }
      }
      const newSingles = new Map(prev.singles);
      newSingles.set(tableId, res);
      return { ...prev, singles: newSingles };
    });
  }, [undoMap, updateAssignments]);

  const onClearAll = useCallback(() => {
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map<string, Reservation>();
      const newMerges = prev.merges.map(mg => ({ ...mg, reservation: null }));
      return { singles: newSingles, merges: newMerges };
    });
  }, [updateAssignments]);

  // Get all reservations for prep summary
  const allReservations: Reservation[] = assignments
    ? [
        ...Array.from(assignments.singles.values()),
        ...assignments.merges.filter(mg => mg.reservation).map(mg => mg.reservation!),
      ]
    : [];

  const hasReservations = assignments !== null;
  const reservationCount = allReservations.length;

  // Print handler
  const handlePrint = useCallback((empty: boolean) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tables = TABLE_LAYOUT;
    const rows = Array.from({ length: 9 }, (_, i) => i + 1);

    const getRes = (tableId: string): Reservation | undefined => {
      if (empty) return undefined;
      if (!assignments) return undefined;
      if (assignments.singles.has(tableId)) return assignments.singles.get(tableId);
      for (const mg of assignments.merges) {
        if (mg.tables[0].id === tableId && mg.reservation) return mg.reservation;
      }
      return undefined;
    };

    const mergedIds = new Set<string>();
    const mergeMap = new Map<string, MergeGroup>();
    if (assignments) {
      for (const mg of assignments.merges) {
        mergeMap.set(mg.tables[0].id, mg);
        mg.tables.forEach(t => mergedIds.add(t.id));
      }
    }

    // Color map for reservation types
    const typeColors: Record<string, string> = {
      '2-ret': '#0ea5e9',
      '3-ret': '#f59e0b',
      '4-ret': '#10b981',
      'a-la-carte': '#8b5cf6',
      'bordreservation': '#64748b',
      'buff': '#f43f5e',
    };

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bordplan</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: white; color: #1a1a1a; }
      h1 { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
      .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .cell {
        border: 1.5px solid #e2e2e2;
        border-radius: 10px;
        padding: 10px;
        min-height: 90px;
        position: relative;
        background: white;
      }
      .cell.round { border-radius: 50%; min-height: 110px; min-width: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      .cell.occupied { border-left: 5px solid #ccc; }
      .cell.buff { border-left: 5px dashed #f43f5e; }
      .cell.empty-cell { border: 1.5px dashed #e2e2e2; }
      .table-num { font-size: 18px; font-weight: 800; color: #1a1a1a; }
      .cap { font-size: 11px; color: #999; margin-left: 4px; }
      .guest-line { font-size: 13px; margin-top: 5px; }
      .type-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px; color: white; margin-left: 6px; }
      .room-line { font-size: 12px; color: #555; margin-top: 2px; }
      .notes { color: #c00; font-size: 11px; margin-top: 3px; font-weight: 500; }
      .coffee { color: #b45309; font-size: 11px; margin-top: 2px; }
      .free-label { color: #bbb; font-size: 13px; text-align: center; margin-top: 20px; }
      .spacer { min-height: 90px; }
      @media print { body { margin: 10px; } @page { size: landscape; margin: 10mm; } }
    </style></head><body>`;
    html += `<h1>Bordplan — ${new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h1>`;
    html += `<div class="subtitle">${empty ? 'Tom bordplan' : `${reservationCount} reservationer · ${allReservations.reduce((s, r) => s + r.guestCount, 0)} gæster`}</div>`;
    html += '<div class="grid">';

    for (const row of rows) {
      for (let col = 1; col <= 4; col++) {
        const table = tables.find(t => t.row === row && t.col === col);
        if (!table) {
          html += '<div class="spacer"></div>';
          continue;
        }

        if (mergedIds.has(table.id) && !mergeMap.has(table.id)) {
          continue; // skip non-first merged cells
        }

        const mg = mergeMap.get(table.id);
        const colspan = mg ? mg.colSpan : 1;
        const res = getRes(table.id);
        const label = mg ? mg.tables.map(t => stripB(t.id)).join('+') : stripB(table.id);
        const isRound = !mg && table.shape === 'round';
        const isBuff = res?.reservationType === 'buff';
        const typeColor = res ? typeColors[res.reservationType || '3-ret'] || '#f59e0b' : '#ccc';

        const cellStyle = colspan > 1 ? `grid-column: span ${colspan};` : '';
        const borderStyle = res ? (isBuff ? '' : `border-left-color: ${typeColor};`) : '';
        const classes = [
          'cell',
          isRound ? 'round' : '',
          res ? (isBuff ? 'buff occupied' : 'occupied') : 'empty-cell',
        ].filter(Boolean).join(' ');

        html += `<div class="${classes}" style="${cellStyle} ${borderStyle}">`;
        html += `<div><span class="table-num">${label}</span><span class="cap">${mg ? mg.combinedCapacity : table.capacity}p</span></div>`;
        if (res) {
          html += `<div class="guest-line">👥 ${res.guestCount}`;
          html += `<span class="type-badge" style="background:${typeColor}">${res.reservationType || '3-ret'}</span>`;
          html += `</div>`;
          if (res.guestName) html += `<div class="guest-line" style="font-weight:600">${res.guestName}</div>`;
          if (res.roomNumber) html += `<div class="room-line">🚪 Vær. ${res.roomNumber}</div>`;
          if (res.coffeeOnly) html += `<div class="coffee">☕ Kaffe/te</div>`;
          if (res.coffeeTeaSweet) html += `<div class="coffee">☕+🍪 Kaffe/te + sødt</div>`;
          if (res.notes) html += `<div class="notes">⚠ ${res.notes}</div>`;
        } else {
          html += `<div class="free-label">—</div>`;
        }
        html += '</div>';
      }
    }

    html += '</div></body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [assignments, allReservations.length]);

  // Dialog helpers
  const addDialogLabel = addDialogTable ? (() => {
    const mg = findMergeGroupForTable(addDialogTable);
    if (mg) return mg.mg.tables.map(t => stripB(t.id)).join('+');
    return stripB(addDialogTable);
  })() : '';

  const addDialogCapacity = addDialogTable ? (() => {
    const mg = findMergeGroupForTable(addDialogTable);
    if (mg) return mg.mg.combinedCapacity;
    const tbl = TABLE_LAYOUT.find(t => t.id === addDialogTable);
    return tbl?.capacity || 2;
  })() : 2;

  const detailReservation = detailDialogTable ? findReservationForTable(detailDialogTable) : undefined;
  const detailLabel = detailDialogTable ? (() => {
    const mg = findMergeGroupForTable(detailDialogTable);
    if (mg) return mg.mg.tables.map(t => stripB(t.id)).join('+');
    return stripB(detailDialogTable);
  })() : '';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('tablePlan.title')}</h1>
          <p className="text-muted-foreground">{t('tablePlan.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> {t('tablePlan.saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Save className="h-3 w-3" /> {t('tablePlan.saved')}
            </span>
          )}
          {hasReservations && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    {t('tablePlan.print')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePrint(false)}>
                    {t('tablePlan.printWithRes')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrint(true)}>
                    {t('tablePlan.printEmpty')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('tablePlan.newUpload')}
              </Button>
            </>
          )}
        </div>
      </div>

      {!hasReservations ? (
        <div className="space-y-4">
          <PdfUploader onUpload={handleUpload} isProcessing={isProcessing} />

          {/* Saved plans - always visible scrollable list */}
          {savedPlans.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                {t('tablePlan.savedPlans')} ({savedPlans.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {savedPlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => handleLoadPlan(plan)}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left truncate flex-1"
                    >
                      {plan.name || plan.plan_date}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : reservationCount === 0 && assignments.merges.length === 0 ? (
        <div className="space-y-6">
          <FloorPlan
            assignments={assignments}
            onMoveReservation={onMoveReservation}
            onMerge={onMerge}
            onUnmerge={onUnmerge}
            onClickFreeTable={onClickFreeTable}
            onClickOccupiedTable={onClickOccupiedTable}
            onMarkArrived={onMarkArrived}
            onClearTable={onClearTable}
            onClearAll={onClearAll}
            onAdvanceCourse={onAdvanceCourse}
            undoMap={undoMap}
            onUndo={onUndoClear}
          />
        </div>
      ) : (
        <>
           <FloorPlan
            assignments={assignments}
            onMoveReservation={onMoveReservation}
            onMerge={onMerge}
            onUnmerge={onUnmerge}
            onClickFreeTable={onClickFreeTable}
            onClickOccupiedTable={onClickOccupiedTable}
            onMarkArrived={onMarkArrived}
            onClearTable={onClearTable}
            onClearAll={onClearAll}
            onAdvanceCourse={onAdvanceCourse}
            undoMap={undoMap}
            onUndo={onUndoClear}
          />
          {reservationCount > 0 && <PreparationSummary reservations={allReservations} />}
        </>
      )}

      {/* Add reservation dialog */}
      <AddReservationDialog
        open={!!addDialogTable}
        onOpenChange={open => { if (!open) setAddDialogTable(null); }}
        tableLabel={addDialogLabel}
        tableCapacity={addDialogCapacity}
        onAdd={handleAddReservation}
      />

      {/* Reservation detail dialog */}
      {detailReservation && (
        <ReservationDetailDialog
          open={!!detailDialogTable}
          onOpenChange={open => { if (!open) setDetailDialogTable(null); }}
          tableLabel={detailLabel}
          reservation={detailReservation}
          onEdit={handleEditReservation}
          onRemove={handleRemoveReservation}
        />
      )}
    </div>
  );
}
