import { useState, useEffect } from 'react';
import { type PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ReceiveRow {
  id: string;
  product_name: string;
  quantity: number;
  received_quantity: number;
}

interface Props {
  order: PurchaseOrder | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orderId: string, items: { id: string; received_quantity: number }[]) => void;
  isSubmitting?: boolean;
}

export default function ReceiveOrderDialog({ order, onOpenChange, onConfirm, isSubmitting }: Props) {
  const [rows, setRows] = useState<ReceiveRow[]>([]);

  useEffect(() => {
    if (order) {
      setRows(
        order.items.map((item) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          received_quantity: item.quantity, // default to full quantity
        }))
      );
    }
  }, [order]);

  const updateQty = (id: string, value: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, received_quantity: Math.max(0, value) } : r))
    );
  };

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive Order</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the quantity received for each item.
            {order.vendor_name && (
              <> Vendor: <span className="font-medium text-foreground">{order.vendor_name}</span></>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Ordered</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Received</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_80px_80px] gap-2 items-center p-3 rounded-xl bg-secondary/50"
            >
              <span className="text-sm font-medium truncate">{row.product_name}</span>
              <span className="text-sm text-center text-muted-foreground">{row.quantity}</span>
              <div className="flex items-center justify-center">
                <Input
                  type="number"
                  min={0}
                  max={row.quantity}
                  className="h-8 text-center w-16 text-sm"
                  value={row.received_quantity}
                  onChange={(e) => updateQty(row.id, Number(e.target.value))}
                />
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No items on this order.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onConfirm(order.id, rows.map((r) => ({ id: r.id, received_quantity: r.received_quantity })))}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Confirm Receipt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
