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

// Restaurant layout matching the actual floor plan (9 rows x 4 columns)
export const TABLE_LAYOUT: TableDef[] = [
  // Row 1 (back of restaurant)
  { id: 'B8',  capacity: 4, row: 1, col: 1 },
  { id: 'B18', capacity: 2, row: 1, col: 2 },
  { id: 'B28', capacity: 2, row: 1, col: 3 },
  { id: 'B34', capacity: 8, row: 1, col: 4, shape: 'round' },
  // Row 2
  { id: 'B7',  capacity: 4, row: 2, col: 1 },
  { id: 'B17', capacity: 2, row: 2, col: 2 },
  { id: 'B27', capacity: 2, row: 2, col: 3 },
  // Row 3
  { id: 'B6',  capacity: 4, row: 3, col: 1 },
  { id: 'B16', capacity: 2, row: 3, col: 2 },
  { id: 'B26', capacity: 2, row: 3, col: 3 },
  { id: 'B31', capacity: 2, row: 3, col: 4 },
  // Row 4
  { id: 'B5',  capacity: 4, row: 4, col: 1 },
  { id: 'B15', capacity: 2, row: 4, col: 2 },
  { id: 'B25', capacity: 2, row: 4, col: 3 },
  // Row 5 (round tables)
  { id: 'B4',  capacity: 6, row: 5, col: 1, shape: 'round' },
  { id: 'B14', capacity: 6, row: 5, col: 2, shape: 'round' },
  { id: 'B32', capacity: 6, row: 5, col: 3, shape: 'round' },
  // Row 6
  { id: 'B3',  capacity: 4, row: 6, col: 1 },
  { id: 'B13', capacity: 2, row: 6, col: 2 },
  { id: 'B23', capacity: 2, row: 6, col: 3 },
  // Row 7
  { id: 'B2',  capacity: 4, row: 7, col: 1 },
  { id: 'B12', capacity: 2, row: 7, col: 2 },
  { id: 'B22', capacity: 2, row: 7, col: 3 },
  { id: 'B33', capacity: 2, row: 7, col: 4 },
  // Row 8
  { id: 'B1',  capacity: 4, row: 8, col: 1 },
  { id: 'B11', capacity: 2, row: 8, col: 2 },
  { id: 'B21', capacity: 2, row: 8, col: 3 },
  // Row 9 (front of restaurant)
  { id: 'B35', capacity: 4, row: 9, col: 1 },
  { id: 'B36', capacity: 2, row: 9, col: 2 },
  { id: 'B37', capacity: 2, row: 9, col: 3 },
];

export interface MergeGroup {
  tables: TableDef[];
  combinedCapacity: number;
  reservation: Reservation | null;
  startCol: number;
  colSpan: number;
  row: number;
}

export interface Assignments {
  singles: Map<string, Reservation>;
  merges: MergeGroup[];
}

// ---------- AUTO-ASSIGNMENT ALGORITHM ----------

// Priority lists for deterministic front-to-back filling
const FOUR_SEAT_PRIORITY = ['B35', 'B1', 'B2', 'B3'];
const ROUND_SIX_SEAT = ['B4', 'B14', 'B32'];
const BACK_FOUR_SEAT = ['B5', 'B6', 'B7', 'B8'];
const TWO_SEAT_PRIORITY = [
  'B36', 'B37', 'B21', 'B11', 'B22', 'B12', 'B23', 'B13',
  'B25', 'B15', 'B26', 'B16', 'B27', 'B17', 'B28', 'B18',
  'B31', 'B33',
];

function firstAvailable(ids: string[], used: Set<string>): string | null {
  for (const id of ids) {
    if (!used.has(id)) return id;
  }
  return null;
}

export function assignTablesToReservations(reservations: Reservation[]): Assignments {
  const singles = new Map<string, Reservation>();
  const merges: MergeGroup[] = [];
  const usedTables = new Set<string>();

  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  for (const res of sorted) {
    const gc = res.guestCount;

    if (gc >= 7) {
      const mg = findMergeGroupFrontToBack(gc, usedTables);
      if (mg) {
        mg.reservation = res;
        merges.push(mg);
        for (const t of mg.tables) usedTables.add(t.id);
        continue;
      }
      if (usedTables.size >= 20 && !usedTables.has('B34')) {
        singles.set('B34', res);
        usedTables.add('B34');
        continue;
      }
    } else if (gc >= 5) {
      const id = firstAvailable(ROUND_SIX_SEAT, usedTables);
      if (id) {
        singles.set(id, res);
        usedTables.add(id);
        continue;
      }
      const mg = findMergeGroupFrontToBack(gc, usedTables);
      if (mg) {
        mg.reservation = res;
        merges.push(mg);
        for (const t of mg.tables) usedTables.add(t.id);
        continue;
      }
    } else if (gc >= 3) {
      const id = firstAvailable(FOUR_SEAT_PRIORITY, usedTables)
        ?? firstAvailable(ROUND_SIX_SEAT, usedTables)
        ?? firstAvailable(BACK_FOUR_SEAT, usedTables);
      if (id) {
        singles.set(id, res);
        usedTables.add(id);
        continue;
      }
    } else {
      const id = firstAvailable(TWO_SEAT_PRIORITY, usedTables);
      if (id) {
        singles.set(id, res);
        usedTables.add(id);
        continue;
      }
    }
  }

  return { singles, merges };
}

function findMergeGroupFrontToBack(
  guestCount: number,
  usedTables: Set<string>,
): MergeGroup | null {
  const groups: MergeGroup[] = [];

  for (let row = 9; row >= 1; row--) {
    const available = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round')
      .sort((a, b) => a.col - b.col);

    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= available.length - size; i++) {
        let adjacent = true;
        for (let j = 0; j < size - 1; j++) {
          if (available[i + j + 1].col - available[i + j].col !== 1) {
            adjacent = false;
            break;
          }
        }
        if (!adjacent) continue;

        const combo = available.slice(i, i + size);
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          groups.push({
            tables: combo,
            combinedCapacity: cap,
            reservation: null,
            startCol: combo[0].col,
            colSpan: size,
            row,
          });
        }
      }
    }
  }

  if (groups.length === 0) return null;

  groups.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    return b.row - a.row;
  });

  return groups[0];
}

// ---------- FLOOR PLAN COMPONENT ----------

interface FloorPlanProps {
  assignments: Assignments;
  onMoveReservation: (fromTableId: string, toTableId: string) => void;
  onMerge: (tableId1: string, tableId2: string) => void;
  onUnmerge: (mergeIndex: number) => void;
  onClickFreeTable: (tableId: string) => void;
  onClickOccupiedTable: (tableId: string) => void;
  onMarkArrived?: (tableId: string) => void;
  onClearTable?: (tableId: string) => void;
  onClearAll?: () => void;
  undoMap?: Map<string, Reservation>;
  onUndo?: (tableId: string) => void;
}

export function FloorPlan({
  assignments,
  onMoveReservation,
  onMerge,
  onUnmerge,
  onClickFreeTable,
  onClickOccupiedTable,
  onMarkArrived,
  onClearTable,
  onClearAll,
  undoMap,
  onUndo,
}: FloorPlanProps) {
  const { t } = useLanguage();
  const { singles, merges } = assignments;
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const totalGuests = Array.from(singles.values()).reduce((s, r) => s + r.guestCount, 0)
    + merges.reduce((s, mg) => s + (mg.reservation?.guestCount || 0), 0);
  const occupied = singles.size + merges.filter(mg => mg.reservation).length;
  const total = TABLE_LAYOUT.length;
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
    const tablesInRow = TABLE_LAYOUT.filter(t => t.row === row).sort((a, b) => a.col - b.col);
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
            const table = TABLE_LAYOUT.find(t => t.row === row && t.col === col);

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
                  undoReservation={undoMap?.get(table.id)}
                  onUndo={() => onUndo?.(table.id)}
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
                undoReservation={undoMap?.get(table.id)}
                onUndo={() => onUndo?.(table.id)}
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
