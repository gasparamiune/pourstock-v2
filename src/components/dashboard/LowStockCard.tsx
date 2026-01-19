import { AlertCircle, ArrowRight, TrendingDown } from 'lucide-react';
import { LowStockAlert } from '@/types/inventory';
import { CategoryBadge } from '@/components/inventory/CategoryBadge';
import { StockBar } from '@/components/inventory/StockIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LowStockCardProps {
  alerts: LowStockAlert[];
  onViewAll?: () => void;
}

export function LowStockCard({ alerts, onViewAll }: LowStockCardProps) {
  const criticalAlerts = alerts.filter(a => a.currentStock === 0);
  const lowAlerts = alerts.filter(a => a.currentStock > 0);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Low Stock</h3>
            <p className="text-sm text-muted-foreground">{alerts.length} items need attention</p>
          </div>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {criticalAlerts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Out of Stock
          </p>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 2).map((alert) => (
              <LowStockItem key={`${alert.product.id}-${alert.location.id}`} alert={alert} critical />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {lowAlerts.slice(0, 4).map((alert) => (
          <LowStockItem key={`${alert.product.id}-${alert.location.id}`} alert={alert} />
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">All items are well stocked! 🎉</p>
        </div>
      )}
    </div>
  );
}

function LowStockItem({ alert, critical }: { alert: LowStockAlert; critical?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-xl transition-colors",
      critical ? "bg-destructive/10" : "bg-secondary/50"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CategoryBadge category={alert.product.category} size="sm" showLabel={false} />
          <span className="font-medium text-sm truncate">{alert.product.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-bold",
            critical ? "text-destructive" : "text-warning"
          )}>
            {alert.currentStock}
          </span>
          <span className="text-xs text-muted-foreground">/ {alert.parLevel}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StockBar current={alert.currentStock} max={alert.parLevel} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.location.name}</span>
      </div>
    </div>
  );
}
