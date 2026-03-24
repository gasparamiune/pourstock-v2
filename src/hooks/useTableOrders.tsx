import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface OrderLine {
  id?: string;
  course: 'starter' | 'main' | 'dessert';
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  special_notes?: string;
  status?: string;
}

export interface TableOrder {
  id: string;
  hotel_id: string;
  plan_date: string;
  table_id: string;
  table_label: string | null;
  status: 'open' | 'submitted' | 'complete' | 'void';
  notes: string | null;
  opened_at: string;
  submitted_at: string | null;
  lines?: OrderLine[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useTableOrders(planDate?: string) {
  const { activeHotelId } = useAuth();
  const date = planDate ?? new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['table-orders', activeHotelId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_orders' as any)
        .select('*, lines:table_order_lines(*)')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', date)
        .neq('status', 'void')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return data as TableOrder[];
    },
    enabled: !!activeHotelId,
  });
}

export function useTableOrderMutations() {
  const qc = useQueryClient();
  const { activeHotelId, user } = useAuth();

  const openOrder = useMutation({
    mutationFn: async ({ tableId, tableLabel, notes }: { tableId: string; tableLabel: string; notes?: string }) => {
      const date = new Date().toISOString().split('T')[0];
      // Upsert: reuse existing open order for same table today
      const { data: existing } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', activeHotelId)
        .eq('table_id', tableId)
        .eq('plan_date', date)
        .eq('status', 'open')
        .maybeSingle();

      if (existing) return existing as { id: string };

      const { data, error } = await supabase
        .from('table_orders' as any)
        .insert({
          hotel_id: activeHotelId,
          table_id: tableId,
          table_label: tableLabel,
          plan_date: date,
          waiter_id: user?.id,
          notes: notes ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['table-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addLines = useMutation({
    mutationFn: async ({ orderId, lines }: { orderId: string; lines: OrderLine[] }) => {
      const rows = lines.map((l) => ({
        order_id: orderId,
        hotel_id: activeHotelId,
        course: l.course,
        item_id: l.item_id,
        item_name: l.item_name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        special_notes: l.special_notes ?? null,
      }));
      const { error } = await supabase.from('table_order_lines' as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['table-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const submitOrder = useMutation({
    mutationFn: async ({ orderId, lines, reservationId }: { orderId: string; lines: OrderLine[]; reservationId?: string }) => {
      // Insert lines
      if (lines.length > 0) {
        const rows = lines.map((l) => ({
          order_id: orderId,
          hotel_id: activeHotelId,
          course: l.course,
          item_id: l.item_id,
          item_name: l.item_name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          special_notes: l.special_notes ?? null,
        }));
        const { error: lErr } = await supabase.from('table_order_lines' as any).insert(rows);
        if (lErr) throw lErr;
      }

      // Mark order submitted
      const { error: oErr } = await supabase
        .from('table_orders' as any)
        .update({ status: 'submitted', submitted_at: new Date().toISOString(), folio_id: reservationId ?? null })
        .eq('id', orderId);
      if (oErr) throw oErr;

      // Create kitchen order tickets per course
      const today = new Date().toISOString().split('T')[0];
      const { data: order } = await supabase
        .from('table_orders' as any)
        .select('table_label')
        .eq('id', orderId)
        .single();

      const courses = ['starter', 'main', 'dessert'] as const;
      for (const course of courses) {
        const courseLines = lines.filter((l) => l.course === course);
        if (courseLines.length === 0) continue;

        const items = courseLines.map((l) => ({
          menu_item_id: l.item_id,
          name: l.item_name,
          quantity: l.quantity,
          notes: l.special_notes,
        }));

        await supabase.from('kitchen_orders' as any).insert({
          hotel_id: activeHotelId,
          table_id: null,
          table_label: order?.table_label ?? 'Table',
          plan_date: today,
          course,
          items,
          waiter_id: user?.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success('Order sent to kitchen!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { openOrder, addLines, submitOrder };
}
