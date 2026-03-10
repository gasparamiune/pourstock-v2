
-- H1: Enhanced Parity Observability

-- Drop existing basic views
DROP VIEW IF EXISTS public.v_stay_parity;
DROP VIEW IF EXISTS public.v_folio_parity;

-- Enhanced stay parity: detects missing, status mismatch, room mismatch
CREATE OR REPLACE VIEW public.v_stay_parity AS
SELECT
  r.hotel_id,
  r.id AS reservation_id,
  r.status AS reservation_status,
  r.room_id AS reservation_room_id,
  r.check_in_date AS reservation_check_in,
  r.check_out_date AS reservation_check_out,
  r.updated_at AS reservation_updated_at,
  s.id AS stay_id,
  s.status AS stay_status,
  s.room_id AS stay_room_id,
  s.check_in AS stay_check_in,
  s.check_out AS stay_check_out,
  CASE
    WHEN s.id IS NULL THEN 'missing_stay'
    WHEN r.status = 'checked_in' AND s.status != 'checked_in' THEN 'status_mismatch'
    WHEN r.status = 'checked_out' AND s.status != 'checked_out' THEN 'status_mismatch'
    WHEN r.room_id != s.room_id THEN 'room_mismatch'
    ELSE 'matched'
  END AS parity_status
FROM public.reservations r
LEFT JOIN public.stays s ON s.reservation_id = r.id
WHERE r.status IN ('confirmed', 'checked_in', 'checked_out');

ALTER VIEW public.v_stay_parity SET (security_invoker = true);

-- Check for duplicate stays per reservation
CREATE OR REPLACE VIEW public.v_stay_duplicates AS
SELECT
  s.hotel_id,
  s.reservation_id,
  COUNT(*) AS stay_count
FROM public.stays s
WHERE s.reservation_id IS NOT NULL
GROUP BY s.hotel_id, s.reservation_id
HAVING COUNT(*) > 1;

ALTER VIEW public.v_stay_duplicates SET (security_invoker = true);

-- Enhanced folio parity: detects missing items and amount mismatches
CREATE OR REPLACE VIEW public.v_folio_parity AS
SELECT
  rc.hotel_id,
  rc.id AS charge_id,
  rc.reservation_id,
  rc.description AS charge_description,
  rc.amount AS charge_amount,
  rc.charge_type,
  rc.created_at AS charge_created_at,
  fi.id AS folio_item_id,
  fi.amount AS folio_amount,
  fi.folio_id,
  CASE
    WHEN fi.id IS NULL THEN 'missing_folio_item'
    WHEN rc.amount != fi.amount THEN 'amount_mismatch'
    ELSE 'matched'
  END AS parity_status,
  CASE
    WHEN fi.id IS NOT NULL AND rc.amount != fi.amount
    THEN rc.amount - fi.amount
    ELSE NULL
  END AS amount_drift
FROM public.room_charges rc
LEFT JOIN public.folio_items fi ON fi.source_id = rc.id AND fi.source_type = 'room_charge';

ALTER VIEW public.v_folio_parity SET (security_invoker = true);

-- Per-hotel parity summary
CREATE OR REPLACE VIEW public.v_parity_summary AS
SELECT
  hotel_id,
  -- Stay parity
  COUNT(*) FILTER (WHERE src = 'stay') AS stay_total_primary,
  COUNT(*) FILTER (WHERE src = 'stay' AND parity = 'matched') AS stay_matched,
  COUNT(*) FILTER (WHERE src = 'stay' AND parity = 'missing_stay') AS stay_missing_count,
  COUNT(*) FILTER (WHERE src = 'stay' AND parity IN ('status_mismatch', 'room_mismatch')) AS stay_mismatch_count,
  -- Folio parity
  COUNT(*) FILTER (WHERE src = 'folio') AS folio_total_primary,
  COUNT(*) FILTER (WHERE src = 'folio' AND parity = 'matched') AS folio_matched,
  COUNT(*) FILTER (WHERE src = 'folio' AND parity = 'missing_folio_item') AS folio_missing_count,
  COUNT(*) FILTER (WHERE src = 'folio' AND parity = 'amount_mismatch') AS folio_amount_mismatch_count,
  now() AS evaluated_at
FROM (
  SELECT hotel_id, 'stay' AS src, parity_status AS parity FROM public.v_stay_parity
  UNION ALL
  SELECT hotel_id, 'folio' AS src, parity_status AS parity FROM public.v_folio_parity
) combined
GROUP BY hotel_id;

ALTER VIEW public.v_parity_summary SET (security_invoker = true);

-- Time-windowed drift helper: recent 24h
CREATE OR REPLACE VIEW public.v_recent_stay_drift AS
SELECT * FROM public.v_stay_parity
WHERE parity_status != 'matched'
  AND reservation_updated_at > now() - interval '24 hours';

ALTER VIEW public.v_recent_stay_drift SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_recent_folio_drift AS
SELECT * FROM public.v_folio_parity
WHERE parity_status != 'matched'
  AND charge_created_at > now() - interval '24 hours';

ALTER VIEW public.v_recent_folio_drift SET (security_invoker = true);
