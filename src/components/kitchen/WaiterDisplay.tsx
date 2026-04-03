import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KitchenOrder } from './KitchenTicket';
import { Loader2, Hand, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const COURSE_BORDER: Record<string, string> = {
  starter: 'border-l-green-500',
  main: 'border-l-red-500',
  dessert: 'border-l-sky-300',
};

const COURSE_BADGE: Record<string, string> = {
  starter: 'bg-green-500/20 text-green-400 border-green-500/40',
  main: 'bg-red-500/20 text-red-400 border-red-500/40',
  dessert: 'bg-sky-300/20 text-sky-300 border-sky-300/40',
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

export function WaiterDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useReadyOrders();

  useEffect(() => {
    if (!activeHotelId) return;
    const channel = supabase
      .channel('waiter-orders-rt')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'kitchen_orders',
        filter: `hotel_id=eq.${activeHotelId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Hand className="h-12 w-12 opacity-20" />
        <p className="text-sm">{t('kitchen.waiterNoOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
                'rounded-xl border-l-4 border border-green-500/40 bg-green-500/5 p-3 space-y-2',
                COURSE_BORDER[order.course],
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base">{order.table_label ?? 'Table —'}</span>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn('text-[10px] border capitalize', COURSE_BADGE[order.course])}>
                    {t(`kitchen.course.${order.course}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">{timeStr}</span>
                </div>
              </div>

              <ul className="space-y-0.5 text-sm">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <span className="font-medium">{item.quantity}×</span> {item.name}
                    {item.notes && <span className="text-xs text-amber-400 ml-1 italic">({item.notes})</span>}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-8 text-xs"
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
    </div>
  );
}
