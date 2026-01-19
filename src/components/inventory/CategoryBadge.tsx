import { Wine, Beer, Martini, Coffee, GlassWater, Droplet } from 'lucide-react';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: BeverageCategory;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const categoryConfig: Record<BeverageCategory, { icon: React.ElementType; colorClass: string }> = {
  wine: { icon: Wine, colorClass: 'bg-wine/20 text-wine border-wine/30' },
  beer: { icon: Beer, colorClass: 'bg-beer/20 text-beer border-beer/30' },
  spirits: { icon: Martini, colorClass: 'bg-spirits/20 text-spirits border-spirits/30' },
  coffee: { icon: Coffee, colorClass: 'bg-coffee/20 text-coffee border-coffee/30' },
  soda: { icon: GlassWater, colorClass: 'bg-soda/20 text-soda border-soda/30' },
  syrup: { icon: Droplet, colorClass: 'bg-syrup/20 text-syrup border-syrup/30' },
};

const sizeClasses = {
  sm: 'h-6 px-2 text-xs gap-1',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function CategoryBadge({ category, size = 'md', showLabel = true }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.colorClass,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{categoryLabels[category]}</span>}
    </span>
  );
}

export function CategoryIcon({ category, className }: { category: BeverageCategory; className?: string }) {
  const Icon = categoryConfig[category].icon;
  return <Icon className={className} />;
}
