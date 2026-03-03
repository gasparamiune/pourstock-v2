import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

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
  const taskDate = date || new Date().toISOString().split('T')[0];

  const query = useQuery({
    queryKey: ['housekeeping-tasks', taskDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*, room:rooms(room_number, floor, room_type)')
        .eq('task_date', taskDate)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data as HousekeepingTask[];
    },
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
  const queryClient = useQueryClient();
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

export function useMaintenanceRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*, room:rooms(room_number, floor)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MaintenanceRequest[];
    },
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
  const { user } = useAuth();

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

      // If inspected, update room to available
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
      // Get all occupied/checkout rooms
      const { data: rooms, error: rErr } = await supabase
        .from('rooms')
        .select('id, status')
        .in('status', ['occupied', 'checkout']);
      if (rErr) throw rErr;

      const tasks = (rooms || []).map(room => ({
        room_id: room.id,
        task_date: today,
        status: 'dirty' as const,
        task_type: room.status === 'checkout' ? 'checkout_clean' : 'stay_over',
        priority: 'normal' as const,
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

  return { updateTaskStatus, assignTask, generateDailyTasks, reportMaintenance, updateTaskNotes };
}
