import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Users, Clock, ChefHat, AlertTriangle, UtensilsCrossed, Wine, CalendarDays, Minus, Plus, ListChecks, SplitSquareHorizontal, DoorOpen, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDailyMenu, DailyMenuItem } from '@/hooks/useDailyMenu';
import { supabase } from '@/integrations/supabase/client';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useProducts } from '@/hooks/useInventoryData';
import { toast } from 'sonner';
import { BillView } from '@/components/restaurant/BillView';
import { PaymentSheet } from '@/components/restaurant/PaymentSheet';
import { VisualMenuBoard } from './VisualMenuBoard';
import { NoteDialog } from './NoteDialog';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { CookingPreferenceDialog } from './CookingPreferenceDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Reservation } from '@/components/tableplan/TableCard';
import { SplitBillDialog } from '@/components/restaurant/SplitBillDialog';
import { useTableOrders as useTableOrdersForBill } from '@/hooks/useTableOrders';
import { useOrderPayments } from '@/hooks/usePayments';

type CourseKey = 'starter' | 'mellemret' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string; source: 'daily' | 'alacarte' }>;

const COURSE_LABELS: Record<CourseKey, string> = {
  starter: 'Starters',
  mellemret: 'Mellemret',
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
  reservation?: Reservation;
}

export function OrderCommandCenter({ open, onOpenChange, tableId, tableLabel, reservation }: Props) {
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const queryClient = useQueryClient();
  const prefillRanRef = useRef(false);
  const { data: menu, isLoading: menuLoading } = useDailyMenu();
  const { data: orders = [] } = useTableOrders();
  const { openOrder, submitOrder, deleteLine } = useTableOrderMutations();
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
  const [cookingPrompt, setCookingPrompt] = useState<{ item: DailyMenuItem; course: CourseKey } | null>(null);

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
  const permanentMellemret = catalogItems.filter(i => i.is_active && i.course === 'mellemret').map(toDailyItem);
  const permanentMains    = catalogItems.filter(i => i.is_active && i.course === 'main').map(toDailyItem);
  const permanentDesserts = catalogItems.filter(i => i.is_active && i.course === 'dessert').map(toDailyItem);

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
      source: s.source,
    })),
    [selection],
  );

  const existingByCourse = useMemo(() => {
    const grouped: Record<CourseKey, typeof existingLines> = { starter: [], mellemret: [], main: [], dessert: [] };
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

  const pendingCourses = useMemo(() => {
    const courses = new Set<CourseKey>();
    pendingLines.forEach(l => courses.add(l.course as CourseKey));
    return courses;
  }, [pendingLines]);

  const nextCourseToRun = useMemo<CourseKey | null>(() => {
    const order: CourseKey[] = ['starter', 'mellemret', 'main', 'dessert'];
    for (const c of order) {
      if (pendingCourses.has(c)) return c;
    }
    return null;
  }, [pendingCourses]);

  const STEAK_KEYWORDS = /steak|bøf|entrecôte|entrecote|oksemørbrad|oksemorbrad|flanksteak/i;

  function addItem(item: DailyMenuItem, course: CourseKey) {
    if (STEAK_KEYWORDS.test(item.name)) {
      setCookingPrompt({ item, course });
      return;
    }
    doAddItem(item, course, '');
  }

  function doAddItem(item: DailyMenuItem, course: CourseKey, cookingNote: string) {
    const itemSource = foodMode === 'daily' ? 'daily' : 'alacarte' as const;
    setSelection(prev => {
      const existingNotes = prev[item.id]?.notes ?? '';
      const combinedNotes = cookingNote
        ? (existingNotes ? `${existingNotes}, ${cookingNote}` : cookingNote)
        : existingNotes;
      const current = prev[item.id]?.qty ?? 0;
      return {
        ...prev,
        [item.id]: { item, course, qty: current + 1, notes: combinedNotes, source: prev[item.id]?.source ?? itemSource },
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

  async function handleSubmit(linesToSubmit?: Omit<OrderLine, 'id' | 'status'>[], fireCourses?: CourseKey[]) {
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
      await submitOrder.mutateAsync({ orderId, lines: lines as OrderLine[], fireCourses });
      if (fireCourses) {
        const firedSet = new Set(fireCourses as string[]);
        setSelection(prev => {
          const next = { ...prev };
          for (const [id, entry] of Object.entries(next)) {
            if (firedSet.has(entry.course)) delete next[id];
          }
          return next;
        });
      } else if (linesToSubmit) {
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
    // Derive unique courses from selected items to pass as fireCourses
    const courses = [...new Set(lines.map(l => l.course))] as CourseKey[];
    handleSubmit(lines, courses);
  }

  // Delete an existing (saved) line from DB
  async function handleDeleteExistingLine(line: any) {
    if (!line.id) return;
    await deleteLine.mutateAsync({ lineId: line.id, itemId: line.item_id, quantity: line.quantity ?? 1 });
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

  // Track which courses have been fired to kitchen + last fired info
  const [firedCourses, setFiredCourses] = useState<Set<string>>(new Set());
  const [lastFiredAt, setLastFiredAt] = useState<Date | null>(null);
  const [lastFiredCourse, setLastFiredCourse] = useState<string | null>(null);
  const [elapsedSinceRun, setElapsedSinceRun] = useState<number | null>(null);

  // Auto-prefill food from reservation's daily menu when opening (self-heal)
  useEffect(() => {
    if (!open || !tableId || !reservation) return;
    const type = (reservation as any)?.reservationType;
    if (type !== '2-ret' && type !== '3-ret' && type !== '4-ret') return;
    
    const prefill = async () => {
      const today = new Date().toISOString().split('T')[0];
      // Check if order already has lines
      const { data: existingOrders } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', activeHotelId)
        .eq('table_id', tableId)
        .eq('plan_date', today)
        .neq('status', 'void');
      
      if (existingOrders && (existingOrders as any[]).length > 0) {
        const oid = (existingOrders as any[])[0].id;
        const { data: lines } = await supabase
          .from('table_order_lines' as any)
          .select('id')
          .eq('order_id', oid)
          .limit(1);
        if (lines && (lines as any[]).length > 0) return; // Already has lines
      }

      // Fetch daily menu
      const hotelId = activeHotelId;
      if (!hotelId) return;
      const { data: menuData } = await supabase
        .from('daily_menus')
        .select('starters, mellemret, mains, desserts')
        .eq('hotel_id', hotelId)
        .eq('menu_date', today)
        .maybeSingle();
      if (!menuData) return;

      const starters = Array.isArray((menuData as any).starters) ? (menuData as any).starters : [];
      const mellemret = Array.isArray((menuData as any).mellemret) ? (menuData as any).mellemret : [];
      const mains = Array.isArray((menuData as any).mains) ? (menuData as any).mains : [];
      const desserts = Array.isArray((menuData as any).desserts) ? (menuData as any).desserts : [];

      let coursesToInsert: { course: string; items: any[] }[] = [];
      if (type === '4-ret') {
        coursesToInsert = [
          { course: 'starter', items: starters },
          { course: 'mellemret', items: mellemret },
          { course: 'main', items: mains },
          { course: 'dessert', items: desserts },
        ];
      } else if (type === '3-ret') {
        coursesToInsert = [
          { course: 'starter', items: starters },
          { course: 'main', items: mains },
          { course: 'dessert', items: desserts },
        ];
      } else if (type === '2-ret') {
        coursesToInsert = [
          { course: 'starter', items: starters },
          { course: 'main', items: mains },
        ];
      }

      // Create order if needed
      let orderId: string;
      if (existingOrders && (existingOrders as any[]).length > 0) {
        orderId = (existingOrders as any[])[0].id;
      } else {
        const result = await openOrder.mutateAsync({ tableId, tableLabel });
        orderId = result.id;
      }

      const guestCount = reservation?.guestCount || 1;
      const lines: any[] = [];
      for (const { course, items } of coursesToInsert) {
        if (items.length === 0) continue;
        const item = items[0];
        lines.push({
          order_id: orderId,
          hotel_id: hotelId,
          course,
          item_id: item.id || `daily-${course}`,
          item_name: item.name,
          quantity: guestCount,
          unit_price: item.price ?? 0,
          source: 'daily',
        });
      }

      if (lines.length > 0) {
        await supabase.from('table_order_lines' as any).insert(lines);
      }
    };
    prefill();
  }, [open, tableId]);

  // Reload unfired courses from existing order lines when command center opens
  useEffect(() => {
    if (!open || !existingOrder) return;
    
    // Small delay to let prefill finish if it ran
    const timer = setTimeout(async () => {
      if (Object.keys(selection).length > 0) return;
      
      const today = new Date().toISOString().split('T')[0];
      const tLabel = existingOrder.table_label;
      
      const { data: tickets } = await supabase
        .from('kitchen_orders' as any)
        .select('course, created_at')
        .eq('hotel_id', existingOrder.hotel_id)
        .eq('table_label', tLabel)
        .eq('plan_date', today)
        .neq('status', 'void')
        .order('created_at', { ascending: false });
      
      const ticketList = (tickets as any[] ?? []);
      const fired = new Set(ticketList.map((t: any) => t.course));
      setFiredCourses(fired);

      if (ticketList.length > 0) {
        setLastFiredAt(new Date(ticketList[0].created_at));
        setLastFiredCourse(ticketList[0].course);
      }
      
      const unfiredLines = existingLines.filter(l => !fired.has(l.course));
      if (unfiredLines.length === 0) return;
      
      const newSelection: SelectionMap = {};
      for (const line of unfiredLines) {
        newSelection[line.item_id] = {
          item: {
            id: line.item_id,
            name: line.item_name,
            description: '',
            allergens: '',
            price: line.unit_price ?? 0,
            available_units: null,
          },
          course: line.course as CourseKey,
          qty: line.quantity ?? 1,
          notes: line.special_notes ?? '',
          source: (line as any).source ?? 'alacarte',
        };
      }
      setSelection(newSelection);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [open, existingOrder?.id]);

  // Update elapsed timer every 30s
  useEffect(() => {
    if (!lastFiredAt) { setElapsedSinceRun(null); return; }
    const update = () => setElapsedSinceRun(Math.floor((Date.now() - lastFiredAt.getTime()) / 60000));
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [lastFiredAt]);

  // Course color map for unified display
  const COURSE_COLORS: Record<CourseKey, { border: string; bg: string; text: string }> = {
    starter:   { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500' },
    mellemret: { border: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-500' },
    main:      { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500' },
    dessert:   { border: 'border-sky-400', bg: 'bg-sky-400/10', text: 'text-sky-400' },
  };

  // Build unified lines grouped by course (merge existing + pending, deduplicated)
  const unifiedByCourse = useMemo(() => {
    const result: Record<CourseKey, { id?: string; item_id: string; item_name: string; quantity: number; unit_price: number; notes?: string; isFired: boolean; isPending: boolean; isExisting: boolean }[]> = {
      starter: [], mellemret: [], main: [], dessert: [],
    };
    const pendingById = new Map(pendingLines.map(l => [l.item_id, l]));
    const seenIds = new Set<string>();

    // Add existing lines (ALL, not just unfired — show FULL order)
    for (const line of existingLines) {
      const c = line.course as CourseKey;
      const isFired = firedCourses.has(c);
      const pendingVersion = pendingById.get(line.item_id);
      seenIds.add(line.item_id);
      result[c].push({
        id: (line as any).id,
        item_id: line.item_id,
        item_name: pendingVersion?.item_name ?? line.item_name,
        quantity: pendingVersion?.quantity ?? line.quantity ?? 1,
        unit_price: pendingVersion?.unit_price ?? line.unit_price ?? 0,
        notes: pendingVersion?.special_notes ?? line.special_notes,
        isFired,
        isPending: !!pendingVersion,
        isExisting: true,
      });
    }

    // Add pending-only lines (not in existing)
    for (const line of pendingLines) {
      if (seenIds.has(line.item_id)) continue;
      const c = line.course as CourseKey;
      result[c].push({
        item_id: line.item_id,
        item_name: line.item_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        notes: line.special_notes,
        isFired: false,
        isPending: true,
        isExisting: false,
      });
    }

    return result;
  }, [existingLines, pendingLines, firedCourses]);

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
      {/* ─── Floating close button (top-left) ─── */}
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
            Order
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
              Bill
            </button>
          )}
        </div>
      </div>

      {mode === 'order' ? (
        <div className="flex-1 flex flex-col items-center justify-start pt-5 pb-3 px-3 min-h-0 gap-3 overflow-hidden">
          {/* ─── Upper row: Order Ticket | Table Card | Table Info ─── */}
          <div className="flex items-stretch gap-3 w-full max-w-7xl" style={{ maxHeight: '42%', minHeight: 150 }}>
            
            {/* ── LEFT: Order Ticket (bigger) ── */}
            <div className={cn(panelClass, 'flex-[1.5] flex flex-col min-w-0 animate-[fadeSlideUp_0.35s_ease-out_0.05s_both] border-l-2 border-l-primary/30')}>
              <div className="px-4 pt-3 pb-1.5">
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">Full Order</p>
              </div>
              <ScrollArea className="flex-1 px-4 min-h-0">
                <div className="space-y-2 pb-2">
                  {(['starter', 'mellemret', 'main', 'dessert'] as const).map(course => {
                    const lines = unifiedByCourse[course];
                    if (!lines?.length) return null;
                    const isFired = firedCourses.has(course);
                    const isLastFired = lastFiredCourse === course;
                    const colors = COURSE_COLORS[course];
                    return (
                      <div key={course} className={cn(
                        'rounded-lg px-2.5 py-1.5 transition-all',
                        isFired ? 'opacity-60' : '',
                        isLastFired && isFired ? 'border-l-2 ' + colors.border : '',
                      )}>
                        <div className="flex items-center gap-1.5">
                          {isFired ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : isLastFired ? (
                            <ArrowRight className={cn('h-3.5 w-3.5 shrink-0 animate-pulse', colors.text)} />
                          ) : null}
                          <p className={cn(
                            'font-mono text-[10px] tracking-widest uppercase font-semibold',
                            colors.text,
                          )}>
                            {COURSE_LABELS[course]}
                          </p>
                          {isFired && (
                            <span className="text-[8px] text-green-500/70 font-medium ml-auto uppercase">Sent</span>
                          )}
                        </div>
                        {lines.map((line, i) => (
                          <div key={line.item_id ?? i} className={cn(
                            'group flex justify-between py-0.5 text-sm',
                            isFired ? 'text-muted-foreground/50' : '',
                          )}>
                            <span className="truncate">
                              <span className={cn('font-bold', line.isPending && !isFired ? 'text-primary' : '')}>{line.quantity}×</span>{' '}
                              {line.item_name}
                              {line.notes && <span className="text-[10px] text-amber-400 ml-1 italic">({line.notes})</span>}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="tabular-nums text-muted-foreground text-xs">{fmt(line.unit_price * line.quantity)}</span>
                              {/* Delete button for unfired items */}
                              {!isFired && (
                                line.isExisting && line.id ? (
                                  <button
                                    onClick={() => handleDeleteExistingLine(line)}
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from order"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : line.isPending ? (
                                  <button onClick={() => removeLineById(line.item_id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                ) : null
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {existingLines.length === 0 && pendingLines.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <ChefHat className="h-6 w-6 text-muted-foreground/15 mb-1" />
                      <p className="text-[10px] text-muted-foreground/40">Tap items below to add</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Total + Run buttons */}
              <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-white/[0.06] space-y-2">
                {/* Last run timer */}
                {lastFiredCourse && elapsedSinceRun != null && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    <span>{COURSE_LABELS[lastFiredCourse as CourseKey]} sent {elapsedSinceRun === 0 ? 'just now' : `${elapsedSinceRun} min ago`}</span>
                  </div>
                )}
                {grandTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold tabular-nums">{fmt(grandTotal)}</span>
                  </div>
                )}
                <div className="flex gap-1.5">
                  {/* Hide main run button when custom run panel is open */}
                  {!customRunOpen && (
                    <Button
                      size="sm"
                      className={cn(
                        'flex-1 h-9 text-xs font-semibold',
                        pendingLines.length > 0 && 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
                      )}
                      disabled={pendingLines.length === 0 || submitting}
                      onClick={() => {
                        if (nextCourseToRun) {
                          handleSubmit(pendingLines, [nextCourseToRun]);
                        }
                      }}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        <>
                          <ChefHat className="h-3.5 w-3.5 mr-1" />
                          Run {nextCourseToRun ? COURSE_LABELS[nextCourseToRun] : 'Dish'}
                          {nextCourseToRun ? ` (${pendingLines.filter(l => l.course === nextCourseToRun).reduce((s, l) => s + l.quantity, 0)})` : ''}
                        </>
                      )}
                    </Button>
                  )}
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
                    <p className="font-mono text-[8px] tracking-widest text-muted-foreground/50 uppercase">Select items to run</p>
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
                      Custom Run ({customRunSelection.size})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER: Custom Table Card ── */}
            <div className="w-48 shrink-0 flex flex-col items-center justify-center gap-3 animate-[fadeSlideUp_0.3s_ease-out_both]">
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
                  <p className="text-[10px] text-muted-foreground">Room {reservation.roomNumber}</p>
                )}
                {arrivedAt && (
                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Arrived {arrivalTimeStr}
                    {elapsedStr && <span className="text-muted-foreground/60 ml-1">({elapsedStr})</span>}
                  </div>
                )}
                {(reservation as any)?.courseType && (
                  <span className="text-[9px] uppercase tracking-widest text-primary/70 font-semibold">{(reservation as any).courseType}</span>
                )}
              </div>

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
                <p className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">Bill</p>
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
                  Charge {billRemaining > 0 ? fmt(billRemaining) : ''}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs border-white/[0.08]"
                  onClick={() => setSplitOpen(true)}
                  disabled={billRemaining <= 0}
                >
                  <SplitSquareHorizontal className="h-3 w-3 mr-1" />
                  Split Bill
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Bottom: Menu Browser ─── */}
          <div className={cn(panelClass, 'w-full max-w-7xl flex-1 min-h-0 flex flex-col animate-[fadeSlideUp_0.4s_ease-out_0.15s_both]')}>
            {/* Menu category tabs */}
            <div className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-2 border-b border-white/[0.06]">
              {([
                { key: 'food' as MenuTab, label: 'Food', icon: UtensilsCrossed },
                { key: 'drinks' as MenuTab, label: 'Drinks', icon: Wine },
              ]).map(({ key, label, icon: Icon }) => (
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
                  {label}
                </button>
              ))}
            </div>

            {/* Sub-tabs */}
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
                    À la Carte
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
                    Daily
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
                    <p className="text-xs">Loading menu…</p>
                  </div>
                </div>
              ) : menuTab === 'food' ? (
                foodMode === 'daily' ? (
                  <div className="flex flex-col h-full min-h-0">
                    {/* Fast ordering shortcuts */}
                    {menu && (
                      <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-b border-white/[0.04]">
                        {[
                          { key: 'order.4ret', courses: ['starter', 'mellemret', 'main', 'dessert'] as CourseKey[] },
                          { key: 'order.3ret', courses: ['starter', 'main', 'dessert'] as CourseKey[] },
                          { key: 'order.2retFH', courses: ['starter', 'main'] as CourseKey[] },
                          { key: 'order.2retHD', courses: ['main', 'dessert'] as CourseKey[] },
                        ].map(({ key, courses }) => (
                          <Button
                            key={key}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-primary/20 hover:bg-primary/10"
                            onClick={() => {
                              const courseToArray: Record<CourseKey, DailyMenuItem[]> = {
                                starter: menu.starters ?? [],
                                mellemret: menu.mellemret ?? [],
                                main: menu.mains ?? [],
                                dessert: menu.desserts ?? [],
                              };
                              for (const c of courses) {
                                const items = courseToArray[c];
                                if (items.length > 0) {
                                  doAddItem(items[0], c, '');
                                }
                              }
                            }}
                          >
                            {t(key)}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <VisualMenuBoard
                        starters={menu?.starters ?? []}
                        mellemret={menu?.mellemret ?? []}
                        mains={menu?.mains ?? []}
                        desserts={menu?.desserts ?? []}
                        stockMap={stockMap}
                        selection={selection}
                        onAdd={addItem}
                        onRemove={removeItem}
                        onRequestNote={(id) => setNoteTarget(id)}
                      />
                    </div>
                  </div>
                ) : (
                  <VisualMenuBoard
                    starters={permanentStarters}
                    mellemret={permanentMellemret}
                    mains={permanentMains}
                    desserts={permanentDesserts}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full pt-16">
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

      <CookingPreferenceDialog
        open={!!cookingPrompt}
        itemName={cookingPrompt?.item.name ?? ''}
        onConfirm={(pref) => {
          if (cookingPrompt) {
            doAddItem(cookingPrompt.item, cookingPrompt.course, pref);
          }
          setCookingPrompt(null);
        }}
        onCancel={() => setCookingPrompt(null)}
      />
    </div>,
    document.body,
  );
}
