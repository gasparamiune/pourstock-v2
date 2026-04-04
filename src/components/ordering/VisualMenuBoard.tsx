import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DailyMenuItem } from '@/hooks/useDailyMenu';
import { MenuItemCard } from './MenuItemCard';

type CourseKey = 'starter' | 'mellemret' | 'main' | 'dessert';
type SelectionMap = Record<string, { item: DailyMenuItem; course: CourseKey; qty: number; notes: string }>;

const COURSES: { key: CourseKey; label: string; color: string; activeColor: string }[] = [
  { key: 'starter',   label: 'Starters',   color: 'text-green-400',  activeColor: 'bg-green-500/20 text-green-300 border-green-500/40' },
  { key: 'mellemret', label: 'Mellemret',   color: 'text-amber-400',  activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { key: 'main',      label: 'Mains',       color: 'text-primary',    activeColor: 'bg-primary/20 text-primary border-primary/40' },
  { key: 'dessert',   label: 'Desserts',    color: 'text-sky-400',    activeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
];

interface Props {
  starters: DailyMenuItem[];
  mellemret?: DailyMenuItem[];
  mains: DailyMenuItem[];
  desserts: DailyMenuItem[];
  stockMap: Record<string, number>;
  selection: SelectionMap;
  onAdd: (item: DailyMenuItem, course: CourseKey) => void;
  onRemove: (item: DailyMenuItem) => void;
  onRequestNote: (itemId: string) => void;
  readOnly?: boolean;
}

export function VisualMenuBoard({
  starters, mellemret = [], mains, desserts, stockMap, selection,
  onAdd, onRemove, onRequestNote, readOnly = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<CourseKey>('main');

  const itemsByTab: Record<CourseKey, DailyMenuItem[]> = {
    starter: starters,
    mellemret,
    main: mains,
    dessert: desserts,
  };

  function countSelected(course: CourseKey) {
    return Object.values(selection).filter(s => s.course === course && s.qty > 0).length;
  }

  function getAvailable(item: DailyMenuItem): number | null {
    if (item.id in stockMap) return stockMap[item.id];
    if (item.available_units != null) return item.available_units;
    return null;
  }

  const items = itemsByTab[activeTab];

  return (
    <div className={cn('flex flex-col h-full', readOnly && 'pointer-events-none')}>
      {/* Course tabs */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-border/40">
        {COURSES.map(({ key, label, activeColor }) => {
          const count = countSelected(key);
          const isActive = activeTab === key;
          const hasItems = itemsByTab[key].length > 0;
          if (!hasItems) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                isActive
                  ? activeColor
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5',
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn(
                  'text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold',
                  isActive ? 'bg-current/20 opacity-80' : 'bg-primary text-primary-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <p className="text-sm">No items for this course</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-3">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                course={activeTab}
                quantity={selection[item.id]?.qty ?? 0}
                available={getAvailable(item)}
                note={selection[item.id]?.notes}
                onAdd={() => onAdd(item, activeTab)}
                onRemove={() => onRemove(item)}
                onRequestNote={() => onRequestNote(item.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
