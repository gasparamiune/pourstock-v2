import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receiveOrderItems,
} from '@/api/queries';

export type PurchaseOrderItem = {
  id: string;
  hotel_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  received_quantity: number | null;
  unit_cost: number | null;
  created_at: string;
};

export type PurchaseOrder = {
  id: string;
  hotel_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  received_at: string | null;
  received_by: string | null;
  sent_at: string | null;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  total_cost: number | null;
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_ref_id: string | null;
  items: PurchaseOrderItem[];
};

export type NewOrderPayload = {
  vendor_ref_id?: string | null;
  vendor_name?: string | null;
  notes?: string | null;
  items: { product_id: string; product_name: string; quantity: number; unit_cost?: number | null }[];
};

export function usePurchaseOrders() {
  const { activeHotelId, user } = useAuth();
  const qc = useQueryClient();

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['purchase_orders', activeHotelId] });
    qc.invalidateQueries({ queryKey: ['purchase_orders_history', activeHotelId] });
  }, [qc, activeHotelId]);

  const { data: activeOrders = [], isLoading: loadingActive } = useQuery({
    queryKey: ['purchase_orders', activeHotelId],
    queryFn: () => fetchPurchaseOrders(activeHotelId, ['draft', 'sent']),
    enabled: !!activeHotelId,
  });

  const { data: historyOrders = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['purchase_orders_history', activeHotelId],
    queryFn: () => fetchPurchaseOrders(activeHotelId, ['received', 'cancelled']),
    enabled: !!activeHotelId,
  });

  const createOrder = useMutation({
    mutationFn: (payload: NewOrderPayload) =>
      createPurchaseOrder(activeHotelId, user!.id, payload),
    onSuccess: () => { invalidate(); toast.success('Order created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markSent = useMutation({
    mutationFn: (orderId: string) => updatePurchaseOrderStatus(orderId, 'sent'),
    onSuccess: () => { invalidate(); toast.success('Order marked as sent'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markCancelled = useMutation({
    mutationFn: (orderId: string) => updatePurchaseOrderStatus(orderId, 'cancelled'),
    onSuccess: () => { invalidate(); toast.success('Order cancelled'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const receiveOrder = useMutation({
    mutationFn: ({
      orderId,
      items,
    }: {
      orderId: string;
      items: { id: string; received_quantity: number }[];
    }) => receiveOrderItems(orderId, items, user!.id),
    onSuccess: () => { invalidate(); toast.success('Order received'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    activeOrders: activeOrders as PurchaseOrder[],
    historyOrders: historyOrders as PurchaseOrder[],
    loadingActive,
    loadingHistory,
    createOrder,
    markSent,
    markCancelled,
    receiveOrder,
  };
}
