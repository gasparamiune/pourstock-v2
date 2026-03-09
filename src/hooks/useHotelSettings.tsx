import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useHotelSettings() {
  const { activeHotelId } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['hotel-settings', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('key, value')
        .eq('hotel_id', activeHotelId);
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const row of data ?? []) {
        map[row.key] = row.value;
      }
      return map;
    },
    enabled: !!activeHotelId,
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('hotel_settings')
        .upsert({ hotel_id: activeHotelId, key, value }, { onConflict: 'hotel_id,key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-settings', activeHotelId] });
    },
  });

  const getSetting = (key: string, defaultValue?: any) => {
    return settingsQuery.data?.[key] ?? defaultValue;
  };

  return { settingsQuery, getSetting, updateSetting };
}
