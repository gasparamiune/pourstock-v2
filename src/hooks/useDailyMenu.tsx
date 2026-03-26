import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DailyMenuItem {
  id: string;
  name: string;
  description: string;
  allergens: string;
  price: number;
}

export interface DailyMenu {
  id: string;
  hotel_id: string;
  menu_date: string;
  starters: DailyMenuItem[];
  mains: DailyMenuItem[];
  desserts: DailyMenuItem[];
  published_at: string | null;
  notes: string | null;
}

export function useDailyMenu(date?: string) {
  const { activeHotelId } = useAuth();
  const menuDate = date ?? new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['daily-menu', activeHotelId, menuDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_menus' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('menu_date', menuDate)
        .maybeSingle();
      return (data as unknown) as DailyMenu | null;
    },
    enabled: !!activeHotelId,
  });
}
