import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TABLE_LAYOUT } from '@/components/tableplan/assignmentAlgorithm';
import { cn } from '@/lib/utils';
import { useServiceCounters } from './KitchenDisplay';

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

/**
 * Determine the last-run course for each table based on kitchen_orders.
 * The "last run" is the most recently created ticket that is pending/in_progress/ready/served.
 */
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
    // tickets are sorted desc by created_at, so first match per table_label wins
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

  // Derive table label from id
  const getLabel = (id: string) => `Table ${id.replace(/^[BA]/, '')}`;
  const getNumber = (id: string) => id.replace(/^[BA]/, '');

  return (
    <div className="flex flex-col h-full gap-6 p-4">
      {/* ── BIG COUNTERS ── */}
      <div className="grid grid-cols-4 gap-4">
        {COURSES.map(course => {
          const colors = COURSE_COLORS[course];
          const rem = counters.remaining[course] ?? 0;
          const exp = counters.expected[course] ?? 0;
          const comp = counters.completed[course] ?? 0;
          return (
            <div
              key={course}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl border-2 py-6',
                colors.bg, colors.border,
              )}
            >
              <span className={cn('text-6xl font-black tabular-nums leading-none', colors.text)}>
                {rem}
              </span>
              <span className="text-sm text-muted-foreground mt-2">
                missing / <span className="font-semibold">{exp}</span> total
              </span>
              <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                {comp} served
              </span>
              <div className="flex items-center gap-2 mt-3">
                <span className={cn('w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-background', colors.fill)}>
                  {COURSE_LETTER[course]}
                </span>
                <span className={cn('text-sm font-semibold', colors.text)}>
                  {COURSE_LABEL[course]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── LEGEND ── */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {COURSES.map(course => {
          const colors = COURSE_COLORS[course];
          return (
            <div key={course} className="flex items-center gap-1.5">
              <span className={cn('w-4 h-4 rounded flex items-center justify-center text-[9px] font-black text-background', colors.fill)}>
                {COURSE_LETTER[course]}
              </span>
              <span>{COURSE_LABEL[course]}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-muted border border-border/50" />
          <span>Ingen ordre</span>
        </div>
      </div>

      {/* ── BELLEVUE TABLE MAP ── */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${maxCol - minCol + 1}, minmax(70px, 90px))`,
            gridTemplateRows: `repeat(${maxRow - minRow + 1}, minmax(60px, 75px))`,
          }}
        >
          {Array.from({ length: (maxRow - minRow + 1) * (maxCol - minCol + 1) }).map((_, i) => {
            const row = minRow + Math.floor(i / (maxCol - minCol + 1));
            const col = minCol + (i % (maxCol - minCol + 1));
            const table = gridMap.get(`${row},${col}`);

            if (!table) {
              return <div key={`empty-${row}-${col}`} />;
            }

            const label = getLabel(table.id);
            const num = getNumber(table.id);
            const currentCourse = tableStatus.get(label);
            const colors = currentCourse ? COURSE_COLORS[currentCourse] : null;

            return (
              <div
                key={table.id}
                className={cn(
                  'rounded-xl border-2 flex flex-col items-center justify-center transition-all',
                  table.shape === 'round' && 'rounded-full',
                  colors
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-muted/30 border-border/30',
                )}
              >
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  colors ? colors.text : 'text-muted-foreground/50',
                )}>
                  {num}
                </span>
                {currentCourse ? (
                  <span className={cn(
                    'text-xs font-black mt-0.5',
                    colors!.text,
                  )}>
                    {COURSE_LETTER[currentCourse]}
                  </span>
                ) : (
                  <span className="text-[9px] text-muted-foreground/30 mt-0.5">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
