import { useState } from 'react';
import { useHousekeepingTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, ArrowRight, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HKAssignmentBoard() {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { assignTask } = useHousekeepingMutations();
  const [selectedWorker, setSelectedWorker] = useState<string>('');

  // Fetch HK staff
  const { data: hkStaff } = useQuery({
    queryKey: ['hk-staff-assign', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_departments')
        .select('user_id')
        .eq('department', 'housekeeping')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const userIds = data.map(d => d.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      if (pErr) throw pErr;
      
      return (profiles || []).map(p => ({
        user_id: p.user_id,
        name: p.full_name || p.email || 'Staff',
      }));
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const allTasks = tasks || [];
  const unassignedTasks = allTasks.filter(t => !t.assigned_to && t.status !== 'inspected');
  const staff = hkStaff || [];

  // Group assigned tasks by worker
  const staffAssignments = staff.map(s => ({
    ...s,
    tasks: allTasks.filter(t => t.assigned_to === s.user_id),
    activeTasks: allTasks.filter(t => t.assigned_to === s.user_id && t.status !== 'inspected'),
  }));

  // Open pool tasks
  const poolTasks = allTasks.filter(t => !t.assigned_to && t.status !== 'inspected');

  const handleAssign = (taskId: string, userId: string) => {
    assignTask.mutate({ taskId, userId });
  };

  const handleUnassign = (taskId: string) => {
    assignTask.mutate({ taskId, userId: '' });
  };

  const handleAutoDistribute = () => {
    if (staff.length === 0 || unassignedTasks.length === 0) return;
    
    // Simple round-robin distribution
    unassignedTasks.forEach((task, idx) => {
      const worker = staff[idx % staff.length];
      assignTask.mutate({ taskId: task.id, userId: worker.user_id });
    });
  };

  const getWorkloadColor = (count: number) => {
    if (count <= 3) return 'text-[hsl(var(--success))]';
    if (count <= 6) return 'text-[hsl(var(--warning))]';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button variant="outline" onClick={handleAutoDistribute} disabled={unassignedTasks.length === 0 || staff.length === 0}>
          <Shuffle className="h-4 w-4 mr-2" />
          {t('housekeeping.autoDistribute')} ({unassignedTasks.length})
        </Button>
        <span className="text-sm text-muted-foreground">
          {unassignedTasks.length} {t('housekeeping.unassignedTasks')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t('housekeeping.staff')}
          </h3>

          {staffAssignments.map(worker => (
            <Card key={worker.user_id}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{worker.name}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", getWorkloadColor(worker.activeTasks.length))}>
                    {worker.activeTasks.length} {t('housekeeping.activeTasks')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-1">
                {worker.tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('housekeeping.noAssignedTasks')}</p>
                ) : (
                  worker.tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.room?.room_number}</span>
                        <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleUnassign(task.id)}>
                        ✕
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}

          {/* Open Pool section */}
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                🏊 {t('housekeeping.openPool')}
                <Badge variant="outline" className="text-xs">{poolTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-1">
              {poolTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('housekeeping.noPoolTasks')}</p>
              ) : (
                poolTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.room?.room_number}</span>
                      <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Tasks Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t('housekeeping.unassignedTasks')} ({unassignedTasks.length})
          </h3>

          {unassignedTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {t('housekeeping.allAssigned')}
              </CardContent>
            </Card>
          ) : (
            unassignedTasks.map(task => (
              <Card key={task.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{t('reception.room')} {task.room?.room_number}</span>
                      {task.priority === 'vip' && <Badge className="bg-[hsl(var(--room-reserved))]/20 text-[hsl(var(--room-reserved))] text-xs">VIP</Badge>}
                      {task.priority === 'urgent' && <Badge variant="destructive" className="text-xs">{t('housekeeping.urgent')}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                  </div>
                  <Select onValueChange={(userId) => handleAssign(task.id, userId)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder={t('housekeeping.assignTo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
