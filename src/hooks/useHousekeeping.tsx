import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useCallback } from 'react';
import { fetchHousekeepingTasks, fetchMaintenanceRequests } from '@/api/queries';
import { MOCK_TASKS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_ZONES, MOCK_RESERVATIONS, USE_HK_MOCK, regenerateMockData } from '@/components/housekeeping/mockData';

export interface HousekeepingTask {
  id: string;
  room_id: string;
  task_date: string;
  status: string;
  priority: string;
  task_type: string;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  inspected_by: string | null;
  inspected_at: string | null;
  notes: string | null;
  estimated_minutes: number | null;
  paused_reason: string | null;
  room?: { room_number: string; floor: number; room_type: string };
}

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  reported_by: string;
  description: string;
  priority: string;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  photos: any;
  created_at: string;
  room?: { room_number: string; floor: number };
}

/**
 * Shared in-memory mock state so mutations work across components.
 * Only used when USE_HK_MOCK is true and real DB returns no data.
 */
let mockTaskState: HousekeepingTask[] = [...MOCK_TASKS];
let mockMaintenanceState: MaintenanceRequest[] = [...MOCK_MAINTENANCE];
let mockListeners: Array<() => void> = [];

function notifyMockListeners() {
  mockListeners.forEach(fn => fn());
}

function useMockRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    mockListeners.push(fn);
    return () => { mockListeners = mockListeners.filter(l => l !== fn); };
  }, []);
}

/** Regenerate all mock data with fresh random tasks */
export function regenerateAllMockData() {
  mockTaskState = regenerateMockData();
  mockMaintenanceState = [...MOCK_MAINTENANCE];
  notifyMockListeners();
}

export function useHousekeepingTasks(date?: string) {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();
  const taskDate = date || new Date().toISOString().split('T')[0];
  useMockRefresh();

  const query = useQuery({
    queryKey: ['housekeeping-tasks', activeHotelId, taskDate],
    queryFn: () => fetchHousekeepingTasks(activeHotelId, taskDate) as Promise<HousekeepingTask[]>,
  });

  useEffect(() => {
    const channel = supabase
      .channel('hk-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? mockTaskState : realData;

  return { ...query, data };
}

export function useMyTasks() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  useMockRefresh();

  const query = useQuery({
    queryKey: ['my-hk-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(room_number, floor, room_type)')
        .eq('assigned_to', user.id)
        .eq('task_date', today)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as HousekeepingTask[];
    },
    enabled: !!user,
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0))
    ? mockTaskState.filter(t => t.assigned_to === MOCK_STAFF[0].user_id)
    : realData;

  return { ...query, data };
}

export function useAllTasks() {
  useMockRefresh();
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const query = useQuery({
    queryKey: ['all-hk-tasks', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(room_number, floor, room_type)')
        .eq('hotel_id', activeHotelId)
        .eq('task_date', today)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as HousekeepingTask[];
    },
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? mockTaskState : realData;
  return { ...query, data };
}

export function useOpenPoolTasks() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  useMockRefresh();

  const query = useQuery({
    queryKey: ['hk-pool-tasks', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(room_number, floor, room_type)')
        .eq('hotel_id', activeHotelId)
        .eq('task_date', today)
        .is('assigned_to', null)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as HousekeepingTask[];
    },
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0))
    ? mockTaskState.filter(t => !t.assigned_to)
    : realData;

  return { ...query, data };
}

export function useMaintenanceRequests() {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();
  useMockRefresh();

  const query = useQuery({
    queryKey: ['maintenance-requests', activeHotelId],
    queryFn: () => fetchMaintenanceRequests(activeHotelId) as Promise<MaintenanceRequest[]>,
  });

  useEffect(() => {
    const channel = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? mockMaintenanceState : realData;

  return { ...query, data };
}

export function useHKStaff() {
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['hk-staff', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_departments' as any)
        .select('user_id, profiles:user_id(full_name)')
        .eq('department', 'housekeeping')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        user_id: d.user_id,
        name: d.profiles?.full_name || 'Staff',
      }));
    },
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? MOCK_STAFF : realData;
  return { ...query, data };
}

export function useHKZones() {
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['hk-zones', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hk_zones')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? MOCK_ZONES : realData;
  return { ...query, data };
}

export function useHKReservations() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const query = useQuery({
    queryKey: ['hk-reservations-today', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, check_in_date, check_out_date, status')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const realData = query.data;
  const data = (USE_HK_MOCK && (!realData || realData.length === 0)) ? MOCK_RESERVATIONS : realData;
  return { ...query, data };
}

export function useHousekeepingMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, activeHotelId } = useAuth();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['my-hk-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['hk-pool-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['all-hk-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  }, [queryClient]);

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      if (USE_HK_MOCK && mockTaskState.find(t => t.id === taskId)) {
        mockTaskState = mockTaskState.map(t => {
          if (t.id !== taskId) return t;
          const updates: Partial<HousekeepingTask> = { status };
          if (status === 'in_progress') updates.started_at = new Date().toISOString();
          if (status === 'clean') updates.completed_at = new Date().toISOString();
          if (status === 'paused') updates.paused_reason = 'paused';
          if (status === 'inspected') {
            updates.inspected_by = user?.id || 'mock-supervisor';
            updates.inspected_at = new Date().toISOString();
          }
          return { ...t, ...updates };
        });
        notifyMockListeners();
        return;
      }

      const updates: any = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'clean') updates.completed_at = new Date().toISOString();
      if (status === 'paused') updates.paused_reason = 'paused';
      if (status === 'inspected') {
        updates.inspected_by = user?.id;
        updates.inspected_at = new Date().toISOString();
      }

      const { error } = await supabase.from('housekeeping_tasks').update(updates).eq('id', taskId);
      if (error) throw error;

      if (status === 'inspected') {
        const { data: task } = await supabase.from('housekeeping_tasks').select('room_id').eq('id', taskId).single();
        if (task) {
          await supabase.from('rooms').update({ status: 'available' } as any).eq('id', task.room_id);
        }
      }
    },
    onSuccess: () => invalidateAll(),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const assignTask = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      if (USE_HK_MOCK && mockTaskState.find(t => t.id === taskId)) {
        mockTaskState = mockTaskState.map(t =>
          t.id === taskId ? { ...t, assigned_to: userId || null } : t
        );
        notifyMockListeners();
        return;
      }

      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({ assigned_to: userId } as any)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const generateDailyTasks = useMutation({
    mutationFn: async () => {
      if (USE_HK_MOCK) {
        toast({ title: 'Demo mode: tasks already generated' });
        return 0;
      }
      const today = new Date().toISOString().split('T')[0];
      const { data: rooms, error: rErr } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('hotel_id', activeHotelId)
        .in('status', ['occupied', 'checkout']);
      if (rErr) throw rErr;

      const tasks = (rooms || []).map(room => ({
        room_id: room.id,
        task_date: today,
        status: 'dirty' as const,
        task_type: room.status === 'checkout' ? 'checkout_clean' : 'stay_over',
        priority: 'normal' as const,
        hotel_id: activeHotelId,
      }));

      if (tasks.length > 0) {
        const { error } = await supabase.from('housekeeping_tasks').upsert(tasks as any[], { onConflict: 'room_id,task_date' });
        if (error) throw error;
      }

      return tasks.length;
    },
    onSuccess: (count) => {
      invalidateAll();
      if (count !== undefined && count > 0) toast({ title: `Generated ${count} tasks for today` });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const reportMaintenance = useMutation({
    mutationFn: async (data: { room_id: string; description: string; priority: string; photos?: any }) => {
      if (USE_HK_MOCK) {
        mockMaintenanceState = [...mockMaintenanceState, {
          id: `mock-m-${Date.now()}`,
          room_id: data.room_id,
          reported_by: user?.id || 'mock-staff',
          description: data.description,
          priority: data.priority,
          status: 'open',
          resolved_by: null,
          resolved_at: null,
          photos: data.photos || [],
          created_at: new Date().toISOString(),
          room: mockTaskState.find(t => t.room_id === data.room_id)?.room as any,
        }];
        notifyMockListeners();
        return;
      }
      const { error } = await supabase.from('maintenance_requests').insert({
        ...data,
        reported_by: user?.id,
        hotel_id: activeHotelId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast({ title: 'Maintenance issue reported' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateTaskNotes = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes: string }) => {
      if (USE_HK_MOCK && mockTaskState.find(t => t.id === taskId)) {
        mockTaskState = mockTaskState.map(t =>
          t.id === taskId ? { ...t, notes } : t
        );
        notifyMockListeners();
        return;
      }
      const { error } = await supabase.from('housekeeping_tasks').update({ notes } as any).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const claimTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      if (USE_HK_MOCK && mockTaskState.find(t => t.id === taskId)) {
        const task = mockTaskState.find(t => t.id === taskId);
        if (task && task.assigned_to) throw new Error('Task already claimed');
        mockTaskState = mockTaskState.map(t =>
          t.id === taskId ? { ...t, assigned_to: user?.id || MOCK_STAFF[0].user_id } : t
        );
        notifyMockListeners();
        return;
      }
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({ assigned_to: user?.id } as any)
        .eq('id', taskId)
        .is('assigned_to', null);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: 'Task claimed' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { updateTaskStatus, assignTask, claimTask, generateDailyTasks, reportMaintenance, updateTaskNotes };
}
