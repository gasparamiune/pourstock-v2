import { useState } from 'react';
import { useHousekeepingTasks, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { HKRoomCard } from './HKRoomCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

const statusOrder = ['dirty', 'in_progress', 'clean', 'inspected'];

export function HKStatusBoard() {
  const { t } = useLanguage();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { updateTaskStatus, generateDailyTasks, updateTaskNotes } = useHousekeepingMutations();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filteredTasks = (tasks || []).filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (floorFilter !== 'all' && task.room?.floor?.toString() !== floorFilter) return false;
    return true;
  });

  const floors = [...new Set((tasks || []).map(t => t.room?.floor).filter(Boolean))].sort();

  // Summary counts
  const counts = {
    dirty: (tasks || []).filter(t => t.status === 'dirty').length,
    in_progress: (tasks || []).filter(t => t.status === 'in_progress').length,
    clean: (tasks || []).filter(t => t.status === 'clean').length,
    inspected: (tasks || []).filter(t => t.status === 'inspected').length,
  };

  const handleProgressStatus = (taskId: string, currentStatus: string) => {
    const idx = statusOrder.indexOf(currentStatus);
    if (idx < statusOrder.length - 1) {
      updateTaskStatus.mutate({ taskId, status: statusOrder[idx + 1] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--hk-dirty))]/10 text-[hsl(var(--hk-dirty))]">
          <span className="font-bold">{counts.dirty}</span>
          <span className="text-sm">{t('housekeeping.dirty')}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--hk-in-progress))]/10 text-[hsl(var(--hk-in-progress))]">
          <span className="font-bold">{counts.in_progress}</span>
          <span className="text-sm">{t('housekeeping.inProgress')}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--hk-clean))]/10 text-[hsl(var(--hk-clean))]">
          <span className="font-bold">{counts.clean}</span>
          <span className="text-sm">{t('housekeeping.clean')}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--hk-inspected))]/10 text-[hsl(var(--hk-inspected))]">
          <span className="font-bold">{counts.inspected}</span>
          <span className="text-sm">{t('housekeeping.inspected')}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="dirty">{t('housekeeping.dirty')}</SelectItem>
            <SelectItem value="in_progress">{t('housekeeping.inProgress')}</SelectItem>
            <SelectItem value="clean">{t('housekeeping.clean')}</SelectItem>
            <SelectItem value="inspected">{t('housekeeping.inspected')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {floors.map(f => (
              <SelectItem key={f} value={f!.toString()}>{t('reception.floor')} {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => generateDailyTasks.mutate()} disabled={generateDailyTasks.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('housekeeping.generateTasks')}
        </Button>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredTasks.map(task => (
          <HKRoomCard
            key={task.id}
            task={task}
            onProgress={() => handleProgressStatus(task.id, task.status)}
            isManager={true}
            onUpdateNotes={(taskId, notes) => updateTaskNotes.mutate({ taskId, notes })}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('housekeeping.noTasks')}
        </div>
      )}
    </div>
  );
}
