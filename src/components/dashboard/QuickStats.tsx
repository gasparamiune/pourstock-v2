import { Package, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'warning' | 'success' | 'primary';
}

function StatCard({ label, value, subtext, icon: Icon, trend, trendValue, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-secondary/50',
    warning: 'bg-warning/10 border-warning/20',
    success: 'bg-success/10 border-success/20',
    primary: 'bg-primary/10 border-primary/20',
  };

  const iconVariants = {
    default: 'bg-secondary text-muted-foreground',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
    primary: 'bg-primary/20 text-primary',
  };

  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 border",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          iconVariants[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && trendValue && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend === 'up' && "bg-success/20 text-success",
            trend === 'down' && "bg-destructive/20 text-destructive",
            trend === 'neutral' && "bg-secondary text-muted-foreground"
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

interface QuickStatsProps {
  totalProducts: number;
  lowStockCount: number;
  lastCountedDays?: number;
  todayUsageValue?: number;
}

export function QuickStats({ totalProducts, lowStockCount, lastCountedDays, todayUsageValue }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Items"
        value={totalProducts}
        icon={Package}
        variant="default"
      />
      <StatCard
        label="Low Stock"
        value={lowStockCount}
        icon={TrendingDown}
        variant={lowStockCount > 0 ? 'warning' : 'success'}
        subtext={lowStockCount > 0 ? 'Needs attention' : 'All stocked'}
      />
      <StatCard
        label="Last Count"
        value={lastCountedDays !== undefined ? `${lastCountedDays}d` : '-'}
        icon={Clock}
        variant={lastCountedDays && lastCountedDays > 7 ? 'warning' : 'default'}
        subtext={lastCountedDays && lastCountedDays > 7 ? 'Count overdue' : 'ago'}
      />
      <StatCard
        label="Today's Usage"
        value={todayUsageValue ? `$${todayUsageValue}` : '$0'}
        icon={DollarSign}
        variant="primary"
        trend="down"
        trendValue="12%"
      />
    </div>
  );
}
