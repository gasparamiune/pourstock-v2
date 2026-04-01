import { Loader2, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTableOrders } from '@/hooks/useTableOrders';
import { useOrderPayments } from '@/hooks/usePayments';

interface Props {
  tableId: string;
  tableLabel: string;
  planDate?: string;
}

const COURSE_LABELS: Record<string, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Dessert',
  drinks: 'Drinks',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

export function BillView({ tableId, tableLabel, planDate }: Props) {
  const { data: orders = [], isLoading } = useTableOrders(planDate);
  const tableOrder = orders.find(o => o.table_id === tableId && o.status !== 'void');
  const { data: payments = [] } = useOrderPayments(tableOrder?.id ?? '');

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!tableOrder) return <div className="py-8 text-center text-sm text-muted-foreground">No active order for {tableLabel}.</div>;

  const lines = tableOrder.lines ?? [];
  const totalAmount = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const paidAmount = payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalAmount - paidAmount);

  const courseOrder = ['starter', 'main', 'dessert', 'drinks'];
  const grouped = courseOrder
    .map(course => ({ course, lines: lines.filter(l => l.course === course) }))
    .filter(g => g.lines.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">{tableLabel}</span>
      </div>

      {grouped.map(({ course, lines: courseLines }) => (
        <div key={course} className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{COURSE_LABELS[course] ?? course}</p>
          {courseLines.map((line, i) => (
            <div key={line.id ?? i} className="flex justify-between text-sm py-0.5">
              <span className="text-foreground">
                {line.quantity > 1 && <span className="text-muted-foreground mr-1">{line.quantity}×</span>}
                {line.item_name}
                {line.special_notes && <span className="text-xs text-muted-foreground ml-1">({line.special_notes})</span>}
              </span>
              <span className="text-right tabular-nums">{fmt(line.unit_price * line.quantity)}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="border-t border-border pt-3 space-y-1">
        <div className="flex justify-between font-semibold text-sm">
          <span>Total</span>
          <span>{fmt(totalAmount)}</span>
        </div>
        {paidAmount > 0 && (
          <>
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>− {fmt(paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Remaining</span>
              <span>{fmt(remaining)}</span>
            </div>
          </>
        )}
      </div>

      {payments.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</p>
          {payments.map(p => (
            <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
              <span>
                {p.split_total ? `Split ${p.split_index}/${p.split_total}` : 'Full payment'}
              </span>
              <Badge variant={p.status === 'succeeded' ? 'default' : 'secondary'} className="text-xs">
                {fmt(p.amount)} · {p.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
