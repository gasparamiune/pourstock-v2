/**
 * Phase 4 read adoption: departments
 * New read source: departments table
 * Legacy source: hardcoded 3-dept list + user_departments enum
 * Fallback: empty state (legacy enforcement unchanged)
 * Write path: hotel_admins only
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DepartmentSettings() {
  const { activeHotelId } = useAuth();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('hotel_id', activeHotelId)
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
      <h2 className="font-display font-semibold text-lg">Departments</h2>

      {(!departments || departments.length === 0) ? (
        <p className="text-sm text-muted-foreground">No departments configured.</p>
      ) : (
        <div className="space-y-2">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{d.display_name}</h4>
                <p className="text-xs text-muted-foreground">{d.slug}</p>
              </div>
              <Badge variant={d.is_active ? 'default' : 'secondary'}>
                {d.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Department management coming in a future update. Role enforcement uses the legacy system.
      </p>
    </div>
  );
}
