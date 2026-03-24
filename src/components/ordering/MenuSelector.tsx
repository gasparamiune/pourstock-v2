import { useState } from 'react';
import { DailyMenuItem } from '@/hooks/useDailyMenu';
import { OrderLine } from '@/hooks/useTableOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';

interface CourseItemProps {
  item: DailyMenuItem;
  course: 'starter' | 'main' | 'dessert';
  selected: number;
  onAdd: () => void;
  onRemove: () => void;
}

function MenuItem({ item, course, selected, onAdd, onRemove }: CourseItemProps) {
  const courseColor: Record<string, string> = {
    starter: 'bg-blue-500/10 text-blue-600',
    main: 'bg-primary/10 text-primary',
    dessert: 'bg-pink-500/10 text-pink-600',
  };

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
      selected > 0 ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-card/50'
    }`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold">
            {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(item.price)}
          </span>
          {item.allergens && (
            <span className="text-xs text-muted-foreground">{item.allergens}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {selected > 0 && (
          <Button size="icon" variant="outline" className="h-7 w-7" onClick={onRemove}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
        )}
        {selected > 0 && (
          <span className="font-bold text-sm w-5 text-center tabular-nums">{selected}</span>
        )}
        <Button size="icon" className="h-7 w-7" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface Props {
  starters: DailyMenuItem[];
  mains: DailyMenuItem[];
  desserts: DailyMenuItem[];
  onChange: (lines: Omit<OrderLine, 'id' | 'status'>[]) => void;
}

type SelectionMap = Record<string, { item: DailyMenuItem; course: 'starter' | 'main' | 'dessert'; qty: number; notes: string }>;

export function MenuSelector({ starters, mains, desserts, onChange }: Props) {
  const [selection, setSelection] = useState<SelectionMap>({});

  function update(item: DailyMenuItem, course: 'starter' | 'main' | 'dessert', delta: number) {
    setSelection((prev) => {
      const current = prev[item.id]?.qty ?? 0;
      const next = Math.max(0, current + delta);
      const updated: SelectionMap = { ...prev };
      if (next === 0) {
        delete updated[item.id];
      } else {
        updated[item.id] = { item, course, qty: next, notes: prev[item.id]?.notes ?? '' };
      }

      // Notify parent
      const lines: Omit<OrderLine, 'id' | 'status'>[] = Object.values(updated).map((s) => ({
        course: s.course,
        item_id: s.item.id,
        item_name: s.item.name,
        quantity: s.qty,
        unit_price: s.item.price,
        special_notes: s.notes || undefined,
      }));
      onChange(lines);

      return updated;
    });
  }

  function CourseSection({ label, items, course, color }: {
    label: string;
    items: DailyMenuItem[];
    course: 'starter' | 'main' | 'dessert';
    color: string;
  }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</h3>
        {items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            course={course}
            selected={selection[item.id]?.qty ?? 0}
            onAdd={() => update(item, course, 1)}
            onRemove={() => update(item, course, -1)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CourseSection label="Starters" items={starters} course="starter" color="text-blue-600" />
      <CourseSection label="Mains" items={mains} course="main" color="text-primary" />
      <CourseSection label="Desserts" items={desserts} course="dessert" color="text-pink-600" />
    </div>
  );
}
