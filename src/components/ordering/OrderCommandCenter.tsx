import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CreditCard, Users, Clock, ChefHat, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDailyMenu, DailyMenuItem } from '@/hooks/useDailyMenu';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { toast } from 'sonner';
import { BillView } from '@/components/restaurant/BillView';
import { PaymentSheet } from '@/components/restaurant/PaymentSheet';
import { VisualMenuBoard } from './VisualMenuBoard';
import { NoteDialog } from './NoteDialog';

type CourseKey = 'starter' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

const COURSE_LABELS: Record<CourseKey, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Desserts',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: string;
  tableLabel: string;
  reservation?: {
    guestCount?: number;
    guestName?: string;
    roomNumber?: string;
    notes?: string;
    arrivedAt?: string;
  };
}

export function OrderCommandCenter({ open, onOpenChange, tableId, tableLabel, reservation }: Props) {
  const { data: menu, isLoading: menuLoading } = useDailyMenu();
  const { data: orders = [] } = useTableOrders();
  const { openOrder, submitOrder } = useTableOrderMutations();
  const { data: catalogItems = [], isLoading: catalogLoading } = useMenuItems();

  const [selection, setSelection] = useState<SelectionMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'order' | 'bill'>('order');
  const [payOpen, setPayOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);

  // Find existing order for this table (any non-void status)
  const existingOrder = orders.find(o => o.table_id === tableId && o.status !== 'void');
  const existingLines = existingOrder?.lines ?? [];
  const hasExistingOrder = !!existingOrder;

  // Build stock map from catalog
  const stockMap: Record<string, number> = {};
  for (const item of catalogItems) {
    if (item.available_units != null) {
      stockMap[item.id] = Math.max(0, (item.available_units ?? 0) - (item.reserved_units ?? 0));
    }
  }

  function toDailyItem(i: typeof catalogItems[number]): DailyMenuItem {
    return {
      id: i.id,
      name: i.name,
      description: i.description ?? '',
      allergens: i.allergens ?? '',
      price: i.price,
      available_units: i.available_units != null
        ? Math.max(0, (i.available_units ?? 0) - (i.reserved_units ?? 0))
        : null,
    };
  }

  const permanentStarters = catalogItems.filter(i => i.is_active && i.course === 'starter').map(toDailyItem);
  const permanentMains    = catalogItems.filter(i => i.is_active && i.course === 'main').map(toDailyItem);
  const permanentDesserts = catalogItems.filter(i => i.is_active && i.course === 'dessert').map(toDailyItem);

  const mergeItems = (daily: DailyMenuItem[], permanent: DailyMenuItem[]) => {
    const ids = new Set(daily.map(i => i.id));
    return [...daily, ...permanent.filter(p => !ids.has(p.id))];
  };

  const allStarters = mergeItems(menu?.starters ?? [], permanentStarters);
  const allMains    = mergeItems(menu?.mains ?? [], permanentMains);
  const allDesserts = mergeItems(menu?.desserts ?? [], permanentDesserts);

  // Pending lines from new selection
  const pendingLines = useMemo<Omit<OrderLine, 'id' | 'status'>[]>(() =>
    Object.values(selection).map(s => ({
      course: s.course,
      item_id: s.item.id,
      item_name: s.item.name,
      quantity: s.qty,
      unit_price: s.item.price,
      special_notes: s.notes || undefined,
    })),
    [selection],
  );

  // Group existing lines by course
  const existingByCourse = useMemo(() => {
    const grouped: Record<CourseKey, typeof existingLines> = { starter: [], main: [], dessert: [] };
    for (const line of existingLines) {
      const c = line.course as CourseKey;
      if (grouped[c]) grouped[c].push(line);
    }
    return grouped;
  }, [existingLines]);

  const existingTotal = existingLines.reduce((s, l) => s + (l.unit_price ?? 0) * (l.quantity ?? 0), 0);
  const pendingTotal = pendingLines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const grandTotal = existingTotal + pendingTotal;
  const pendingCount = pendingLines.reduce((s, l) => s + l.quantity, 0);

  function addItem(item: DailyMenuItem, course: CourseKey) {
    setSelection(prev => {
      const current = prev[item.id]?.qty ?? 0;
      return {
        ...prev,
        [item.id]: { item, course, qty: current + 1, notes: prev[item.id]?.notes ?? '' },
      };
    });
  }

  function removeItem(item: DailyMenuItem) {
    setSelection(prev => {
      const current = prev[item.id]?.qty ?? 0;
      if (current <= 1) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { ...prev[item.id], qty: current - 1 } };
    });
  }

  function removeLineById(itemId: string) {
    setSelection(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  }

  function saveNote(itemId: string, note: string) {
    setSelection(prev => {
      if (!prev[itemId]) return prev;
      return { ...prev, [itemId]: { ...prev[itemId], notes: note } };
    });
  }

  const noteItem = noteTarget ? selection[noteTarget] : null;

  async function handleSubmit() {
    if (pendingLines.length === 0) {
      toast.error('Add at least one item before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      let orderId = existingOrder?.id;
      if (!orderId) {
        const result = await openOrder.mutateAsync({ tableId, tableLabel });
        orderId = result.id;
      }
      await submitOrder.mutateAsync({ orderId, lines: pendingLines as OrderLine[] });
      setSelection({});
      // Stay open so waiter can see the full order
    } catch {
      // Error toast handled by mutation
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const arrivedTime = reservation?.arrivedAt
    ? new Date(reservation.arrivedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-bold text-lg tracking-tight">{tableLabel}</span>
          {pendingCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
              +{pendingCount}
            </span>
          )}
          {existingLines.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {existingLines.reduce((s, l) => s + (l.quantity ?? 0), 0)} items ordered
            </span>
          )}
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 bg-secondary/60 rounded-full p-1">
          <button
            onClick={() => setMode('order')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
              mode === 'order'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Order
          </button>
          {hasExistingOrder && (
            <button
              onClick={() => setMode('bill')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1',
                mode === 'bill'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CreditCard className="h-3 w-3" />
              Bill
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      {mode === 'order' ? (
        <div className="flex flex-1 min-h-0">
          {/* Left: Order Ticket */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-card/30 border-r border-border/40">
            {/* Ticket header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-dashed border-border/40">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase mb-1">
                Order Ticket
              </p>
              <p className="font-bold text-xl tracking-tight">{tableLabel}</p>
              {reservation && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {reservation.guestCount && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {reservation.guestCount}</span>
                  )}
                  {arrivedTime && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {arrivedTime}</span>
                  )}
                </div>
              )}
            </div>

            {/* Existing + pending items */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-3 space-y-3">
                {/* Existing ordered items */}
                {existingLines.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] tracking-widest text-emerald-500/70 uppercase mb-2">
                      ✓ Ordered
                    </p>
                    {(['starter', 'main', 'dessert'] as const).map(course => {
                      const lines = existingByCourse[course];
                      if (!lines || lines.length === 0) return null;
                      return (
                        <div key={course} className="mb-2">
                          <p className="font-mono text-[9px] tracking-widest text-muted-foreground/40 mb-1">
                            {COURSE_LABELS[course]}
                          </p>
                          {lines.map((line, i) => (
                            <div key={line.id ?? i} className="flex items-start justify-between gap-2 py-1.5 border-b border-dashed border-border/15 text-muted-foreground/70">
                              <span className="font-mono text-xs">
                                <span className="font-bold">{line.quantity}×</span> {line.item_name}
                              </span>
                              <span className="font-mono text-xs tabular-nums shrink-0">
                                {fmt((line.unit_price ?? 0) * (line.quantity ?? 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {pendingLines.length > 0 && (
                      <div className="border-t border-primary/30 my-2" />
                    )}
                  </div>
                )}

                {/* New pending items */}
                {pendingLines.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] tracking-widest text-primary/70 uppercase mb-2">
                      + New Items
                    </p>
                    {(['starter', 'main', 'dessert'] as const).map(course => {
                      const courseLines = pendingLines.filter(l => l.course === course);
                      if (courseLines.length === 0) return null;
                      return (
                        <div key={course} className="mb-2">
                          <p className="font-mono text-[9px] tracking-widest text-muted-foreground/40 mb-1">
                            {COURSE_LABELS[course]}
                          </p>
                          {courseLines.map((line) => (
                            <div key={line.item_id} className="group flex items-start justify-between gap-2 py-1.5 border-b border-dashed border-border/20">
                              <div className="flex-1 min-w-0">
                                <span className="font-mono text-xs">
                                  <span className="text-primary font-bold">{line.quantity}×</span> {line.item_name}
                                </span>
                                {selection[line.item_id]?.notes && (
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic truncate">
                                    {selection[line.item_id].notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                  {fmt(line.unit_price * line.quantity)}
                                </span>
                                <button
                                  onClick={() => removeLineById(line.item_id)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {existingLines.length === 0 && pendingLines.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ChefHat className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground/50">No items yet</p>
                    <p className="text-[10px] text-muted-foreground/30 mt-0.5">Tap cards to add</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer with total + submit */}
            <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-border/40 space-y-2">
              {grandTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Total</span>
                  <span className="font-mono font-bold text-sm tabular-nums">{fmt(grandTotal)}</span>
                </div>
              )}
              <Button
                className={cn(
                  'w-full h-11 text-sm font-semibold transition-all duration-200',
                  pendingLines.length > 0
                    ? 'shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]'
                    : '',
                )}
                disabled={pendingLines.length === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <>
                    <ChefHat className="h-4 w-4 mr-2" />
                    Fire to Kitchen{pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Center + Right: Table info + Menu */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Table info bar */}
            {reservation && (
              <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                {reservation.guestName && (
                  <span className="text-sm font-medium text-foreground">{reservation.guestName}</span>
                )}
                {reservation.roomNumber && (
                  <span className="text-xs text-muted-foreground">Room {reservation.roomNumber}</span>
                )}
                {reservation.notes && (
                  <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{reservation.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Menu board */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {menuLoading || catalogLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm">Loading menu…</p>
                  </div>
                </div>
              ) : allStarters.length + allMains.length + allDesserts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">No menu available</p>
                  <p className="text-xs text-muted-foreground/60">Ask the kitchen to publish today's menu</p>
                </div>
              ) : (
                <VisualMenuBoard
                  starters={allStarters}
                  mains={allMains}
                  desserts={allDesserts}
                  stockMap={stockMap}
                  selection={selection}
                  onAdd={addItem}
                  onRemove={removeItem}
                  onRequestNote={(id) => setNoteTarget(id)}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Bill & Pay mode */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
          <BillView tableId={tableId} tableLabel={tableLabel} />
          <Button className="w-full h-12 text-base" onClick={() => setPayOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay
          </Button>
          <PaymentSheet
            open={payOpen}
            onOpenChange={setPayOpen}
            tableId={tableId}
            tableLabel={tableLabel}
          />
        </div>
      )}

      {/* Note dialog */}
      <NoteDialog
        itemId={noteTarget}
        itemName={noteItem?.item.name ?? ''}
        initialNote={noteItem?.notes ?? ''}
        onSave={saveNote}
        onClose={() => setNoteTarget(null)}
      />
    </div>,
    document.body,
  );
}
