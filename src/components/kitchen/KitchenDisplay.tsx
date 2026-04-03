import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderCard, KitchenOrder } from './OrderCard';
import { Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

// ── Hooks ─────────────────────────────────────────────────────────────────────

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
    refetchInterval: 30_000,
  });
}

function useOrderMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('kitchen_orders' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { updateStatus };
}

// ── Column ────────────────────────────────────────────────────────────────────

function KDSColumn({ title, orders, color, onAdvance, onVoid, newIds }: {
  title: string;
  orders: KitchenOrder[];
  color: string;
  onAdvance: (id: string, next: string) => void;
  onVoid: (id: string) => void;
  newIds: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs font-bold">{orders.length}</span>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/30 py-8 flex items-center justify-center text-muted-foreground text-xs">
          No orders
        </div>
      ) : (
        orders.map((o) => (
          <OrderCard key={o.id} order={o} onAdvance={onAdvance} onVoid={onVoid} isNew={newIds.has(o.id)} />
        ))
      )}
    </div>
  );
}

// ── Main KitchenDisplay ───────────────────────────────────────────────────────

export function KitchenDisplay({ fullScreen = false }: { fullScreen?: boolean }) {
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useKitchenOrders(['pending', 'in_progress', 'ready']);
  const { updateStatus } = useOrderMutations();

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

  function handleAdvance(id: string, next: string) {
    updateStatus.mutate({ id, status: next });
  }

  function handleVoid(id: string) {
    updateStatus.mutate({ id, status: 'void' });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending    = orders.filter((o) => o.status === 'pending');
  const inProgress = orders.filter((o) => o.status === 'in_progress');
  const ready      = orders.filter((o) => o.status === 'ready');

  if (orders.length === 0) {
    return (
      <div className={fullScreen ? 'min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-500' : 'flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground'}>
        <ChefHat className={fullScreen ? 'h-16 w-16 opacity-20' : 'h-12 w-12 opacity-20'} />
        <p className={fullScreen ? 'text-lg' : 'text-sm'}>No active orders. Awaiting first ticket.</p>
      </div>
    );
  }

  return (
    <div className={fullScreen ? 'min-h-screen bg-gray-950 text-white p-6' : ''}>
      {fullScreen && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-400" />
            <span className="text-2xl font-bold text-white">Kitchen Display</span>
          </div>
          <span className="text-gray-400 text-lg">{new Date().toLocaleTimeString('da-DK')}</span>
        </div>
      )}
      <div className={fullScreen
        ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
        : 'grid grid-cols-1 md:grid-cols-3 gap-4'
      }>
        <KDSColumn
          title="Pending"
          orders={pending}
          color={fullScreen ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/10 text-amber-700'}
          onAdvance={handleAdvance}
          onVoid={handleVoid}
          newIds={newIds}
        />
        <KDSColumn
          title="In Progress"
          orders={inProgress}
          color={fullScreen ? 'bg-blue-500/20 text-blue-300' : 'bg-primary/10 text-primary'}
          onAdvance={handleAdvance}
          onVoid={handleVoid}
          newIds={newIds}
        />
        <KDSColumn
          title="Ready"
          orders={ready}
          color={fullScreen ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700'}
          onAdvance={handleAdvance}
          onVoid={handleVoid}
          newIds={newIds}
        />
      </div>
    </div>
  );
}
