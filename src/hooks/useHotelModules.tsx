import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Phase 3 read adoption: hotel_modules
 * 
 * New read source: hotel_modules table
 * Legacy source: hardcoded nav items (all visible)
 * Fallback: if query fails or returns empty, all modules are considered enabled
 * Write path: hotel_modules only (admin via Settings, seeded on hotel creation)
 */
export function useHotelModules() {
  const { activeHotelId } = useAuth();

  const { data: modules, isLoading, isError } = useQuery({
    queryKey: ['hotel-modules', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_modules')
        .select('module, is_enabled, config')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
    staleTime: 5 * 60 * 1000, // 5 min — config data changes rarely
  });

  /**
   * Check if a module is enabled.
   * FALLBACK: if modules haven't loaded or query failed, return true (all enabled).
   * This preserves current behavior where all nav items are visible.
   */
  const isModuleEnabled = (moduleName: string): boolean => {
    if (isLoading || isError || !modules || modules.length === 0) {
      return true; // fallback: show everything (current behavior)
    }
    const mod = modules.find(m => m.module === moduleName);
    return mod ? mod.is_enabled : true; // unknown modules default to enabled
  };

  return { modules, isLoading, isModuleEnabled };
}
