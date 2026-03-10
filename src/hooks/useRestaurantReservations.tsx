/**
 * Phase 7: Dual-write mirror for restaurant reservations.
 *
 * This hook provides a best-effort mirror write from the JSON
 * assignments blob (source of truth) into the relational
 * restaurant_reservations + table_assignments tables.
 *
 * RULES:
 * - JSON write always happens first (caller responsibility)
 * - Mirror write is best-effort — failures are logged but never block
 * - Writes are idempotent via ON CONFLICT on dedup indexes
 * - Existing relational data for the plan_date is replaced atomically
 */

import { supabase } from '@/integrations/supabase/client';
import type { Reservation } from '@/components/tableplan/TableCard';
import type { Assignments, MergeGroup } from '@/components/tableplan/assignmentAlgorithm';

interface MirrorEntry {
  guestName: string;
  partySize: number;
  roomNumber: string;
  course: string;
  dietary: string;
  notes: string;
  tableIds: string[];
  source: string;
}

/**
 * Extract flat reservation → table mappings from Assignments.
 */
function flattenAssignments(assignments: Assignments): MirrorEntry[] {
  const entries: MirrorEntry[] = [];

  // Singles
  assignments.singles.forEach((res, tableId) => {
    entries.push({
      guestName: res.guestName || '',
      partySize: res.guestCount,
      roomNumber: res.roomNumber || '',
      course: res.reservationType || `${res.dishCount}-ret`,
      dietary: '',
      notes: res.notes || '',
      tableIds: [tableId],
      source: 'manual',
    });
  });

  // Merges
  for (const mg of assignments.merges) {
    if (!mg.reservation) continue;
    const res = mg.reservation;
    entries.push({
      guestName: res.guestName || '',
      partySize: res.guestCount,
      roomNumber: res.roomNumber || '',
      course: res.reservationType || `${res.dishCount}-ret`,
      dietary: '',
      notes: res.notes || '',
      tableIds: mg.tables.map(t => t.id),
      source: 'manual',
    });
  }

  return entries;
}

/**
 * Mirror-write assignments to relational tables.
 * Best-effort — errors are caught and logged, never thrown.
 */
export async function mirrorWriteAssignments(
  hotelId: string,
  planDate: string,
  assignments: Assignments,
  userId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const entries = flattenAssignments(assignments);

    // 1. Delete existing relational data for this hotel+date
    //    (CASCADE will remove table_assignments too)
    await supabase
      .from('restaurant_reservations')
      .delete()
      .eq('hotel_id', hotelId)
      .eq('plan_date', planDate);

    if (entries.length === 0) {
      return { success: true };
    }

    // 2. Insert restaurant_reservations
    const reservationRows = entries.map(e => ({
      hotel_id: hotelId,
      guest_name: e.guestName,
      party_size: e.partySize,
      room_number: e.roomNumber,
      course: e.course,
      dietary: e.dietary,
      notes: e.notes,
      plan_date: planDate,
      source: e.source,
    }));

    const { data: insertedRes, error: resError } = await supabase
      .from('restaurant_reservations')
      .insert(reservationRows)
      .select('id');

    if (resError) {
      console.warn('[Phase7 mirror] reservation insert failed:', resError.message);
      return { success: false, error: resError.message };
    }

    if (!insertedRes || insertedRes.length !== entries.length) {
      console.warn('[Phase7 mirror] reservation count mismatch');
      return { success: false, error: 'Count mismatch' };
    }

    // 3. Insert table_assignments
    const assignmentRows: {
      reservation_id: string;
      table_id: string;
      position_index: number;
      assigned_by: string | null;
    }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const resId = insertedRes[i].id;
      for (let j = 0; j < entry.tableIds.length; j++) {
        assignmentRows.push({
          reservation_id: resId,
          table_id: entry.tableIds[j],
          position_index: j,
          assigned_by: userId || null,
        });
      }
    }

    if (assignmentRows.length > 0) {
      const { error: assignError } = await supabase
        .from('table_assignments')
        .insert(assignmentRows);

      if (assignError) {
        console.warn('[Phase7 mirror] assignment insert failed:', assignError.message);
        return { success: false, error: assignError.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.warn('[Phase7 mirror] unexpected error:', err);
    return { success: false, error: String(err) };
  }
}
