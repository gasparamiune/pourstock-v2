import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Users, Clock, ChefHat, AlertTriangle, UtensilsCrossed, Wine, CalendarDays, Minus, Plus, ListChecks, SplitSquareHorizontal, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { type Reservation } from '@/components/tableplan/TableCard';
import { SplitBillDialog } from '@/components/restaurant/SplitBillDialog';
import { useTableOrders as useTableOrdersForBill } from '@/hooks/useTableOrders';
import { useOrderPayments } from '@/hooks/usePayments';

type CourseKey = 'starter' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

const COURSE_LABELS_KEY: Record<CourseKey, string> = {
  starter: 'occ.starters',
  main: 'occ.mains',
  dessert: 'occ.desserts',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

type MenuTab = 'food' | 'drinks';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: string;
  tableLabel: string;
  reservation?: Reservation;
}

export function OrderCommandCenter({ open, onOpenChange, tableId, tableLabel, reservation }: Props) {
  const { t } = useLanguage();
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
  const [customRunOpen, setCustomRunOpen] = useState(false);
  const [customRunSelection, setCustomRunSelection] = useState<Set<string>>(new Set());

  const existingOrder = orders.find(o => o.table_id === tableId && o.status !== 'void');
  const existingLines = existingOrder?.lines ?? [];
  const hasExistingOrder = !!existingOrder;

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

  // Determine which courses have pending items
  const pendingCourses = useMemo(() => {
    const courses = new Set<CourseKey>();
    pendingLines.forEach(l => courses.add(l.course as CourseKey));
    return courses;
  }, [pendingLines]);

  // Determine which course type to run (first pending course)
  const nextCourseToRun = useMemo<CourseKey | null>(() => {
    const order: CourseKey[] = ['starter', 'main', 'dessert'];
    for (const c of order) {
      if (pendingCourses.has(c)) return c;
    }
    return null;
  }, [pendingCourses]);

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

  async function handleSubmit(linesToSubmit?: Omit<OrderLine, 'id' | 'status'>[]) {
    const lines = linesToSubmit ?? pendingLines;
    if (lines.length === 0) {
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
      await submitOrder.mutateAsync({ orderId, lines: lines as OrderLine[] });
      // Remove submitted items from selection
      if (linesToSubmit) {
        const submittedIds = new Set(linesToSubmit.map(l => l.item_id));
        setSelection(prev => {
          const next = { ...prev };
          submittedIds.forEach(id => delete next[id]);
          return next;
        });
      } else {
        setSelection({});
      }
      setCustomRunOpen(false);
      setCustomRunSelection(new Set());
    } catch {
      // Error toast handled by mutation
    } finally {
      setSubmitting(false);
    }
  }

  function handleCustomRun() {
    const lines = pendingLines.filter(l => customRunSelection.has(l.item_id));
    handleSubmit(lines);
  }

  // Bill data for right panel
  const billOrders = useTableOrdersForBill();
  const billTableOrder = (billOrders.data ?? []).find(o => o.table_id === tableId && o.status !== 'void');
  const { data: billPayments = [] } = useOrderPayments(billTableOrder?.id ?? '');
  const [splitOpen, setSplitOpen] = useState(false);

  const billTotal = (billTableOrder?.lines ?? []).reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const billPaid = billPayments.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const billRemaining = Math.max(0, billTotal - billPaid);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    }
  }, [open]);

  if (!open) return null;

  const allergyNotes = reservation?.notes?.split(',').map(n => n.trim()).filter(Boolean) ?? [];

  // Elapsed time since arrival
  const arrivedAt = reservation?.arrivedAt ? new Date(reservation.arrivedAt) : null;
  const elapsedMin = arrivedAt ? Math.floor((Date.now() - arrivedAt.getTime()) / 60000) : null;
  const elapsedStr = elapsedMin != null ? `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m` : null;
  const arrivalTimeStr = arrivedAt ? arrivedAt.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : null;

  const panelClass = 'bg-card/60 backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 command-center-enter flex flex-col overflow-hidden" onWheel={e => e.stopPropagation()}>
      {/* ─── Floating close button (top-left, below card area) ─── */}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-3 left-3 z-10 h-8 w-8 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* ─── Floating mode toggle (top-right) ─── */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center bg-white/[0.04] backdrop-blur-sm rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setMode('order')}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
              mode === 'order'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('occ.order')}
          </button>
          {hasExistingOrder && (
            <button
              onClick={() => setMode('bill')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                mode === 'bill'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CreditCard className="h-3 w-3" />
              {t('occ.bill')}
            </button>
          )}
        </div>
      </div>

      {mode === 'order' ? (
        <div className="flex-1 flex flex-col items-center justify-start pt-5 pb-3 px-3 min-h-0 gap-3 overflow-hidden">
          {/* ─── Upper row: Order Ticket | Table Card | Table Info ─── */}
          <div className="flex items-stretch gap-3 w-full max-w-4xl" style={{ maxHeight: '40%', minHeight: 180 }}>
            
            {/* ── LEFT: Order Ticket ── */}
            <div className={cn(panelClass, 'flex-1 flex flex-col min-w-0 animate-[fadeSlideUp_0.35s_ease-out_0.05s_both]')}>
              <div className="px-4 pt-4 pb-2">
                <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">{t('occ.currentOrder')}</p>
              </div>
              <ScrollArea className="flex-1 px-4 min-h-0">
                <div className="space-y-1 pb-2">
                  {existingLines.length > 0 && (
                    <>
                      {(['starter', 'main', 'dessert'] as const).map(course => {
                        const lines = existingByCourse[course];
                        if (!lines?.length) return null;
                        return (
                          <div key={course}>
                            <p className="font-mono text-[8px] tracking-widest text-emerald-500/60 uppercase mt-1">{t(COURSE_LABELS_KEY[course])}</p>
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

                  {pendingLines.length > 0 && (
                    <>
                      <p className="font-mono text-[8px] tracking-widest text-primary/60 uppercase">{t('occ.new')}</p>
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
                      <p className="text-[10px] text-muted-foreground/40">{t('occ.tapToAdd')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Total + Run buttons */}
              <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-white/[0.06] space-y-2">
                {grandTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('occ.total')}</span>
                    <span className="font-bold tabular-nums">{fmt(grandTotal)}</span>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className={cn(
                      'flex-1 h-9 text-xs font-semibold',
                      pendingLines.length > 0 && 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
                    )}
                    disabled={pendingLines.length === 0 || submitting}
                    onClick={() => handleSubmit()}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        {t('occ.sending')}
                      </span>
                    ) : (
                      <>
                        <ChefHat className="h-3.5 w-3.5 mr-1" />
                        {t('occ.runDish')} {nextCourseToRun ? t(COURSE_LABELS_KEY[nextCourseToRun]) : ''}
                        {pendingCount > 0 ? ` (${pendingCount})` : ''}
                      </>
                    )}
                  </Button>
                  {pendingLines.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-2.5 text-xs border-white/[0.08]"
                      onClick={() => { setCustomRunOpen(!customRunOpen); setCustomRunSelection(new Set()); }}
                      title="Custom run — select specific items"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Custom run panel */}
                {customRunOpen && pendingLines.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                    <p className="font-mono text-[8px] tracking-widest text-muted-foreground/50 uppercase">{t('occ.selectToRun')}</p>
                    {pendingLines.map(line => (
                      <label key={line.item_id} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={customRunSelection.has(line.item_id)}
                          onChange={() => {
                            setCustomRunSelection(prev => {
                              const next = new Set(prev);
                              if (next.has(line.item_id)) next.delete(line.item_id);
                              else next.add(line.item_id);
                              return next;
                            });
                          }}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
                        />
                        <span className="truncate">{line.quantity}× {line.item_name}</span>
                      </label>
                    ))}
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      disabled={customRunSelection.size === 0 || submitting}
                      onClick={handleCustomRun}
                    >
                      <ChefHat className="h-3 w-3 mr-1" />
                      {t('occ.customRun')} ({customRunSelection.size})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER: Custom Table Card ── */}
            <div className="w-48 shrink-0 flex flex-col items-center justify-center gap-3 animate-[fadeSlideUp_0.3s_ease-out_both]">
              {/* Card */}
              <div className="w-40 rounded-2xl border-2 border-amber-500/40 bg-card/80 backdrop-blur-xl p-4 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <span className="text-3xl font-black tracking-tight">{tableLabel}</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{reservation?.guestCount ?? '–'}</span>
                </div>
                {reservation?.guestName && (
                  <p className="text-xs font-medium text-foreground truncate max-w-full">{reservation.guestName}</p>
                )}
                {reservation?.roomNumber && (
                  <p className="text-[10px] text-muted-foreground">{t('occ.room')} {reservation.roomNumber}</p>
                )}
                {arrivedAt && (
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t('occ.arrived')} {arrivalTimeStr}
                    {elapsedStr && <span className="text-muted-foreground/60 ml-1">({elapsedStr})</span>}
                  </div>
                )}
                {(reservation as any)?.courseType && (
                  <span className="text-[9px] uppercase tracking-widest text-primary/70 font-semibold">{(reservation as any).courseType}</span>
                )}
              </div>

              {/* Allergy notes below center card */}
              {allergyNotes.length > 0 && (
                <div className="w-full space-y-1">
                  {allergyNotes.map((note, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Bill Panel ── */}
            <div className={cn(panelClass, 'flex-[1.2] flex flex-col min-w-0 animate-[fadeSlideUp_0.35s_ease-out_0.1s_both]')}>
              <div className="px-4 pt-4 pb-2">
                <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">{t('occ.bill')}</p>
              </div>
              <ScrollArea className="flex-1 px-4 min-h-0">
                <BillView tableId={tableId} tableLabel={tableLabel} />
              </ScrollArea>
              <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-white/[0.06] space-y-1.5">
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => setPayOpen(true)}
                  disabled={billRemaining <= 0}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {t('occ.charge')} {billRemaining > 0 ? fmt(billRemaining) : ''}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs border-white/[0.08]"
                  onClick={() => setSplitOpen(true)}
                  disabled={billRemaining <= 0}
                >
                  <SplitSquareHorizontal className="h-3 w-3 mr-1" />
                  {t('occ.splitBill')}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Bottom: Menu Browser ─── */}
          <div className={cn(panelClass, 'w-full max-w-4xl flex-1 min-h-0 flex flex-col animate-[fadeSlideUp_0.4s_ease-out_0.15s_both]')}>
            {/* Menu category tabs — centered */}
            <div className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-2 border-b border-white/[0.06]">
              {([
                { key: 'food' as MenuTab, labelKey: 'occ.food', icon: UtensilsCrossed },
                { key: 'drinks' as MenuTab, labelKey: 'occ.drinks', icon: Wine },
              ]).map(({ key, labelKey, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMenuTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                    menuTab === key
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {/* Sub-tabs — centered */}
            {menuTab === 'food' && (
              <div className="flex-shrink-0 flex items-center justify-center py-1.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-full p-0.5">
                  <button
                    onClick={() => setFoodMode('alacarte')}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-medium transition-all',
                      foodMode === 'alacarte'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t('occ.alaCarte')}
                  </button>
                  <button
                    onClick={() => setFoodMode('daily')}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1',
                      foodMode === 'daily'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <CalendarDays className="h-3 w-3" />
                    {t('occ.daily')}
                  </button>
                </div>
              </div>
            )}

            {menuTab === 'drinks' && availableDrinkCats.length > 0 && (
              <div className="flex-shrink-0 flex items-center justify-center gap-0.5 py-1.5 border-b border-white/[0.04] overflow-x-auto px-4">
                {availableDrinkCats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveDrinkCat(cat)}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap',
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

            {/* Menu content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {menuLoading || catalogLoading || productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs">{t('occ.loadingMenu')}</p>
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
                <ScrollArea className="h-full">
                  {availableDrinkCats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
                      <Wine className="h-10 w-10 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground/50">{t('occ.noDrinks')}</p>
                      <p className="text-xs text-muted-foreground/30">{t('occ.addDrinksHint')}</p>
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
                                : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05]',
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
                                  className="h-5 w-5 rounded-full bg-white/[0.06] hover:bg-destructive/20 flex items-center justify-center"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pt-16">
          <BillView tableId={tableId} tableLabel={tableLabel} />
          <Button className="w-full h-12 text-base" onClick={() => setPayOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" /> {t('occ.pay')}
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

      {/* Split bill dialog */}
      <SplitBillDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        totalAmount={billRemaining}
        onConfirm={(splits) => {
          setSplitOpen(false);
          setPayOpen(true);
        }}
      />
    </div>,
    document.body,
  );
}
