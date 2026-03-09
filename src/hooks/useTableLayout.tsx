import { useQuery } from '@tanstack/react-query';
import { fetchDefaultTableLayout } from '@/api/queries';
import { useAuth } from '@/hooks/useAuth';
import type { TableDef } from '@/components/tableplan/TableCard';
import { TABLE_LAYOUT as FALLBACK_LAYOUT } from '@/components/tableplan/assignmentAlgorithm';

/**
 * Loads the hotel's default table layout from the database.
 * Falls back to the hardcoded layout if none is configured.
 */
export function useTableLayout() {
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['table-layout', activeHotelId],
    queryFn: async () => {
      const layout = await fetchDefaultTableLayout(activeHotelId);
      if (layout?.layout_json && Array.isArray(layout.layout_json) && layout.layout_json.length > 0) {
        return layout.layout_json as unknown as TableDef[];
      }
      return FALLBACK_LAYOUT;
    },
    enabled: !!activeHotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes — layout rarely changes
  });

  return {
    tables: query.data ?? FALLBACK_LAYOUT,
    isLoading: query.isLoading,
    layoutId: query.data ? 'db' : 'fallback',
  };
}
