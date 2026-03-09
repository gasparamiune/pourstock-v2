import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'products' | 'locations' | 'stock_levels' | 'stock_movements' | 'profiles' | 'user_roles' | 'purchase_orders' | 'purchase_order_items' | 'table_plans' | 'user_departments' | 'rooms' | 'guests' | 'reservations' | 'room_charges' | 'housekeeping_tasks' | 'housekeeping_logs' | 'maintenance_requests' | 'table_plan_changes' | 'hotel_members' | 'hotel_settings' | 'system_notices';

// Tables that have hotel_id column for tenant filtering
const HOTEL_SCOPED_TABLES = new Set([
  'products', 'locations', 'stock_levels', 'stock_movements',
  'purchase_orders', 'purchase_order_items', 'table_plans', 'table_plan_changes',
  'rooms', 'guests', 'reservations', 'room_charges',
  'housekeeping_tasks', 'housekeeping_logs', 'maintenance_requests',
]);

interface RealtimeOptions {
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  hotelId?: string; // Tenant filter — applied automatically for hotel-scoped tables
}

/**
 * Subscribe to realtime postgres_changes on a table.
 * Calls `callback` whenever a matching event occurs.
 * For hotel-scoped tables, automatically filters by hotel_id if provided.
 */
export function useRealtimeSubscription(
  table: TableName | TableName[],
  callback: () => void,
  options?: RealtimeOptions,
) {
  useEffect(() => {
    const tables = Array.isArray(table) ? table : [table];
    const channelName = `realtime-${tables.join('-')}${options?.hotelId ? `-${options.hotelId.slice(0, 8)}` : ''}`;

    let channel = supabase.channel(channelName);

    for (const t of tables) {
      const opts: any = {
        event: options?.event || '*',
        schema: 'public',
        table: t,
      };

      // Apply hotel_id filter for tenant-scoped tables
      if (options?.hotelId && HOTEL_SCOPED_TABLES.has(t)) {
        opts.filter = options.filter
          ? `${options.filter},hotel_id=eq.${options.hotelId}`
          : `hotel_id=eq.${options.hotelId}`;
      } else if (options?.filter) {
        opts.filter = options.filter;
      }

      channel = channel.on('postgres_changes', opts, () => callback());
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, options?.filter, options?.event, options?.hotelId]);
}
