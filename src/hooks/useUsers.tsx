import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { invokeManageUsers } from '@/api/queries';

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

export function useUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeHotelId } = useAuth();

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);

  useRealtimeSubscription(['profiles', 'user_roles', 'user_departments'], invalidateUsers);

  const usersQuery = useQuery({
    queryKey: ['users', activeHotelId],
    queryFn: async (): Promise<UserProfile[]> => {
      const [profilesRes, rolesRes, deptsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_departments').select('user_id, department, department_role'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const depts = deptsRes.data || [];

      return profiles.map((p) => {
        const userRole = roles.find((r) => r.user_id === p.user_id);
        const userDepts = depts.filter((d) => d.user_id === p.user_id);
        return {
          ...p,
          role: userRole?.role || 'staff',
          departments: userDepts.map((d) => ({
            department: d.department,
            department_role: d.department_role,
          })),
        };
      });
    },
  });

  const createUser = useMutation({
    mutationFn: (params: { email: string; password: string; fullName: string; role: string; departments: { department: string; department_role: string }[] }) =>
      invokeManageUsers('create', activeHotelId, params),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User created successfully' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateUser = useMutation({
    mutationFn: (params: { userId: string; role?: string; departments?: { department: string; department_role: string }[]; fullName?: string; phoneNumber?: string }) =>
      invokeManageUsers('update', activeHotelId, params),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User updated successfully' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const approveUser = useMutation({
    mutationFn: (userId: string) => invokeManageUsers('approve', activeHotelId, { userId }),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User approved' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => invokeManageUsers('delete', activeHotelId, { userId }),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { usersQuery, createUser, updateUser, approveUser, deleteUser };
}
