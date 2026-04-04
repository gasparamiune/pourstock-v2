import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KitchenOrder } from './KitchenTicket';
import { Loader2, Hand, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const COURSE_BORDER: Record<string, string> = {
  starter: 'border-green-500',
  mellemret: 'border-violet-500',
  main: 'border-red-500',
  dessert: 'border-sky-300',
};

const COURSE_BADGE: Record<string, string> = {
  starter: 'bg-green-100 text-green-800 border-green-300',
  mellemret: 'bg-violet-100 text-violet-800 border-violet-300',
  main: 'bg-red-100 text-red-800 border-red-300',
  dessert: 'bg-sky-100 text-sky-800 border-sky-300',
};

function useReadyOrders() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['kitchen-orders', activeHotelId, ['ready'], today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_orders' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .eq('status', 'ready')
        .order('updated_at', { ascending: true });
      if (error) throw error;
      return (data as unknown) as KitchenOrder[];
    },
    enabled: !!activeHotelId,
    refetchInterval: 10_000,
  });
}

function useServedOrders() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['kitchen-orders-served', activeHotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_orders' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('plan_date', today)
        .eq('status', 'served')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as unknown) as KitchenOrder[];
    },
    enabled: !!activeHotelId,
    refetchInterval: 30_000,
  });
}

export function WaiterDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useReadyOrders();
  const { data: servedOrders = [], isLoading: servedLoading } = useServedOrders();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!activeHotelId) return;
    const channel = supabase
      .channel('waiter-orders-rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'kitchen_orders',
        filter: `hotel_id=eq.${activeHotelId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
        qc.invalidateQueries({ queryKey: ['kitchen-orders-served'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeHotelId, qc]);

  const pinch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kitchen_orders' as any)
        .update({ status: 'served', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
      qc.invalidateQueries({ queryKey: ['kitchen-orders-served'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ready for pickup */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Hand className="h-12 w-12 opacity-20" />
          <p className="text-sm">{t('kitchen.waiterNoOrders')}</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {orders.length} {t('kitchen.readyForPickup')}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {orders.map(order => {
              const timeStr = new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-lg border-[3px] bg-white p-3 space-y-2 shadow-sm',
                    COURSE_BORDER[order.course],
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-black">{order.table_label ?? 'Table —'}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn('text-[10px] border capitalize', COURSE_BADGE[order.course])}>
                        {t(`kitchen.course.${order.course}`)}
                      </Badge>
                      <span className="text-xs text-gray-500 tabular-nums">{timeStr}</span>
                    </div>
                  </div>

                  <ul className="space-y-0.5 text-sm text-black">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        <span className="font-medium">{item.quantity}×</span> {item.name}
                        {item.notes && <span className="text-xs text-orange-600 ml-1 italic">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => pinch.mutate(order.id)}
                    disabled={pinch.isPending}
                  >
                    <Hand className="h-3.5 w-3.5 mr-1.5" />
                    {t('kitchen.pinch')}
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Pinched / Served History ── */}
      <div className="pt-2">
        <button
          onClick={() => setShowHistory(h => !h)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <div className="flex-1 h-px bg-border/40" />
          <History className="h-3.5 w-3.5" />
          <span className="font-medium uppercase tracking-wider text-[10px]">
            {t('kitchen.servedHistory')} ({servedOrders.length})
          </span>
          {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <div className="flex-1 h-px bg-border/40" />
        </button>

        {showHistory && (
          <div className="mt-3 grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {servedOrders.length === 0 ? (
              <p className="col-span-full text-center text-xs text-muted-foreground py-4">No served tickets yet today</p>
            ) : (
              servedOrders.map(order => {
                const timeStr = new Date((order as any).updated_at ?? order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={order.id}
                    className={cn(
                      'rounded-md border-2 bg-gray-50 p-2 space-y-1 opacity-60',
                      COURSE_BORDER[order.course],
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black">{order.table_label ?? '—'}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{timeStr}</span>
                    </div>
                    <ul className="space-y-0 text-[11px] text-gray-600">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.quantity}× {item.name}
                          {item.notes && <span className="text-orange-500 ml-1 italic text-[10px]">({item.notes})</span>}
                        </li>
                      ))}
                    </ul>
                    <Badge className={cn('text-[8px] border capitalize', COURSE_BADGE[order.course])}>
                      {t(`kitchen.course.${order.course}`)} ✓
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
