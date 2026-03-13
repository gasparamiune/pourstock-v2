import { useState } from 'react';
import { useHousekeepingTasks, useMaintenanceRequests, useHousekeepingMutations } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { HKRoomCard } from './HKRoomCard';
import { HKRoomDetailSheet } from './HKRoomDetailSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Grid3X3, List, Wrench } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';

const statusOrder = ['dirty', 'in_progress', 'clean', 'inspected'];

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))]',
  in_progress: 'bg-[hsl(var(--hk-in-progress))]',
  clean: 'bg-[hsl(var(--hk-clean))]',
  inspected: 'bg-[hsl(var(--hk-inspected))]',
  paused: 'bg-muted-foreground',
};

type ViewMode = 'grid' | 'table';
type GroupBy = 'none' | 'floor' | 'status';

export function HKStatusBoard() {
  const { t } = useLanguage();
  const { isAdmin, isManager, isDepartmentManager, hasDepartment } = useAuth();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { data: maintenance } = useMaintenanceRequests();
  const { updateTaskStatus, generateDailyTasks, updateTaskNotes } = useHousekeepingMutations();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const isSupervisor = isAdmin || isManager || isDepartmentManager('housekeeping');
  const isReceptionOnly = hasDepartment('reception') && !hasDepartment('housekeeping');

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Build maintenance lookup
  const maintenanceByRoom = new Map<string, boolean>();
  (maintenance || []).forEach(m => {
    if (m.status === 'open' || m.status === 'in_progress') {
      maintenanceByRoom.set(m.room_id, true);
    }
  });

  const filteredTasks = (tasks || []).filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (floorFilter !== 'all' && task.room?.floor?.toString() !== floorFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (assignmentFilter === 'assigned' && !task.assigned_to) return false;
    if (assignmentFilter === 'unassigned' && task.assigned_to) return false;
    return true;
  });

  const floors = [...new Set((tasks || []).map(t => t.room?.floor).filter(Boolean))].sort();

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

  const selectedTask = selectedTaskId ? (tasks || []).find(t => t.id === selectedTaskId) : null;

  // Grouping logic
  const groupedTasks = groupBy === 'none'
    ? [{ key: 'all', label: '', tasks: filteredTasks }]
    : groupBy === 'floor'
    ? [...new Set(filteredTasks.map(t => t.room?.floor ?? 0))].sort().map(floor => ({
        key: `floor-${floor}`,
        label: `${t('reception.floor')} ${floor}`,
        tasks: filteredTasks.filter(task => (task.room?.floor ?? 0) === floor),
      }))
    : statusOrder.map(status => ({
        key: status,
        label: t(`housekeeping.${status === 'in_progress' ? 'inProgress' : status}`),
        tasks: filteredTasks.filter(task => task.status === status),
      })).filter(g => g.tasks.length > 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2">
        {(['dirty', 'in_progress', 'clean', 'inspected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer",
              `bg-[hsl(var(--hk-${status.replace('_', '-')}))]/10 text-[hsl(var(--hk-${status.replace('_', '-')}))]`,
              statusFilter === status && "ring-2 ring-[hsl(var(--hk-${status.replace('_', '-')}))]"
            )}
          >
            <span className="font-bold">{counts[status]}</span>
            <span className="text-sm">{t(`housekeeping.${status === 'in_progress' ? 'inProgress' : status}`)}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('reception.allFloors')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reception.allFloors')}</SelectItem>
            {floors.map(f => (
              <SelectItem key={f} value={f!.toString()}>{t('reception.floor')} {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="urgent">{t('housekeeping.urgent')}</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="normal">{t('housekeeping.normal')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="assigned">{t('housekeeping.assigned')}</SelectItem>
            <SelectItem value="unassigned">{t('housekeeping.openPool')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('housekeeping.groupBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('housekeeping.noGrouping')}</SelectItem>
            <SelectItem value="floor">{t('housekeeping.byFloor')}</SelectItem>
            <SelectItem value="status">{t('housekeeping.byStatus')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
            <List className="h-4 w-4" />
          </Button>
        </div>

        {isSupervisor && (
          <Button variant="outline" onClick={() => generateDailyTasks.mutate()} disabled={generateDailyTasks.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('housekeeping.generateTasks')}
          </Button>
        )}
      </div>

      {/* Task Grid / Table */}
      {groupedTasks.map(group => (
        <div key={group.key}>
          {group.label && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 mt-4">{group.label}</h3>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {group.tasks.map(task => (
                <HKRoomCard
                  key={task.id}
                  task={task}
                  onProgress={isReceptionOnly ? undefined : () => handleProgressStatus(task.id, task.status)}
                  isManager={isSupervisor}
                  hasMaintenance={maintenanceByRoom.has(task.room_id)}
                  onUpdateNotes={isSupervisor ? (taskId, notes) => updateTaskNotes.mutate({ taskId, notes }) : undefined}
                  onOpenDetail={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reception.room')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('housekeeping.type')}</TableHead>
                    <TableHead>{t('users.status')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('housekeeping.priority')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('housekeeping.assignedTo')}</TableHead>
                    <TableHead className="hidden md:table-cell">🔧</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.tasks.map(task => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <TableCell className="font-bold">{task.room?.room_number || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell capitalize text-xs">{t(`housekeeping.taskType.${task.task_type}`)}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", statusColors[task.status], "text-white")}>{t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize text-xs">
                        {task.priority === 'vip' && <Badge className="bg-[hsl(var(--room-reserved))]/20 text-[hsl(var(--room-reserved))]">VIP</Badge>}
                        {task.priority === 'urgent' && <Badge variant="destructive" className="text-xs">{t('housekeeping.urgent')}</Badge>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {task.assigned_to ? '👤' : t('housekeeping.openPool')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {maintenanceByRoom.has(task.room_id) && <Wrench className="h-3.5 w-3.5 text-destructive" />}
                      </TableCell>
                      <TableCell>
                        {!isReceptionOnly && task.status !== 'inspected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleProgressStatus(task.id, task.status); }}
                          >
                            →
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {(tasks || []).length === 0 ? t('housekeeping.noTasks') : t('housekeeping.noMatchingRooms')}
        </div>
      )}

      {/* Room Detail Sheet */}
      <HKRoomDetailSheet
        task={selectedTask || null}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        maintenanceRequests={(maintenance || []).filter(m => selectedTask && m.room_id === selectedTask.room_id)}
        isSupervisor={isSupervisor}
      />
    </div>
  );
}
