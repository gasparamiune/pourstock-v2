import { useState, useCallback } from 'react';
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
import { RotateCcw } from 'lucide-react';

function stripB(id: string) { return id.replace('B', ''); }

export default function TablePlan() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignments | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog state
  const [addDialogTable, setAddDialogTable] = useState<string | null>(null);
  const [detailDialogTable, setDetailDialogTable] = useState<string | null>(null);

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

  // --- Editable callbacks ---

  const findReservationForTable = useCallback((tableId: string): Reservation | undefined => {
    if (!assignments) return undefined;
    if (assignments.singles.has(tableId)) return assignments.singles.get(tableId);
    for (const mg of assignments.merges) {
      if (mg.tables[0].id === tableId && mg.reservation) return mg.reservation;
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

  const onMoveReservation = useCallback((fromId: string, toId: string) => {
    if (!assignments) return;
    setAssignments(prev => {
      if (!prev) return prev;
      const newSingles = new Map(prev.singles);
      const fromRes = newSingles.get(fromId);
      const toRes = newSingles.get(toId);

      if (fromRes && toRes) {
        // Swap
        newSingles.set(fromId, toRes);
        newSingles.set(toId, fromRes);
      } else if (fromRes) {
        // Move to free table
        newSingles.delete(fromId);
        newSingles.set(toId, fromRes);
      }
      return { ...prev, singles: newSingles };
    });
  }, [assignments]);

  const onMerge = useCallback((tableId1: string, tableId2: string) => {
    if (!assignments) return;
    setAssignments(prev => {
      if (!prev) return prev;
      const t1 = TABLE_LAYOUT.find(t => t.id === tableId1)!;
      const t2 = TABLE_LAYOUT.find(t => t.id === tableId2)!;
      const tables = [t1, t2].sort((a, b) => a.col - b.col);
      const combinedCapacity = tables.reduce((s, t) => s + t.capacity, 0);

      // Move any existing single reservations to the merge
      const newSingles = new Map(prev.singles);
      let reservation: Reservation | null = null;
      for (const t of tables) {
        if (newSingles.has(t.id)) {
          if (!reservation) reservation = newSingles.get(t.id)!;
          newSingles.delete(t.id);
        }
      }

      const newMerge: MergeGroup = {
        tables,
        combinedCapacity,
        reservation,
        startCol: tables[0].col,
        colSpan: tables.length,
        row: tables[0].row,
      };

      return { singles: newSingles, merges: [...prev.merges, newMerge] };
    });
  }, [assignments]);

  const onUnmerge = useCallback((mergeIndex: number) => {
    if (!assignments) return;
    setAssignments(prev => {
      if (!prev) return prev;
      const newMerges = [...prev.merges];
      const removed = newMerges.splice(mergeIndex, 1)[0];
      const newSingles = new Map(prev.singles);
      // Put reservation back on first table if it had one
      if (removed.reservation) {
        newSingles.set(removed.tables[0].id, removed.reservation);
      }
      return { singles: newSingles, merges: newMerges };
    });
  }, [assignments]);

  const onClickFreeTable = useCallback((tableId: string) => {
    setAddDialogTable(tableId);
  }, []);

  const onClickOccupiedTable = useCallback((tableId: string) => {
    setDetailDialogTable(tableId);
  }, []);

  const handleAddReservation = useCallback((reservation: Reservation) => {
    if (!assignments || !addDialogTable) return;
    setAssignments(prev => {
      if (!prev) return prev;
      // Check if it's a merge group
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables[0].id === addDialogTable) {
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
  }, [assignments, addDialogTable]);

  const handleEditReservation = useCallback((reservation: Reservation) => {
    if (!assignments || !detailDialogTable) return;
    setAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables[0].id === detailDialogTable) {
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
  }, [assignments, detailDialogTable]);

  const handleRemoveReservation = useCallback(() => {
    if (!assignments || !detailDialogTable) return;
    setAssignments(prev => {
      if (!prev) return prev;
      for (let i = 0; i < prev.merges.length; i++) {
        if (prev.merges[i].tables[0].id === detailDialogTable) {
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
  }, [assignments, detailDialogTable]);

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
        {hasReservations && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('tablePlan.newUpload')}
          </Button>
        )}
      </div>

      {!hasReservations ? (
        <PdfUploader onUpload={handleUpload} isProcessing={isProcessing} />
      ) : reservationCount === 0 && assignments.merges.length === 0 ? (
        <div className="space-y-6">
          <FloorPlan
            assignments={assignments}
            onMoveReservation={onMoveReservation}
            onMerge={onMerge}
            onUnmerge={onUnmerge}
            onClickFreeTable={onClickFreeTable}
            onClickOccupiedTable={onClickOccupiedTable}
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
          />
          {reservationCount > 0 && <PreparationSummary reservations={allReservations} />}
        </>
      )}

      {/* Add reservation dialog */}
      <AddReservationDialog
        open={!!addDialogTable}
        onOpenChange={open => { if (!open) setAddDialogTable(null); }}
        tableLabel={addDialogLabel}
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
