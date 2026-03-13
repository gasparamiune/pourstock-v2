import { useMyTasks, useHousekeepingMutations, useOpenPoolTasks } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Hand, Play, CheckCircle, AlertTriangle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';

const statusBg: Record<string, string> = {
  dirty: 'border-[hsl(var(--hk-dirty))]/30',
  in_progress: 'border-[hsl(var(--hk-in-progress))]/30',
  clean: 'border-[hsl(var(--hk-clean))]/30',
  inspected: 'border-[hsl(var(--hk-inspected))]/30',
  paused: 'border-muted-foreground/30',
};

function TaskCard({ task, onProgress, onClaim }: { task: HousekeepingTask; onProgress?: () => void; onClaim?: () => void }) {
  const { t } = useLanguage();
  const isPool = !task.assigned_to;

  return (
    <Card className={cn("border-l-4", statusBg[task.status], isPool && "border-dashed")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{t('reception.room')} {task.room?.room_number}</p>
              {task.priority === 'vip' && <Badge className="bg-[hsl(var(--room-reserved))]/20 text-[hsl(var(--room-reserved))] text-xs">VIP</Badge>}
              {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{task.room?.room_type}</span>
              {task.room?.floor && <span>· {t('reception.floor')} {task.room.floor}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">{t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}</Badge>
              <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
            </div>
            {isPool && (
              <span className="text-xs text-[hsl(var(--info))] mt-1 inline-block">🏊 {t('housekeeping.openPool')}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-3">
            {isPool && onClaim && (
              <Button size="sm" variant="outline" onClick={onClaim} className="touch-target">
                <Hand className="h-4 w-4 mr-1" />
                {t('housekeeping.claim')}
              </Button>
            )}
            {!isPool && task.status === 'dirty' && onProgress && (
              <Button size="sm" onClick={onProgress} className="touch-target">
                <Play className="h-4 w-4 mr-1" />
                {t('housekeeping.startCleaning')}
              </Button>
            )}
            {!isPool && task.status === 'in_progress' && onProgress && (
              <Button size="sm" onClick={onProgress} className="touch-target bg-[hsl(var(--hk-clean))] hover:bg-[hsl(var(--hk-clean))]/90">
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('housekeeping.markClean')}
              </Button>
            )}
          </div>
        </div>

        {task.notes && (
          <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{task.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

const statusOrder = ['dirty', 'in_progress', 'clean', 'inspected'];

export function MyTasksList() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: tasks, isLoading } = useMyTasks();
  const { data: poolTasks, isLoading: poolLoading } = useOpenPoolTasks();
  const { updateTaskStatus, claimTask } = useHousekeepingMutations();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleProgress = (taskId: string, currentStatus: string) => {
    const idx = statusOrder.indexOf(currentStatus);
    if (idx < statusOrder.length - 1) {
      updateTaskStatus.mutate({ taskId, status: statusOrder[idx + 1] });
    }
  };

  const handleClaim = (taskId: string) => {
    if (user) {
      claimTask.mutate({ taskId });
    }
  };

  const myActiveTasks = (tasks || []).filter(t => t.status !== 'inspected');
  const myCompletedTasks = (tasks || []).filter(t => t.status === 'inspected' || t.status === 'clean');
  const availablePool = (poolTasks || []).filter(t => t.status !== 'inspected');

  if (myActiveTasks.length === 0 && availablePool.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🎉</div>
        <p className="text-muted-foreground">{t('housekeeping.allDone')}</p>
        <p className="text-sm text-muted-foreground">{t('housekeeping.checkPoolSuggestion')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
