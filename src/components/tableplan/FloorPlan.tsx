import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Re-export algorithm items so existing imports from FloorPlan still work
export { TABLE_LAYOUT, assignTablesToReservations, findLargePartyMerges } from './assignmentAlgorithm';
export type { MergeGroup, Assignments } from './assignmentAlgorithm';
import { TABLE_LAYOUT, type MergeGroup, type Assignments } from './assignmentAlgorithm';

// ---------- FLOOR PLAN COMPONENT ----------

interface FloorPlanProps {
  assignments: Assignments;
  tables?: TableDef[];
  onMoveReservation: (fromTableId: string, toTableId: string) => void;
  onMerge: (tableId1: string, tableId2: string) => void;
  onUnmerge: (mergeIndex: number) => void;
  onClickFreeTable: (tableId: string) => void;
  onClickOccupiedTable: (tableId: string) => void;
  onMarkArrived?: (tableId: string) => void;
  onClearTable?: (tableId: string) => void;
  onClearAll?: () => void;
  onAdvanceCourse?: (tableId: string) => void;
  undoMap?: Map<string, Reservation>;
  onUndo?: (tableId: string) => void;
  justAddedTables?: Set<string>;
}

export function FloorPlan({
  assignments,
  tables: tablesProp,
  onMoveReservation,
  onMerge,
  onUnmerge,
  onClickFreeTable,
  onClickOccupiedTable,
  onMarkArrived,
  onClearTable,
  onClearAll,
  onAdvanceCourse,
  undoMap,
  onUndo,
  justAddedTables,
}: FloorPlanProps) {
  const { t } = useLanguage();
  const tables = tablesProp ?? TABLE_LAYOUT;
  const { singles, merges } = assignments;
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const totalGuests = Array.from(singles.values()).reduce((s, r) => s + r.guestCount, 0)
    + merges.reduce((s, mg) => s + (mg.reservation?.guestCount || 0), 0);
  const occupied = singles.size + merges.filter(mg => mg.reservation).length;
  const total = tables.length;
  const hasAnyOccupied = occupied > 0;

  // Build sets for merge rendering
  const mergedTableIds = new Set<string>();
  const mergeByFirstId = new Map<string, { mg: MergeGroup; index: number }>();
  merges.forEach((mg, idx) => {
    mergeByFirstId.set(mg.tables[0].id, { mg, index: idx });
    for (const t of mg.tables) mergedTableIds.add(t.id);
  });

  const handleDragStart = (tableId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', tableId);
    setDragSource(tableId);
  };
  const handleDragOver = (tableId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(tableId);
  };
  const handleDragLeave = () => setDragOverTarget(null);
  const handleDrop = (tableId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    setDragSource(null);
    setDragOverTarget(null);
    if (fromId && fromId !== tableId) {
      onMoveReservation(fromId, tableId);
    }
  };

  const legendItems = [
    { color: 'bg-sky-500', label: '2-ret' },
    { color: 'bg-amber-500', label: '3-ret' },
    { color: 'bg-emerald-500', label: '4-ret' },
    { color: 'bg-violet-500', label: 'A la carte' },
    { color: 'bg-slate-500', label: 'Bordres.' },
    { color: 'bg-rose-500', label: 'BUFF', dashed: true },
    { color: 'bg-muted', label: t('tablePlan.free') },
  ];

  // Build merge-between-cells data: show "+" between adjacent tables when at least one is free and not round
  const mergeBetweenPairs: { row: number; leftTableId: string; rightTableId: string; col: number }[] = [];
  for (let row = 1; row <= 9; row++) {
    const tablesInRow = tablesr(t => t.row === row).sort((a, b) => a.col - b.col);
    for (let i = 0; i < tablesInRow.length - 1; i++) {
      const left = tablesInRow[i];
      const right = tablesInRow[i + 1];
      if (right.col - left.col !== 1) continue;
      if (left.shape === 'round' || right.shape === 'round') continue;

      // Check if both are already in the same merge group
      const leftInMerge = mergedTableIds.has(left.id);
      const rightInMerge = mergedTableIds.has(right.id);

      // If both in same merge, skip
      if (leftInMerge && rightInMerge) {
        // Check if they're in the same group
        let sameGroup = false;
        for (const mg of merges) {
          const ids = mg.tables.map(t => t.id);
          if (ids.includes(left.id) && ids.includes(right.id)) { sameGroup = true; break; }
        }
        if (sameGroup) continue;
      }

      // Show merge button if neither is merged, or if one is at the edge of a merge group
      // and the merge group has fewer than 4 tables
      if (!leftInMerge && !rightInMerge) {
        mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
      } else if (leftInMerge && !rightInMerge) {
        // Check if left is the last table in its merge group and group < 4
        for (const mg of merges) {
          const ids = mg.tables.map(t => t.id);
          if (ids.includes(left.id) && ids[ids.length - 1] === left.id && ids.length < 4) {
            mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
          }
        }
      } else if (!leftInMerge && rightInMerge) {
        // Check if right is the first table in its merge group and group < 4
        for (const mg of merges) {
          const ids = mg.tables.map(t => t.id);
          if (ids.includes(right.id) && ids[0] === right.id && ids.length < 4) {
            mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Legend + Clear All */}
      <div className="flex flex-wrap gap-4 text-sm items-center">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              item.color,
              (item as any).dashed && "border border-dashed border-current"
            )} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground">
            {occupied}/{total} {t('tablePlan.tablesOccupied')} · {totalGuests} {t('tablePlan.guests')}
          </span>
          {hasAnyOccupied && onClearAll && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {t('tablePlan.clearAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('tablePlan.clearAll')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('tablePlan.clearAllConfirm')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="relative grid grid-cols-4 gap-3">
        {Array.from({ length: 9 }, (_, rowIdx) => {
          const row = rowIdx + 1;
          return Array.from({ length: 4 }, (_, colIdx) => {
            const col = colIdx + 1;
            const table = tables.find(t => t.row === row && t.col === col);

            if (!table) {
              return <div key={`${row}-${col}`} className="min-h-[120px]" />;
            }

            // Merged table (first cell)
            const mergeInfo = mergeByFirstId.get(table.id);
            if (mergeInfo) {
              const { mg, index } = mergeInfo;
              const res = mg.reservation;
              const isOccupied = !!res;
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  reservation={res || undefined}
                  mergedIds={mg.tables.map(t => t.id)}
                  colSpan={mg.colSpan}
                  onClick={() => isOccupied ? onClickOccupiedTable(table.id) : onClickFreeTable(table.id)}
                  onUnmerge={() => onUnmerge(index)}
                  onMarkArrived={() => onMarkArrived?.(table.id)}
                  onClearTable={() => onClearTable?.(table.id)}
                  onAdvanceCourse={() => onAdvanceCourse?.(table.id)}
                  undoReservation={undoMap?.get(table.id)}
                  onUndo={() => onUndo?.(table.id)}
                  isJustAdded={justAddedTables?.has(table.id)}
                  draggable={isOccupied}
                  isDragging={dragSource === table.id}
                  isDragOver={dragOverTarget === table.id}
                  onDragStart={handleDragStart(table.id)}
                  onDragOver={handleDragOver(table.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(table.id)}
                />
              );
            }

            // Skip non-first cells of merge
            if (mergedTableIds.has(table.id)) return null;

            const res = singles.get(table.id);
            const isOccupied = !!res;
            return (
              <TableCard
                key={table.id}
                table={table}
                reservation={res}
                onClick={() => isOccupied ? onClickOccupiedTable(table.id) : onClickFreeTable(table.id)}
                onMarkArrived={() => onMarkArrived?.(table.id)}
                onClearTable={() => onClearTable?.(table.id)}
                onAdvanceCourse={() => onAdvanceCourse?.(table.id)}
                undoReservation={undoMap?.get(table.id)}
                onUndo={() => onUndo?.(table.id)}
                isJustAdded={justAddedTables?.has(table.id)}
                draggable={isOccupied}
                isDragging={dragSource === table.id}
                isDragOver={dragOverTarget === table.id}
                onDragStart={handleDragStart(table.id)}
                onDragOver={handleDragOver(table.id)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(table.id)}
              />
            );
          });
        }).flat().filter(Boolean)}

        {/* Merge "+" buttons between adjacent tables */}
        {mergeBetweenPairs.map(({ leftTableId, rightTableId, row, col }) => {
          const leftPercent = col * 25;
          const topPercent = ((row - 1) / 9) * 100;
          return (
            <button
              key={`merge-${leftTableId}-${rightTableId}`}
              onClick={() => onMerge(leftTableId, rightTableId)}
              className="absolute z-10 w-6 h-6 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-md hover:scale-110"
              style={{
                left: `calc(${leftPercent}% - 12px)`,
                top: `calc(${topPercent}% + 55px)`,
              }}
              title={t('tablePlan.merge')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
