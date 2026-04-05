import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TABLE_LAYOUT } from '@/components/tableplan/assignmentAlgorithm';
import type { Reservation } from '@/components/tableplan/TableCard';
import { cn } from '@/lib/utils';
import { useServiceCounters } from './KitchenDisplay';
import { Users } from 'lucide-react';

const COURSES = ['starter', 'mellemret', 'main', 'dessert'] as const;
type Course = typeof COURSES[number];

const COURSE_LETTER: Record<Course, string> = {
  starter: 'F',
  mellemret: 'M',
  main: 'H',
  dessert: 'D',
};

const COURSE_LABEL: Record<Course, string> = {
  starter: 'Forret',
  mellemret: 'Mellemret',
  main: 'Hovedret',
  dessert: 'Dessert',
};

const COURSE_COLORS: Record<Course, { bg: string; text: string; border: string; fill: string }> = {
  starter:   { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/40', fill: 'bg-green-500' },
  mellemret: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/40', fill: 'bg-violet-500' },
  main:      { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/40', fill: 'bg-red-500' },
  dessert:   { bg: 'bg-sky-400/15', text: 'text-sky-300', border: 'border-sky-400/40', fill: 'bg-sky-400' },
};

// ── Load active table plan assignments ──
function useActivePlanAssignments() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['service-overview-plan', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_plans')
        .select('assignments_json, status')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .in('status', ['active', 'published'])
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Deserialize
      const obj = data.assignments_json as any;
      const singles = new Map<string, Reservation>();
      if (obj?.singles) {
        for (const [k, v] of Object.entries(obj.singles)) {
          singles.set(k, v as Reservation);
        }
      }
      return { singles, merges: (obj?.merges || []) as any[], status: (data as any).status };
    },
    enabled: !!activeHotelId,
    refetchInterval: 10_000,
  });
}

// ── Last-run course per table from kitchen_orders ──
function useTableCourseStatus() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: tickets = [] } = useQuery({
    queryKey: ['service-overview-tickets', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_orders' as any)
        .select('table_label, course, status, created_at')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .in('status', ['pending', 'in_progress', 'ready', 'served'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!activeHotelId,
    refetchInterval: 5_000,
  });

  return useMemo(() => {
    const map = new Map<string, Course>();
    for (const t of tickets) {
      const label = t.table_label as string;
      if (!label || map.has(label)) continue;
      const course = t.course as Course;
      if (COURSES.includes(course)) {
        map.set(label, course);
      }
    }
    return map;
  }, [tickets]);
}

export function ServiceOverview() {
  const counters = useServiceCounters();
  const tableStatus = useTableCourseStatus();
  const { data: plan } = useActivePlanAssignments();

  // Grid dimensions from TABLE_LAYOUT (Bellevue only)
  const minRow = Math.min(...TABLE_LAYOUT.map(t => t.row));
  const maxRow = Math.max(...TABLE_LAYOUT.map(t => t.row));
  const minCol = Math.min(...TABLE_LAYOUT.map(t => t.col));
  const maxCol = Math.max(...TABLE_LAYOUT.map(t => t.col));

  // Build a lookup: row,col -> table
  const gridMap = new Map<string, typeof TABLE_LAYOUT[0]>();
  for (const t of TABLE_LAYOUT) {
    gridMap.set(`${t.row},${t.col}`, t);
  }

  const getLabel = (id: string) => `Table ${id.replace(/^[BA]/, '')}`;
  const getNumber = (id: string) => id.replace(/^[BA]/, '');

  // Get reservation for a table from the active plan
  const getReservation = (tableId: string): Reservation | null => {
    if (!plan) return null;
    const res = plan.singles.get(tableId);
    if (res) return res;
    for (const mg of plan.merges) {
      if (mg.tables?.[0]?.id === tableId && mg.reservation) return mg.reservation;
    }
    return null;
  };

  const isOccupied = (tableId: string): boolean => !!getReservation(tableId);
  const isArrived = (tableId: string): boolean => !!getReservation(tableId)?.arrivedAt;

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* ── BIG COUNTERS ── */}
      <div className="grid grid-cols-4 gap-3">
        {COURSES.map(course => {
          const colors = COURSE_COLORS[course];
          const rem = counters.remaining[course] ?? 0;
          const exp = counters.expected[course] ?? 0;
          const comp = counters.completed[course] ?? 0;
          return (
            <div
              key={course}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl border-2 py-5',
                colors.bg, colors.border,
              )}
            >
              <span className={cn('text-5xl font-black tabular-nums leading-none', colors.text)}>
                {rem}
              </span>
              <span className="text-xs text-muted-foreground mt-1.5">
                missing / <span className="font-semibold">{exp}</span> total
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                {comp} served
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn('w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-background', colors.fill)}>
                  {COURSE_LETTER[course]}
                </span>
                <span className={cn('text-xs font-semibold', colors.text)}>
                  {COURSE_LABEL[course]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── LEGEND ── */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        {COURSES.map(course => {
          const colors = COURSE_COLORS[course];
          return (
            <div key={course} className="flex items-center gap-1">
              <span className={cn('w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-black text-background', colors.fill)}>
                {COURSE_LETTER[course]}
              </span>
              <span>{COURSE_LABEL[course]}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40" />
          <span>Reserveret</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded bg-muted border border-border/50" />
          <span>Ledig</span>
        </div>
      </div>

      {/* ── BELLEVUE TABLE MAP ── */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${maxCol - minCol + 1}, minmax(70px, 95px))`,
            gridTemplateRows: `repeat(${maxRow - minRow + 1}, minmax(55px, 70px))`,
          }}
        >
          {Array.from({ length: (maxRow - minRow + 1) * (maxCol - minCol + 1) }).map((_, i) => {
            const row = minRow + Math.floor(i / (maxCol - minCol + 1));
            const col = minCol + (i % (maxCol - minCol + 1));
            const table = gridMap.get(`${row},${col}`);

            if (!table) {
              return <div key={`empty-${row}-${col}`} />;
            }

            const num = getNumber(table.id);
            const label = getLabel(table.id);
            const reservation = getReservation(table.id);
            const arrived = isArrived(table.id);
            const occupied = isOccupied(table.id);
            const currentCourse = tableStatus.get(label);
            const colors = currentCourse ? COURSE_COLORS[currentCourse] : null;

            // Determine cell styling
            let cellBg: string;
            let cellBorder: string;
            let numColor: string;

            if (currentCourse && colors) {
              // Table has a fired course — show course color
              cellBg = colors.bg;
              cellBorder = colors.border;
              numColor = colors.text;
            } else if (arrived) {
              // Arrived but no course fired yet
              cellBg = 'bg-amber-500/10';
              cellBorder = 'border-amber-500/40';
              numColor = 'text-amber-400';
            } else if (occupied) {
              // Reserved but not arrived
              cellBg = 'bg-amber-500/5';
              cellBorder = 'border-amber-500/20';
              numColor = 'text-amber-400/60';
            } else {
              cellBg = 'bg-muted/20';
              cellBorder = 'border-border/20';
              numColor = 'text-muted-foreground/30';
            }

            return (
              <div
                key={table.id}
                className={cn(
                  'rounded-xl border-2 flex flex-col items-center justify-center transition-all relative',
                  table.shape === 'round' && 'rounded-full',
                  cellBg, cellBorder,
                )}
              >
                {/* Guest count badge */}
                {reservation && (
                  <span className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-background/80 rounded-full px-1 py-0.5 text-[8px] text-muted-foreground border border-border/40">
                    <Users className="w-2.5 h-2.5" />
                    {reservation.guestCount}
                  </span>
                )}

                <span className={cn('text-lg font-bold tabular-nums', numColor)}>
                  {num}
                </span>

                {currentCourse && colors ? (
                  <span className={cn(
                    'w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-background mt-0.5',
                    colors.fill,
                  )}>
                    {COURSE_LETTER[currentCourse]}
                  </span>
                ) : arrived ? (
                  <span className="text-[9px] font-semibold text-amber-400 mt-0.5">✓</span>
                ) : occupied ? (
                  <span className="text-[8px] text-amber-400/40 mt-0.5">{reservation?.time || '—'}</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground/20 mt-0.5">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
