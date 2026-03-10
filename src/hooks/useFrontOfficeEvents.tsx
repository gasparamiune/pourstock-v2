import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 9: Best-effort event emission for front office operations.
 * All functions are fire-and-forget — failures are logged, never thrown.
 */

export async function emitCheckInEvent(params: {
  hotelId: string;
  reservationId: string;
  stayId?: string;
  performedBy: string;
  method?: string;
  notes?: string;
}): Promise<void> {
  try {
    // Find stay_id if not provided
    let stayId = params.stayId;
    if (!stayId) {
      const { data } = await supabase
        .from('stays')
        .select('id')
        .eq('reservation_id', params.reservationId)
        .single();
      stayId = data?.id;
    }

    const { error } = await supabase.from('checkin_events').insert({
      hotel_id: params.hotelId,
      stay_id: stayId || null,
      reservation_id: params.reservationId,
      performed_by: params.performedBy,
      method: params.method || 'manual',
      notes: params.notes || null,
    } as any);

    if (error) console.warn('[Phase9] checkin_event emit failed:', error.message);
  } catch (err) {
    console.warn('[Phase9] checkin_event unexpected error:', err);
  }
}

export async function emitCheckOutEvent(params: {
  hotelId: string;
  reservationId: string;
  performedBy: string;
  balanceStatus?: string;
  notes?: string;
}): Promise<void> {
  try {
    let stayId: string | null = null;
    const { data } = await supabase
      .from('stays')
      .select('id')
      .eq('reservation_id', params.reservationId)
      .single();
    stayId = data?.id || null;

    const { error } = await supabase.from('checkout_events').insert({
      hotel_id: params.hotelId,
      stay_id: stayId,
      reservation_id: params.reservationId,
      performed_by: params.performedBy,
      balance_status: params.balanceStatus || null,
      notes: params.notes || null,
    } as any);

    if (error) console.warn('[Phase9] checkout_event emit failed:', error.message);
  } catch (err) {
    console.warn('[Phase9] checkout_event unexpected error:', err);
  }
}
