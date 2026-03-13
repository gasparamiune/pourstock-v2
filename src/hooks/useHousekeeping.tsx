import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { fetchHousekeepingTasks, fetchMaintenanceRequests } from '@/api/queries';

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

export function useHousekeepingTasks(date?: string) {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();
  const taskDate = date || new Date().toISOString().split('T')[0];

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

  return query;
}

export function useMyTasks() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
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
}

export function useOpenPoolTasks() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
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
}

export function useMaintenanceRequests() {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();

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

  return query;
}

export function useHousekeepingMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, activeHotelId } = useAuth();

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'clean') updates.completed_at = new Date().toISOString();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-hk-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const assignTask = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({ assigned_to: userId } as any)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-hk-tasks'] });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const generateDailyTasks = useMutation({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      toast({ title: `Generated ${count} tasks for today` });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const reportMaintenance = useMutation({
    mutationFn: async (data: { room_id: string; description: string; priority: string; photos?: any }) => {
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
      const { error } = await supabase.from('housekeeping_tasks').update({ notes } as any).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-hk-tasks'] });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const claimTask = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      // Atomic claim: only succeeds if still unassigned
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({ assigned_to: user?.id } as any)
        .eq('id', taskId)
        .is('assigned_to', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-hk-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['hk-pool-tasks'] });
      toast({ title: 'Task claimed' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { updateTaskStatus, assignTask, claimTask, generateDailyTasks, reportMaintenance, updateTaskNotes };
}
