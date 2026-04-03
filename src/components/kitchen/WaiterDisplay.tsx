import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KitchenOrder } from './OrderCard';
import { Loader2, Hand, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

const COURSE_COLOR: Record<string, string> = {
  starter: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  main: 'bg-primary/20 text-primary border-primary/40',
  dessert: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
};

export function WaiterDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useReadyOrders();

  // Realtime
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
      <div className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'min-h-screen bg-gray-950 text-gray-500' : 'py-24 text-muted-foreground',
      )}>
        <Hand className={fullScreen ? 'h-16 w-16 opacity-20' : 'h-12 w-12 opacity-20'} />
        <p className={fullScreen ? 'text-lg' : 'text-sm'}>No ready orders. Waiting for kitchen…</p>
      </div>
    );
  }

  return (
    <div className={fullScreen ? 'min-h-screen bg-gray-950 text-white p-6' : ''}>
      {fullScreen && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Hand className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold text-white">Waiter Side</span>
          </div>
          <span className="text-gray-400 text-lg">{new Date().toLocaleTimeString('da-DK')}</span>
        </div>
      )}
      <div className={cn(
        'grid gap-4',
        fullScreen ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      )}>
        {orders.map(order => {
          const age = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
          return (
            <div
              key={order.id}
              className="rounded-xl border-2 border-green-500/60 bg-green-500/5 p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{order.table_label ?? 'Table —'}</span>
                <Badge className={cn('text-xs border capitalize', COURSE_COLOR[order.course])}>
                  {order.course}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                <span className="tabular-nums">{age} ago</span>
              </div>

              {/* Items */}
              <ul className="space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{item.quantity}×</span> {item.name}
                    {item.notes && <span className="text-xs text-muted-foreground ml-1 italic">({item.notes})</span>}
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="text-xs italic text-muted-foreground border-t border-border/30 pt-2">{order.notes}</p>
              )}

              {/* Pinch button */}
              <Button
                className="w-full"
                onClick={() => pinch.mutate(order.id)}
                disabled={pinch.isPending}
              >
                <Hand className="h-4 w-4 mr-2" />
                Pinch
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
