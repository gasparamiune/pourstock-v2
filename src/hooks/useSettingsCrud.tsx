/**
 * Phase 5 hardened: Shared CRUD hook for settings reference tables.
 * - Sanitised error messages for constraint violations
 * - Audit-ready (audit logging deferred to Phase 6+ edge function)
 * - Soft-delete only (is_active = false)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TableName = 'vendors' | 'departments' | 'product_categories' | 'room_types' | 'restaurants' | 'service_periods' | 'reorder_rules' | 'hotel_modules';

interface UseSettingsCrudOptions {
  table: TableName;
  queryKey: string;
  hotelId: string | null;
  label: string;
  /** Additional query keys to invalidate on success (e.g. navigation cache) */
  extraInvalidate?: string[];
}

function friendlyError(msg: string, label: string): string {
  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('idx_')) {
    return `A ${label.toLowerCase()} with that name or slug already exists.`;
  }
  if (msg.includes('violates row-level security')) {
    return `You don't have permission to modify this ${label.toLowerCase()}.`;
  }
  if (msg.includes('violates foreign key')) {
    return `This ${label.toLowerCase()} is in use and cannot be modified.`;
  }
  return msg;
}

export function useSettingsCrud({ table, queryKey, hotelId, label, extraInvalidate }: UseSettingsCrudOptions) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [queryKey, hotelId] });
    extraInvalidate?.forEach(key => qc.invalidateQueries({ queryKey: [key, hotelId] }));
  };

  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any).insert({ ...values, hotel_id: hotelId });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${label} created`);
    },
    onError: (e: Error) => toast.error(friendlyError(e.message, label)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any).update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${label} updated`);
    },
    onError: (e: Error) => toast.error(friendlyError(e.message, label)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
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
    onError: (e: Error) => toast.error(friendlyError(e.message, label)),
  });

  return { create, update, remove };
}
