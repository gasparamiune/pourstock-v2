import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DailyMenuItem {
  id: string;
  name: string;
  description: string;
  allergens: string;
  price: number;
  available_units?: number | null; // null = unlimited
}

export interface DailyMenu {
  id: string;
  hotel_id: string;
  menu_date: string;
  starters: DailyMenuItem[];
  mellemret: DailyMenuItem[];
  mains: DailyMenuItem[];
  desserts: DailyMenuItem[];
  published_at: string | null;
  notes: string | null;
}

/** Ensure every item in a course array has an id (guard against incomplete JSON) */
function ensureIds(items: any[]): DailyMenuItem[] {
  return (items ?? []).map((item: any) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
  }));
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
      if (!data) return null;
      const raw = data as any;
      return {
        ...raw,
        starters: ensureIds(raw.starters),
        mellemret: ensureIds(raw.mellemret),
        mains: ensureIds(raw.mains),
        desserts: ensureIds(raw.desserts),
      } as DailyMenu;
    },
    enabled: !!activeHotelId,
  });
}
