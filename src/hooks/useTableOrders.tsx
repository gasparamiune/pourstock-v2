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

// ── Stock reservation helpers ──────────────────────────────────────────────────

async function adjustReservations(lines: Array<{ item_id: string; quantity: number }>, delta: 1 | -1) {
  const itemIds = [...new Set(lines.map((l) => l.item_id))];
  if (itemIds.length === 0) return;

  const { data: menuItems } = await supabase
    .from('menu_items' as any)
    .select('id, product_id')
    .in('id', itemIds);

  if (!menuItems?.length) return;

  const totals: Record<string, number> = {};
  for (const line of lines) {
    const mi = (menuItems as any[]).find((m) => m.id === line.item_id);
    if (mi?.product_id) {
      totals[mi.product_id] = (totals[mi.product_id] ?? 0) + line.quantity;
    }
  }

  await Promise.all(
    Object.entries(totals).map(([productId, qty]) =>
      supabase.rpc('reserve_product_stock' as any, {
        p_product_id: productId,
        p_delta: delta * qty,
      })
    )
  );
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
      return (data as unknown) as TableOrder[];
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
      // Reuse existing non-void order for same table today
      const { data: existing } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', activeHotelId)
        .eq('table_id', tableId)
        .eq('plan_date', date)
        .in('status', ['open', 'submitted'])
        .maybeSingle();

      if (existing) return (existing as unknown) as { id: string };

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
      return (data as unknown) as { id: string };
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
      await adjustReservations(lines, 1);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['table-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteLine = useMutation({
    mutationFn: async ({ lineId, itemId, quantity }: { lineId: string; itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from('table_order_lines' as any)
        .delete()
        .eq('id', lineId)
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      await adjustReservations([{ item_id: itemId, quantity }], -1);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      toast.success('Item removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitOrder = useMutation({
    mutationFn: async ({ orderId, lines, reservationId }: { orderId: string; lines: OrderLine[]; reservationId?: string }) => {
      // Insert new lines
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
        await adjustReservations(lines, 1);
      }

      // Keep order as 'open' so additional items can be added later.
      // Only update folio link and submitted_at timestamp.
      const updatePayload: any = { submitted_at: new Date().toISOString() };
      if (reservationId) updatePayload.folio_id = reservationId;
      await supabase
        .from('table_orders' as any)
        .update(updatePayload)
        .eq('id', orderId);

      // Create kitchen order tickets per course
      const today = new Date().toISOString().split('T')[0];
      const { data: order } = await supabase
        .from('table_orders' as any)
        .select('table_label')
        .eq('id', orderId)
        .single();

      const tableLabel = (order as any)?.table_label ?? 'Table';

      // Check which kitchen tickets already exist for this table today
      const { data: existingTickets } = await supabase
        .from('kitchen_orders' as any)
        .select('id, course, items')
        .eq('hotel_id', activeHotelId)
        .eq('table_label', tableLabel)
        .eq('plan_date', today)
        .neq('status', 'void');

      const existingByC = new Map<string, any>();
      for (const t of (existingTickets as any[] ?? [])) {
        existingByC.set(t.course, t);
      }

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

        const existing = existingByC.get(course);
        if (existing) {
          // Append to existing ticket
          const currentItems = Array.isArray(existing.items) ? existing.items : [];
          await supabase
            .from('kitchen_orders' as any)
            .update({ items: [...currentItems, ...items], updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          continue;
        }

        await supabase.from('kitchen_orders' as any).insert({
          hotel_id: activeHotelId,
          table_id: null,
          table_label: tableLabel,
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

  const completeOrder = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { error } = await supabase
        .from('table_orders' as any)
        .update({ status: 'complete', completed_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      toast.success('Order completed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fireNextCourse = useMutation({
    mutationFn: async ({ orderId, courseToFire }: { orderId: string; courseToFire: 'main' | 'dessert' }) => {
      const { data: lines, error: lErr } = await supabase
        .from('table_order_lines' as any)
        .select('item_id, item_name, quantity, special_notes')
        .eq('order_id', orderId)
        .eq('course', courseToFire);
      if (lErr) throw lErr;
      if (!lines || (lines as any[]).length === 0) return;

      const { data: order } = await supabase
        .from('table_orders' as any)
        .select('table_label')
        .eq('id', orderId)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('kitchen_orders' as any).insert({
        hotel_id: activeHotelId,
        table_id: null,
        table_label: (order as any)?.table_label ?? 'Table',
        plan_date: today,
        course: courseToFire,
        items: (lines as any[]).map((l) => ({
          menu_item_id: l.item_id,
          name: l.item_name,
          quantity: l.quantity,
          notes: l.special_notes,
        })),
        waiter_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { openOrder, addLines, deleteLine, submitOrder, completeOrder, fireNextCourse };
}
