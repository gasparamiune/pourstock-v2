import { useEffect, useRef, useState } from 'react';
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

export function KitchenDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useKitchenOrders(['pending', 'in_progress', 'ready']);

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] }),
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sort: active first (pending/in_progress), then ready
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const sortedOrders = [...activeOrders, ...readyOrders];

  if (sortedOrders.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'min-h-[60vh] text-muted-foreground' : 'py-24 text-muted-foreground',
      )}>
        <ChefHat className="h-12 w-12 opacity-20" />
        <p className="text-sm">{t('kitchen.noActiveOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {/* Ticket grid — 3-4 per row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedOrders.map(order => (
          <KitchenTicket
            key={order.id}
            order={order}
            onMarkReady={(id) => markReady.mutate(id)}
            onVoid={(id) => voidOrder.mutate(id)}
            isNew={newIds.has(order.id)}
          />
        ))}
      </div>
    </div>
  );
}
