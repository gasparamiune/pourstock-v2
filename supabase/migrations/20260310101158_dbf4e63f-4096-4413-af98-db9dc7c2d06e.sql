
-- H3: Reconciliation helper functions

-- Re-mirror a single stay from its reservation
CREATE OR REPLACE FUNCTION public.reconcile_stay_from_reservation(_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res record;
  _stay_id uuid;
  _result jsonb := '{}';
BEGIN
  -- Fetch reservation
  SELECT id, hotel_id, room_id, guest_id, check_in_date, check_out_date, status, source, special_requests
  INTO _res FROM reservations WHERE id = _reservation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'reservation_not_found');
  END IF;

  -- Verify caller is admin/manager for this hotel
  IF NOT is_hotel_admin_or_manager(auth.uid(), _res.hotel_id) THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  -- Determine stay status from reservation status
  DECLARE _stay_status text;
  BEGIN
    _stay_status := CASE
      WHEN _res.status IN ('checked_in') THEN 'checked_in'
      WHEN _res.status IN ('checked_out') THEN 'checked_out'
      ELSE 'confirmed'
    END;
  END;

  -- Upsert stay
  INSERT INTO stays (hotel_id, room_id, check_in, check_out, status, source, notes, reservation_id)
  VALUES (_res.hotel_id, _res.room_id, _res.check_in_date, _res.check_out_date,
          CASE WHEN _res.status IN ('checked_in') THEN 'checked_in'
               WHEN _res.status IN ('checked_out') THEN 'checked_out'
               ELSE 'confirmed' END,
          _res.source, _res.special_requests, _reservation_id)
  ON CONFLICT (reservation_id) DO UPDATE SET
    room_id = EXCLUDED.room_id,
    check_in = EXCLUDED.check_in,
    check_out = EXCLUDED.check_out,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO _stay_id;

  -- Upsert stay_guest
  INSERT INTO stay_guests (stay_id, guest_id, is_primary)
  VALUES (_stay_id, _res.guest_id, true)
  ON CONFLICT (stay_id, guest_id) DO NOTHING;

  -- Ensure room_assignment exists
  INSERT INTO room_assignments (stay_id, room_id)
  SELECT _stay_id, _res.room_id
  WHERE NOT EXISTS (
    SELECT 1 FROM room_assignments WHERE stay_id = _stay_id AND released_at IS NULL
  );

  -- If checked_out, release room assignment
  IF _res.status = 'checked_out' THEN
    UPDATE room_assignments SET released_at = now()
    WHERE stay_id = _stay_id AND released_at IS NULL;
  END IF;

  RETURN jsonb_build_object('success', true, 'stay_id', _stay_id, 'reservation_id', _reservation_id);
END;
$$;

-- Re-mirror folio items from room_charges for a reservation
CREATE OR REPLACE FUNCTION public.reconcile_folio_from_charges(_reservation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res record;
  _folio_id uuid;
  _charge record;
  _items_created int := 0;
BEGIN
  -- Fetch reservation
  SELECT id, hotel_id, guest_id FROM reservations WHERE id = _reservation_id INTO _res;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'reservation_not_found');
  END IF;

  -- Verify caller
  IF NOT is_hotel_admin_or_manager(auth.uid(), _res.hotel_id) THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  -- Find or create folio
  SELECT id INTO _folio_id FROM folios WHERE reservation_id = _reservation_id AND hotel_id = _res.hotel_id LIMIT 1;

  IF _folio_id IS NULL THEN
    INSERT INTO folios (hotel_id, reservation_id, guest_id, status, currency)
    VALUES (_res.hotel_id, _reservation_id, _res.guest_id, 'open', 'DKK')
    RETURNING id INTO _folio_id;
  END IF;

  -- Upsert folio items from room charges
  FOR _charge IN
    SELECT id, description, amount, charge_type FROM room_charges
    WHERE reservation_id = _reservation_id AND hotel_id = _res.hotel_id
  LOOP
    INSERT INTO folio_items (folio_id, description, amount, charge_type, source_id, source_type)
    VALUES (_folio_id, _charge.description, _charge.amount, _charge.charge_type::text, _charge.id, 'room_charge')
    ON CONFLICT (source_id, source_type) WHERE source_id IS NOT NULL DO UPDATE SET
      amount = EXCLUDED.amount,
      description = EXCLUDED.description;
    _items_created := _items_created + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'folio_id', _folio_id, 'items_processed', _items_created);
END;
$$;
