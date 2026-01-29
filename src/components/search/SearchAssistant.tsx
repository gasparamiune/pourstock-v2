import { useState, useEffect, useMemo } from 'react';
import { Search, Wine, Beer, Coffee, GlassWater, Droplet, Martini, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProducts, mockStockLevels, mockLocations } from '@/data/mockData';
import { BeverageCategory, categoryLabels } from '@/types/inventory';
import { cn } from '@/lib/utils';

const categoryIcons: Record<BeverageCategory, React.ReactNode> = {
  wine: <Wine className="h-4 w-4" />,
  beer: <Beer className="h-4 w-4" />,
  spirits: <Martini className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  soda: <GlassWater className="h-4 w-4" />,
  syrup: <Droplet className="h-4 w-4" />,
};

interface SearchResult {
  productId: string;
  productName: string;
  category: BeverageCategory;
  locations: {
    locationId: string;
    locationName: string;
    onHand: number;
  }[];
}

export function SearchAssistant() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Build search index
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    
    return mockProducts
      .filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.subtype?.toLowerCase().includes(lowerQuery) ||
        product.vendor?.toLowerCase().includes(lowerQuery)
      )
      .map(product => {
        const stockInLocations = mockStockLevels
          .filter(sl => sl.productId === product.id && sl.onHand > 0)
          .map(sl => {
            const location = mockLocations.find(l => l.id === sl.locationId);
            return {
              locationId: sl.locationId,
              locationName: location?.name || 'Unknown',
              onHand: sl.onHand,
            };
          });

        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          locations: stockInLocations,
        };
      })
      .slice(0, 8);
  }, [query]);

  // Recommendations when no query
  const recommendations = useMemo(() => {
    if (query.trim()) return [];
    
    // Show popular items or low stock items as recommendations
    const popularItems = mockProducts.slice(0, 5).map(product => {
      const stockInLocations = mockStockLevels
        .filter(sl => sl.productId === product.id && sl.onHand > 0)
        .map(sl => {
          const location = mockLocations.find(l => l.id === sl.locationId);
          return {
            locationId: sl.locationId,
            locationName: location?.name || 'Unknown',
            onHand: sl.onHand,
          };
        });

      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        locations: stockInLocations,
      };
    });

    return popularItems;
  }, [query]);

  const displayResults = query.trim() ? searchResults : recommendations;

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedResult(null);
  };

  return (
    <div className="relative">
      {/* Search Trigger */}
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Where is my wine stored?"
          className="pl-10 bg-card/50 border-border/50 focus:bg-card"
          onFocus={() => setIsOpen(true)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Results Panel */}
          <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            {/* Search Input in Panel */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for wine, beer, spirits..."
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {!query.trim() && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Popular Items
                </div>
              )}
              
              {displayResults.length === 0 && query.trim() && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No items found for "{query}"</p>
                  <p className="text-sm mt-1">Try searching by name, category, or vendor</p>
                </div>
              )}

              {displayResults.map((result) => (
                <div
                  key={result.productId}
                  className={cn(
                    "p-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors",
                    "hover:bg-accent/50",
                    selectedResult?.productId === result.productId && "bg-accent"
                  )}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      {categoryIcons[result.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.productName}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {categoryLabels[result.category]}
                        </Badge>
                      </div>
                      
                      {/* Location Info */}
                      {result.locations.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {result.locations.map((loc) => (
                            <div 
                              key={loc.locationId}
                              className="flex items-center gap-2 text-sm"
                            >
                              <MapPin className="h-3 w-3 text-primary" />
                              <span className="text-foreground font-medium">{loc.locationName}</span>
                              <span className="text-muted-foreground">({loc.onHand} in stock)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-destructive flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>Out of stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Hint */}
            <div className="p-2 border-t border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                Search by name, category (wine, beer, spirits), or vendor
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
