import { useHousekeepingTasks, useMaintenanceRequests, useHKStaff, useHKReservations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Wrench, ClipboardCheck, Users, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'border-border',
    warning: 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5',
    danger: 'border-destructive/30 bg-destructive/5',
    success: 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5',
  };

  return (
    <Card className={cn('border', variantClasses[variant])}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HKOverview() {
  const { t } = useLanguage();
  const { data: tasks, isLoading: tasksLoading } = useHousekeepingTasks();
  const { data: maintenance, isLoading: maintLoading } = useMaintenanceRequests();
  const { data: reservations } = useHKReservations();
  const { data: hkStaff } = useHKStaff();
  const today = new Date().toISOString().split('T')[0];

  if (tasksLoading || maintLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const allTasks = tasks || [];
  const counts = {
    dirty: allTasks.filter(t => t.status === 'dirty').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    clean: allTasks.filter(t => t.status === 'clean').length,
    inspected: allTasks.filter(t => t.status === 'inspected').length,
    paused: allTasks.filter(t => t.status === 'paused').length,
  };

  const unassigned = allTasks.filter(t => !t.assigned_to && t.status !== 'inspected').length;
  const urgentCount = allTasks.filter(t => (t.priority === 'urgent' || t.priority === 'vip') && t.status !== 'inspected').length;
  const inspectQueue = allTasks.filter(t => t.status === 'clean').length;
  const activeMaintenanceBlocking = (maintenance || []).filter(m => m.status === 'open' || m.status === 'in_progress').length;

  const arrivalsToday = (reservations || []).filter(r => r.check_in_date === today).length;
  const departuresToday = (reservations || []).filter(r => r.check_out_date === today).length;
  const stayovers = (reservations || []).filter(r => r.check_in_date < today && r.check_out_date > today && r.status === 'checked_in').length;

  // Staff with active tasks
  const staffWithTasks = new Set(allTasks.filter(tk => tk.assigned_to && tk.status === 'in_progress').map(tk => tk.assigned_to));

  // Average clean time (completed tasks)
  const completedTasks = allTasks.filter(t => t.started_at && t.completed_at);
  const avgCleanMinutes = completedTasks.length > 0
    ? Math.round(completedTasks.reduce((sum, t) => {
        const start = new Date(t.started_at!).getTime();
        const end = new Date(t.completed_at!).getTime();
        return sum + (end - start) / 60000;
      }, 0) / completedTasks.length)
    : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Status Summary Bar */}
      <div className="flex flex-wrap gap-2">
        {(['dirty', 'in_progress', 'clean', 'inspected'] as const).map(status => (
          <div
            key={status}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              `bg-[hsl(var(--hk-${status.replace('_', '-')}))]/10 text-[hsl(var(--hk-${status.replace('_', '-')}))]`
            )}
          >
            <span className="font-bold text-lg">{counts[status]}</span>
            <span className="text-sm">{t(`housekeeping.${status === 'in_progress' ? 'inProgress' : status}`)}</span>
          </div>
        ))}
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard label={t('housekeeping.arrivals')} value={arrivalsToday} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label={t('housekeeping.departures')} value={departuresToday} icon={<Clock className="h-5 w-5" />} />
        <StatCard label={t('housekeeping.stayovers')} value={stayovers} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('housekeeping.unassigned')} value={unassigned} icon={<ClipboardCheck className="h-5 w-5" />} variant={unassigned > 0 ? 'warning' : 'default'} />
        <StatCard label={t('housekeeping.inspectQueue')} value={inspectQueue} icon={<ClipboardCheck className="h-5 w-5" />} variant={inspectQueue > 3 ? 'warning' : 'default'} />
        <StatCard label={t('housekeeping.maintenanceBlocked')} value={activeMaintenanceBlocking} icon={<Wrench className="h-5 w-5" />} variant={activeMaintenanceBlocking > 0 ? 'danger' : 'default'} />
        <StatCard label={t('housekeeping.staffActive')} value={staffWithTasks.size} icon={<Users className="h-5 w-5" />} variant="success" />
        {avgCleanMinutes > 0 && (
          <StatCard label={t('housekeeping.avgCleanTime')} value={avgCleanMinutes} icon={<Clock className="h-5 w-5" />} />
        )}
      </div>

      {/* Alert Strips */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {urgentCount} {t('housekeeping.urgentRooms')}
          </span>
        </div>
      )}

      {activeMaintenanceBlocking > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]">
          <Wrench className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {activeMaintenanceBlocking} {t('housekeeping.roomsBlockedMaintenance')}
          </span>
        </div>
      )}

      {/* Staff Activity Strip */}
      {(hkStaff || []).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('housekeeping.staffActivity')}</h3>
            <div className="flex flex-wrap gap-3">
              {(hkStaff || []).map((staff: any) => {
                const staffTasks = allTasks.filter(t => t.assigned_to === staff.user_id);
                const active = staffTasks.filter(t => t.status === 'in_progress').length;
                const done = staffTasks.filter(t => t.status === 'clean' || t.status === 'inspected').length;
                const total = staffTasks.length;
                const name = staff.profiles?.full_name || 'Staff';
                return (
                  <div key={staff.user_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                    <div className={cn("w-2 h-2 rounded-full", active > 0 ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/30")} />
                    <span className="text-sm font-medium">{name.split(' ')[0]}</span>
                    <Badge variant="outline" className="text-xs">{done}/{total}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {allTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('housekeeping.noTasksOverview')}
        </div>
      )}
    </div>
  );
}
