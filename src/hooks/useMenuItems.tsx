import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type MenuCourse = 'starter' | 'main' | 'dessert' | 'drinks';

export interface MenuItem {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  allergens: string | null;
  price: number;
  course: MenuCourse;
  is_active: boolean;
  sort_order: number;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'hotel_id' | 'created_at' | 'updated_at'>;

export function useMenuItems() {
  const { activeHotelId } = useAuth();

  return useQuery({
    queryKey: ['menu-items', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .order('course')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return (data as unknown) as MenuItem[];
    },
    enabled: !!activeHotelId,
  });
}

export function useMenuItemMutations() {
  const qc = useQueryClient();
  const { activeHotelId } = useAuth();

  const create = useMutation({
    mutationFn: async (input: MenuItemInput) => {
      const { data, error } = await supabase
        .from('menu_items' as any)
        .insert({ ...input, hotel_id: activeHotelId })
        .select('*')
        .single();
      if (error) throw error;
      return (data as unknown) as MenuItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items', activeHotelId] });
      toast.success('Menu item added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MenuItem> & { id: string }) => {
      const { error } = await supabase
        .from('menu_items' as any)
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items', activeHotelId] });
      toast.success('Item updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items' as any)
        .delete()
        .eq('id', id)
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items', activeHotelId] });
      toast.success('Item removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, update, remove };
}
