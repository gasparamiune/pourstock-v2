import { useState } from 'react';
import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus } from 'lucide-react';

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

export function assignTablesToReservations(reservations: Reservation[]): Assignments {
  const singles = new Map<string, Reservation>();
  const merges: MergeGroup[] = [];
  const usedTables = new Set<string>();
  const occupiedRows = new Set<number>();

  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  const rowDistance = (row: number): number => {
    if (occupiedRows.size === 0) return 9 - row; // seed: prefer bottom rows
    let sum = 0;
    for (const r of occupiedRows) sum += Math.abs(row - r);
    return sum / occupiedRows.size;
  };

  for (const res of sorted) {
    // 1. Try single table (B34 only for 7+ guests)
    const candidates = TABLE_LAYOUT
      .filter(t =>
        !usedTables.has(t.id) &&
        t.capacity >= res.guestCount &&
        (t.id !== 'B34' || res.guestCount >= 7)
      )
      .sort((a, b) => {
        // Distance first (cluster), then capacity
        const distDiff = rowDistance(a.row) - rowDistance(b.row);
        if (Math.abs(distDiff) > 0.01) return distDiff;
        const capDiff = a.capacity - b.capacity;
        if (capDiff !== 0) return capDiff;
        if (a.row !== b.row) return b.row - a.row;
        if (a.id === 'B37') return 1;
        if (b.id === 'B37') return -1;
        return 0;
      });

    if (candidates.length > 0) {
      const chosen = candidates[0];
      singles.set(chosen.id, res);
      usedTables.add(chosen.id);
      if (chosen.id !== 'B34') {
        occupiedRows.add(chosen.row);
      }
      continue;
    }

    // 2. Try merging 2-3 adjacent tables in same row
    const mergeCandidate = findMergeGroup(res.guestCount, usedTables, occupiedRows, rowDistance);
    if (mergeCandidate) {
      mergeCandidate.reservation = res;
      merges.push(mergeCandidate);
      for (const t of mergeCandidate.tables) {
        usedTables.add(t.id);
      }
      occupiedRows.add(mergeCandidate.row);
    }
  }

  return { singles, merges };
}

function findMergeGroup(
  guestCount: number,
  usedTables: Set<string>,
  occupiedRows: Set<number>,
  rowDistance: (row: number) => number
): MergeGroup | null {
  const groups: MergeGroup[] = [];
  const rows = new Set(TABLE_LAYOUT.map(t => t.row));

  for (const row of rows) {
    const available = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round')
      .sort((a, b) => a.col - b.col);

    for (let i = 0; i < available.length - 1; i++) {
      if (available[i + 1].col - available[i].col === 1) {
        const combo = [available[i], available[i + 1]];
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          groups.push({ tables: combo, combinedCapacity: cap, reservation: null, startCol: combo[0].col, colSpan: 2, row });
        }
      }
    }
    for (let i = 0; i < available.length - 2; i++) {
      if (available[i + 1].col - available[i].col === 1 && available[i + 2].col - available[i + 1].col === 1) {
        const combo = [available[i], available[i + 1], available[i + 2]];
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          groups.push({ tables: combo, combinedCapacity: cap, reservation: null, startCol: combo[0].col, colSpan: 3, row });
        }
      }
    }
  }

  if (groups.length === 0) return null;

  groups.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    const distDiff = rowDistance(a.row) - rowDistance(b.row);
    if (distDiff !== 0) return distDiff;
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
}

export function FloorPlan({
  assignments,
  onMoveReservation,
  onMerge,
  onUnmerge,
  onClickFreeTable,
  onClickOccupiedTable,
}: FloorPlanProps) {
  const { t } = useLanguage();
  const { singles, merges } = assignments;
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const totalGuests = Array.from(singles.values()).reduce((s, r) => s + r.guestCount, 0)
    + merges.reduce((s, mg) => s + (mg.reservation?.guestCount || 0), 0);
  const occupied = singles.size + merges.filter(mg => mg.reservation).length;
  const total = TABLE_LAYOUT.length;

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
    { color: 'bg-muted', label: t('tablePlan.free') },
  ];

  // Build merge-between-cells data: for each row, find pairs of adjacent visible tables for "+" buttons
  const mergeBetweenPairs: { row: number; leftTableId: string; rightTableId: string; col: number }[] = [];
  for (let row = 1; row <= 9; row++) {
    const tablesInRow = TABLE_LAYOUT.filter(t => t.row === row).sort((a, b) => a.col - b.col);
    for (let i = 0; i < tablesInRow.length - 1; i++) {
      const left = tablesInRow[i];
      const right = tablesInRow[i + 1];
      // Only show merge button if adjacent columns and neither is already in a merge group, and neither is round
      if (
        right.col - left.col === 1 &&
        !mergedTableIds.has(left.id) &&
        !mergedTableIds.has(right.id) &&
        left.shape !== 'round' &&
        right.shape !== 'round'
      ) {
        mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto text-muted-foreground">
          {occupied}/{total} {t('tablePlan.tablesOccupied')} · {totalGuests} {t('tablePlan.guests')}
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
              return <div key={`${row}-${col}`} className="min-h-[110px]" />;
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
          // Position the button between columns col and col+1 in the given row
          // Grid gap is 0.75rem (gap-3). Each column is 25%. Button sits at the gap.
          const leftPercent = col * 25; // right edge of left cell
          const topPercent = ((row - 1) / 9) * 100;
          return (
            <button
              key={`merge-${leftTableId}-${rightTableId}`}
              onClick={() => onMerge(leftTableId, rightTableId)}
              className="absolute z-10 w-6 h-6 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-md hover:scale-110"
              style={{
                left: `calc(${leftPercent}% - 12px)`,
                top: `calc(${topPercent}% + 50px)`,
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
