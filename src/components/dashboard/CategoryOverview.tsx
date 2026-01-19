import { Wine, Beer, Martini, Coffee, GlassWater, Droplet } from 'lucide-react';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface CategoryOverviewProps {
  data: Record<string, { total: number; low: number }>;
  onCategoryClick?: (category: BeverageCategory) => void;
}

const categoryConfig: Record<BeverageCategory, { icon: React.ElementType; gradient: string }> = {
  wine: { icon: Wine, gradient: 'from-wine to-wine/60' },
  beer: { icon: Beer, gradient: 'from-beer to-beer/60' },
  spirits: { icon: Martini, gradient: 'from-spirits to-spirits/60' },
  coffee: { icon: Coffee, gradient: 'from-coffee to-coffee/60' },
  soda: { icon: GlassWater, gradient: 'from-soda to-soda/60' },
  syrup: { icon: Droplet, gradient: 'from-syrup to-syrup/60' },
};

export function CategoryOverview({ data, onCategoryClick }: CategoryOverviewProps) {
  const categories = Object.keys(categoryConfig) as BeverageCategory[];

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-display font-semibold text-lg mb-4">Categories</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          const stats = data[category] || { total: 0, low: 0 };

          return (
            <button
              key={category}
              onClick={() => onCategoryClick?.(category)}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200",
                "bg-gradient-to-br",
                config.gradient,
                "hover:scale-[1.02] active:scale-[0.98]",
                "touch-target"
              )}
            >
              <Icon className="h-6 w-6 text-white/90 mb-2" />
              <p className="font-semibold text-white text-lg">{stats.total}</p>
              <p className="text-sm text-white/80">{categoryLabels[category]}</p>
              {stats.low > 0 && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-destructive">{stats.low}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
