import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';

// Restaurant layout matching the actual floor plan (9 rows x 4 columns)
const TABLE_LAYOUT: TableDef[] = [
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
  reservation: Reservation;
  startCol: number;
  colSpan: number;
  row: number;
}

interface AssignmentResult {
  singles: Map<string, Reservation>;
  merges: MergeGroup[];
}

export function assignTablesToReservations(reservations: Reservation[]): AssignmentResult {
  const singles = new Map<string, Reservation>();
  const merges: MergeGroup[] = [];
  const usedTables = new Set<string>();
  const occupiedRows = new Set<number>();

  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  const rowDistance = (row: number): number => {
    if (occupiedRows.size === 0) return 0;
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
        const capDiff = a.capacity - b.capacity;
        if (capDiff !== 0) return capDiff;
        const distDiff = rowDistance(a.row) - rowDistance(b.row);
        if (distDiff !== 0) return distDiff;
        if (a.row !== b.row) return b.row - a.row;
        if (a.id === 'B37') return 1;
        if (b.id === 'B37') return -1;
        return 0;
      });

    if (candidates.length > 0) {
      const chosen = candidates[0];
      singles.set(chosen.id, res);
      usedTables.add(chosen.id);
      // B34 isolated from clustering
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
): (MergeGroup & { reservation: any }) | null {
  const groups: MergeGroup[] = [];

  // Get all rows
  const rows = new Set(TABLE_LAYOUT.map(t => t.row));

  for (const row of rows) {
    // Get available non-round tables in this row, sorted by col
    const available = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round')
      .sort((a, b) => a.col - b.col);

    // Try pairs
    for (let i = 0; i < available.length - 1; i++) {
      if (available[i + 1].col - available[i].col === 1) {
        // Adjacent columns
        const combo = [available[i], available[i + 1]];
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          groups.push({
            tables: combo,
            combinedCapacity: cap,
            reservation: null as any,
            startCol: combo[0].col,
            colSpan: 2,
            row,
          });
        }
      }
    }

    // Try triples
    for (let i = 0; i < available.length - 2; i++) {
      if (
        available[i + 1].col - available[i].col === 1 &&
        available[i + 2].col - available[i + 1].col === 1
      ) {
        const combo = [available[i], available[i + 1], available[i + 2]];
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          groups.push({
            tables: combo,
            combinedCapacity: cap,
            reservation: null as any,
            startCol: combo[0].col,
            colSpan: 3,
            row,
          });
        }
      }
    }
  }

  if (groups.length === 0) return null;

  // Sort: smallest capacity, then closest to cluster, then bottom rows
  groups.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    const distDiff = rowDistance(a.row) - rowDistance(b.row);
    if (distDiff !== 0) return distDiff;
    return b.row - a.row;
  });

  return groups[0] as any;
}

interface FloorPlanProps {
  reservations: Reservation[];
}

export function FloorPlan({ reservations }: FloorPlanProps) {
  const { t } = useLanguage();
  const { singles, merges } = assignTablesToReservations(reservations);

  const totalGuests = reservations.reduce((s, r) => s + r.guestCount, 0);
  const occupied = singles.size + merges.length;
  const total = TABLE_LAYOUT.length;

  // Build a set of table IDs that are part of merges (non-first cells to skip)
  const mergedTableIds = new Set<string>();
  const mergeByFirstId = new Map<string, MergeGroup>();
  for (const mg of merges) {
    mergeByFirstId.set(mg.tables[0].id, mg);
    for (const t of mg.tables) {
      mergedTableIds.add(t.id);
    }
  }

  const legendItems = [
    { color: 'bg-sky-500', label: '2-ret' },
    { color: 'bg-amber-500', label: '3-ret' },
    { color: 'bg-emerald-500', label: '4-ret' },
    { color: 'bg-violet-500', label: 'A la carte' },
    { color: 'bg-slate-500', label: 'Bordres.' },
    { color: 'bg-muted', label: t('tablePlan.free') },
  ];

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
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 9 }, (_, rowIdx) => {
          const row = rowIdx + 1;
          return Array.from({ length: 4 }, (_, colIdx) => {
            const col = colIdx + 1;
            const table = TABLE_LAYOUT.find(t => t.row === row && t.col === col);

            if (!table) {
              return <div key={`${row}-${col}`} className="min-h-[110px]" />;
            }

            // Check if this table is part of a merge group
            const mg = mergeByFirstId.get(table.id);
            if (mg) {
              // Render the merged card spanning multiple columns
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  reservation={mg.reservation}
                  mergedIds={mg.tables.map(t => t.id)}
                  colSpan={mg.colSpan}
                />
              );
            }

            // Skip non-first cells of a merge group
            if (mergedTableIds.has(table.id)) {
              return null;
            }

            return (
              <TableCard
                key={table.id}
                table={table}
                reservation={singles.get(table.id)}
              />
            );
          });
        }).flat().filter(Boolean)}
      </div>
    </div>
  );
}
