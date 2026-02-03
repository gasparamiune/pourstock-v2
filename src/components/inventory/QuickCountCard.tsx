import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, StockLevel } from '@/types/inventory';
import { CategoryBadge } from './CategoryBadge';
import { cn } from '@/lib/utils';

interface QuickCountCardProps {
  product: Product;
  stockLevel: StockLevel;
  onUpdate: (productId: string, newCount: number, partial?: number) => void;
  isPartialMode?: boolean;
  canEdit?: boolean;
}

const partialOptions = [0, 25, 50, 75, 100];

export function QuickCountCard({ product, stockLevel, onUpdate, isPartialMode, canEdit = true }: QuickCountCardProps) {
  const [count, setCount] = useState(stockLevel.onHand);
  const [partial, setPartial] = useState(stockLevel.partialAmount || 100);
  const [hasChanged, setHasChanged] = useState(false);

  const handleCountChange = (delta: number) => {
    const newCount = Math.max(0, count + delta);
    setCount(newCount);
    setHasChanged(true);
  };

  const handlePartialChange = (value: number) => {
    setPartial(value);
    setHasChanged(true);
  };

  const handleConfirm = () => {
    onUpdate(product.id, count, isPartialMode ? partial : undefined);
    setHasChanged(false);
  };

  const showPartial = isPartialMode && (product.category === 'spirits' || product.category === 'syrup' || product.subtype === 'keg');

  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 transition-all duration-200 fade-in",
      hasChanged && "ring-2 ring-primary/50"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <CategoryBadge category={product.category} size="sm" />
            {product.subtype && (
              <span className="text-xs text-muted-foreground capitalize">{product.subtype}</span>
            )}
          </div>
        </div>
      </div>

      {/* Count Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          variant="secondary"
          size="icon-lg"
          onClick={() => handleCountChange(-1)}
          className="rounded-xl touch-target"
          disabled={!canEdit}
        >
          <Minus className="h-6 w-6" />
        </Button>

        <div className="min-w-[80px] text-center">
          <span className="text-4xl font-display font-bold text-foreground">{count}</span>
          {product.containerUnit && (
            <p className="text-xs text-muted-foreground mt-1">
              {product.containerSize}{product.containerUnit} each
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          size="icon-lg"
          onClick={() => handleCountChange(1)}
          className="rounded-xl touch-target"
          disabled={!canEdit}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Partial Bottle Selector */}
      {showPartial && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Open bottle level</p>
          <div className="flex gap-2">
            {partialOptions.map((option) => (
              <button
                key={option}
                onClick={() => handlePartialChange(option)}
                disabled={!canEdit}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all touch-target",
                  partial === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  !canEdit && "opacity-50 cursor-not-allowed"
                )}
              >
                {option}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {hasChanged && canEdit && (
        <Button
          variant="success"
          className="w-full mt-4"
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm Count
        </Button>
      )}

      {/* Stock Info */}
      <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        <span>Par: {stockLevel.parLevel}</span>
        <span>Reorder at: {stockLevel.reorderThreshold}</span>
      </div>
    </div>
  );
}
