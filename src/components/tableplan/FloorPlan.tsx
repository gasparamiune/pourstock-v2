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

// ---------- AUTO-ASSIGNMENT ALGORITHM (adjacency-based clustering) ----------

function tableById(id: string): TableDef | undefined {
  return TABLE_LAYOUT.find(t => t.id === id);
}

/**
 * Check if a table has a neighbor among already-used tables.
 * Priority: left/right (same row, col ±1) first, then south (row+1, same col).
 * Row 9 is the southernmost (front of restaurant).
 */
function hasNeighborScore(t: TableDef, usedTables: Set<string>): number {
  // Check left/right neighbors (same row)
  const leftRight = TABLE_LAYOUT.filter(
    o => usedTables.has(o.id) && o.row === t.row && Math.abs(o.col - t.col) === 1
  );
  if (leftRight.length > 0) return 2; // best: horizontal neighbor

  // Check south neighbor (higher row number = more south/front)
  const south = TABLE_LAYOUT.filter(
    o => usedTables.has(o.id) && o.col === t.col && o.row === t.row + 1
  );
  if (south.length > 0) return 1; // good: south neighbor

  // Check north neighbor as last resort
  const north = TABLE_LAYOUT.filter(
    o => usedTables.has(o.id) && o.col === t.col && o.row === t.row - 1
  );
  if (north.length > 0) return 0.5;

  return 0; // no neighbor
}

function findBestTable(
  guestCount: number,
  usedTables: Set<string>,
  allow4SeatFor2: boolean,
): string | null {
  const candidates = TABLE_LAYOUT
    .filter(t => {
      if (usedTables.has(t.id) || t.id === 'B34') return false;
      if (t.capacity >= guestCount) return true;
      return false;
    })
    .filter(t => {
      // If guest count <= 2 and we're NOT allowing 4-seat tables, skip capacity-4 tables
      if (guestCount <= 2 && !allow4SeatFor2 && t.capacity >= 4) return false;
      return true;
    })
    .sort((a, b) => {
      // First priority: has a neighbor (adjacency)
      if (usedTables.size > 0) {
        const nA = hasNeighborScore(a, usedTables);
        const nB = hasNeighborScore(b, usedTables);
        if (nA !== nB) return nB - nA; // higher score = better
      }
      // Second: prefer smallest capacity that fits
      const capDiff = a.capacity - b.capacity;
      if (capDiff !== 0) return capDiff;
      // Third: front of restaurant first (higher row = more south)
      return b.row - a.row;
    });
  return candidates[0]?.id ?? null;
}

function findMergeGroup(
  guestCount: number,
  usedTables: Set<string>,
): MergeGroup | null {
  const candidates: MergeGroup[] = [];

  for (let row = 1; row <= 9; row++) {
    const tablesInRow = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round' && t.id !== 'B34')
      .sort((a, b) => a.col - b.col);

    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= tablesInRow.length - size; i++) {
        let adjacent = true;
        for (let j = 0; j < size - 1; j++) {
          if (tablesInRow[i + j + 1].col - tablesInRow[i + j].col !== 1) {
            adjacent = false;
            break;
          }
        }
        if (!adjacent) continue;

        const combo = tablesInRow.slice(i, i + size);
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          candidates.push({
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

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    if (usedTables.size > 0) {
      const nA = Math.max(...a.tables.map(t => hasNeighborScore(t, usedTables)));
      const nB = Math.max(...b.tables.map(t => hasNeighborScore(t, usedTables)));
      if (nA !== nB) return nB - nA;
    }
    return b.row - a.row;
  });

  return candidates[0];
}

/**
 * For large parties (>8 guests), split into two sub-groups and find
 * two adjacent rows where each row can merge enough tables.
 * The two merge groups share the same columns so guests sit next to each other.
 */
/**
 * Find a single horizontal merge group in a given row that fits guestCount.
 * Returns null if none found.
 */
function findMergeInRow(
  guestCount: number,
  usedTables: Set<string>,
  preferredRow?: number,
): MergeGroup | null {
  const rowCandidates: MergeGroup[] = [];
  const rows = preferredRow ? [preferredRow] : Array.from({ length: 9 }, (_, i) => i + 1);

  for (const row of rows) {
    const tablesInRow = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round' && t.id !== 'B34')
      .sort((a, b) => a.col - b.col);

    for (let size = 2; size <= Math.min(4, tablesInRow.length); size++) {
      for (let i = 0; i <= tablesInRow.length - size; i++) {
        let adjacent = true;
        for (let j = 0; j < size - 1; j++) {
          if (tablesInRow[i + j + 1].col - tablesInRow[i + j].col !== 1) { adjacent = false; break; }
        }
        if (!adjacent) continue;
        const combo = tablesInRow.slice(i, i + size);
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          rowCandidates.push({
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

  if (rowCandidates.length === 0) return null;
  rowCandidates.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    return b.row - a.row; // prefer front
  });
  return rowCandidates[0];
}

/**
 * For large parties (>8 guests), split into N sub-groups (N = ceil(guests/8))
 * and find N adjacent rows where each row can merge enough tables horizontally.
 * Groups share overlapping columns so guests sit next to each other.
 */
export function findLargePartyMerges(
  guestCount: number,
  usedTables: Set<string>,
): MergeGroup[] | null {
  const numGroups = Math.ceil(guestCount / 8);
  const perGroup = Math.ceil(guestCount / numGroups);
  const groupSizes: number[] = [];
  let remaining = guestCount;
  for (let i = 0; i < numGroups; i++) {
    const size = i < numGroups - 1 ? perGroup : remaining;
    groupSizes.push(size);
    remaining -= perGroup;
  }

  // Try to find N adjacent rows
  for (let startRow = 1; startRow <= 9 - numGroups + 1; startRow++) {
    const tempUsed = new Set(usedTables);
    const groups: MergeGroup[] = [];
    let success = true;

    for (let g = 0; g < numGroups; g++) {
      const row = startRow + g;
      const mg = findMergeInRow(groupSizes[g], tempUsed, row);
      if (!mg) { success = false; break; }
      groups.push(mg);
      for (const t of mg.tables) tempUsed.add(t.id);
    }

    if (success) return groups;
  }

  return null;
}

export function assignTablesToReservations(reservations: Reservation[]): Assignments {
  const singles = new Map<string, Reservation>();
  const merges: MergeGroup[] = [];
  const usedTables = new Set<string>();

  // Sort by guest count descending so big groups get best tables
  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  const hasLargeReservations = sorted.some(r => r.guestCount >= 3 && r.guestCount <= 4);
  const allow4SeatFor2 = !hasLargeReservations;

  // Group by reservation type for clustering
  const typeGroups = new Map<string, Reservation[]>();
  for (const res of sorted) {
    const type = res.reservationType || `${res.dishCount}-ret`;
    if (!typeGroups.has(type)) typeGroups.set(type, []);
    typeGroups.get(type)!.push(res);
  }

  const orderedTypes = [...typeGroups.entries()].sort((a, b) => {
    const maxA = Math.max(...a[1].map(r => r.guestCount));
    const maxB = Math.max(...b[1].map(r => r.guestCount));
    return maxB - maxA;
  });

  for (const [, group] of orderedTypes) {
    for (const res of group) {
      const gc = res.guestCount;

      // Large party (>8): split into N adjacent row-merges
      if (gc > 8) {
        const groups = findLargePartyMerges(gc, usedTables);
        if (groups) {
          const numGroups = groups.length;
          const perGroup = Math.ceil(gc / numGroups);
          let rem = gc;
          for (let gi = 0; gi < numGroups; gi++) {
            const gSize = gi < numGroups - 1 ? perGroup : rem;
            groups[gi].reservation = {
              ...res,
              guestCount: gSize,
              notes: gi > 0 ? (res.notes ? `${res.notes} (del ${gi + 1})` : `(del ${gi + 1})`) : res.notes,
            };
            for (const t of groups[gi].tables) usedTables.add(t.id);
            rem -= perGroup;
          }
          merges.push(...groups);
          continue;
        }
      }

      // Try single table first
      const tableId = findBestTable(gc, usedTables, allow4SeatFor2);
      if (tableId) {
        singles.set(tableId, res);
        usedTables.add(tableId);
        continue;
      }

      // Try merge
      const mg = findMergeGroup(gc, usedTables);
      if (mg) {
        mg.reservation = res;
        merges.push(mg);
        for (const t of mg.tables) usedTables.add(t.id);
        continue;
      }
    }
  }
  return { singles, merges };
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
  onAdvanceCourse?: (tableId: string) => void;
  undoMap?: Map<string, Reservation>;
  onUndo?: (tableId: string) => void;
  justAddedTables?: Set<string>;
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
  onAdvanceCourse,
  undoMap,
  onUndo,
  justAddedTables,
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
