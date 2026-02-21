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

export function assignTablesToReservations(reservations: Reservation[]): Map<string, Reservation> {
  const assignments = new Map<string, Reservation>();
  const usedTables = new Set<string>();
  const occupiedRows = new Set<number>();

  // Sort: largest parties first
  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  for (const res of sorted) {
    // Helper: minimum distance from a row to any occupied row
    const rowDistance = (row: number): number => {
      if (occupiedRows.size === 0) return 0;
      let sum = 0;
      for (const r of occupiedRows) {
        sum += Math.abs(row - r);
      }
      return sum / occupiedRows.size;
    };

    const candidates = TABLE_LAYOUT
      .filter(t => !usedTables.has(t.id) && t.capacity >= res.guestCount)
      .sort((a, b) => {
        // 1. Smallest capacity that fits
        const capDiff = a.capacity - b.capacity;
        if (capDiff !== 0) return capDiff;
        // 2. Closest to occupied rows (cluster together)
        const distDiff = rowDistance(a.row) - rowDistance(b.row);
        if (distDiff !== 0) return distDiff;
        // 3. Prefer higher row numbers (bottom-to-top)
        if (a.row !== b.row) return b.row - a.row;
        // 4. Deprioritize B37
        if (a.id === 'B37') return 1;
        if (b.id === 'B37') return -1;
        return 0;
      });

    if (candidates.length > 0) {
      const chosen = candidates[0];
      assignments.set(chosen.id, res);
      usedTables.add(chosen.id);
      occupiedRows.add(chosen.row);
    }
  }

  return assignments;
}

interface FloorPlanProps {
  reservations: Reservation[];
}

export function FloorPlan({ reservations }: FloorPlanProps) {
  const { t } = useLanguage();
  const assignments = assignTablesToReservations(reservations);

  const totalGuests = reservations.reduce((s, r) => s + r.guestCount, 0);
  const occupied = assignments.size;
  const total = TABLE_LAYOUT.length;

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
            return (
              <TableCard
                key={table.id}
                table={table}
                reservation={assignments.get(table.id)}
              />
            );
          });
        }).flat()}
      </div>
    </div>
  );
}
