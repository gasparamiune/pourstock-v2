import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { ArrowRight, AlertTriangle, StickyNote } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))] text-white',
  in_progress: 'bg-[hsl(var(--hk-in-progress))] text-black',
  clean: 'bg-[hsl(var(--hk-clean))] text-white',
  inspected: 'bg-[hsl(var(--hk-inspected))] text-white',
};

const nextStatusLabel: Record<string, string> = {
  dirty: 'housekeeping.startCleaning',
  in_progress: 'housekeeping.markClean',
  clean: 'housekeeping.markInspected',
};

interface HKRoomCardProps {
  task: HousekeepingTask;
  onProgress: () => void;
  isManager?: boolean;
  onUpdateNotes?: (taskId: string, notes: string) => void;
}

export function HKRoomCard({ task, onProgress, isManager, onUpdateNotes }: HKRoomCardProps) {
  const { t } = useLanguage();
  const canProgress = task.status !== 'inspected';
  const [noteValue, setNoteValue] = useState(task.notes || '');
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div className={cn(
      "relative rounded-xl p-3 transition-all duration-200 border border-white/10 shadow-lg min-h-[110px] flex flex-col justify-between",
      statusColors[task.status] || 'bg-muted'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{task.room?.room_number || '—'}</span>
        <div className="flex items-center gap-1">
          {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4" />}
          {task.priority === 'vip' && (
            <Badge className="bg-white/20 text-xs">VIP</Badge>
          )}
          {/* Notes indicator / editor */}
          {isManager && onUpdateNotes ? (
            <Popover open={noteOpen} onOpenChange={setNoteOpen}>
              <PopoverTrigger asChild>
                <button className={cn("p-0.5 rounded", task.notes ? "text-white" : "text-white/40")}>
                  <StickyNote className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <Textarea
                  value={noteValue}
                  onChange={e => setNoteValue(e.target.value)}
                  placeholder={t('housekeeping.addNote')}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => { onUpdateNotes(task.id, noteValue); setNoteOpen(false); }}
                >
                  {t('common.save')}
                </Button>
              </PopoverContent>
            </Popover>
          ) : task.notes ? (
            <StickyNote className="h-3.5 w-3.5 text-white/70" />
          ) : null}
        </div>
      </div>

      <div className="text-xs opacity-80 capitalize mt-1">
        {t(`housekeeping.taskType.${task.task_type}`)}
      </div>

      {/* Show notes text if present */}
      {task.notes && (
        <div className="text-[10px] mt-1 opacity-70 line-clamp-2 italic">
          {task.notes}
        </div>
      )}

      {canProgress && (
        <button
          onClick={onProgress}
          className="mt-2 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-medium"
        >
          <span>{t(nextStatusLabel[task.status] || '')}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
