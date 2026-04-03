import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, ChefHat, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  starter: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  main:    'bg-primary/20 text-primary border-primary/40',
  dessert: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
};

const STATUS_COLOR: Record<string, string> = {
  pending:     'border-amber-400/60 bg-amber-400/5',
  in_progress: 'border-primary/60 bg-primary/5',
  ready:       'border-green-500/60 bg-green-500/5',
  served:      'border-muted bg-muted/10',
  void:        'border-muted/30 bg-muted/5 opacity-50',
};

const COURSE_THRESHOLDS: Record<string, number> = {
  starter: 15,
  main: 25,
  dessert: 15,
};

interface Props {
  order: KitchenOrder;
  onAdvance: (id: string, next: string) => void;
  onVoid: (id: string) => void;
  isNew?: boolean;
}

export function OrderCard({ order, onAdvance, onVoid, isNew = false }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const age = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
  const ageMinutes = (Date.now() - new Date(order.created_at).getTime()) / 60000;
  const threshold = COURSE_THRESHOLDS[order.course] ?? 15;
  const percent = Math.min(100, (ageMinutes / threshold) * 100);
  const urgencyColor =
    percent >= 80 ? 'bg-red-500' :
    percent >= 50 ? 'bg-amber-500' :
    'bg-green-500';

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

  function toggleCheck(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const allChecked = order.items.length > 0 && checked.size === order.items.length;

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 space-y-3 transition-colors',
      STATUS_COLOR[order.status],
      isNew && 'pulse-glow',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{order.table_label ?? 'Table —'}</span>
          <Badge className={cn('text-xs border capitalize', COURSE_COLOR[order.course])}>
            {order.course}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/60" />
          <span className={cn('text-xs tabular-nums', percent >= 80 ? 'text-red-400 font-semibold' : 'text-muted-foreground')}>
            {age}
          </span>
        </div>
      </div>

      {/* Age progress bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', urgencyColor)}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Items with checkboxes */}
      <ul className="space-y-2">
        {order.items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'flex items-start gap-2.5 text-sm cursor-pointer group transition-opacity duration-150',
              checked.has(i) && 'opacity-50',
            )}
            onClick={() => toggleCheck(i)}
          >
            <Checkbox
              checked={checked.has(i)}
              onCheckedChange={() => toggleCheck(i)}
              className="mt-0.5 flex-shrink-0"
            />
            <span className={cn('flex-1', checked.has(i) && 'line-through text-muted-foreground')}>
              <span className="font-medium">{item.quantity}×</span> {item.name}
              {item.notes && (
                <span className="text-xs text-muted-foreground ml-1 italic">({item.notes})</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {allChecked && order.status === 'in_progress' && (
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> All items ready to plate
        </div>
      )}

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
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onVoid(order.id)}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Ready for service
        </div>
      )}
    </div>
  );
}
