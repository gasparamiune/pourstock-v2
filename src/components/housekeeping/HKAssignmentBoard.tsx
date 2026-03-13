import { useState, useCallback } from 'react';
import { useHousekeepingTasks, useHousekeepingMutations, useHKStaff, useHKZones } from '@/hooks/useHousekeeping';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Loader2, User, Shuffle, Users, MapPin, ChevronDown, ChevronUp, GripVertical, AlertTriangle, Plus, RotateCcw, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';

type AssignmentMode = 'direct' | 'pool' | 'zone' | 'auto';

interface StaffMember {
  user_id: string;
  name: string;
}

export function HKAssignmentBoard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { activeHotelId } = useAuth();
  const { data: tasks, isLoading } = useHousekeepingTasks();
  const { assignTask, createTask, reopenTask } = useHousekeepingMutations();
  const { data: hkStaff } = useHKStaff();
  const { data: zones } = useHKZones();
  const [mode, setMode] = useState<AssignmentMode>('direct');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkAssignTarget, setBulkAssignTarget] = useState<string>('');
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set(['all']));
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Create task dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newTaskType, setNewTaskType] = useState('checkout_clean');
  const [newPriority, setNewPriority] = useState('normal');
  const [newAssignTo, setNewAssignTo] = useState('');

  // Reopen tasks dialog state
  const [reopenOpen, setReopenOpen] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const allTasks = tasks || [];
  const unassignedTasks = allTasks.filter(t => !t.assigned_to && t.status !== 'inspected');
  const staff = hkStaff || [];

  const staffAssignments = staff.map(s => {
    const workerTasks = allTasks.filter(t => t.assigned_to === s.user_id);
    const activeTasks = workerTasks.filter(t => t.status !== 'inspected');
    const doneTasks = workerTasks.filter(t => t.status === 'clean' || t.status === 'inspected');
    const estMinutes = activeTasks.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0);
    return { ...s, tasks: workerTasks, activeTasks, doneTasks, estMinutes };
  });

  const poolTasks = allTasks.filter(t => !t.assigned_to && t.status !== 'inspected');

  const handleAssign = (taskId: string, userId: string) => {
    assignTask.mutate({ taskId, userId });
  };

  const handleUnassign = (taskId: string) => {
    assignTask.mutate({ taskId, userId: '' });
  };

  const handleAutoDistribute = () => {
    if (staff.length === 0 || unassignedTasks.length === 0) return;
    const workloads = new Map(staff.map(s => [s.user_id, staffAssignments.find(sa => sa.user_id === s.user_id)?.activeTasks.length || 0]));
    
    unassignedTasks.forEach(task => {
      const leastLoaded = [...workloads.entries()].sort((a, b) => a[1] - b[1])[0];
      assignTask.mutate({ taskId: task.id, userId: leastLoaded[0] });
      workloads.set(leastLoaded[0], leastLoaded[1] + 1);
    });
    toast({ title: t('housekeeping.autoDistributed') });
  };

  const handleBulkAssign = () => {
    if (!bulkAssignTarget || selectedTasks.size === 0) return;
    selectedTasks.forEach(taskId => {
      assignTask.mutate({ taskId, userId: bulkAssignTarget === '__pool__' ? '' : bulkAssignTarget });
    });
    setSelectedTasks(new Set());
    setBulkAssignTarget('');
    toast({ title: `${selectedTasks.size} ${t('housekeeping.tasksAssigned')}` });
  };

  const handleZoneAssign = (zoneFloors: number[], userId: string) => {
    const zoneTasks = unassignedTasks.filter(t => zoneFloors.includes(t.room?.floor ?? 0));
    zoneTasks.forEach(task => {
      assignTask.mutate({ taskId: task.id, userId });
    });
    toast({ title: `${zoneTasks.length} ${t('housekeeping.tasksAssigned')}` });
  };

  const toggleTaskSelection = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
    setSelectedTasks(next);
  };

  const selectAllUnassigned = () => {
    if (selectedTasks.size === unassignedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(unassignedTasks.map(t => t.id)));
    }
  };

  const toggleWorkerExpand = (id: string) => {
    const next = new Set(expandedWorkers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedWorkers(next);
  };

  const getWorkloadColor = (count: number) => {
    if (count <= 3) return 'text-[hsl(var(--success))]';
    if (count <= 6) return 'text-[hsl(var(--warning))]';
    return 'text-destructive';
  };

  const getWorkloadBg = (count: number) => {
    if (count <= 3) return 'bg-[hsl(var(--success))]/10';
    if (count <= 6) return 'bg-[hsl(var(--warning))]/10';
    return 'bg-destructive/10';
  };

  const getCapacityColor = (count: number) => {
    if (count <= 3) return 'hsl(var(--success))';
    if (count <= 6) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const statusDot: Record<string, string> = {
    dirty: 'bg-[hsl(var(--hk-dirty))]',
    in_progress: 'bg-[hsl(var(--hk-in-progress))]',
    clean: 'bg-[hsl(var(--hk-clean))]',
    inspected: 'bg-[hsl(var(--hk-inspected))]',
    paused: 'bg-muted-foreground',
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => setDragOverTarget(null);

  const handleDrop = (e: React.DragEvent, userId: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleAssign(taskId, userId);
    }
  };

  const handleDropPool = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleUnassign(taskId);
    }
  };

  const closedTasks = allTasks.filter(t => t.status === 'inspected' || t.status === 'clean');

  const handleCreateTask = () => {
    if (!newRoomNumber.trim()) return;
    createTask.mutate({
      roomNumber: newRoomNumber.trim(),
      taskType: newTaskType,
      priority: newPriority,
      assignTo: newAssignTo || undefined,
    });
    setCreateOpen(false);
    setNewRoomNumber('');
    setNewTaskType('checkout_clean');
    setNewPriority('normal');
    setNewAssignTo('');
  };

  const handleReopenTask = (taskId: string) => {
    reopenTask.mutate({ taskId });
  };

  return (
    <div className="space-y-4">
      {/* Mode toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(['direct', 'pool', 'zone', 'auto'] as const).map(m => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(m)}
              className="text-xs h-8"
            >
              {m === 'direct' && <User className="h-3.5 w-3.5 mr-1" />}
              {m === 'pool' && <span className="mr-1">🏊</span>}
              {m === 'zone' && <MapPin className="h-3.5 w-3.5 mr-1" />}
              {m === 'auto' && <Shuffle className="h-3.5 w-3.5 mr-1" />}
              {t(`housekeeping.mode.${m}`)}
            </Button>
          ))}
        </div>

        {mode === 'auto' && (
          <Button onClick={handleAutoDistribute} disabled={unassignedTasks.length === 0 || staff.length === 0}>
            <Shuffle className="h-4 w-4 mr-2" />
            {t('housekeeping.autoDistribute')} ({unassignedTasks.length})
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">
            {unassignedTasks.length} {t('housekeeping.unassignedTasks')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {t('housekeeping.actions')}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('housekeeping.createTask')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setReopenOpen(true)} disabled={closedTasks.length === 0}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('housekeeping.reopenClosedTasks')} ({closedTasks.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedTasks.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Badge variant="outline">{selectedTasks.size} {t('housekeeping.selected')}</Badge>
          <Select value={bulkAssignTarget} onValueChange={setBulkAssignTarget}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('housekeeping.assignTo')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__pool__">🏊 {t('housekeeping.openPool')}</SelectItem>
              {staff.map(s => (
                <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={!bulkAssignTarget}>
            {t('housekeeping.assignSelected')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedTasks(new Set())}>
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {/* Zone assignment mode */}
      {mode === 'zone' && (zones || []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(zones || []).map(zone => {
            const zoneFloors = zone.floors || [];
            const zoneTaskCount = unassignedTasks.filter(t => zoneFloors.includes(t.room?.floor ?? 0)).length;
            return (
              <Card key={zone.id} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{zoneTaskCount} {t('housekeeping.unassignedTasks')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('reception.floor')}: {zoneFloors.join(', ') || '—'}
                  </p>
                  <Select onValueChange={(userId) => handleZoneAssign(zoneFloors, userId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('housekeeping.assignZoneTo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {mode === 'zone' && (!zones || zones.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t('housekeeping.noZonesConfigured')}</p>
            <p className="text-xs mt-1">{t('housekeeping.configureZonesHint')}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('housekeeping.staff')} ({staff.length})
          </h3>

          {staffAssignments.map(worker => {
            const isExpanded = expandedWorkers.has(worker.user_id) || expandedWorkers.has('all');
            const progressPct = worker.tasks.length > 0 ? Math.round((worker.doneTasks.length / worker.tasks.length) * 100) : 0;
            return (
              <Card
                key={worker.user_id}
                className={cn(
                  "transition-all",
                  dragOverTarget === worker.user_id && "ring-2 ring-primary bg-primary/5"
                )}
                onDragOver={(e) => handleDragOver(e, worker.user_id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, worker.user_id)}
              >
                <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => toggleWorkerExpand(worker.user_id)}>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{worker.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("text-xs px-2 py-0.5 rounded-full", getWorkloadBg(worker.activeTasks.length))}>
                        <span className={cn("font-semibold", getWorkloadColor(worker.activeTasks.length))}>
                          {worker.activeTasks.length} {t('housekeeping.activeTasks')}
                        </span>
                        <span className="text-muted-foreground ml-1">· ~{worker.estMinutes}min</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="py-2 px-4 space-y-2 border-t border-border/50">
                    {/* Workload progress bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <Progress value={progressPct} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{worker.doneTasks.length}/{worker.tasks.length}</span>
                    </div>
                    {worker.tasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{t('housekeeping.noAssignedTasks')}</p>
                    ) : (
                      worker.tasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between py-1.5 text-sm group/task"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab opacity-0 group-hover/task:opacity-100 transition-opacity" />
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot[task.status])} />
                            <span className="font-medium">{task.room?.room_number}</span>
                            <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {t(`housekeeping.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                            </Badge>
                            {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs h-7 opacity-0 group-hover/task:opacity-100" onClick={() => handleUnassign(task.id)}>
                            ✕
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Open Pool drop zone */}
          <Card
            className={cn(
              "border-dashed transition-all",
              dragOverTarget === '__pool__' && "ring-2 ring-primary bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver(e, '__pool__')}
            onDragLeave={handleDragLeave}
            onDrop={handleDropPool}
          >
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                🏊 {t('housekeeping.openPool')}
                <Badge variant="outline" className="text-xs">{poolTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-1">
              {poolTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('housekeeping.noPoolTasks')}</p>
              ) : (
                poolTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot[task.status])} />
                      <span className="font-medium">{task.room?.room_number}</span>
                      <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                      {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </div>
                    <Select onValueChange={(userId) => handleAssign(task.id, userId)}>
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue placeholder={t('housekeeping.assignTo')} />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(s => (
                          <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Tasks Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('housekeeping.unassignedTasks')} ({unassignedTasks.length})
            </h3>
            {unassignedTasks.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={selectAllUnassigned}>
                {selectedTasks.size === unassignedTasks.length ? t('housekeeping.deselectAll') : t('housekeeping.selectAll')}
              </Button>
            )}
          </div>

          {unassignedTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <span className="text-3xl block mb-2">✅</span>
                {t('housekeeping.allAssigned')}
              </CardContent>
            </Card>
          ) : (
            unassignedTasks.map(task => (
              <Card
                key={task.id}
                className={cn(
                  "transition-all cursor-grab active:cursor-grabbing",
                  selectedTasks.has(task.id) && "ring-2 ring-primary"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{t('reception.room')} {task.room?.room_number}</span>
                      {task.priority === 'urgent' && <Badge variant="destructive" className="text-xs">{t('housekeeping.urgent')}</Badge>}
                      {task.room?.floor && <Badge variant="outline" className="text-[10px]">{t('reception.floor')} {task.room.floor}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
                    {task.estimated_minutes && (
                      <span className="text-xs text-muted-foreground ml-2">~{task.estimated_minutes}min</span>
                    )}
                  </div>
                  <Select onValueChange={(userId) => handleAssign(task.id, userId)}>
                    <SelectTrigger className="w-32 flex-shrink-0">
                      <SelectValue placeholder={t('housekeeping.assignTo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
