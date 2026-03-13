import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { ArrowRight, AlertTriangle, StickyNote, Wrench, Play, CheckCircle, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ElapsedTimer } from './ElapsedTimer';

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))] text-white',
  in_progress: 'bg-[hsl(var(--hk-in-progress))] text-black',
  clean: 'bg-[hsl(var(--hk-clean))] text-white',
  inspected: 'bg-[hsl(var(--hk-inspected))] text-white',
  paused: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  dirty: 'housekeeping.toBeCleaned',
  in_progress: 'housekeeping.cleaning',
  clean: 'housekeeping.readyForInspection',
  inspected: 'housekeeping.inspectedReady',
  paused: 'housekeeping.paused',
};

interface HKRoomCardProps {
  task: HousekeepingTask;
  onProgress?: () => void;
  onStartCleaning?: () => void;
  onMarkClean?: () => void;
  onInspect?: () => void;
  isManager?: boolean;
  hasMaintenance?: boolean;
  onUpdateNotes?: (taskId: string, notes: string) => void;
  onOpenDetail?: () => void;
}

export function HKRoomCard({ task, onProgress, onStartCleaning, onMarkClean, onInspect, isManager, hasMaintenance, onUpdateNotes, onOpenDetail }: HKRoomCardProps) {
  const { t } = useLanguage();
  const [noteValue, setNoteValue] = useState(task.notes || '');
  const [noteOpen, setNoteOpen] = useState(false);

  const hasInspectionNote = task.notes?.startsWith('[Inspection');

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 transition-all duration-200 border border-white/10 shadow-lg min-h-[140px] flex flex-col justify-between cursor-pointer group",
        statusColors[task.status] || 'bg-muted'
      )}
      onClick={onOpenDetail}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{task.room?.room_number || '—'}</span>
        <div className="flex items-center gap-1">
          {hasMaintenance && <Wrench className="h-3.5 w-3.5 text-white/80" />}
          {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4" />}
          {isManager && onUpdateNotes ? (
            <Popover open={noteOpen} onOpenChange={setNoteOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn("p-0.5 rounded", task.notes ? "text-white" : "text-white/40")}
                  onClick={e => e.stopPropagation()}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" onClick={e => e.stopPropagation()}>
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

      {/* Status label */}
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-1">
        {t(STATUS_LABELS[task.status] || '')}
      </div>

      {/* Room type + task type */}
      <div className="text-xs opacity-80 mt-0.5">
        <span className="capitalize">{task.room?.room_type || ''}</span>
        {task.room?.room_type && ' · '}
        <span className="capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
      </div>

      {/* Live timer for in_progress */}
      {task.status === 'in_progress' && task.started_at && (
        <div className="mt-1">
          <ElapsedTimer startTime={task.started_at} className="text-xs font-mono flex items-center gap-0.5 opacity-90" />
        </div>
      )}

      {/* Inspection notes highlight */}
      {hasInspectionNote && (
        <div className={cn(
          "text-[10px] mt-1 px-1.5 py-0.5 rounded font-medium",
          task.notes?.includes('FAIL') ? "bg-destructive/30 text-white" : "bg-[hsl(var(--success))]/30 text-white"
        )}>
          {task.notes?.split('\n')[0]}
        </div>
      )}

      {/* Regular notes preview (non-inspection) */}
      {task.notes && !hasInspectionNote && (
        <div className="text-[10px] mt-1 opacity-60 line-clamp-1 italic">
          {task.notes}
        </div>
      )}

      {/* Inline quick-action buttons — manager only */}
      {isManager && (
        <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
          {task.status === 'dirty' && onStartCleaning && (
            <button
              onClick={onStartCleaning}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-medium touch-target"
            >
              <Play className="h-3 w-3" /> {t('housekeeping.startCleaning')}
            </button>
          )}
          {task.status === 'in_progress' && onMarkClean && (
            <button
              onClick={onMarkClean}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-medium touch-target"
            >
              <CheckCircle className="h-3 w-3" /> {t('housekeeping.markClean')}
            </button>
          )}
          {task.status === 'clean' && onInspect && (
            <button
              onClick={onInspect}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-medium touch-target"
            >
              <Eye className="h-3 w-3" /> {t('housekeeping.inspect')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
