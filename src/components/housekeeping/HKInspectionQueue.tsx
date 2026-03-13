import { useHousekeepingTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export function HKInspectionQueue() {
  const { t } = useLanguage();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { updateTaskStatus } = useHousekeepingMutations();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const inspectionQueue = (tasks || []).filter(task => task.status === 'clean');

  const handlePass = (taskId: string) => {
    updateTaskStatus.mutate({ taskId, status: 'inspected' });
  };

  const handleFail = (taskId: string) => {
    updateTaskStatus.mutate({ taskId, status: 'dirty' });
  };

  if (inspectionQueue.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">✅</div>
        <p className="text-muted-foreground">{t('housekeeping.noInspections')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {inspectionQueue.length} {t('housekeeping.roomsAwaitingInspection')}
      </p>

      {inspectionQueue.map(task => {
        const cleanDuration = task.started_at && task.completed_at
          ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)
          : null;

        return (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{t('reception.room')} {task.room?.room_number}</p>
                    <Badge variant="outline" className="text-xs capitalize">{task.room?.room_type}</Badge>
                    {task.room?.floor && <Badge variant="outline" className="text-xs">{t('reception.floor')} {task.room.floor}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                    {cleanDuration !== null && <span> · {cleanDuration} min</span>}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{task.notes}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleFail(task.id)}
                    className="touch-target"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t('housekeeping.fail')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePass(task.id)}
                    className="touch-target bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('housekeeping.pass')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
