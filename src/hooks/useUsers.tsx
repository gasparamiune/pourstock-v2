import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useCallback } from 'react';
import { DEFAULT_HOTEL_ID } from '@/lib/hotel';

export interface UserDepartment {
  department: string;
  department_role: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  is_approved: boolean;
  avatar_url: string | null;
  created_at: string;
  role: string;
  departments: UserDepartment[];
}

async function invokeManageUsers(action: string, params: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action, hotelId: DEFAULT_HOTEL_ID, ...params },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);

  useRealtimeSubscription(['profiles', 'user_roles', 'user_departments'], invalidateUsers);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserProfile[]> => {
      const [profilesRes, rolesRes, deptsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_departments').select('user_id, department, department_role'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const roleMap = new Map<string, string>();
      (rolesRes.data || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

      const deptMap = new Map<string, UserDepartment[]>();
      (deptsRes.data || []).forEach((d: any) => {
        const existing = deptMap.get(d.user_id) || [];
        existing.push({ department: d.department, department_role: d.department_role });
        deptMap.set(d.user_id, existing);
      });

      return (profilesRes.data || []).map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || 'staff',
        departments: deptMap.get(p.user_id) || [],
      }));
    },
  });

  const createUser = useMutation({
    mutationFn: (params: { email: string; password: string; fullName: string; phone?: string; role: string; departments?: { department: string; department_role: string }[] }) =>
      invokeManageUsers('createUser', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created successfully' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => invokeManageUsers('deleteUser', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const approveUser = useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      invokeManageUsers('approveUser', { userId, approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      invokeManageUsers('updateRole', { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role updated' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const resetPassword = useMutation({
    mutationFn: (email: string) => invokeManageUsers('resetPassword', { email }),
    onSuccess: (data) => {
      toast({ title: 'Password reset link generated', description: 'The link has been generated.' });
      return data;
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ userId, fullName, phone, email }: { userId: string; fullName: string; phone: string; email: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phone, email })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Profile updated' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const assignDepartment = useMutation({
    mutationFn: ({ userId, department, departmentRole }: { userId: string; department: string; departmentRole: string }) =>
      invokeManageUsers('assignDepartment', { userId, department, departmentRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Department assigned' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const removeDepartment = useMutation({
    mutationFn: ({ userId, department }: { userId: string; department: string }) =>
      invokeManageUsers('removeDepartment', { userId, department }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Department removed' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    createUser,
    deleteUser,
    approveUser,
    updateRole,
    resetPassword,
    updateProfile,
    assignDepartment,
    removeDepartment,
  };
}
