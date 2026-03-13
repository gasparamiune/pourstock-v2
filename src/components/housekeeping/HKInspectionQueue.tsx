import { useState } from 'react';
import { useHousekeepingTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ChevronRight, Clock, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HKInspectionForm } from './HKInspectionForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function HKInspectionQueue() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { updateTaskStatus, updateTaskNotes } = useHousekeepingMutations();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const inspectionQueue = (tasks || [])
    .filter(task => task.status === 'clean')
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, normal: 1 };
      const pa = priorityOrder[a.priority] ?? 1;
      const pb = priorityOrder[b.priority] ?? 1;
      return pa - pb;
    });

  const selectedTask = selectedTaskId ? inspectionQueue.find(t => t.id === selectedTaskId) : null;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handlePass = (notes: string) => {
    if (!selectedTask) return;
    updateTaskStatus.mutate({ taskId: selectedTask.id, status: 'inspected' });
    if (notes) {
      updateTaskNotes.mutate({ taskId: selectedTask.id, notes: `[Inspection PASS] ${notes}` });
    }
    toast({ title: t('housekeeping.inspectionPassed') });
    setSelectedTaskId(null);
  };

  const handleFail = (notes: string, defects: Array<{ category: string; description: string }>) => {
    if (!selectedTask) return;
    const defectSummary = defects.map(d => `[${d.category}] ${d.description}`).join('\n');
    const fullNotes = [
      '[Inspection FAIL]',
      notes,
      defects.length > 0 ? `\nDefects:\n${defectSummary}` : '',
    ].filter(Boolean).join('\n');

    updateTaskStatus.mutate({ taskId: selectedTask.id, status: 'dirty' });
    if (fullNotes) {
      updateTaskNotes.mutate({ taskId: selectedTask.id, notes: fullNotes });
    }
    toast({ title: t('housekeeping.inspectionFailed'), variant: 'destructive' });
    setSelectedTaskId(null);
  };

  const handleReopen = () => {
    if (!selectedTask) return;
    updateTaskStatus.mutate({ taskId: selectedTask.id, status: 'in_progress' });
    toast({ title: t('housekeeping.taskReopened') });
    setSelectedTaskId(null);
  };

  if (inspectionQueue.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">✅</div>
        <p className="text-lg font-medium">{t('housekeeping.noInspections')}</p>
        <p className="text-sm text-muted-foreground">{t('housekeeping.allRoomsInspected')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Queue list */}
      <div className="lg:col-span-2 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {inspectionQueue.length} {t('housekeeping.roomsAwaitingInspection')}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <CheckCheck className="h-3.5 w-3.5" />
                {t('housekeeping.passAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('housekeeping.passAllTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('housekeeping.passAllDescription', { count: String(inspectionQueue.length) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handlePassAll}>
                  {t('housekeeping.confirmPassAll')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {inspectionQueue.map(task => {
          const cleanDuration = task.started_at && task.completed_at
            ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)
            : null;
          const isSelected = selectedTaskId === task.id;

          return (
            <Card
              key={task.id}
              className={cn(
                "cursor-pointer transition-all hover:bg-secondary/50",
                isSelected && "ring-2 ring-primary bg-primary/5"
              )}
              onClick={() => handleSelectTask(task.id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{t('reception.room')} {task.room?.room_number}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{task.room?.room_type}</Badge>
                    {task.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                    {cleanDuration !== null && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {cleanDuration}min
                      </span>
                    )}
                    {task.room?.floor && <span>{t('reception.floor')} {task.room.floor}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inspection form */}
      <div className="lg:col-span-3">
        {!selectedTask ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>{t('housekeeping.selectRoomToInspect')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <HKInspectionForm
                task={selectedTask}
                onPass={handlePass}
                onFail={handleFail}
                onReopen={handleReopen}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
