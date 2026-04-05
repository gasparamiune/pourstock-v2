import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AngryChefOverlay } from './AngryChefOverlay';

export interface KitchenOrder {
  id: string;
  hotel_id: string;
  table_label: string | null;
  plan_date: string;
  status: 'pending' | 'in_progress' | 'ready' | 'served' | 'void' | 'rejected';
  course: 'starter' | 'mellemret' | 'main' | 'dessert';
  items: { menu_item_id?: string; name: string; quantity: number; notes?: string; source?: 'daily' | 'alacarte' }[];
  notes: string | null;
  created_at: string;
}

const COURSE_LEFT_BORDER: Record<string, string> = {
  starter: 'border-l-green-500',
  mellemret: 'border-l-violet-500',
  main: 'border-l-red-500',
  dessert: 'border-l-sky-300',
};

const COURSE_ORDER = ['starter', 'mellemret', 'main', 'dessert'];
const COURSE_LABEL: Record<string, string> = {
  starter: 'FORRET',
  mellemret: 'MELLEMRET',
  main: 'HOVEDRET',
  dessert: 'DESSERT',
};

interface Props {
  order: KitchenOrder;
  onMarkReady: (id: string) => void;
  onVoid: (id: string) => void;
  onReject?: (id: string) => void;
  isNew?: boolean;
}

export function KitchenTicket({ order, onMarkReady, onVoid, onReject, isNew = false }: Props) {
  const { t } = useLanguage();
  const [showFull, setShowFull] = useState(false);
  const [allTickets, setAllTickets] = useState<KitchenOrder[]>([]);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [showChef, setShowChef] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  const timeStr = new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  const ageMinutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  const isDailyMenu = order.items.some(i => i.source === 'daily');

  const groupedItems = order.items.reduce((acc, item) => {
    const key = item.name;
    if (!acc[key]) acc[key] = { ...item, quantity: 0, notes: item.notes };
    acc[key].quantity += item.quantity;
    return acc;
  }, {} as Record<string, typeof order.items[0]>);

  const isReady = order.status === 'ready';
  const isServed = order.status === 'served';

  // Fetch ALL tickets + order lines for full order view
  useEffect(() => {
    if (!showFull || !order.table_label || !order.hotel_id) return;
    const fetchAll = async () => {
      const { data: tickets } = await supabase
        .from('kitchen_orders' as any)
        .select('*')
        .eq('hotel_id', order.hotel_id)
        .eq('table_label', order.table_label)
        .eq('plan_date', order.plan_date)
        .not('status', 'in', '("void","rejected")')
        .order('created_at', { ascending: true });
      setAllTickets((tickets as unknown as KitchenOrder[]) ?? []);

      const { data: tableOrders } = await supabase
        .from('table_orders' as any)
        .select('id')
        .eq('hotel_id', order.hotel_id)
        .eq('table_label', order.table_label)
        .eq('plan_date', order.plan_date)
        .neq('status', 'void');
      
      if (tableOrders && (tableOrders as any[]).length > 0) {
        const orderIds = (tableOrders as any[]).map((o: any) => o.id);
        const { data: lines } = await supabase
          .from('table_order_lines' as any)
          .select('*')
          .in('order_id', orderIds);
        setOrderLines((lines as any[]) ?? []);
      }
    };
    fetchAll();
  }, [showFull, order.table_label, order.hotel_id, order.plan_date]);

  // Tilt for receipt imperfection
  const ticketIdx = parseInt(order.id.slice(-2), 16) % 3;
  const tilt = ticketIdx === 0 ? 'rotate-[0.3deg]' : ticketIdx === 1 ? '-rotate-[0.2deg]' : '';

  const sep = '- - - - - - - - - - - - - - -';
  const doubleSep = '========================';

  const handleWtf = useCallback(() => {
    setPendingRejectId(order.id);
    setShowChef(true);
  }, [order.id]);

  const handleChefComplete = useCallback(() => {
    setShowChef(false);
    if (pendingRejectId && onReject) {
      onReject(pendingRejectId);
    }
    setPendingRejectId(null);
  }, [pendingRejectId, onReject]);

  return (
    <>
      <AngryChefOverlay visible={showChef} onComplete={handleChefComplete} />
      <div className={cn(
        'border-l-[4px] font-mono text-[13px] leading-snug transition-all relative',
        'bg-[#FFFEF5] text-black shadow-[2px_3px_8px_rgba(0,0,0,0.08)]',
        'rounded-sm overflow-hidden',
        COURSE_LEFT_BORDER[order.course],
        isReady && 'opacity-50',
        isServed && 'opacity-25',
        isNew && 'ring-2 ring-primary/40 animate-pulse',
        tilt,
      )}
      style={{
        clipPath: 'polygon(0% 2%, 3% 0%, 6% 1.5%, 9% 0%, 12% 2%, 15% 0%, 18% 1%, 21% 0%, 24% 2%, 27% 0.5%, 30% 1.5%, 33% 0%, 36% 2%, 39% 0%, 42% 1%, 45% 0%, 48% 2%, 51% 0%, 54% 1.5%, 57% 0%, 60% 2%, 63% 0.5%, 66% 1%, 69% 0%, 72% 2%, 75% 0%, 78% 1.5%, 81% 0%, 84% 2%, 87% 0%, 90% 1%, 93% 0%, 96% 2%, 100% 0%, 100% 98%, 97% 100%, 94% 98.5%, 91% 100%, 88% 98%, 85% 100%, 82% 99%, 79% 100%, 76% 98%, 73% 100%, 70% 99%, 67% 100%, 64% 98%, 61% 100%, 58% 99%, 55% 100%, 52% 98%, 49% 100%, 46% 99%, 43% 100%, 40% 98%, 37% 100%, 34% 99%, 31% 100%, 28% 98%, 25% 100%, 22% 99%, 19% 100%, 16% 98%, 13% 100%, 10% 99%, 7% 100%, 4% 98%, 1% 100%, 0% 98%)',
      }}
      >
        <div className="px-3 py-2.5 space-y-1">
          {/* ═══ Header ═══ */}
          <p className="text-center text-[10px] tracking-[0.3em] text-gray-400 select-none">{doubleSep}</p>
          <div className="flex items-center justify-between">
            <span className="font-black text-base tracking-wide">{order.table_label ?? 'TABLE —'}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className={cn(
                'text-xs tabular-nums font-bold',
                ageMinutes >= 15 ? 'text-red-700' : ageMinutes >= 8 ? 'text-amber-700' : 'text-gray-600',
              )}>
                {timeStr}
              </span>
              {ageMinutes >= 5 && (
                <span className={cn(
                  'text-[10px] tabular-nums',
                  ageMinutes >= 15 ? 'text-red-700 font-black' : 'text-gray-500'
                )}>
                  ({ageMinutes}m)
                </span>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] tracking-[0.3em] text-gray-400 select-none">{doubleSep}</p>

          {/* ── Course label ── */}
          <p className="text-[10px] tracking-[0.2em] text-gray-500">
            -- {COURSE_LABEL[order.course]} {sep.slice(0, 20)}
          </p>

          {/* ── Items ── */}
          <div className="space-y-0.5 pl-1">
            {isDailyMenu && !order.items.some(i => i.source === 'alacarte') ? (
              Object.values(groupedItems).map((item, i) => (
                <div key={i}>
                  <span className="font-bold">{item.quantity}× {t(`kitchen.course.label.${order.course}`)}</span>
                  {item.notes && (
                    <div className="text-[11px] text-gray-600 ml-3">↳ {item.notes}</div>
                  )}
                </div>
              ))
            ) : (
              order.items.map((item, i) => (
                <div key={i}>
                  <span className="font-bold">{item.quantity}× </span>
                  <span>{item.name}</span>
                  {item.notes && (
                    <span className="text-[11px] text-gray-600 ml-1">({item.notes})</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Notes ── */}
          {order.notes && (
            <>
              <p className="text-center text-[10px] tracking-wider text-gray-300">{sep}</p>
              <p className="text-[11px] text-gray-700 italic">⚠ {order.notes}</p>
            </>
          )}

          <p className="text-center text-[10px] tracking-[0.3em] text-gray-400 select-none">{doubleSep}</p>

          {/* ── Actions ── */}
          <div className="flex items-center gap-1 pt-0.5">
            {!isReady && !isServed && order.status !== 'void' && (
              <button
                onClick={() => onMarkReady(order.id)}
                className="flex-1 py-1 border border-black/20 rounded-sm text-[11px] font-bold tracking-wide text-center hover:bg-green-100 transition-colors"
              >
                ✓ READY
              </button>
            )}
            {isReady && (
              <div className="flex items-center gap-1 text-green-700 text-[11px] font-bold flex-1 justify-center">
                <CheckCircle2 className="h-3 w-3" /> READY
              </div>
            )}
            {/* WTF Button */}
            {!isReady && !isServed && order.status !== 'void' && onReject && (
              <button
                onClick={handleWtf}
                className="py-1 px-2 border border-red-400/40 rounded-sm text-[11px] font-black text-red-600 hover:bg-red-100 transition-colors flex items-center gap-0.5"
                title="Send ticket back to restaurant"
              >
                <AlertTriangle className="h-3 w-3" />
                WTF
              </button>
            )}
            {!isServed && order.status !== 'void' && (
              <button
                onClick={() => onVoid(order.id)}
                className="py-1 px-2 border border-black/10 rounded-sm text-[11px] text-red-600 hover:bg-red-50 transition-colors"
              >
                ✗
              </button>
            )}
            <button
              onClick={() => setShowFull(!showFull)}
              className={cn(
                'py-1 px-2 border border-black/10 rounded-sm text-[11px] hover:bg-gray-100 transition-colors',
                showFull && 'bg-gray-200',
              )}
            >
              <Eye className="h-3 w-3" />
            </button>
          </div>

          {/* ── Full Order — merged view of all courses ── */}
          {showFull && (
            <div className="text-[11px] text-gray-700 pt-1 space-y-1">
              <p className="text-center text-[10px] tracking-wider text-gray-300">{sep}</p>
              <p className="font-black text-xs text-center tracking-wider">FULL ORDER — {order.table_label}</p>
              <p className="text-center text-[10px] tracking-wider text-gray-300">{sep}</p>
              {COURSE_ORDER.map(course => {
                const linesForCourse = orderLines.filter((l: any) => l.course === course);
                const ticketsForCourse = allTickets.filter(t => t.course === course);
                const hasFired = ticketsForCourse.length > 0;
                const status = hasFired
                  ? (ticketsForCourse.every(t => t.status === 'served') ? 'served'
                    : ticketsForCourse.some(t => t.status === 'ready') ? 'ready'
                    : 'fired')
                  : null;

                const items: { name: string; qty: number; notes?: string }[] = [];
                if (linesForCourse.length > 0) {
                  for (const l of linesForCourse) {
                    items.push({ name: l.item_name, qty: l.quantity ?? 1, notes: l.special_notes });
                  }
                } else if (ticketsForCourse.length > 0) {
                  for (const ticket of ticketsForCourse) {
                    for (const item of ticket.items) {
                      items.push({ name: item.name, qty: item.quantity, notes: item.notes });
                    }
                  }
                }

                return (
                  <div key={course} className={cn(items.length === 0 && 'opacity-30')}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold tracking-wider text-[10px]">{COURSE_LABEL[course]}</span>
                      <span className={cn(
                        'text-[9px] font-bold',
                        status === 'served' ? 'text-gray-400' :
                        status === 'ready' ? 'text-green-700' :
                        status === 'fired' ? 'text-amber-600' :
                        'text-gray-300'
                      )}>
                        {status === 'served' ? '✓ SERVED' : status === 'ready' ? '● READY' : status === 'fired' ? '… FIRED' : '— PENDING'}
                      </span>
                    </div>
                    {items.length > 0 ? items.map((item, i) => (
                      <div key={i} className={cn(
                        'flex justify-between pl-1',
                        status === 'served' && 'line-through opacity-50',
                      )}>
                        <span>{item.qty}× {item.name}</span>
                        {item.notes && <span className="text-gray-500 italic text-[9px]">{item.notes}</span>}
                      </div>
                    )) : (
                      <p className="pl-1 text-gray-400 italic">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
