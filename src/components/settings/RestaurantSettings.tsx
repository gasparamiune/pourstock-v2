/**
 * Phase 3 read adoption: restaurants + service_periods
 * New read source: restaurants, service_periods tables
 * Legacy source: none (no UI existed before)
 * Fallback: empty state
 * Write path: hotel_admins only via these tables
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UtensilsCrossed, Clock } from 'lucide-react';

export default function RestaurantSettings() {
  const { activeHotelId } = useAuth();

  const { data: restaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['restaurants', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const { data: servicePeriods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['service-periods', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_periods')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const isLoading = loadingRestaurants || loadingPeriods;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-lg">Restaurants & Service</h2>

      {/* Restaurants */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Restaurants</h3>
        {(!restaurants || restaurants.length === 0) ? (
          <p className="text-sm text-muted-foreground">No restaurants configured.</p>
        ) : (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{r.name}</h4>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.capacity > 0 ? `${r.capacity} seats` : 'No capacity set'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Periods */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Service Periods</h3>
        {(!servicePeriods || servicePeriods.length === 0) ? (
          <p className="text-sm text-muted-foreground">No service periods configured.</p>
        ) : (
          <div className="space-y-2">
            {servicePeriods.map((sp) => (
              <div key={sp.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{sp.name}</h4>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {sp.start_time?.slice(0, 5)} – {sp.end_time?.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Restaurant and service period management coming in a future update.
      </p>
    </div>
  );
}
