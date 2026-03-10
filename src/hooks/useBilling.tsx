import { supabase } from '@/integrations/supabase/client';
import { logDualWriteFailure } from '@/lib/dualWriteLogger';

/**
 * Phase 10: Best-effort folio mirror writes.
 * room_charges remains primary source of truth.
 */

export async function mirrorChargeToFolio(params: {
  hotelId: string;
  reservationId: string;
  chargeId: string;
  description: string;
  amount: number;
  chargeType: string;
  createdBy?: string;
}): Promise<void> {
  try {
    let { data: folio } = await supabase
      .from('folios')
      .select('id')
      .eq('hotel_id', params.hotelId)
      .eq('reservation_id', params.reservationId)
      .limit(1)
      .single();

    if (!folio) {
      const { data: res } = await supabase
        .from('reservations')
        .select('guest_id')
        .eq('id', params.reservationId)
        .single();

      const { data: stay } = await supabase
        .from('stays')
        .select('id')
        .eq('reservation_id', params.reservationId)
        .single();

      const { data: newFolio, error: folioErr } = await supabase
        .from('folios')
        .insert({
          hotel_id: params.hotelId,
          reservation_id: params.reservationId,
          guest_id: res?.guest_id || null,
          stay_id: stay?.id || null,
          status: 'open',
          currency: 'DKK',
        } as any)
        .select('id')
        .single();

      if (folioErr || !newFolio) {
        console.warn('[Phase10] Folio creation failed:', folioErr?.message);
        logDualWriteFailure({ hotelId: params.hotelId, domain: 'billing', operation: 'create_folio', sourceRecordId: params.reservationId, error: folioErr || 'no data returned' });
        return;
      }
      folio = newFolio;
    }

    const { error: itemErr } = await supabase
      .from('folio_items')
      .upsert({
        folio_id: folio.id,
        description: params.description,
        amount: params.amount,
        charge_type: params.chargeType,
        source_id: params.chargeId,
        source_type: 'room_charge',
        created_by: params.createdBy || null,
      } as any, { onConflict: 'source_id,source_type' });

    if (itemErr) {
      console.warn('[Phase10] Folio item mirror failed:', itemErr.message);
      logDualWriteFailure({ hotelId: params.hotelId, domain: 'billing', operation: 'mirror_charge', sourceRecordId: params.chargeId, error: itemErr });
    }
  } catch (err) {
    console.warn('[Phase10] Folio mirror unexpected error:', err);
    logDualWriteFailure({ hotelId: params.hotelId, domain: 'billing', operation: 'mirror_charge', sourceRecordId: params.chargeId, error: err });
  }
}
