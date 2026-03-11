/**
 * Hotel-scoped query helpers.
 * Every query function requires a hotelId to enforce tenant isolation.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// ── Products ──
export async function fetchProducts(hotelId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ── Locations ──
export async function fetchLocations(hotelId: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ── Stock Levels ──
export async function fetchStockLevels(hotelId: string, locationId?: string) {
  let query = supabase.from('stock_levels').select('*').eq('hotel_id', hotelId);
  if (locationId) query = query.eq('location_id', locationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── Stock Movements ──
export async function fetchStockMovements(hotelId: string, limit = 10) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ── Rooms ──
export async function fetchRooms(hotelId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .order('room_number');
  if (error) throw error;
  return data ?? [];
}

// ── Guests ──
export async function fetchGuests(hotelId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('last_name');
  if (error) throw error;
  return data ?? [];
}

// ── Reservations ──
export async function fetchReservations(hotelId: string, dateFilter?: { from: string; to: string }) {
  let q = supabase
    .from('reservations')
    .select('*, guest:guests(*), room:rooms(*)')
    .eq('hotel_id', hotelId)
    .order('check_in_date', { ascending: true });
  if (dateFilter) {
    q = q.lte('check_in_date', dateFilter.to).gte('check_out_date', dateFilter.from);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ── Room Charges ──
export async function fetchRoomCharges(hotelId: string, reservationId: string) {
  const { data, error } = await supabase
    .from('room_charges')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Housekeeping Tasks ──
export async function fetchHousekeepingTasks(hotelId: string, taskDate: string) {
  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .select('*, room:rooms(room_number, floor, room_type)')
    .eq('hotel_id', hotelId)
    .eq('task_date', taskDate)
    .order('priority', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Maintenance Requests ──
export async function fetchMaintenanceRequests(hotelId: string) {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*, room:rooms(room_number, floor)')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Table Plans ──
export async function fetchTablePlan(hotelId: string, planDate: string) {
  const { data, error } = await supabase
    .from('table_plans')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('plan_date', planDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Table Plan Changes ──
export async function fetchPendingChangesCount(hotelId: string, planDate: string) {
  const { count, error } = await supabase
    .from('table_plan_changes')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
    .eq('status', 'pending')
    .eq('plan_date', planDate);
  if (error) throw error;
  return count ?? 0;
}

// ── Table Layouts ──
export async function fetchDefaultTableLayout(hotelId: string) {
  const { data, error } = await supabase
    .from('table_layouts')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_default', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Table Layout Mutations ──
export async function upsertDefaultTableLayout(hotelId: string, layoutJson: unknown[], name = 'Default') {
  // Check if a default layout exists
  const existing = await fetchDefaultTableLayout(hotelId);
  if (existing) {
    const { error } = await supabase
      .from('table_layouts')
      .update({ layout_json: layoutJson as Json[], name, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('table_layouts')
      .insert({ hotel_id: hotelId, layout_json: layoutJson, name, is_default: true });
    if (error) throw error;
  }
}

// ── Hotel Settings ──
export async function fetchHotelSetting(hotelId: string, key: string) {
  const { data, error } = await supabase
    .from('hotel_settings')
    .select('value')
    .eq('hotel_id', hotelId)
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value;
}

// ── Manage Users (edge function) ──
export async function invokeManageUsers(action: string, hotelId: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action, hotelId, ...params },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
