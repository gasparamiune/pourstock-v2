import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Clock, CheckCircle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfWeek, format, subDays } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HKTask {
  id: string;
  status: string;
  assigned_to: string | null;
  task_type: string;
  completed_at: string | null;
  task_date: string;
  started_at?: string | null;
}

interface HKProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useHKTasksRange(from: string, to: string) {
  const { activeHotelId } = useAuth();
  return useQuery({
    queryKey: ['hk-tasks-range', activeHotelId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping_tasks' as any)
        .select('id, status, assigned_to, task_type, completed_at, task_date')
        .eq('hotel_id', activeHotelId)
        .gte('task_date', from)
        .lte('task_date', to)
        .order('task_date', { ascending: false });
      if (error) throw error;
      return (data as unknown) as HKTask[];
    },
    enabled: !!activeHotelId,
  });
}

function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['profiles-subset', userIds.join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles' as any)
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      return ((data ?? []) as unknown) as HKProfile[];
    },
    enabled: userIds.length > 0,
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-2xl leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main HKPerformanceDashboard ───────────────────────────────────────────────

export function HKPerformanceDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const past30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: todayTasks = [], isLoading: loadingToday } = useHKTasksRange(today, today);
  const { data: weekTasks = [], isLoading: loadingWeek } = useHKTasksRange(weekStart, today);
  const { data: monthTasks = [], isLoading: loadingMonth } = useHKTasksRange(past30, today);

  // Unique assigned users
  const allTasks = [...todayTasks, ...weekTasks, ...monthTasks];
  const staffIds = useMemo(() => {
    return [...new Set(allTasks.filter((t) => t.assigned_to).map((t) => t.assigned_to as string))];
  }, [allTasks]);

  const { data: profiles = [] } = useProfiles(staffIds);
  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach((p) => { m[p.user_id] = p.full_name ?? p.email ?? p.user_id.slice(0, 8); });
    return m;
  }, [profiles]);

  // Per-staff stats (week)
  const staffStats = useMemo(() => {
    const stats: Record<string, { name: string; completed: number; total: number }> = {};
    weekTasks.forEach((t) => {
      if (!t.assigned_to) return;
      const uid = t.assigned_to;
      if (!stats[uid]) stats[uid] = { name: profileMap[uid] ?? 'Staff', completed: 0, total: 0 };
      stats[uid].total++;
      if (t.status === 'done') stats[uid].completed++;
    });
    return Object.values(stats).sort((a, b) => b.completed - a.completed);
  }, [weekTasks, profileMap]);

  // 7-day chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayTasks = monthTasks.filter((t) => t.task_date === d);
      return {
        day: format(subDays(new Date(), 6 - i), 'EEE'),
        completed: dayTasks.filter((t) => t.status === 'done').length,
        total: dayTasks.length,
      };
    });
  }, [monthTasks]);

  const todayCompleted = todayTasks.filter((t) => t.status === 'done').length;
  const weekCompleted = weekTasks.filter((t) => t.status === 'done').length;
  const passRate = monthTasks.length > 0
    ? Math.round((monthTasks.filter((t) => t.status === 'done').length / monthTasks.length) * 100)
    : 0;

  if (loadingToday || loadingWeek) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle} label="Completed today" value={todayCompleted} sub={`of ${todayTasks.length} assigned`} />
        <StatCard icon={Trophy} label="Completed this week" value={weekCompleted} />
        <StatCard icon={Star} label="Completion rate (30d)" value={`${passRate}%`} />
        <StatCard icon={Clock} label="Staff active this week" value={staffStats.length} />
      </div>

      {/* 7-day chart */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tasks Completed — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />
              <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="total" name="Total assigned" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} fillOpacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff leaderboard */}
      {staffStats.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Team Performance — This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staffStats.map((s, i) => {
                const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium truncate">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.completed}/{s.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${i === 0 ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <Badge className="text-xs" variant="outline">{pct}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
