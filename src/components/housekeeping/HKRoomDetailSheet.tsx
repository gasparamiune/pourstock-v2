import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHousekeepingMutations, type HousekeepingTask, type MaintenanceRequest } from '@/hooks/useHousekeeping';
import { Clock, Wrench, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))] text-white',
  in_progress: 'bg-[hsl(var(--hk-in-progress))] text-black',
  clean: 'bg-[hsl(var(--hk-clean))] text-white',
  inspected: 'bg-[hsl(var(--hk-inspected))] text-white',
  paused: 'bg-muted text-muted-foreground',
};

const statusOrder = ['dirty', 'in_progress', 'clean', 'inspected'];

interface HKRoomDetailSheetProps {
  task: HousekeepingTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceRequests: MaintenanceRequest[];
  isSupervisor: boolean;
}

export function HKRoomDetailSheet({ task, open, onOpenChange, maintenanceRequests, isSupervisor }: HKRoomDetailSheetProps) {
  const { t } = useLanguage();
  const { updateTaskStatus } = useHousekeepingMutations();

  if (!task) return null;

  const canProgress = task.status !== 'inspected';
  const nextStatus = canProgress ? statusOrder[statusOrder.indexOf(task.status) + 1] : null;
  const activeMaintenanceCount = maintenanceRequests.filter(m => m.status === 'open' || m.status === 'in_progress').length;
  const hasInspectionNote = task.notes?.startsWith('[Inspection');

  const handleProgress = () => {
    if (nextStatus) {
      updateTaskStatus.mutate({ taskId: task.id, status: nextStatus });
    }
  };

  const cleanDuration = task.started_at && task.completed_at
    ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="text-2xl">{t('reception.room')} {task.room?.room_number}</span>
            <Badge className={cn("text-xs", statusColors[task.status])}>
              {t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Room Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('housekeeping.roomType')}:</span>
              <span className="capitalize font-medium">{task.room?.room_type || '—'}</span>
            </div>
            {task.room?.floor && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('reception.floor')}:</span>
                <span className="font-medium">{task.room.floor}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('housekeeping.taskTypeLabel')}:</span>
              <span className="capitalize font-medium">{t(`housekeeping.taskType.${task.task_type}`)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('housekeeping.priority')}:</span>
              {task.priority === 'urgent' && <Badge variant="destructive">{t('housekeeping.urgent')}</Badge>}
              {task.priority === 'normal' && <span className="font-medium capitalize">{t('housekeeping.normal')}</span>}
            </div>
          </div>

          <Separator />

          {/* Current Task */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t('housekeeping.currentTask')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{task.assigned_to ? t('housekeeping.assigned') : t('housekeeping.openPool')}</span>
              </div>
              {task.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{t('housekeeping.startedAt')}: {formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}</span>
                </div>
              )}
              {cleanDuration !== null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{t('housekeeping.cleanTime')}: {cleanDuration} min</span>
                </div>
              )}
            </div>

            {canProgress && isSupervisor && (
              <Button className="mt-3 w-full" onClick={handleProgress}>
                {t(`housekeeping.${task.status === 'dirty' ? 'startCleaning' : task.status === 'in_progress' ? 'markClean' : 'markInspected'}`)}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Inspection Notes — highlighted */}
          {hasInspectionNote && (
            <>
              <Separator />
              <div className={cn(
                "px-3 py-2 rounded-lg text-sm",
                task.notes?.includes('FAIL') ? "bg-destructive/10 border border-destructive/20" : "bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20"
              )}>
                <h3 className="text-sm font-semibold mb-1">{t('housekeeping.inspectionNotes')}</h3>
                <p className="whitespace-pre-wrap">{task.notes}</p>
              </div>
            </>
          )}

          {/* Regular Notes */}
          {task.notes && !hasInspectionNote && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('reception.notes')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
              </div>
            </>
          )}

          {/* Maintenance */}
          {maintenanceRequests.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {t('housekeeping.maintenance')} ({activeMaintenanceCount} {t('common.active')})
                </h3>
                <div className="space-y-2">
                  {maintenanceRequests.map(m => (
                    <div key={m.id} className="p-3 rounded-lg bg-secondary text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{m.description}</span>
                        <Badge variant={m.status === 'open' ? 'destructive' : 'outline'} className="text-xs capitalize">{m.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">{m.priority}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Activity Timeline */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2">{t('housekeeping.activityTimeline')}</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              {task.inspected_at && (
                <div className="flex gap-2">
                  <span className="text-[hsl(var(--hk-inspected))]">●</span>
                  <span>{t('housekeeping.inspected')} — {formatDistanceToNow(new Date(task.inspected_at), { addSuffix: true })}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex gap-2">
                  <span className="text-[hsl(var(--hk-clean))]">●</span>
                  <span>{t('housekeeping.clean')} — {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</span>
                </div>
              )}
              {task.started_at && (
                <div className="flex gap-2">
                  <span className="text-[hsl(var(--hk-in-progress))]">●</span>
                  <span>{t('housekeeping.inProgress')} — {formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-[hsl(var(--hk-dirty))]">●</span>
                <span>{t('housekeeping.taskCreated')} — {formatDistanceToNow(new Date(task.task_date), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
