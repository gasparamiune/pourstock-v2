import { useState, useMemo } from 'react';
import { ArrowLeft, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDailyMenu, DailyMenuItem } from '@/hooks/useDailyMenu';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { toast } from 'sonner';
import { BillView } from '@/components/restaurant/BillView';
import { PaymentSheet } from '@/components/restaurant/PaymentSheet';
import { VisualMenuBoard } from './VisualMenuBoard';
import { OrderTicketPanel } from './OrderTicketPanel';
import { NoteDialog } from './NoteDialog';

type CourseKey = 'starter' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: string;
  tableLabel: string;
}

export function OrderCommandCenter({ open, onOpenChange, tableId, tableLabel }: Props) {
  const { data: menu, isLoading: menuLoading } = useDailyMenu();
  const { data: orders = [] } = useTableOrders();
  const { openOrder, submitOrder } = useTableOrderMutations();
  const { data: catalogItems = [], isLoading: catalogLoading } = useMenuItems();

  const [selection, setSelection] = useState<SelectionMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'order' | 'bill'>('order');
  const [payOpen, setPayOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);

  // Build stock map from catalog
  const stockMap: Record<string, number> = {};
  for (const item of catalogItems) {
    if (item.available_units != null) {
      stockMap[item.id] = Math.max(0, (item.available_units ?? 0) - (item.reserved_units ?? 0));
    }
  }

  // Convert catalog items to DailyMenuItem format
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

  const existingOrder = orders.find(o => o.table_id === tableId && o.status === 'open');
  const hasExistingOrder = orders.some(o => o.table_id === tableId && o.status !== 'void');

  // Derive pending lines from selection
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
      onOpenChange(false);
    } catch {
      // Error toast handled by mutation
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background command-center-enter flex flex-col">
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
          {pendingLines.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
              {pendingLines.reduce((s, l) => s + l.quantity, 0)}
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
          {/* Menu board — left 55% */}
          <div className="flex-[55] min-w-0 overflow-hidden border-r border-border/40">
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

          {/* Order ticket — right 45% */}
          <div className="flex-[45] min-w-0 overflow-hidden">
            <OrderTicketPanel
              tableLabel={tableLabel}
              lines={pendingLines}
              selection={selection}
              onRemoveLine={removeLineById}
              onSubmit={handleSubmit}
              submitting={submitting}
              existingOrder={!!existingOrder}
            />
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
    </div>
  );
}
