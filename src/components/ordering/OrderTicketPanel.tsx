import { Receipt, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DailyMenuItem } from '@/hooks/useDailyMenu';
import { OrderLine } from '@/hooks/useTableOrders';

type CourseKey = 'starter' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

const COURSE_LABELS: Record<CourseKey, string> = {
  starter: '── STARTERS ──',
  main: '── MAINS ──',
  dessert: '── DESSERTS ──',
};

const COURSE_ORDER: CourseKey[] = ['starter', 'main', 'dessert'];

interface Props {
  tableLabel: string;
  lines: Omit<OrderLine, 'id' | 'status'>[];
  selection: SelectionMap;
  onRemoveLine: (itemId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  existingOrder: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const today = () =>
  new Date().toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' });

export function OrderTicketPanel({
  tableLabel, lines, selection, onRemoveLine, onSubmit, submitting, existingOrder,
}: Props) {
  const total = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  const grouped = COURSE_ORDER.reduce((acc, course) => {
    const courseLines = lines.filter(l => l.course === course);
    if (courseLines.length > 0) acc[course] = courseLines;
    return acc;
  }, {} as Record<CourseKey, typeof lines>);

  return (
    <div className="flex flex-col h-full bg-card/30 border-l border-border/40">
      {/* Ticket header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-dashed border-border/40">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase mb-1">
          Order Ticket
        </p>
        <p className="font-bold text-2xl tracking-tight">{tableLabel}</p>
        <p className="font-mono text-xs text-muted-foreground/60 mt-0.5">{today()}</p>
        {existingOrder && (
          <div className="mt-2 text-xs text-primary/70 bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5">
            Adding to open order
          </div>
        )}
      </div>

      {/* Line items */}
      <ScrollArea className="flex-1 px-5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">No items yet</p>
            <p className="text-xs text-muted-foreground/30 mt-1">Tap cards to add</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {(Object.entries(grouped) as [CourseKey, typeof lines][]).map(([course, courseLines]) => (
              <div key={course}>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground/40 mb-2">
                  {COURSE_LABELS[course]}
                </p>
                <div className="space-y-1">
                  {courseLines.map((line) => (
                    <div key={line.item_id} className="group">
                      <div className="flex items-start justify-between gap-2 py-2 border-b border-dashed border-border/20">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm">
                            <span className="text-primary font-bold">{line.quantity}×</span>{' '}
                            {line.item_name}
                          </span>
                          {selection[line.item_id]?.notes && (
                            <p className="text-xs text-muted-foreground/60 mt-0.5 italic truncate">
                              {selection[line.item_id].notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-sm tabular-nums text-muted-foreground">
                            {fmt(line.unit_price * line.quantity)}
                          </span>
                          <button
                            onClick={() => onRemoveLine(line.item_id)}
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150',
                              'opacity-0 group-hover:opacity-60 hover:!opacity-100',
                              'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                            )}
                            aria-label={`Remove ${line.item_name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 pb-5 pt-4 border-t border-border/40 space-y-3">
        {lines.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">Total</span>
            <span className="font-mono font-bold text-base tabular-nums">{fmt(total)}</span>
          </div>
        )}
        <Button
          className={cn(
            'w-full h-12 text-base font-semibold transition-all duration-200',
            lines.length > 0
              ? 'shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]'
              : '',
          )}
          disabled={lines.length === 0 || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</>
          ) : (
            <>Send to Kitchen{totalItems > 0 ? ` (${totalItems})` : ''}</>
          )}
        </Button>
      </div>
    </div>
  );
}
