import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to track pending table_plan_changes count for notification badges.
 */
export function usePendingChanges() {
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const { activeHotelId } = useAuth();

  const fetchCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('table_plan_changes')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', activeHotelId)
      .eq('status', 'pending')
      .eq('plan_date', today);
    setPendingCount(count || 0);
  }, [activeHotelId]);

  useEffect(() => {
    fetchCount();
    const today = new Date().toISOString().split('T')[0];
    const channel = supabase
      .channel('pending-changes-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_plan_changes', filter: `plan_date=eq.${today}` },
        () => { fetchCount(); setDismissed(false); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCount]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return { pendingCount, dismissed, dismiss };
}
