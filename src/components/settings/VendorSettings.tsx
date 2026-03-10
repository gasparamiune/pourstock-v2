/**
 * Phase 4 read adoption: vendors
 * New read source: vendors table
 * Legacy source: products.vendor text field (stays source of truth)
 * Fallback: empty state
 * Write path: managers/admins only via vendors table
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Mail, Phone } from 'lucide-react';

export default function VendorSettings() {
  const { activeHotelId } = useAuth();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('name');
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
      <h2 className="font-display font-semibold text-lg">Vendors</h2>

      {(!vendors || vendors.length === 0) ? (
        <div className="text-center py-8">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No vendors configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Vendor management coming in a future update.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{v.name}</h4>
                {v.contact_name && <p className="text-xs text-muted-foreground">{v.contact_name}</p>}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {v.email && <Mail className="h-4 w-4" />}
                {v.phone && <Phone className="h-4 w-4" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
