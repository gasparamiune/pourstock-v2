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
import { RotateCcw, Save, Loader2, FolderOpen } from 'lucide-react';
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
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog state
  const [addDialogTable, setAddDialogTable] = useState<string | null>(null);
  const [detailDialogTable, setDetailDialogTable] = useState<string | null>(null);

  // Auto-save preference
  const autoSaveEnabled = localStorage.getItem('pourstock-autosave-tableplan') !== 'false';

  // Load saved plans on mount
  useEffect(() => {
    loadSavedPlans();
  }, []);

  const loadSavedPlans = async () => {
    const { data } = await supabase
      .from('table_plans')
      .select('*')
      .order('plan_date', { ascending: false })
      .limit(20);
    if (data) setSavedPlans(data);
  };

  // Auto-save with debounce
  const triggerAutoSave = useCallback((newAssignments: Assignments) => {
    if (!autoSaveEnabled || !user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('idle');
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const today = new Date().toISOString().split('T')[0];
      const name = `${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })} - Aften`;
      const { error } = await supabase.from('table_plans').upsert(
        {
          plan_date: today,
          created_by: user.id,
          name,
          assignments_json: serializeAssignments(newAssignments) as any,
        } as any,
        { onConflict: 'plan_date,created_by' }
      );
      setSaveStatus(error ? 'idle' : 'saved');
      if (!error) loadSavedPlans();
    }, 2000);
  }, [autoSaveEnabled, user]);

  // Wrapper to update assignments + trigger auto-save
  const updateAssignments = useCallback((updater: (prev: Assignments | null) => Assignments | null) => {
    setAssignments(prev => {
      const next = updater(prev);
      if (next) triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  const handleUpload = async (pdfBase64: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-table-plan', {
        body: { pdfBase64 },
      });
      if (error) throw error;
      const parsed: Reservation[] = Array.isArray(data) ? data : [];
      const result = assignTablesToReservations(parsed);
      setAssignments(result);
      triggerAutoSave(result);
      toast({
        title: t('tablePlan.extracted'),
        description: `${parsed.length} ${t('tablePlan.reservationsFound')}`,
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
    setShowSavedPlans(false);
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

  const onClearTable = useCallback((tableId: string) => {
    updateAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      if (newSingles.has(tableId)) {
        newSingles.delete(tableId);
        return { ...prev, singles: newSingles };
      }
      const newMerges = [...prev.merges];
      for (let i = 0; i < newMerges.length; i++) {
        if (newMerges[i].tables[0].id === tableId) {
          newMerges[i] = { ...newMerges[i], reservation: null };
          return { ...prev, merges: newMerges };
        }
      }
      return prev;
    });
  }, [updateAssignments]);

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
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('tablePlan.newUpload')}
            </Button>
          )}
        </div>
      </div>

      {!hasReservations ? (
        <div className="space-y-6">
          {/* Saved plans */}
          {savedPlans.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                {t('tablePlan.savedPlans')} ({savedPlans.length})
              </button>
              {showSavedPlans && (
                <div className="grid gap-2">
                  {savedPlans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <button
                        onClick={() => handleLoadPlan(plan)}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left"
                      >
                        {plan.name || plan.plan_date}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <PdfUploader onUpload={handleUpload} isProcessing={isProcessing} />
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
