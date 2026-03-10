/**
 * Phase 3 read adoption: product_categories
 * New read source: product_categories table
 * Legacy source: products.category enum (stays source of truth for products)
 * Fallback: empty state
 * Write path: managers/admins only
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tag } from 'lucide-react';

export default function ProductCategorySettings() {
  const { activeHotelId } = useAuth();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['product-categories', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-lg">Product Categories</h2>

      {(!categories || categories.length === 0) ? (
        <p className="text-sm text-muted-foreground">No categories configured.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
                <Tag className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{cat.name}</h4>
                {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Category management coming in a future update. Products currently use the legacy category enum.
      </p>
    </div>
  );
}
