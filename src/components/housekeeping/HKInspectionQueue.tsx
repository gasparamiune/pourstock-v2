import { useState } from 'react';
import { useHousekeepingTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle, RotateCcw, Camera, Plus, Clock, User, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const DEFECT_CATEGORIES = [
  'bathroom', 'bedding', 'flooring', 'furniture', 'windows', 'amenities', 'minibar', 'general',
] as const;

interface Defect {
  category: string;
  description: string;
}

export function HKInspectionQueue() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { updateTaskStatus, updateTaskNotes } = useHousekeepingMutations();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [addingDefect, setAddingDefect] = useState(false);
  const [newDefectCategory, setNewDefectCategory] = useState('');
  const [newDefectDesc, setNewDefectDesc] = useState('');

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const inspectionQueue = (tasks || [])
    .filter(task => task.status === 'clean')
    .sort((a, b) => {
      // VIP/urgent first
      const priorityOrder = { vip: 0, urgent: 1, normal: 2 };
      const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      return pa - pb;
    });

  const selectedTask = selectedTaskId ? inspectionQueue.find(t => t.id === selectedTaskId) : null;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDefects([]);
    setInspectionNotes('');
    setAddingDefect(false);
  };

  const handlePass = (taskId: string) => {
    updateTaskStatus.mutate({ taskId, status: 'inspected' });
    if (inspectionNotes) {
      updateTaskNotes.mutate({ taskId, notes: `[Inspection PASS] ${inspectionNotes}` });
    }
    toast({ title: t('housekeeping.inspectionPassed') });
    setSelectedTaskId(null);
    setDefects([]);
    setInspectionNotes('');
  };

  const handleFail = (taskId: string) => {
    const defectSummary = defects.map(d => `[${d.category}] ${d.description}`).join('\n');
    const notes = [
      '[Inspection FAIL]',
      inspectionNotes,
      defects.length > 0 ? `\nDefects:\n${defectSummary}` : '',
    ].filter(Boolean).join('\n');

    updateTaskStatus.mutate({ taskId, status: 'dirty' });
    if (notes) {
      updateTaskNotes.mutate({ taskId, notes });
    }
    toast({ title: t('housekeeping.inspectionFailed'), variant: 'destructive' });
    setSelectedTaskId(null);
    setDefects([]);
    setInspectionNotes('');
  };

  const handleReopen = (taskId: string) => {
    updateTaskStatus.mutate({ taskId, status: 'in_progress' });
    toast({ title: t('housekeeping.taskReopened') });
    setSelectedTaskId(null);
  };

  const addDefect = () => {
    if (!newDefectCategory || !newDefectDesc.trim()) return;
    setDefects([...defects, { category: newDefectCategory, description: newDefectDesc.trim() }]);
    setNewDefectCategory('');
    setNewDefectDesc('');
    setAddingDefect(false);
  };

  const removeDefect = (idx: number) => {
    setDefects(defects.filter((_, i) => i !== idx));
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
        <p className="text-sm text-muted-foreground mb-3">
          {inspectionQueue.length} {t('housekeeping.roomsAwaitingInspection')}
        </p>

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
                    {task.priority === 'vip' && <Badge className="bg-[hsl(var(--room-reserved))]/20 text-[hsl(var(--room-reserved))] text-[10px]">VIP</Badge>}
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
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold">{t('reception.room')} {selectedTask.room?.room_number}</h2>
                  <Badge variant="outline" className="capitalize">{selectedTask.room?.room_type}</Badge>
                  {selectedTask.room?.floor && <Badge variant="outline">{t('reception.floor')} {selectedTask.room.floor}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="capitalize">{t(`housekeeping.taskType.${selectedTask.task_type}`)}</span>
                  {(() => {
                    const dur = selectedTask.started_at && selectedTask.completed_at
                      ? Math.round((new Date(selectedTask.completed_at).getTime() - new Date(selectedTask.started_at).getTime()) / 60000)
                      : null;
                    return dur !== null ? <span>· {dur} min</span> : null;
                  })()}
                  {selectedTask.completed_at && (
                    <span>· {formatDistanceToNow(new Date(selectedTask.completed_at), { addSuffix: true })}</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Defects section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('housekeeping.defectsFound')} ({defects.length})</h3>
                
                {defects.map((defect, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{t(`housekeeping.defect.${defect.category}`)}</Badge>
                      <span className="text-sm">{defect.description}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeDefect(idx)}>✕</Button>
                  </div>
                ))}

                {addingDefect ? (
                  <div className="space-y-2 p-3 rounded-lg border border-dashed">
                    <Select value={newDefectCategory} onValueChange={setNewDefectCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('housekeeping.defectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFECT_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{t(`housekeeping.defect.${cat}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={newDefectDesc}
                      onChange={e => setNewDefectDesc(e.target.value)}
                      placeholder={t('housekeeping.defectDescription')}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addDefect} disabled={!newDefectCategory || !newDefectDesc.trim()}>
                        {t('common.add')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingDefect(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setAddingDefect(true)} className="mt-1">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t('housekeeping.addDefect')}
                  </Button>
                )}
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('housekeeping.inspectionNotes')}</h3>
                <Textarea
                  value={inspectionNotes}
                  onChange={e => setInspectionNotes(e.target.value)}
                  placeholder={t('housekeeping.inspectionNotesPlaceholder')}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 touch-target"
                  onClick={() => handleFail(selectedTask.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('housekeeping.fail')}
                  {defects.length > 0 && <Badge className="ml-2 bg-white/20 text-xs">{defects.length}</Badge>}
                </Button>
                <Button
                  className="flex-1 touch-target bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
                  onClick={() => handlePass(selectedTask.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('housekeeping.pass')}
                </Button>
                <Button
                  variant="outline"
                  className="touch-target"
                  onClick={() => handleReopen(selectedTask.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('housekeeping.reopen')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
