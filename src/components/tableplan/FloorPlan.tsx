import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';

// Restaurant layout matching the actual floor plan
const TABLE_LAYOUT: TableDef[] = [
  // Row 1
  { id: 'B7',  capacity: 4, row: 1, col: 1 },
  { id: 'B17', capacity: 2, row: 1, col: 2 },
  { id: 'B27', capacity: 2, row: 1, col: 3 },
  // Row 2
  { id: 'B6',  capacity: 4, row: 2, col: 1 },
  { id: 'B16', capacity: 2, row: 2, col: 2 },
  { id: 'B26', capacity: 2, row: 2, col: 3 },
  { id: 'B31', capacity: 2, row: 2, col: 4 },
  // Row 3
  { id: 'B5',  capacity: 4, row: 3, col: 1 },
  { id: 'B15', capacity: 2, row: 3, col: 2 },
  { id: 'B25', capacity: 2, row: 3, col: 3 },
  // Row 4
  { id: 'B4',  capacity: 4, row: 4, col: 1 },
  { id: 'B14', capacity: 2, row: 4, col: 2 },
  { id: 'B32', capacity: 6, row: 4, col: 3 },
  // Row 5
  { id: 'B3',  capacity: 6, row: 5, col: 1 },
  { id: 'B13', capacity: 6, row: 5, col: 2 },
  { id: 'B23', capacity: 6, row: 5, col: 3 },
  // Row 6
  { id: 'B2',  capacity: 4, row: 6, col: 1 },
  { id: 'B12', capacity: 2, row: 6, col: 2 },
  { id: 'B22', capacity: 2, row: 6, col: 3 },
  { id: 'B33', capacity: 2, row: 6, col: 4 },
  // Row 7
  { id: 'B1',  capacity: 4, row: 7, col: 1 },
  { id: 'B11', capacity: 2, row: 7, col: 2 },
  { id: 'B21', capacity: 2, row: 7, col: 3 },
  // Row 8
  { id: 'B35', capacity: 4, row: 8, col: 1 },
  { id: 'B36', capacity: 2, row: 8, col: 2 },
  { id: 'B37', capacity: 2, row: 8, col: 3 },
];

export function assignTablesToReservations(reservations: Reservation[]): Map<string, Reservation> {
  const assignments = new Map<string, Reservation>();
  const usedTables = new Set<string>();

  // Sort: largest parties first
  const sorted = [...reservations].sort((a, b) => b.guestCount - a.guestCount);

  for (const res of sorted) {
    // Find smallest available table that fits
    // Prefer bottom rows (higher row number) first, deprioritize B37
    const candidates = TABLE_LAYOUT
      .filter(t => !usedTables.has(t.id) && t.capacity >= res.guestCount)
      .sort((a, b) =>
        a.capacity - b.capacity ||
        b.row - a.row ||
        (a.id === 'B37' ? 1 : b.id === 'B37' ? -1 : 0)
      );

    if (candidates.length > 0) {
      assignments.set(candidates[0].id, res);
      usedTables.add(candidates[0].id);
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
        {Array.from({ length: 8 }, (_, rowIdx) => {
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
