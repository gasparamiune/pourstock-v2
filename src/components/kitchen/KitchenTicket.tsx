import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface KitchenOrder {
  id: string;
  hotel_id: string;
  table_label: string | null;
  plan_date: string;
  status: 'pending' | 'in_progress' | 'ready' | 'served' | 'void';
  course: 'starter' | 'mellemret' | 'main' | 'dessert';
  items: { menu_item_id?: string; name: string; quantity: number; notes?: string; source?: 'daily' | 'alacarte' }[];
  notes: string | null;
  created_at: string;
}

const COURSE_BORDER: Record<string, string> = {
  starter: 'border-green-500',
  mellemret: 'border-violet-500',
  main: 'border-red-500',
  dessert: 'border-sky-300',
};

const COURSE_BADGE: Record<string, string> = {
  starter: 'bg-green-100 text-green-800 border-green-300',
  mellemret: 'bg-violet-100 text-violet-800 border-violet-300',
  main: 'bg-red-100 text-red-800 border-red-300',
  dessert: 'bg-sky-100 text-sky-800 border-sky-300',
};

interface Props {
  order: KitchenOrder;
  onMarkReady: (id: string) => void;
  onVoid: (id: string) => void;
  isNew?: boolean;
}

export function KitchenTicket({ order, onMarkReady, onVoid, isNew = false }: Props) {
  const { t } = useLanguage();
  const [showFull, setShowFull] = useState(false);

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

  return (
    <div className={cn(
      'rounded-lg border-[3px] bg-white p-3 space-y-2 transition-all shadow-sm',
      COURSE_BORDER[order.course],
      isReady && 'opacity-50 bg-gray-50',
      isServed && 'opacity-30 bg-gray-100',
      isNew && 'animate-pulse ring-2 ring-primary/40',
    )}>
      {/* Header: Table + Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-black">{order.table_label ?? 'Table —'}</span>
          <Badge className={cn('text-[10px] border capitalize', COURSE_BADGE[order.course])}>
            {t(`kitchen.course.${order.course}`)}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className={cn(
            'text-xs tabular-nums font-medium',
            ageMinutes >= 15 ? 'text-red-600' : ageMinutes >= 8 ? 'text-amber-600' : 'text-gray-500'
          )}>
            {timeStr}
          </span>
          {ageMinutes >= 5 && (
            <span className={cn(
              'text-[10px] tabular-nums ml-0.5',
              ageMinutes >= 15 ? 'text-red-600 font-bold' : 'text-gray-500'
            )}>
              ({ageMinutes}m)
            </span>
          )}
        </div>
      </div>

      {/* Order content */}
      <div className="space-y-1 text-sm text-black">
        {isDailyMenu && !order.items.some(i => i.source === 'alacarte') ? (
          <>
            {Object.values(groupedItems).map((item, i) => (
              <div key={i}>
                <span className="font-semibold">{item.quantity}× {t(`kitchen.course.label.${order.course}`)}</span>
                {item.notes && (
                  <div className="text-xs text-orange-600 ml-4">↳ ×1 {item.notes}</div>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="text-[10px] text-gray-400 tracking-widest text-center border-b border-dashed border-gray-300 pb-1 mb-1">
              ── {t('kitchen.run')} ──
            </div>
            {order.items.map((item, i) => (
              <div key={i}>
                <span className="font-medium">{item.quantity}× </span>
                <span>{item.name}</span>
                {item.notes && (
                  <span className="text-xs text-orange-600 ml-1 italic">({item.notes})</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {order.notes && (
        <p className="text-xs italic text-orange-600 border-t border-gray-200 pt-1.5">⚠ {order.notes}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1">
        {!isReady && !isServed && order.status !== 'void' && (
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onMarkReady(order.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {t('kitchen.ready')}
          </Button>
        )}
        {isReady && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium flex-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t('kitchen.readyForService')}
          </div>
        )}
        {!isServed && order.status !== 'void' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
            onClick={() => onVoid(order.id)}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => setShowFull(!showFull)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Full order detail (expandable) */}
      {showFull && (
        <div className="text-xs text-gray-600 border-t border-gray-200 pt-2 space-y-0.5">
          <p className="font-medium text-black mb-1">{t('kitchen.fullOrder')}</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.quantity}× {item.name}</span>
              {item.notes && <span className="text-orange-600 italic">{item.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
