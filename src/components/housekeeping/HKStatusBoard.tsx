import { useState } from 'react';
import { useHousekeepingTasks, useMaintenanceRequests, useHousekeepingMutations, regenerateAllMockData } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { HKRoomCard } from './HKRoomCard';
import { HKRoomDetailSheet } from './HKRoomDetailSheet';
import { HKInspectionForm } from './HKInspectionForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Grid3X3, List, Wrench } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ElapsedTimer } from './ElapsedTimer';
import { USE_HK_MOCK } from './mockData';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { useToast } from '@/hooks/use-toast';

const statusOrder = ['dirty', 'in_progress', 'paused', 'clean', 'inspected'];
const priorityOrder: Record<string, number> = { urgent: 0, normal: 1 };
const statusSortOrder: Record<string, number> = { dirty: 0, in_progress: 1, paused: 2, clean: 3, inspected: 4 };

const statusColors: Record<string, string> = {
  dirty: 'bg-[hsl(var(--hk-dirty))]',
  in_progress: 'bg-[hsl(var(--hk-in-progress))]',
  clean: 'bg-[hsl(var(--hk-clean))]',
  inspected: 'bg-[hsl(var(--hk-inspected))]',
  paused: 'bg-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  dirty: 'housekeeping.toBeCleaned',
  in_progress: 'housekeeping.cleaning',
  clean: 'housekeeping.readyForInspection',
  inspected: 'housekeeping.inspectedReady',
  paused: 'housekeeping.paused',
};

type ViewMode = 'grid' | 'table';
type GroupBy = 'none' | 'floor' | 'status';

function defaultSort(a: HousekeepingTask, b: HousekeepingTask): number {
  const pa = priorityOrder[a.priority] ?? 1;
  const pb = priorityOrder[b.priority] ?? 1;
  if (pa !== pb) return pa - pb;
  const sa = statusSortOrder[a.status] ?? 4;
  const sb = statusSortOrder[b.status] ?? 4;
  if (sa !== sb) return sa - sb;
  const fa = a.room?.floor ?? 0;
  const fb = b.room?.floor ?? 0;
  if (fa !== fb) return fa - fb;
  return (a.room?.room_number || '').localeCompare(b.room?.room_number || '', undefined, { numeric: true });
}

interface HKStatusBoardProps {
  isSupervisor?: boolean;
}

export function HKStatusBoard({ isSupervisor: isSupervisorProp }: HKStatusBoardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
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
  const [inspectingTask, setInspectingTask] = useState<HousekeepingTask | null>(null);

  const isSupervisor = isSupervisorProp ?? (isAdmin || isManager || isDepartmentManager('housekeeping'));
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
  }).sort(defaultSort);

  const floors = [...new Set((tasks || []).map(t => t.room?.floor).filter(Boolean))].sort();

  const counts = {
    dirty: (tasks || []).filter(t => t.status === 'dirty').length,
    in_progress: (tasks || []).filter(t => t.status === 'in_progress').length,
    clean: (tasks || []).filter(t => t.status === 'clean').length,
    inspected: (tasks || []).filter(t => t.status === 'inspected').length,
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  const handleInspectFromBoard = (task: HousekeepingTask) => {
    setInspectingTask(task);
  };

  const handleInspectionPass = (notes: string) => {
    if (!inspectingTask) return;
    updateTaskStatus.mutate({ taskId: inspectingTask.id, status: 'inspected' });
    if (notes) {
      updateTaskNotes.mutate({ taskId: inspectingTask.id, notes: `[Inspection PASS] ${notes}` });
    }
    toast({ title: t('housekeeping.inspectionPassed') });
    setInspectingTask(null);
  };

  const handleInspectionFail = (notes: string, defects: Array<{ category: string; description: string }>) => {
    if (!inspectingTask) return;
    const defectSummary = defects.map(d => `[${d.category}] ${d.description}`).join('\n');
    const fullNotes = [
      '[Inspection FAIL]',
      notes,
      defects.length > 0 ? `\nDefects:\n${defectSummary}` : '',
    ].filter(Boolean).join('\n');

    updateTaskStatus.mutate({ taskId: inspectingTask.id, status: 'dirty' });
    if (fullNotes) {
      updateTaskNotes.mutate({ taskId: inspectingTask.id, notes: fullNotes });
    }
    toast({ title: t('housekeeping.inspectionFailed'), variant: 'destructive' });
    setInspectingTask(null);
  };

  const handleInspectionReopen = () => {
    if (!inspectingTask) return;
    updateTaskStatus.mutate({ taskId: inspectingTask.id, status: 'in_progress' });
    toast({ title: t('housekeeping.taskReopened') });
    setInspectingTask(null);
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
        label: t(STATUS_LABELS[status] || `housekeeping.${status === 'in_progress' ? 'inProgress' : status}`),
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
              statusFilter === status && "ring-2 ring-primary"
            )}
          >
            <span className="font-bold">{counts[status]}</span>
            <span className="text-sm">{t(STATUS_LABELS[status] || `housekeeping.${status === 'in_progress' ? 'inProgress' : status}`)}</span>
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
          <>
            <Button variant="outline" onClick={() => generateDailyTasks.mutate()} disabled={generateDailyTasks.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('housekeeping.generateTasks')}
            </Button>
            {USE_HK_MOCK && (
              <Button variant="outline" onClick={() => regenerateAllMockData()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('housekeeping.regenerateMock')}
              </Button>
            )}
          </>
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
                  isManager={isSupervisor}
                  hasMaintenance={maintenanceByRoom.has(task.room_id)}
                  onUpdateNotes={isSupervisor ? (taskId, notes) => updateTaskNotes.mutate({ taskId, notes }) : undefined}
                  onOpenDetail={() => setSelectedTaskId(task.id)}
                  onStartCleaning={isSupervisor ? () => handleStatusChange(task.id, 'in_progress') : undefined}
                  onMarkClean={isSupervisor ? () => handleStatusChange(task.id, 'clean') : undefined}
                  onInspect={isSupervisor ? () => handleInspectFromBoard(task) : undefined}
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
                    <TableHead className="hidden md:table-cell"></TableHead>
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
                        <Badge className={cn("text-xs", statusColors[task.status], "text-white")}>{t(STATUS_LABELS[task.status] || '')}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize text-xs">
                        {task.priority === 'urgent' && <Badge variant="destructive" className="text-xs">{t('housekeeping.urgent')}</Badge>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {task.assigned_to ? '👤' : t('housekeeping.openPool')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {maintenanceByRoom.has(task.room_id) && <Wrench className="h-3.5 w-3.5 text-destructive" />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.status === 'in_progress' && task.started_at && (
                          <ElapsedTimer startTime={task.started_at} />
                        )}
                      </TableCell>
                      <TableCell>
                        {isSupervisor && task.status === 'clean' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleInspectFromBoard(task); }}
                          >
                            {t('housekeeping.inspect')}
                          </Button>
                        )}
                        {isSupervisor && task.status !== 'inspected' && task.status !== 'clean' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextIdx = statusOrder.indexOf(task.status) + 1;
                              if (nextIdx < statusOrder.length) {
                                handleStatusChange(task.id, statusOrder[nextIdx]);
                              }
                            }}
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

      {/* Inspection Dialog (same form as Inspect tab) */}
      <Dialog open={!!inspectingTask} onOpenChange={(open) => !open && setInspectingTask(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('housekeeping.inspect')}</DialogTitle>
          </DialogHeader>
          {inspectingTask && (
            <HKInspectionForm
              task={inspectingTask}
              onPass={handleInspectionPass}
              onFail={handleInspectionFail}
              onReopen={handleInspectionReopen}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
