
-- Phase 12: Analytics Views (additive only, no legacy removal)

-- Daily occupancy view
CREATE OR REPLACE VIEW public.v_daily_occupancy AS
SELECT
  r.hotel_id,
  r.check_in_date AS date,
  COUNT(DISTINCT r.room_id) AS rooms_occupied,
  SUM(r.adults) AS total_adults,
  SUM(r.children) AS total_children,
  COUNT(*) AS reservation_count
FROM public.reservations r
WHERE r.status IN ('confirmed', 'checked_in')
GROUP BY r.hotel_id, r.check_in_date;

-- Revenue summary view
CREATE OR REPLACE VIEW public.v_revenue_summary AS
SELECT
  rc.hotel_id,
  DATE(rc.created_at) AS date,
  rc.charge_type,
  COUNT(*) AS charge_count,
  SUM(rc.amount) AS total_amount
FROM public.room_charges rc
GROUP BY rc.hotel_id, DATE(rc.created_at), rc.charge_type;

-- Stay parity check view (for validation)
CREATE OR REPLACE VIEW public.v_stay_parity AS
SELECT
  r.hotel_id,
  r.id AS reservation_id,
  r.status AS reservation_status,
  s.id AS stay_id,
  s.status AS stay_status,
  CASE WHEN s.id IS NULL THEN 'missing_stay' ELSE 'matched' END AS parity_status
FROM public.reservations r
LEFT JOIN public.stays s ON s.reservation_id = r.id
WHERE r.status IN ('checked_in', 'checked_out');

-- Folio parity check view
CREATE OR REPLACE VIEW public.v_folio_parity AS
SELECT
  rc.hotel_id,
  rc.id AS charge_id,
  rc.reservation_id,
  rc.amount AS charge_amount,
  fi.id AS folio_item_id,
  fi.amount AS folio_amount,
  CASE WHEN fi.id IS NULL THEN 'missing_folio_item' ELSE 'matched' END AS parity_status
FROM public.room_charges rc
LEFT JOIN public.folio_items fi ON fi.source_id = rc.id AND fi.source_type = 'room_charge';
