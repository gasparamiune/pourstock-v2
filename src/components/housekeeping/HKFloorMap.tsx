import { useMemo } from 'react';
import { useRooms } from '@/hooks/useReception';
import { Loader2, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  available:   { label: 'Available',   bg: 'bg-green-500/10',  border: 'border-green-500/40',  text: 'text-green-700',    dot: 'bg-green-500' },
  occupied:    { label: 'Occupied',    bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  text: 'text-amber-700',    dot: 'bg-amber-500' },
  checkout:    { label: 'Checkout',    bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-700',   dot: 'bg-orange-500' },
  dirty:       { label: 'Dirty',       bg: 'bg-red-500/10',    border: 'border-red-500/40',    text: 'text-red-700',      dot: 'bg-red-500' },
  in_progress: { label: 'Cleaning',    bg: 'bg-blue-500/10',   border: 'border-blue-500/40',   text: 'text-blue-700',     dot: 'bg-blue-500' },
  clean:       { label: 'Clean',       bg: 'bg-emerald-500/10',border: 'border-emerald-500/40',text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  inspected:   { label: 'Inspected',   bg: 'bg-primary/10',    border: 'border-primary/40',    text: 'text-primary',      dot: 'bg-primary' },
  maintenance: { label: 'Maintenance', bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-700',   dot: 'bg-purple-500' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
}

// ── Room cell ─────────────────────────────────────────────────────────────────

function RoomCell({ room }: { room: any }) {
  const cfg = getStatusConfig(room.status);
  return (
    <div
      className={`relative p-2 rounded-xl border-2 transition-all ${cfg.bg} ${cfg.border} flex flex-col gap-0.5 min-h-[64px] cursor-default`}
      title={`Room ${room.room_number} · ${room.room_type} · ${cfg.label}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">{room.room_number}</span>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      </div>
      <p className="text-xs text-muted-foreground capitalize truncate">{room.room_type}</p>
      <p className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</p>
    </div>
  );
}

// ── Main HKFloorMap ───────────────────────────────────────────────────────────

export function HKFloorMap() {
  const { data: rooms = [], isLoading } = useRooms();

  const floors = useMemo(() => {
    const map: Record<number, any[]> = {};
    (rooms as any[]).forEach((r) => {
      const floor = r.floor ?? 1;
      (map[floor] ??= []).push(r);
    });
    // Sort rooms on each floor by room_number
    Object.keys(map).forEach((f) => {
      map[Number(f)].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    });
    return map;
  }, [rooms]);

  const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => b - a); // top floor first

  // Legend
  const legendStatuses = ['available', 'occupied', 'checkout', 'dirty', 'in_progress', 'clean', 'inspected', 'maintenance'];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((rooms as any[]).length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <BedDouble className="h-12 w-12 opacity-20" />
        <p className="text-sm">No rooms found. Add rooms in Settings.</p>
      </div>
    );
  }

  // Status summary
  const statusCounts: Record<string, number> = {};
  (rooms as any[]).forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  });

  return (
    <div className="space-y-5">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => {
          const cfg = getStatusConfig(status);
          return (
            <div key={status} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {count} {cfg.label}
            </div>
          );
        })}
      </div>

      {/* Floors — top to bottom */}
      {floorNumbers.map((floor) => (
        <div key={floor}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Floor {floor}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {floors[floor].map((room: any) => (
              <RoomCell key={room.id} room={room} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
