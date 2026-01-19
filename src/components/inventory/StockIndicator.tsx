import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface StockIndicatorProps {
  current: number;
  reorderThreshold: number;
  parLevel: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StockIndicator({ 
  current, 
  reorderThreshold, 
  parLevel, 
  size = 'md',
  showIcon = true 
}: StockIndicatorProps) {
  const isLow = current <= reorderThreshold;
  const isWarning = current <= parLevel * 0.5 && current > reorderThreshold;
  const isOk = current > reorderThreshold;

  const status = isLow ? 'low' : isWarning ? 'warning' : 'ok';
  
  const statusConfig = {
    low: {
      icon: AlertCircle,
      text: 'Low Stock',
      className: 'text-destructive bg-destructive/10',
    },
    warning: {
      icon: AlertTriangle,
      text: 'Getting Low',
      className: 'text-warning bg-warning/10',
    },
    ok: {
      icon: CheckCircle,
      text: 'In Stock',
      className: 'text-success bg-success/10',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-md font-medium",
      config.className,
      sizeClasses[size]
    )}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{current}</span>
    </div>
  );
}

export function StockBar({ current, max, className }: { current: number; max: number; className?: string }) {
  const percentage = Math.min(100, (current / max) * 100);
  const isLow = percentage < 25;
  const isWarning = percentage >= 25 && percentage < 50;

  return (
    <div className={cn("h-2 bg-secondary rounded-full overflow-hidden", className)}>
      <div 
        className={cn(
          "h-full rounded-full transition-all duration-300",
          isLow ? "bg-destructive" : isWarning ? "bg-warning" : "bg-success"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
