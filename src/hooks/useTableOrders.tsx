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

// Look up product_ids for the given menu item ids, then call reserve_product_stock
// for each linked product. delta = +qty to reserve, -qty to release.
async function adjustReservations(lines: Array<{ item_id: string; quantity: number }>, delta: 1 | -1) {
  const itemIds = [...new Set(lines.map((l) => l.item_id))];
  if (itemIds.length === 0) return;

  const { data: menuItems } = await supabase
    .from('menu_items' as any)
    .select('id, product_id')
    .in('id', itemIds);

  if (!menuItems?.length) return;

  // Sum quantities per product_id
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
      // Upsert: reuse existing open order for same table today
      const { data: existing } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', activeHotelId)
        .eq('table_id', tableId)
        .eq('plan_date', date)
        .eq('status', 'open')
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
      // Reserve stock for linked products
      await adjustReservations(lines, 1);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['table-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete a single order line and release its stock reservation
  const deleteLine = useMutation({
    mutationFn: async ({ lineId, itemId, quantity }: { lineId: string; itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from('table_order_lines' as any)
        .delete()
        .eq('id', lineId)
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      // Release the reservation
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
        // Reserve stock for linked products
        await adjustReservations(lines, 1);
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

      // Only fire the FIRST course immediately — subsequent courses are fired
      // when the waiter advances the table's course (kør forret → kør hovedret → etc.)
      const firstCourse = (['starter', 'main', 'dessert'] as const).find(
        (c) => lines.some((l) => l.course === c),
      );
      const tableLabel = (order as any)?.table_label ?? 'Table';

      // Check which kitchen tickets already exist for this table today
      const { data: existingTickets } = await supabase
        .from('kitchen_orders' as any)
        .select('id, course, items')
        .eq('hotel_id', activeHotelId)
        .eq('table_label', tableLabel)
        .eq('plan_date', today)
        .neq('status', 'void');

      const existingCourses = new Set((existingTickets as any[] ?? []).map((t: any) => t.course));

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

        if (existingCourses.has(course)) {
          const existingTicket = (existingTickets as any[])?.find((t: any) => t.course === course);
          if (existingTicket) {
            const currentItems = Array.isArray(existingTicket.items) ? existingTicket.items : [];
            await supabase
              .from('kitchen_orders' as any)
              .update({ items: [...currentItems, ...items], updated_at: new Date().toISOString() })
              .eq('id', existingTicket.id);
          }
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

      await supabase.from('audit_logs' as any).insert({
        hotel_id: activeHotelId,
        user_id: user?.id,
        action: 'complete',
        entity_type: 'table_order',
        entity_id: orderId,
        metadata: {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-orders'] });
      toast.success('Order completed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Fire the NEXT course kitchen ticket when waiter advances table course
  const fireNextCourse = useMutation({
    mutationFn: async ({ orderId, courseToFire }: { orderId: string; courseToFire: 'main' | 'dessert' }) => {
      const { data: lines, error: lErr } = await supabase
        .from('table_order_lines' as any)
        .select('item_id, item_name, quantity, special_notes')
        .eq('order_id', orderId)
        .eq('course', courseToFire);
      if (lErr) throw lErr;
      if (!lines || (lines as any[]).length === 0) return; // No items for this course

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
