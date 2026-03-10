
-- ============================================================
-- SOAK VALIDATION: Areas 1-4
-- Validation views, failure dedup, reconciliation audit trail,
-- and improved migration health thresholds
-- ============================================================

-- ── Area 1: Validation Queries Pack ──

-- 1a. Hotels with unresolved dual-write failures
CREATE OR REPLACE VIEW public.v_dw_failures_by_hotel
WITH (security_invoker = true) AS
SELECT
  dwf.hotel_id,
  h.name AS hotel_name,
  COUNT(*) AS unresolved_count,
  MIN(dwf.created_at) AS oldest_failure,
  MAX(dwf.created_at) AS newest_failure
FROM dual_write_failures dwf
JOIN hotels h ON h.id = dwf.hotel_id
WHERE dwf.resolved_at IS NULL
GROUP BY dwf.hotel_id, h.name
ORDER BY unresolved_count DESC;

-- 1b. Top failure domains/operations (24h and 7d windows)
CREATE OR REPLACE VIEW public.v_dw_failure_hotspots
WITH (security_invoker = true) AS
SELECT
  dwf.hotel_id,
  dwf.domain,
  dwf.operation,
  COUNT(*) FILTER (WHERE dwf.created_at > now() - interval '24 hours') AS failures_24h,
  COUNT(*) FILTER (WHERE dwf.created_at > now() - interval '7 days') AS failures_7d,
  COUNT(*) AS failures_total,
  MAX(dwf.created_at) AS last_failure_at
FROM dual_write_failures dwf
WHERE dwf.resolved_at IS NULL
GROUP BY dwf.hotel_id, dwf.domain, dwf.operation
ORDER BY failures_24h DESC, failures_7d DESC;

-- 1c. Duplicate stay mirrors (same reservation_id appearing more than once)
CREATE OR REPLACE VIEW public.v_duplicate_stay_mirrors
WITH (security_invoker = true) AS
SELECT
  s.hotel_id,
  s.reservation_id,
  COUNT(*) AS stay_count,
  array_agg(s.id ORDER BY s.created_at) AS stay_ids
FROM stays s
WHERE s.reservation_id IS NOT NULL
GROUP BY s.hotel_id, s.reservation_id
HAVING COUNT(*) > 1;

-- 1d. Duplicate folio mirrors (same reservation_id with multiple folios)
CREATE OR REPLACE VIEW public.v_duplicate_folio_mirrors
WITH (security_invoker = true) AS
SELECT
  f.hotel_id,
  f.reservation_id,
  COUNT(*) AS folio_count,
  array_agg(f.id ORDER BY f.created_at) AS folio_ids
FROM folios f
WHERE f.reservation_id IS NOT NULL
GROUP BY f.hotel_id, f.reservation_id
HAVING COUNT(*) > 1;

-- 1e. Reconciliation candidates ranked by impact
CREATE OR REPLACE VIEW public.v_reconciliation_candidates
WITH (security_invoker = true) AS
SELECT
  r.hotel_id,
  h.name AS hotel_name,
  r.id AS reservation_id,
  r.status AS reservation_status,
  r.check_in_date,
  r.check_out_date,
  r.total_amount,
  CASE WHEN s.id IS NULL THEN 'missing_stay' ELSE 'ok' END AS stay_status,
  CASE
    WHEN rc_count.cnt > 0 AND fi_count.cnt = 0 THEN 'missing_folio'
    WHEN rc_count.cnt > 0 AND fi_count.cnt < rc_count.cnt THEN 'partial_folio'
    ELSE 'ok'
  END AS folio_status,
  COALESCE(rc_count.cnt, 0) AS charge_count,
  COALESCE(fi_count.cnt, 0) AS folio_item_count,
  COALESCE(rc_count.total_amount, 0) AS charges_total,
  COALESCE(fi_count.total_amount, 0) AS folio_items_total
FROM reservations r
JOIN hotels h ON h.id = r.hotel_id
LEFT JOIN stays s ON s.reservation_id = r.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total_amount
  FROM room_charges WHERE reservation_id = r.id AND hotel_id = r.hotel_id
) rc_count ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, COALESCE(SUM(fi.amount), 0) AS total_amount
  FROM folio_items fi
  JOIN folios f ON f.id = fi.folio_id
  WHERE f.reservation_id = r.id AND f.hotel_id = r.hotel_id
) fi_count ON true
WHERE r.status IN ('checked_in', 'checked_out')
  AND (s.id IS NULL OR rc_count.cnt > COALESCE(fi_count.cnt, 0))
ORDER BY r.total_amount DESC NULLS LAST, r.check_in_date DESC;

-- ── Area 2: Failure Noise Control ──

-- Grouped view for near-identical unresolved failures
CREATE OR REPLACE VIEW public.v_dw_failure_groups
WITH (security_invoker = true) AS
SELECT
  hotel_id,
  domain,
  operation,
  error_code,
  LEFT(error_message, 200) AS error_signature,
  COUNT(*) AS occurrence_count,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen,
  array_agg(DISTINCT source_record_id) FILTER (WHERE source_record_id IS NOT NULL) AS affected_records
FROM dual_write_failures
WHERE resolved_at IS NULL
GROUP BY hotel_id, domain, operation, error_code, LEFT(error_message, 200)
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- ── Area 3: Reconciliation Audit Trail ──

CREATE TABLE public.reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  triggered_by uuid NOT NULL,
  action text NOT NULL,
  source_record_id uuid,
  result jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation logs"
  ON public.reconciliation_log FOR SELECT TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

CREATE POLICY "Admins can insert reconciliation logs"
  ON public.reconciliation_log FOR INSERT TO authenticated
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

CREATE INDEX idx_reconciliation_log_hotel ON reconciliation_log(hotel_id, created_at DESC);

-- ── Area 4: Improved v_migration_health with percentage thresholds ──

DROP VIEW IF EXISTS public.v_migration_health;

CREATE OR REPLACE VIEW public.v_migration_health
WITH (security_invoker = true) AS
WITH stay_stats AS (
  SELECT
    r.hotel_id,
    COUNT(*) AS total_primary,
    COUNT(s.id) AS matched,
    COUNT(*) FILTER (WHERE s.id IS NULL) AS missing,
    COUNT(*) FILTER (WHERE s.id IS NOT NULL AND (
      s.status IS DISTINCT FROM
        CASE WHEN r.status = 'checked_in' THEN 'checked_in'
             WHEN r.status = 'checked_out' THEN 'checked_out'
             ELSE 'confirmed' END
      OR s.room_id IS DISTINCT FROM r.room_id
    )) AS mismatched
  FROM reservations r
  LEFT JOIN stays s ON s.reservation_id = r.id
  WHERE r.status IN ('confirmed','checked_in','checked_out')
  GROUP BY r.hotel_id
),
folio_stats AS (
  SELECT
    rc.hotel_id,
    COUNT(*) AS total_primary,
    COUNT(fi.id) AS matched,
    COUNT(*) FILTER (WHERE fi.id IS NULL) AS missing,
    COUNT(*) FILTER (WHERE fi.id IS NOT NULL AND fi.amount IS DISTINCT FROM rc.amount) AS amount_mismatches
  FROM room_charges rc
  LEFT JOIN folio_items fi ON fi.source_id = rc.id AND fi.source_type = 'room_charge'
  GROUP BY rc.hotel_id
),
dw_stats AS (
  SELECT
    hotel_id,
    COUNT(*) FILTER (WHERE resolved_at IS NULL) AS unresolved,
    MAX(created_at) FILTER (WHERE resolved_at IS NULL) AS last_failure_at
  FROM dual_write_failures
  GROUP BY hotel_id
),
ai_stats AS (
  SELECT hotel_id,
    COUNT(*) FILTER (WHERE status = 'failed' AND created_at > now() - interval '7 days') AS failed_7d
  FROM ai_jobs GROUP BY hotel_id
),
int_stats AS (
  SELECT i.hotel_id,
    COUNT(*) FILTER (WHERE ie.status = 'failed' AND ie.created_at > now() - interval '7 days') AS failed_7d
  FROM integration_events ie
  JOIN integrations i ON i.id = ie.integration_id
  GROUP BY i.hotel_id
)
SELECT
  now() AS evaluated_at,
  h.id AS hotel_id,
  h.name AS hotel_name,
  COALESCE(ss.total_primary, 0) AS stay_total_primary,
  COALESCE(ss.matched, 0) AS stay_matched,
  COALESCE(ss.missing, 0) AS stay_missing,
  COALESCE(ss.mismatched, 0) AS stay_mismatched,
  CASE WHEN COALESCE(ss.total_primary, 0) = 0 THEN 100
       ELSE ROUND(100.0 * ss.matched / ss.total_primary, 1)
  END AS stay_parity_pct,
  COALESCE(fs.total_primary, 0) AS folio_total_primary,
  COALESCE(fs.matched, 0) AS folio_matched,
  COALESCE(fs.missing, 0) AS folio_missing,
  COALESCE(fs.amount_mismatches, 0) AS folio_amount_mismatches,
  CASE WHEN COALESCE(fs.total_primary, 0) = 0 THEN 100
       ELSE ROUND(100.0 * fs.matched / fs.total_primary, 1)
  END AS folio_parity_pct,
  COALESCE(dws.unresolved, 0) AS unresolved_dw_failures,
  dws.last_failure_at,
  COALESCE(ais.failed_7d, 0) AS ai_failed_jobs_7d,
  COALESCE(ints.failed_7d, 0) AS integration_failed_7d,
  CASE
    WHEN COALESCE(dws.unresolved, 0) > 20 THEN 'not_ready'
    WHEN COALESCE(ss.missing, 0) > GREATEST(5, COALESCE(ss.total_primary, 0) * 0.05) THEN 'not_ready'
    WHEN COALESCE(fs.missing, 0) > GREATEST(5, COALESCE(fs.total_primary, 0) * 0.05) THEN 'not_ready'
    WHEN COALESCE(dws.unresolved, 0) > 5
      OR COALESCE(ss.missing, 0) > GREATEST(2, COALESCE(ss.total_primary, 0) * 0.02) THEN 'monitor'
    WHEN COALESCE(fs.amount_mismatches, 0) > 0 THEN 'monitor'
    ELSE 'healthy'
  END AS recommendation
FROM hotels h
LEFT JOIN stay_stats ss ON ss.hotel_id = h.id
LEFT JOIN folio_stats fs ON fs.hotel_id = h.id
LEFT JOIN dw_stats dws ON dws.hotel_id = h.id
LEFT JOIN ai_stats ais ON ais.hotel_id = h.id
LEFT JOIN int_stats ints ON ints.hotel_id = h.id
WHERE h.is_active = true;
