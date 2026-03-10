/**
 * Phase 3 read adoption: room_types
 * New read source: room_types table
 * Legacy source: rooms.room_type enum (stays source of truth for rooms)
 * Fallback: empty state
 * Write path: hotel_admins only
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BedDouble } from 'lucide-react';

export default function RoomTypeSettings() {
  const { activeHotelId } = useAuth();

  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ['room-types', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
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
      <h2 className="font-display font-semibold text-lg">Room Types</h2>

      {(!roomTypes || roomTypes.length === 0) ? (
        <p className="text-sm text-muted-foreground">No room types configured.</p>
      ) : (
        <div className="space-y-2">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{rt.name}</h4>
                {rt.description && <p className="text-xs text-muted-foreground">{rt.description}</p>}
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">{rt.default_capacity} guests</span>
                {rt.base_rate && (
                  <p className="text-xs text-muted-foreground">{rt.base_rate} DKK/night</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Room type management coming in a future update. Currently rooms use the legacy type system.
      </p>
    </div>
  );
}
