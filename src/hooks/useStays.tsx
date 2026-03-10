import { supabase } from '@/integrations/supabase/client';
import { logDualWriteFailure } from '@/lib/dualWriteLogger';

/**
 * Phase 8: Best-effort mirror write for stays domain.
 * All functions are fire-and-forget — failures are logged, never thrown.
 */

interface MirrorStayParams {
  hotelId: string;
  reservationId: string;
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source?: string;
  notes?: string;
}

export async function mirrorWriteStayOnCheckIn(params: MirrorStayParams): Promise<void> {
  try {
    const { data: stay, error: stayErr } = await supabase
      .from('stays')
      .upsert({
        hotel_id: params.hotelId,
        room_id: params.roomId,
        check_in: params.checkIn,
        check_out: params.checkOut,
        status: 'checked_in',
        source: params.source || null,
        notes: params.notes || null,
        reservation_id: params.reservationId,
      } as any, { onConflict: 'reservation_id' })
      .select('id')
      .single();

    if (stayErr || !stay) {
      console.warn('[Phase8] Stay mirror write failed:', stayErr?.message);
      logDualWriteFailure({ hotelId: params.hotelId, domain: 'stays', operation: 'check_in', sourceRecordId: params.reservationId, error: stayErr || 'no data returned' });
      return;
    }

    const stayId = stay.id;

    const { error: sgErr } = await supabase
      .from('stay_guests')
      .upsert({
        stay_id: stayId,
        guest_id: params.guestId,
        is_primary: true,
      } as any, { onConflict: 'stay_id,guest_id' })
      .select();

    if (sgErr) {
      console.warn('[Phase8] stay_guests mirror write failed:', sgErr.message);
      logDualWriteFailure({ hotelId: params.hotelId, domain: 'stays', operation: 'check_in_guest', sourceRecordId: params.reservationId, error: sgErr });
    }

    const { data: existing } = await supabase
      .from('room_assignments')
      .select('id')
      .eq('stay_id', stayId)
      .is('released_at', null)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error: raErr } = await supabase
        .from('room_assignments')
        .insert({ stay_id: stayId, room_id: params.roomId } as any);

      if (raErr) {
        console.warn('[Phase8] room_assignments mirror write failed:', raErr.message);
        logDualWriteFailure({ hotelId: params.hotelId, domain: 'stays', operation: 'check_in_room_assignment', sourceRecordId: params.reservationId, error: raErr });
      }
    }
  } catch (err) {
    console.warn('[Phase8] Stay mirror write unexpected error:', err);
    logDualWriteFailure({ hotelId: params.hotelId, domain: 'stays', operation: 'check_in', sourceRecordId: params.reservationId, error: err });
  }
}

export async function mirrorWriteStayOnCheckOut(reservationId: string, hotelId?: string): Promise<void> {
  try {
    const { data: stay } = await supabase
      .from('stays')
      .select('id, hotel_id')
      .eq('reservation_id', reservationId)
      .single();

    if (!stay) return;

    const { error: stayErr } = await supabase
      .from('stays')
      .update({ status: 'checked_out' } as any)
      .eq('id', stay.id);

    if (stayErr) {
      console.warn('[Phase8] Stay checkout mirror failed:', stayErr.message);
      logDualWriteFailure({ hotelId: stay.hotel_id, domain: 'stays', operation: 'check_out', sourceRecordId: reservationId, error: stayErr });
    }

    const { error: raErr } = await supabase
      .from('room_assignments')
      .update({ released_at: new Date().toISOString() } as any)
      .eq('stay_id', stay.id)
      .is('released_at', null);

    if (raErr) {
      console.warn('[Phase8] room_assignments release failed:', raErr.message);
      logDualWriteFailure({ hotelId: stay.hotel_id, domain: 'stays', operation: 'check_out_release', sourceRecordId: reservationId, error: raErr });
    }
  } catch (err) {
    console.warn('[Phase8] Stay checkout mirror unexpected error:', err);
    logDualWriteFailure({ hotelId: hotelId, domain: 'stays', operation: 'check_out', sourceRecordId: reservationId, error: err });
  }
}
