import { useState } from 'react';
import { useProducts } from '@/hooks/useInventoryData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

const BAR_CATEGORIES = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];
const CATEGORY_COLOR: Record<string, string> = {
  wine: 'text-red-400',
  beer: 'text-amber-400',
  spirits: 'text-purple-400',
  coffee: 'text-orange-400',
  soda: 'text-cyan-400',
  syrup: 'text-pink-400',
};

export function QuickService() {
  const { products } = useProducts();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('all');

  const barProducts = products.filter((p) => BAR_CATEGORIES.includes(p.category ?? ''));
  const filtered = filter === 'all' ? barProducts : barProducts.filter((p) => p.category === filter);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = barProducts.find((x) => x.id === id);
    return sum + (p ? qty : 0);
  }, 0);

  function adjust(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {['all', ...BAR_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
              filter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cart summary */}
      {cartTotal > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="h-4 w-4 text-primary" />
            {cartTotal} item{cartTotal !== 1 ? 's' : ''} selected
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearCart}>
            Clear
          </Button>
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Wine className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No bar products found. Add products in Inventory → Products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((product) => {
            const qty = cart[product.id] ?? 0;
            return (
              <Card
                key={product.id}
                className={cn(
                  'glass-card border-border/50 transition-all',
                  qty > 0 && 'ring-1 ring-primary'
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn('text-xs font-medium uppercase tracking-wide', CATEGORY_COLOR[product.category ?? ''] ?? 'text-muted-foreground')}>
                      {product.category}
                    </span>
                    {qty > 0 && (
                      <Badge className="text-xs h-5 px-1.5 bg-primary text-primary-foreground">{qty}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug mb-3 line-clamp-2">{product.name}</p>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => adjust(product.id, -1)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-30 hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                    <button
                      onClick={() => adjust(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                    >
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
