/**
 * Phase 4 read adoption: reorder_rules
 * New read source: reorder_rules table
 * Legacy source: stock_levels.reorder_threshold (stays source of truth)
 * Fallback: empty state
 * Write path: managers/admins only
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReorderRuleSettings() {
  const { activeHotelId } = useAuth();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['reorder-rules', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reorder_rules')
        .select('*, product:products(name)')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
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
      <h2 className="font-display font-semibold text-lg">Reorder Rules</h2>

      {(!rules || rules.length === 0) ? (
        <div className="text-center py-8">
          <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No reorder rules configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Reorder thresholds are currently managed per stock level. Automated reorder rules coming in a future update.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">
                  {(r as any).product?.name ?? 'Unknown product'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Min: {r.min_threshold} · Reorder qty: {r.reorder_quantity}
                </p>
              </div>
              <Badge variant={r.auto_order ? 'default' : 'secondary'}>
                {r.auto_order ? 'Auto' : 'Manual'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
