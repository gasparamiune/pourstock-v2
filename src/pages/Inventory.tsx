import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Play, X, MapPin, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuickCountCard } from '@/components/inventory/QuickCountCard';
import { CategoryBadge } from '@/components/inventory/CategoryBadge';
import { StockIndicator } from '@/components/inventory/StockIndicator';
import { useProducts, useLocations, useStockLevels } from '@/hooks/useInventoryData';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'list' | 'count';

const categories: BeverageCategory[] = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isManager } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | null>(
    (searchParams.get('category') as BeverageCategory) || null
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    searchParams.get('mode') === 'count' ? 'count' : 'list'
  );
  const [showLowOnly, setShowLowOnly] = useState(searchParams.get('filter') === 'low');

  const { products, isLoading: productsLoading } = useProducts();
  const { locations, isLoading: locationsLoading } = useLocations();
  const { stockLevels, isLoading: stockLoading, refetch: refetchStock } = useStockLevels(selectedLocation || undefined);

  // Set first location as default when locations load
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);

  const isLoading = productsLoading || locationsLoading || stockLoading;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch = !search || 
        product.name.toLowerCase().includes(lowerSearch) ||
        (product.subtype && product.subtype.toLowerCase().includes(lowerSearch)) ||
        (product.vendor && product.vendor.toLowerCase().includes(lowerSearch)) ||
        (product.barcode && product.barcode.toLowerCase().includes(lowerSearch));
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      if (showLowOnly && selectedLocation) {
        const stockLevel = stockLevels.find(
          sl => sl.product_id === product.id && sl.location_id === selectedLocation
        );
        if (!stockLevel || stockLevel.on_hand > stockLevel.reorder_threshold) {
          return false;
        }
      }
      
      return matchesSearch && matchesCategory && product.is_active;
    });
  }, [products, search, selectedCategory, selectedLocation, showLowOnly, stockLevels]);

  const handleCountUpdate = async (productId: string, newCount: number, partial?: number) => {
    if (!selectedLocation) return;

    const stockLevel = stockLevels.find(
      sl => sl.product_id === productId && sl.location_id === selectedLocation
    );

    if (stockLevel) {
      // Update existing stock level
      const { error } = await supabase
        .from('stock_levels')
        .update({
          on_hand: newCount,
          partial_amount: partial,
          last_counted_at: new Date().toISOString(),
        })
        .eq('id', stockLevel.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error updating stock',
          description: error.message,
        });
      } else {
        refetchStock();
      }
    }
  };

  const startCountSession = () => {
    setViewMode('count');
    setSearchParams({ mode: 'count' });
  };

  const endCountSession = () => {
    setViewMode('list');
    setSearchParams({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Inventory</h1>
          <p className="text-muted-foreground">
            {viewMode === 'count' ? 'Quick Count Mode' : 'Manage your stock levels'}
          </p>
        </div>
        {viewMode === 'list' ? (
          <Button onClick={startCountSession} className="gap-2">
            <Play className="h-4 w-4" />
            Start Count
          </Button>
        ) : (
          <Button onClick={endCountSession} variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            End Session
          </Button>
        )}
      </div>

      {/* Location Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => setSelectedLocation(location.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all touch-target",
              selectedLocation === location.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <MapPin className="h-4 w-4" />
            {location.name}
          </button>
        ))}
        {locations.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No locations configured</p>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-0"
          />
        </div>
        <Button
          variant={showLowOnly ? 'default' : 'secondary'}
          size="icon"
          onClick={() => setShowLowOnly(!showLowOnly)}
          className="shrink-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all touch-target",
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all touch-target",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} items
          {showLowOnly && ' (low stock only)'}
        </p>
      </div>

      {/* Product Grid/List */}
      {viewMode === 'count' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const stockLevel = stockLevels.find(
              sl => sl.product_id === product.id && sl.location_id === selectedLocation
            );
            
            // Create a compatible stock level object for the component
            const stockLevelForCard = stockLevel ? {
              id: stockLevel.id,
              productId: stockLevel.product_id,
              locationId: stockLevel.location_id,
              onHand: stockLevel.on_hand,
              parLevel: stockLevel.par_level,
              reorderThreshold: stockLevel.reorder_threshold,
              partialAmount: stockLevel.partial_amount ?? undefined,
              lastCountedAt: stockLevel.last_counted_at ? new Date(stockLevel.last_counted_at) : undefined,
            } : null;
            
            if (!stockLevelForCard) return null;

            // Create a compatible product object for the component
            const productForCard = {
              id: product.id,
              name: product.name,
              category: product.category as BeverageCategory,
              subtype: product.subtype ?? undefined,
              unitType: product.unit_type as 'count' | 'liters' | 'grams' | 'ml' | 'kg',
              containerSize: product.container_size ?? undefined,
              containerUnit: product.container_unit ?? undefined,
              isActive: product.is_active,
              createdAt: new Date(product.created_at),
              updatedAt: new Date(product.updated_at),
            };
            
            return (
              <QuickCountCard
                key={product.id}
                product={productForCard}
                stockLevel={stockLevelForCard}
                onUpdate={handleCountUpdate}
                isPartialMode={product.category === 'spirits' || product.category === 'syrup'}
                canEdit={isManager}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const stockLevel = stockLevels.find(
              sl => sl.product_id === product.id && sl.location_id === selectedLocation
            );

            return (
              <div 
                key={product.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-card/80 transition-colors cursor-pointer fade-in"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={product.category as BeverageCategory} size="sm" />
                    {product.subtype && (
                      <span className="text-xs text-muted-foreground capitalize">{product.subtype}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {stockLevel ? (
                    <>
                      <StockIndicator
                        current={stockLevel.on_hand}
                        reorderThreshold={stockLevel.reorder_threshold}
                        parLevel={stockLevel.par_level}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Par: {stockLevel.par_level}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No stock level</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
