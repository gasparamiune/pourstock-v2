import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Play, X, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuickCountCard } from '@/components/inventory/QuickCountCard';
import { CategoryBadge } from '@/components/inventory/CategoryBadge';
import { StockIndicator } from '@/components/inventory/StockIndicator';
import { mockProducts, mockStockLevels, mockLocations } from '@/data/mockData';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'count';

const categories: BeverageCategory[] = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | null>(
    (searchParams.get('category') as BeverageCategory) || null
  );
  const [selectedLocation, setSelectedLocation] = useState(mockLocations[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>(
    searchParams.get('mode') === 'count' ? 'count' : 'list'
  );
  const [showLowOnly, setShowLowOnly] = useState(searchParams.get('filter') === 'low');

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      if (showLowOnly) {
        const stockLevel = mockStockLevels.find(
          sl => sl.productId === product.id && sl.locationId === selectedLocation
        );
        if (!stockLevel || stockLevel.onHand > stockLevel.reorderThreshold) {
          return false;
        }
      }
      
      return matchesSearch && matchesCategory && product.isActive;
    });
  }, [search, selectedCategory, selectedLocation, showLowOnly]);

  const handleCountUpdate = (productId: string, newCount: number, partial?: number) => {
    console.log('Count update:', { productId, newCount, partial });
    // In real app, this would update the database
  };

  const startCountSession = () => {
    setViewMode('count');
    setSearchParams({ mode: 'count' });
  };

  const endCountSession = () => {
    setViewMode('list');
    setSearchParams({});
  };

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
        {mockLocations.filter(l => l.isActive).map((location) => (
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
            const stockLevel = mockStockLevels.find(
              sl => sl.productId === product.id && sl.locationId === selectedLocation
            );
            if (!stockLevel) return null;
            
            return (
              <QuickCountCard
                key={product.id}
                product={product}
                stockLevel={stockLevel}
                onUpdate={handleCountUpdate}
                isPartialMode={product.category === 'spirits' || product.category === 'syrup' || product.subtype === 'keg'}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const stockLevel = mockStockLevels.find(
              sl => sl.productId === product.id && sl.locationId === selectedLocation
            );
            if (!stockLevel) return null;

            return (
              <div 
                key={product.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-card/80 transition-colors cursor-pointer fade-in"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={product.category} size="sm" />
                    {product.subtype && (
                      <span className="text-xs text-muted-foreground capitalize">{product.subtype}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StockIndicator
                    current={stockLevel.onHand}
                    reorderThreshold={stockLevel.reorderThreshold}
                    parLevel={stockLevel.parLevel}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Par: {stockLevel.parLevel}
                  </p>
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
