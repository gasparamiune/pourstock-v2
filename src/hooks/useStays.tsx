import { supabase } from '@/integrations/supabase/client';

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
    // Upsert stay (idempotent via unique reservation_id index)
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
      return;
    }

    const stayId = stay.id;

    // Upsert stay_guest (primary guest)
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
    }

    // Insert room_assignment if none exists for this stay
    const { data: existing } = await supabase
      .from('room_assignments')
      .select('id')
      .eq('stay_id', stayId)
      .is('released_at', null)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error: raErr } = await supabase
        .from('room_assignments')
        .insert({
          stay_id: stayId,
          room_id: params.roomId,
        } as any);

      if (raErr) {
        console.warn('[Phase8] room_assignments mirror write failed:', raErr.message);
      }
    }
  } catch (err) {
    console.warn('[Phase8] Stay mirror write unexpected error:', err);
  }
}

export async function mirrorWriteStayOnCheckOut(reservationId: string): Promise<void> {
  try {
    // Find the stay
    const { data: stay } = await supabase
      .from('stays')
      .select('id')
      .eq('reservation_id', reservationId)
      .single();

    if (!stay) return;

    // Update stay status
    const { error: stayErr } = await supabase
      .from('stays')
      .update({ status: 'checked_out' } as any)
      .eq('id', stay.id);

    if (stayErr) {
      console.warn('[Phase8] Stay checkout mirror failed:', stayErr.message);
    }

    // Release active room assignment
    const { error: raErr } = await supabase
      .from('room_assignments')
      .update({ released_at: new Date().toISOString() } as any)
      .eq('stay_id', stay.id)
      .is('released_at', null);

    if (raErr) {
      console.warn('[Phase8] room_assignments release failed:', raErr.message);
    }
  } catch (err) {
    console.warn('[Phase8] Stay checkout mirror unexpected error:', err);
  }
}
