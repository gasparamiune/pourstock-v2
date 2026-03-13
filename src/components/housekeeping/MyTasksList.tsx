import { useMyTasks, useHousekeepingMutations, useOpenPoolTasks, useAllTasks } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Loader2, Hand, Play, CheckCircle, AlertTriangle, Pause, MapPin, Star, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElapsedTimer } from './ElapsedTimer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { useState } from 'react';

const statusBg: Record<string, string> = {
  dirty: 'border-l-[hsl(var(--hk-dirty))]',
  in_progress: 'border-l-[hsl(var(--hk-in-progress))]',
  clean: 'border-l-[hsl(var(--hk-clean))]',
  inspected: 'border-l-[hsl(var(--hk-inspected))]',
  paused: 'border-l-muted-foreground',
};

function TaskCard({ task, onProgress, onClaim, onPause, isPool, isZone }: {
  task: HousekeepingTask;
  onProgress?: () => void;
  onClaim?: () => void;
  onPause?: () => void;
  isPool?: boolean;
  isZone?: boolean;
}) {
  const { t } = useLanguage();
  const hasInspectionNote = task.notes?.startsWith('[Inspection');

  return (
    <Card className={cn("border-l-4", statusBg[task.status], (isPool || isZone) && "border-dashed border-l-4")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{task.room?.room_number || '—'}</p>
              {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{task.room?.room_type}</span>
              {task.room?.floor && <span>· {t('reception.floor')} {task.room.floor}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
              {task.estimated_minutes && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" /> ~{task.estimated_minutes}min
                </span>
              )}
            </div>
            {/* Live timer for in-progress */}
            {task.status === 'in_progress' && task.started_at && (
              <div className="mt-1">
                <ElapsedTimer startTime={task.started_at} className="text-xs text-[hsl(var(--hk-in-progress))] font-mono flex items-center gap-0.5" />
              </div>
            )}
            {isPool && (
              <span className="text-xs text-[hsl(var(--info))] mt-1 inline-block">🏊 {t('housekeeping.openPool')}</span>
            )}
            {isZone && (
              <span className="text-xs text-[hsl(var(--info))] mt-1 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {t('housekeeping.zoneTask')}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-3">
            {(isPool || isZone) && onClaim && (
              <Button size="sm" variant="outline" onClick={onClaim} className="touch-target min-h-[44px]">
                <Hand className="h-4 w-4 mr-1" />
                {t('housekeeping.claim')}
              </Button>
            )}
            {!isPool && !isZone && task.status === 'dirty' && onProgress && (
              <Button size="sm" onClick={onProgress} className="touch-target min-h-[44px]">
                <Play className="h-4 w-4 mr-1" />
                {t('housekeeping.startCleaning')}
              </Button>
            )}
            {!isPool && !isZone && task.status === 'in_progress' && (
              <div className="flex flex-col gap-1">
                {onProgress && (
                  <Button size="sm" onClick={onProgress} className="touch-target min-h-[44px] bg-[hsl(var(--hk-clean))] hover:bg-[hsl(var(--hk-clean))]/90">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('housekeeping.markClean')}
                  </Button>
                )}
                {onPause && (
                  <Button size="sm" variant="outline" onClick={onPause} className="touch-target min-h-[44px]">
                    <Pause className="h-4 w-4 mr-1" />
                    {t('housekeeping.pause')}
                  </Button>
                )}
              </div>
            )}
            {!isPool && !isZone && task.status === 'paused' && onProgress && (
              <Button size="sm" onClick={onProgress} className="touch-target min-h-[44px]">
                <Play className="h-4 w-4 mr-1" />
                {t('housekeeping.resume')}
              </Button>
            )}
          </div>
        </div>

        {/* Inspection notes highlighted */}
        {hasInspectionNote && (
          <div className={cn(
            "text-xs mt-2 px-2 py-1.5 rounded font-medium",
            task.notes?.includes('FAIL') ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20"
          )}>
            {task.notes}
          </div>
        )}

        {/* Regular notes */}
        {task.notes && !hasInspectionNote && (
          <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{task.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

const statusOrder = ['dirty', 'in_progress', 'paused', 'clean', 'inspected'];

export function MyTasksList() {
  const { t } = useLanguage();
  const { user, activeHotelId } = useAuth();
  const { data: tasks, isLoading } = useMyTasks();
  const { data: poolTasks, isLoading: poolLoading } = useOpenPoolTasks();
  const { data: allTasks } = useAllTasks();
  const { updateTaskStatus, claimTask, updateTaskNotes } = useHousekeepingMutations();
  const [showOtherTasks, setShowOtherTasks] = useState(false);

  // Fetch zone tasks for this user
  const { data: zoneTasks } = useQuery({
    queryKey: ['hk-zone-tasks', user?.id, activeHotelId],
    queryFn: async () => {
      if (!user) return [];
      const { data: zones } = await supabase
        .from('hk_zones')
        .select('floors')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .contains('assigned_staff', [user.id]);
      if (!zones || zones.length === 0) return [];
      
      const allFloors = zones.flatMap(z => z.floors || []);
      if (allFloors.length === 0) return [];

      const today = new Date().toISOString().split('T')[0];
      const { data: tasks } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(room_number, floor, room_type)')
        .eq('hotel_id', activeHotelId)
        .eq('task_date', today)
        .is('assigned_to', null)
        .in('room.floor', allFloors)
        .order('priority', { ascending: true });
      
      return (tasks || []).filter(t => t.room && allFloors.includes(t.room.floor)) as HousekeepingTask[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleProgress = (taskId: string, currentStatus: string) => {
    const idx = statusOrder.indexOf(currentStatus);
    if (currentStatus === 'paused') {
      updateTaskStatus.mutate({ taskId, status: 'in_progress' });
    } else if (idx < statusOrder.length - 1) {
      updateTaskStatus.mutate({ taskId, status: statusOrder[idx + 1] });
    }
  };

  const handlePause = (taskId: string) => {
    updateTaskStatus.mutate({ taskId, status: 'paused' });
  };

  const handleClaim = (taskId: string) => {
    if (user) {
      claimTask.mutate({ taskId });
    }
  };

  const myActiveTasks = (tasks || []).filter(t => t.status !== 'inspected' && t.status !== 'clean');
  const myCompletedTasks = (tasks || []).filter(t => t.status === 'inspected' || t.status === 'clean');
  const availablePool = (poolTasks || []).filter(t => t.status !== 'inspected');
  const availableZone = (zoneTasks || []).filter(t => t.status !== 'inspected');

  // Shift summary
  const totalTasks = (tasks || []).length;
  const completedCount = myCompletedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const estimatedRemaining = myActiveTasks.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0);

  // Other staff tasks (for visibility toggle)
  const otherStaffTasks = (allTasks || []).filter(t => t.assigned_to && t.assigned_to !== user?.id && t.status !== 'inspected');

  // "Next Best Room" — highest priority, closest floor to last task
  const suggestedNext = myActiveTasks.length === 0 && availablePool.length > 0
    ? availablePool[0]
    : null;

  if (myActiveTasks.length === 0 && availablePool.length === 0 && availableZone.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🎉</div>
        <p className="text-lg font-medium">{t('housekeeping.allDone')}</p>
        <p className="text-sm text-muted-foreground">{t('housekeeping.checkPoolSuggestion')}</p>
        {myCompletedTasks.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {myCompletedTasks.length} {t('housekeeping.completedToday')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Shift Summary Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{t('housekeeping.shiftProgress')}</h3>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalTasks} · ~{estimatedRemaining}min {t('housekeeping.estimatedRemaining')}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Next Best Room suggestion */}
      {suggestedNext && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t('housekeeping.nextBestRoom')}</span>
          </div>
          <TaskCard
            task={suggestedNext}
            onClaim={() => handleClaim(suggestedNext.id)}
            isPool
          />
        </div>
      )}

      {/* My Assigned Tasks */}
      {myActiveTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t('housekeeping.myAssigned')} ({myActiveTasks.length})
          </h3>
          {myActiveTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onProgress={() => handleProgress(task.id, task.status)}
              onPause={() => handlePause(task.id)}
            />
          ))}
        </div>
      )}

      {/* Zone Tasks */}
      {availableZone.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('housekeeping.zoneTasks')} ({availableZone.length})
          </h3>
          {availableZone.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClaim={() => handleClaim(task.id)}
              isZone
            />
          ))}
        </div>
      )}

      {/* Open Pool */}
      {availablePool.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            🏊 {t('housekeeping.openPool')} ({availablePool.length})
          </h3>
          {availablePool.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClaim={() => handleClaim(task.id)}
              isPool
            />
          ))}
        </div>
      )}

      {/* Other Staff Tasks (collapsible, read-only) */}
      {otherStaffTasks.length > 0 && (
        <Collapsible open={showOtherTasks} onOpenChange={setShowOtherTasks}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="uppercase tracking-wider font-semibold flex items-center gap-2">
                {t('housekeeping.otherStaffTasks')} ({otherStaffTasks.length})
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showOtherTasks && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 mt-2">
              {otherStaffTasks.map(task => (
                <Card key={task.id} className={cn("border-l-4 opacity-60", statusBg[task.status])}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold">{task.room?.room_number}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Completed summary */}
      {myCompletedTasks.length > 0 && (
        <div className="text-center py-4">
          <Badge variant="outline" className="text-xs">
            {myCompletedTasks.length} {t('housekeeping.completedToday')}
          </Badge>
        </div>
      )}
    </div>
  );
}
