import { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyMenuItem } from '@/hooks/useDailyMenu';

interface Props {
  item: DailyMenuItem;
  course: 'starter' | 'mellemret' | 'main' | 'dessert';
  quantity: number;
  available: number | null;
  note?: string;
  onAdd: () => void;
  onRemove: () => void;
  onRequestNote: () => void;
}

function StockDot({ available }: { available: number | null }) {
  if (available === null) return null;
  const color =
    available === 0 ? 'bg-red-500' :
    available === 1 ? 'bg-orange-500' :
    available <= 5 ? 'bg-amber-500' :
    'bg-green-500';
  return (
    <span className="flex items-center gap-1">
      <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', color)} />
      <span className="text-xs text-muted-foreground tabular-nums">{available}</span>
    </span>
  );
}

export function MenuItemCard({ item, course, quantity, available, note, onAdd, onRemove, onRequestNote }: Props) {
  const soldOut = available !== null && available <= 0;
  const prevQty = useRef(quantity);
  const [popClass, setPopClass] = useState('');
  const [badgeClass, setBadgeClass] = useState('');

  useEffect(() => {
    if (prevQty.current === 0 && quantity > 0) {
      setPopClass('card-pop');
      setBadgeClass('badge-pop');
      const t = setTimeout(() => { setPopClass(''); setBadgeClass(''); }, 250);
      return () => clearTimeout(t);
    }
    prevQty.current = quantity;
  }, [quantity]);

  function handleCardClick(e: React.MouseEvent) {
    if (soldOut) return;
    if ((e.target as HTMLElement).closest('[data-note-btn]')) return;
    if ((e.target as HTMLElement).closest('[data-qty-badge]')) return;
    onAdd();
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative rounded-2xl p-4 transition-all duration-200 select-none',
        'bg-card/60 border',
        soldOut
          ? 'opacity-50 pointer-events-none border-white/5'
          : quantity > 0
            ? 'border-primary/60 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)] cursor-pointer'
            : 'border-white/5 hover:border-white/15 hover:bg-card/80 cursor-pointer',
        popClass,
      )}
    >
      {/* Quantity badge */}
      {quantity > 0 && (
        <button
          data-qty-badge
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={cn(
            'absolute -top-2 -right-2 min-w-[26px] h-[26px] rounded-full',
            'bg-primary text-primary-foreground text-xs font-bold',
            'flex items-center justify-center px-1.5',
            'shadow-lg ring-2 ring-background transition-transform duration-150 hover:scale-110',
            badgeClass,
          )}
          aria-label={`Remove one ${item.name}`}
        >
          {quantity}
        </button>
      )}

      {/* Note icon */}
      {quantity > 0 && (
        <button
          data-note-btn
          onClick={(e) => { e.stopPropagation(); onRequestNote(); }}
          className={cn(
            'absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center',
            'transition-colors duration-150',
            note
              ? 'text-primary bg-primary/15 hover:bg-primary/25'
              : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5',
          )}
          aria-label={`Add note to ${item.name}`}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      )}

      {/* Content */}
      <div className="flex flex-col gap-1 pr-1">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-primary font-bold text-sm tabular-nums">
            {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(item.price)}
          </span>
          <StockDot available={available} />
        </div>
        {item.allergens && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.allergens.split(',').map((a, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-muted-foreground bg-white/5"
              >
                {a.trim()}
              </span>
            ))}
          </div>
        )}
        {note && (
          <p className="text-xs text-primary/70 mt-1 italic truncate">"{note}"</p>
        )}
      </div>
    </div>
  );
}
