/**
 * Phase 5A: Shared CRUD hook for settings reference tables.
 * Provides create, update, delete mutations with optimistic query invalidation.
 * Used by: VendorSettings, DepartmentSettings, ProductCategorySettings, RoomTypeSettings
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TableName = 'vendors' | 'departments' | 'product_categories' | 'room_types';

interface UseSettingsCrudOptions {
  table: TableName;
  queryKey: string;
  hotelId: string | null;
  label: string; // e.g. "Vendor", "Department"
}

export function useSettingsCrud({ table, queryKey, hotelId, label }: UseSettingsCrudOptions) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey, hotelId] });

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { error } = await supabase
        .from(table)
        .insert({ ...values, hotel_id: hotelId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${label} created`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, any>) => {
      const { error } = await supabase
        .from(table)
        .update(values as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${label} updated`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete via is_active = false for all Phase 5A tables
      const { error } = await supabase
        .from(table)
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${label} removed`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, update, remove };
}
