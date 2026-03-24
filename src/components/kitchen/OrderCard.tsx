import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface KitchenOrder {
  id: string;
  hotel_id: string;
  table_label: string | null;
  plan_date: string;
  status: 'pending' | 'in_progress' | 'ready' | 'served' | 'void';
  course: 'starter' | 'main' | 'dessert';
  items: { menu_item_id?: string; name: string; quantity: number; notes?: string }[];
  notes: string | null;
  created_at: string;
}

const COURSE_COLOR: Record<string, string> = {
  starter:  'bg-blue-500/15 text-blue-600 border-blue-500/30',
  main:     'bg-primary/15 text-primary border-primary/30',
  dessert:  'bg-pink-500/15 text-pink-600 border-pink-500/30',
};

const STATUS_COLOR: Record<string, string> = {
  pending:     'border-amber-400/60 bg-amber-400/5',
  in_progress: 'border-primary/60 bg-primary/5',
  ready:       'border-green-500/60 bg-green-500/5',
  served:      'border-muted bg-muted/10',
  void:        'border-muted/30 bg-muted/5 opacity-50',
};

interface Props {
  order: KitchenOrder;
  onAdvance: (id: string, next: string) => void;
  onVoid: (id: string) => void;
}

export function OrderCard({ order, onAdvance, onVoid }: Props) {
  const age = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
  const isOld = Date.now() - new Date(order.created_at).getTime() > 15 * 60_000; // >15 min

  const nextStatus: Record<string, string> = {
    pending: 'in_progress',
    in_progress: 'ready',
    ready: 'served',
  };

  const nextLabel: Record<string, string> = {
    pending: 'Start cooking',
    in_progress: 'Mark ready',
    ready: 'Mark served',
  };

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${STATUS_COLOR[order.status]}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{order.table_label ?? 'Table —'}</span>
          <Badge className={`text-xs border capitalize ${COURSE_COLOR[order.course]}`}>
            {order.course}
          </Badge>
        </div>
        <span className={`flex items-center gap-1 text-xs ${isOld ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
          <Clock className="h-3 w-3" /> {age}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {order.items.map((item, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium">{item.quantity}×</span> {item.name}
            {item.notes && <span className="text-xs text-muted-foreground ml-1">({item.notes})</span>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="text-xs italic text-muted-foreground border-t border-border/30 pt-2">{order.notes}</p>
      )}

      {/* Actions */}
      {order.status !== 'served' && order.status !== 'void' && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAdvance(order.id, nextStatus[order.status])}
          >
            <ChefHat className="h-3.5 w-3.5 mr-1" />
            {nextLabel[order.status]}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onVoid(order.id)}>
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Ready for service
        </div>
      )}
    </div>
  );
}
