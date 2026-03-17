import { useState } from 'react';
import { ChevronDown, ChevronUp, Send, PackageCheck, XCircle, Truck } from 'lucide-react';
import { type PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  sent: { label: 'Sent', variant: 'default' as const },
  received: { label: 'Received', variant: 'outline' as const },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const },
};

interface Props {
  order: PurchaseOrder;
  onMarkSent?: (id: string) => void;
  onMarkCancelled?: (id: string) => void;
  onReceive?: (order: PurchaseOrder) => void;
  isMutating?: boolean;
  showActions?: boolean;
}

export default function OrderCard({
  order,
  onMarkSent,
  onMarkCancelled,
  onReceive,
  isMutating,
  showActions = true,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status];
  const dateLabel =
    order.status === 'received' && order.received_at
      ? `Received ${format(new Date(order.received_at), 'dd MMM yyyy')}`
      : order.status === 'sent' && order.sent_at
      ? `Sent ${format(new Date(order.sent_at), 'dd MMM yyyy')}`
      : `Created ${format(new Date(order.created_at), 'dd MMM yyyy')}`;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Truck className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {order.vendor_name ?? 'No vendor'}
            </span>
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {dateLabel}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            {order.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={isMutating}
                  onClick={() => onMarkSent?.(order.id)}
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  disabled={isMutating}
                  onClick={() => onMarkCancelled?.(order.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {order.status === 'sent' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={isMutating}
                  onClick={() => onReceive?.(order)}
                >
                  <PackageCheck className="h-3.5 w-3.5" /> Receive
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  disabled={isMutating}
                  onClick={() => onMarkCancelled?.(order.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{item.product_name}</span>
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                {item.unit_cost != null && (
                  <span>{item.unit_cost.toFixed(2)} / unit</span>
                )}
                <span className="font-medium text-foreground">
                  {order.status === 'received' && item.received_quantity != null
                    ? `${item.received_quantity} / ${item.quantity} received`
                    : `×${item.quantity}`}
                </span>
              </div>
            </div>
          ))}
          {order.notes && (
            <p className="text-xs text-muted-foreground italic mt-3 pt-3 border-t border-border/50">
              {order.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
