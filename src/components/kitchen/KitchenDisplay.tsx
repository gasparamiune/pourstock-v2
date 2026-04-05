import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KitchenTicket, KitchenOrder } from './KitchenTicket';
import { Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Re-export for backward compat
export type { KitchenOrder } from './KitchenTicket';

function useKitchenOrders(statusFilter: string[]) {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['kitchen-orders', activeHotelId, statusFilter, today],
    queryFn: async () => {
      let q = supabase
        .from('kitchen_orders' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .order('created_at', { ascending: true });

      if (statusFilter.length > 0) {
        q = q.in('status', statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown) as KitchenOrder[];
    },
    enabled: !!activeHotelId,
    refetchInterval: 15_000,
  });
}

// ── Service Counter: fetch all today's order lines + completed tickets ──
function useServiceCounters() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: orderLines = [] } = useQuery({
    queryKey: ['service-counter-lines', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_order_lines' as any)
        .select('course, quantity, order_id')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      // Filter to today's orders by joining with table_orders
      const { data: todayOrders } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .neq('status', 'void');
      const orderIds = new Set((todayOrders as any[] ?? []).map((o: any) => o.id));
      return ((data as any[]) ?? []).filter((l: any) => orderIds.has(l.order_id));
    },
    enabled: !!activeHotelId,
    refetchInterval: 15_000,
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['service-counter-tickets', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_orders' as any)
        .select('course, items, status')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .in('status', ['ready', 'served']);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!activeHotelId,
    refetchInterval: 15_000,
  });

  return useMemo(() => {
    const courses = ['starter', 'mellemret', 'main', 'dessert'] as const;
    const expected: Record<string, number> = {};
    const completed: Record<string, number> = {};

    for (const c of courses) { expected[c] = 0; completed[c] = 0; }

    for (const line of orderLines) {
      const c = (line as any).course;
      if (expected[c] !== undefined) {
        expected[c] += (line as any).quantity ?? 1;
      }
    }

    for (const ticket of allTickets) {
      const c = ticket.course;
      if (completed[c] === undefined) continue;
      const items = Array.isArray(ticket.items) ? ticket.items : [];
      for (const item of items) {
        completed[c] += (item as any).quantity ?? 1;
      }
    }

    const remaining: Record<string, number> = {};
    for (const c of courses) {
      remaining[c] = Math.max(0, expected[c] - completed[c]);
    }

    return { expected, completed, remaining };
  }, [orderLines, allTickets]);
}

export function KitchenDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useKitchenOrders(['pending', 'in_progress', 'ready']);
  const counters = useServiceCounters();

  // New-order pulse detection
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    const arrived = [...currentIds].filter(id => !prevIdsRef.current.has(id));
    if (arrived.length > 0 && prevIdsRef.current.size > 0) {
      setNewIds(new Set(arrived));
      const t = setTimeout(() => setNewIds(new Set()), 4000);
      return () => clearTimeout(t);
    }
    prevIdsRef.current = currentIds;
  }, [orders]);

  // Realtime subscription
  useEffect(() => {
    if (!activeHotelId) return;
    const channel = supabase
      .channel('kitchen-orders-rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'kitchen_orders',
        filter: `hotel_id=eq.${activeHotelId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
        qc.invalidateQueries({ queryKey: ['service-counter-tickets'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeHotelId, qc]);

  // Also subscribe to table_order_lines for counter updates
  useEffect(() => {
    if (!activeHotelId) return;
    const channel = supabase
      .channel('order-lines-rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'table_order_lines',
        filter: `hotel_id=eq.${activeHotelId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['service-counter-lines'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeHotelId, qc]);

  const markReady = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kitchen_orders' as any)
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
      qc.invalidateQueries({ queryKey: ['service-counter-tickets'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kitchen_orders' as any)
        .update({ status: 'void', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const COUNTER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    starter:   { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    mellemret: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
    main:      { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    dessert:   { bg: 'bg-sky-400/10', text: 'text-sky-400', border: 'border-sky-400/30' },
  };

  const COUNTER_LABELS: Record<string, string> = {
    starter: 'Forret',
    mellemret: 'Mellemret',
    main: 'Hovedret',
    dessert: 'Dessert',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const sortedOrders = [...activeOrders, ...readyOrders];

  const hasAnyExpected = Object.values(counters.expected).some(v => v > 0);

  return (
    <div className="space-y-3">
      {/* ── Tonight's Service Counters ── */}
      {hasAnyExpected && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50 mr-1">Tonight</span>
          {(['starter', 'mellemret', 'main', 'dessert'] as const).map(course => {
            const rem = counters.remaining[course];
            const exp = counters.expected[course];
            if (exp === 0) return null;
            const colors = COUNTER_COLORS[course];
            return (
              <div
                key={course}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                  colors.bg, colors.border,
                )}
              >
                <span className={cn('text-xs font-medium', colors.text)}>{COUNTER_LABELS[course]}</span>
                <span className={cn('text-lg font-black tabular-nums', colors.text)}>{rem}</span>
                <span className="text-[10px] text-muted-foreground/50">/{exp}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket counts */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {activeOrders.length} {t('kitchen.active')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {readyOrders.length} {t('kitchen.ready')}
        </span>
      </div>

      {sortedOrders.length === 0 ? (
        <div className={cn(
          'flex flex-col items-center justify-center gap-4',
          fullScreen ? 'min-h-[60vh] text-muted-foreground' : 'py-24 text-muted-foreground',
        )}>
          <ChefHat className="h-12 w-12 opacity-20" />
          <p className="text-sm">{t('kitchen.noActiveOrders')}</p>
        </div>
      ) : (
        <>
          {/* Active tickets grid */}
          {activeOrders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeOrders.map(order => (
                <KitchenTicket
                  key={order.id}
                  order={order}
                  onMarkReady={(id) => markReady.mutate(id)}
                  onVoid={(id) => voidOrder.mutate(id)}
                  isNew={newIds.has(order.id)}
                />
              ))}
            </div>
          )}

          {/* Ready for Service section */}
          {readyOrders.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-green-500/20" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-green-500/60">
                  {t('kitchen.readyForService')}
                </span>
                <div className="flex-1 h-px bg-green-500/20" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {readyOrders.map(order => (
                  <KitchenTicket
                    key={order.id}
                    order={order}
                    onMarkReady={(id) => markReady.mutate(id)}
                    onVoid={(id) => voidOrder.mutate(id)}
                    isNew={newIds.has(order.id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
