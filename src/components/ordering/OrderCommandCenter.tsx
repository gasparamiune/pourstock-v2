import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CreditCard, Users, Clock, ChefHat, AlertTriangle, UtensilsCrossed, Wine, CalendarDays, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDailyMenu, DailyMenuItem } from '@/hooks/useDailyMenu';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useProducts } from '@/hooks/useInventoryData';
import { toast } from 'sonner';
import { BillView } from '@/components/restaurant/BillView';
import { PaymentSheet } from '@/components/restaurant/PaymentSheet';
import { VisualMenuBoard } from './VisualMenuBoard';
import { NoteDialog } from './NoteDialog';
import { BeverageCategory, categoryLabels } from '@/types/inventory';

type CourseKey = 'starter' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

const COURSE_LABELS: Record<CourseKey, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Desserts',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

type MenuTab = 'food' | 'drinks';

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
  const { products: stockProducts, isLoading: productsLoading } = useProducts();
  const [selection, setSelection] = useState<SelectionMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'order' | 'bill'>('order');
  const [payOpen, setPayOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [menuTab, setMenuTab] = useState<MenuTab>('food');
  const [foodMode, setFoodMode] = useState<'alacarte' | 'daily'>('alacarte');

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

  // Build drink items from stock products (beverages)
  const drinkCategories: BeverageCategory[] = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];
  const [activeDrinkCat, setActiveDrinkCat] = useState<BeverageCategory>('wine');

  const drinksByCategory = useMemo(() => {
    const grouped: Partial<Record<BeverageCategory, DailyMenuItem[]>> = {};
    for (const cat of drinkCategories) {
      const items = stockProducts
        .filter(p => p.is_active && p.category === cat)
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.subtype ?? '',
          allergens: '',
          price: p.cost_per_unit ?? 0,
          available_units: null as number | null,
        }));
      if (items.length > 0) grouped[cat] = items;
    }
    return grouped;
  }, [stockProducts]);

  const availableDrinkCats = useMemo(() =>
    drinkCategories.filter(c => (drinksByCategory[c]?.length ?? 0) > 0),
    [drinksByCategory],
  );

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

  const elapsedMinutes = reservation?.arrivedAt
    ? Math.floor((Date.now() - new Date(reservation.arrivedAt).getTime()) / 60000)
    : null;

  // Parse allergy/diet info from notes
  const allergyNotes = reservation?.notes?.split(',').map(n => n.trim()).filter(Boolean) ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background command-center-enter flex flex-col">
      {/* ─── HEADER ─── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 h-12 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="font-bold text-base tracking-tight flex-1">{tableLabel}</span>

        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 bg-secondary/60 rounded-full p-0.5">
          <button
            onClick={() => setMode('order')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              mode === 'order' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            Order
          </button>
          {hasExistingOrder && (
            <button
              onClick={() => setMode('bill')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1',
                mode === 'bill' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              <CreditCard className="h-3 w-3" /> Bill
            </button>
          )}
        </div>
      </div>

      {mode === 'order' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* ─── TOP SECTION: 3-column layout ─── */}
          <div className="flex-shrink-0 grid grid-cols-[minmax(200px,1fr)_minmax(180px,auto)_minmax(200px,1fr)] border-b border-border/30" style={{ height: '38%', minHeight: 200 }}>
            
            {/* ── LEFT: Order Ticket ── */}
            <div className="flex flex-col border-r border-border/30 bg-card/20">
              <div className="px-3 pt-3 pb-2">
                <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">Current Order</p>
              </div>
              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 pb-2">
                  {/* Existing lines */}
                  {existingLines.length > 0 && (
                    <>
                      {(['starter', 'main', 'dessert'] as const).map(course => {
                        const lines = existingByCourse[course];
                        if (!lines?.length) return null;
                        return (
                          <div key={course}>
                            <p className="font-mono text-[8px] tracking-widest text-emerald-500/60 uppercase mt-1">{COURSE_LABELS[course]}</p>
                            {lines.map((line, i) => (
                              <div key={line.id ?? i} className="flex justify-between py-0.5 text-xs text-muted-foreground/70">
                                <span className="truncate"><span className="font-bold">{line.quantity}×</span> {line.item_name}</span>
                                <span className="tabular-nums ml-2 shrink-0">{fmt((line.unit_price ?? 0) * (line.quantity ?? 0))}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      {pendingLines.length > 0 && <div className="border-t border-primary/20 my-1.5" />}
                    </>
                  )}

                  {/* Pending lines */}
                  {pendingLines.length > 0 && (
                    <>
                      <p className="font-mono text-[8px] tracking-widest text-primary/60 uppercase">+ New</p>
                      {pendingLines.map(line => (
                        <div key={line.item_id} className="group flex justify-between py-0.5 text-xs">
                          <span className="truncate">
                            <span className="text-primary font-bold">{line.quantity}×</span> {line.item_name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="tabular-nums text-muted-foreground">{fmt(line.unit_price * line.quantity)}</span>
                            <button onClick={() => removeLineById(line.item_id)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {existingLines.length === 0 && pendingLines.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <ChefHat className="h-6 w-6 text-muted-foreground/15 mb-1" />
                      <p className="text-[10px] text-muted-foreground/40">Tap items below to add</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Total + Fire */}
              <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-border/30 space-y-2">
                {grandTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold tabular-nums">{fmt(grandTotal)}</span>
                  </div>
                )}
                <Button
                  size="sm"
                  className={cn(
                    'w-full h-9 text-xs font-semibold',
                    pendingLines.length > 0 && 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
                  )}
                  disabled={pendingLines.length === 0 || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <>
                      <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                      Fire to Kitchen{pendingCount > 0 ? ` (${pendingCount})` : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ── CENTER: Table Visual ── */}
            <div className="flex flex-col items-center justify-center gap-3 px-4 bg-gradient-to-b from-card/10 to-transparent">
              {/* Table icon */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/30 flex flex-col items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
                  <UtensilsCrossed className="h-8 w-8 text-primary/60 mb-1" />
                  <span className="font-bold text-lg text-primary">{tableLabel}</span>
                </div>
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1 shadow-lg">
                    +{pendingCount}
                  </span>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {reservation?.guestCount && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {reservation.guestCount} covers
                  </span>
                )}
                {arrivedTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {arrivedTime}
                  </span>
                )}
              </div>

              {elapsedMinutes !== null && (
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full tabular-nums',
                  elapsedMinutes > 90 ? 'bg-destructive/10 text-destructive' :
                  elapsedMinutes > 60 ? 'bg-amber-500/10 text-amber-400' :
                  'bg-muted/30 text-muted-foreground',
                )}>
                  {elapsedMinutes} min
                </span>
              )}
            </div>

            {/* ── RIGHT: Table Info ── */}
            <div className="flex flex-col border-l border-border/30 bg-card/20 p-3 gap-2 overflow-y-auto">
              <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">Table Info</p>

              {reservation?.guestName && (
                <div>
                  <p className="text-[10px] text-muted-foreground/50">Guest</p>
                  <p className="text-sm font-medium">{reservation.guestName}</p>
                </div>
              )}

              {reservation?.roomNumber && (
                <div>
                  <p className="text-[10px] text-muted-foreground/50">Room</p>
                  <p className="text-sm font-medium">#{reservation.roomNumber}</p>
                </div>
              )}

              {reservation?.guestCount && (
                <div>
                  <p className="text-[10px] text-muted-foreground/50">Covers</p>
                  <p className="text-sm font-medium">{reservation.guestCount}</p>
                </div>
              )}

              {/* Allergen warnings */}
              {allergyNotes.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3 text-amber-400" /> Dietary Notes
                  </p>
                  <div className="space-y-1">
                    {allergyNotes.map((note, i) => (
                      <div key={i} className="text-xs bg-amber-500/10 text-amber-300 px-2 py-1 rounded-md border border-amber-500/20">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!reservation?.guestName && !reservation?.notes && (
                <p className="text-xs text-muted-foreground/30 mt-2">No reservation details</p>
              )}
            </div>
          </div>

          {/* ─── BOTTOM SECTION: Menu Browser ─── */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Menu category tabs */}
            <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-border/20 bg-card/10">
              {([
                { key: 'food' as MenuTab, label: 'Food', icon: UtensilsCrossed },
                { key: 'drinks' as MenuTab, label: 'Drinks', icon: Wine },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMenuTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    menuTab === key
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}

              {/* Food sub-toggle: À la Carte / Daily Menu */}
              {menuTab === 'food' && (
                <div className="ml-auto flex items-center gap-0.5 bg-secondary/40 rounded-full p-0.5">
                  <button
                    onClick={() => setFoodMode('alacarte')}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all',
                      foodMode === 'alacarte'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    À la Carte
                  </button>
                  <button
                    onClick={() => setFoodMode('daily')}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1',
                      foodMode === 'daily'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <CalendarDays className="h-3 w-3" />
                    Daily
                  </button>
                </div>
              )}

              {/* Drink category sub-tabs */}
              {menuTab === 'drinks' && availableDrinkCats.length > 0 && (
                <div className="ml-auto flex items-center gap-0.5 overflow-x-auto">
                  {availableDrinkCats.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveDrinkCat(cat)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap',
                        activeDrinkCat === cat
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {menuLoading || catalogLoading || productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs">Loading menu…</p>
                  </div>
                </div>
              ) : menuTab === 'food' ? (
                foodMode === 'daily' ? (
                  <VisualMenuBoard
                    starters={menu?.starters ?? []}
                    mains={menu?.mains ?? []}
                    desserts={menu?.desserts ?? []}
                    stockMap={stockMap}
                    selection={selection}
                    onAdd={addItem}
                    onRemove={removeItem}
                    onRequestNote={(id) => setNoteTarget(id)}
                  />
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
                )
              ) : (
                /* Drinks tab */
                <ScrollArea className="h-full">
                  {availableDrinkCats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
                      <Wine className="h-10 w-10 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground/50">No drinks in stock</p>
                      <p className="text-xs text-muted-foreground/30">Add products in Inventory to see them here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 p-4">
                      {(drinksByCategory[activeDrinkCat] ?? []).map(item => {
                        const qty = selection[item.id]?.qty ?? 0;
                        return (
                          <button
                            key={item.id}
                            onClick={() => addItem(item, 'main')}
                            className={cn(
                              'relative flex flex-col items-start p-3 rounded-xl border transition-all text-left',
                              qty > 0
                                ? 'border-primary/40 bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.1)]'
                                : 'border-border/30 bg-card/30 hover:border-border/60 hover:bg-card/50',
                            )}
                          >
                            <p className="text-sm font-medium truncate w-full">{item.name}</p>
                            {item.description && (
                              <p className="text-[10px] text-muted-foreground/60 truncate w-full mt-0.5">{item.description}</p>
                            )}
                            <p className="text-xs font-bold text-primary mt-1.5">{fmt(item.price)}</p>
                            {qty > 0 && (
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeItem(item); }}
                                  className="h-5 w-5 rounded-full bg-muted/60 hover:bg-destructive/20 flex items-center justify-center"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold min-w-[16px] text-center">{qty}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); addItem(item, 'main'); }}
                                  className="h-5 w-5 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── BILL MODE ─── */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
          <BillView tableId={tableId} tableLabel={tableLabel} />
          <Button className="w-full h-12 text-base" onClick={() => setPayOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" /> Pay
          </Button>
          <PaymentSheet open={payOpen} onOpenChange={setPayOpen} tableId={tableId} tableLabel={tableLabel} />
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
