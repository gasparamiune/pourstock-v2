
-- H6: Production Readiness Dashboard View

CREATE OR REPLACE VIEW public.v_migration_health AS
SELECT
  h.id AS hotel_id,
  h.name AS hotel_name,
  -- Stay parity
  COALESCE(sp.stay_total_primary, 0) AS stay_total_primary,
  COALESCE(sp.stay_matched, 0) AS stay_matched,
  COALESCE(sp.stay_missing_count, 0) AS stay_missing,
  COALESCE(sp.stay_mismatch_count, 0) AS stay_mismatched,
  CASE WHEN COALESCE(sp.stay_total_primary, 0) = 0 THEN 100.0
       ELSE ROUND(COALESCE(sp.stay_matched, 0)::numeric / sp.stay_total_primary * 100, 1)
  END AS stay_parity_pct,
  -- Folio parity
  COALESCE(sp.folio_total_primary, 0) AS folio_total_primary,
  COALESCE(sp.folio_matched, 0) AS folio_matched,
  COALESCE(sp.folio_missing_count, 0) AS folio_missing,
  COALESCE(sp.folio_amount_mismatch_count, 0) AS folio_amount_mismatches,
  CASE WHEN COALESCE(sp.folio_total_primary, 0) = 0 THEN 100.0
       ELSE ROUND(COALESCE(sp.folio_matched, 0)::numeric / sp.folio_total_primary * 100, 1)
  END AS folio_parity_pct,
  -- Dual-write failures
  COALESCE(dwf.unresolved_failures, 0) AS unresolved_dw_failures,
  dwf.last_failure_at,
  -- AI job failures (last 7d)
  COALESCE(aj.failed_jobs_7d, 0) AS ai_failed_jobs_7d,
  -- Integration failures (last 7d)
  COALESCE(ie.failed_events_7d, 0) AS integration_failed_7d,
  -- Recommendation
  CASE
    WHEN COALESCE(dwf.unresolved_failures, 0) > 10 THEN 'not_ready'
    WHEN COALESCE(sp.stay_missing_count, 0) + COALESCE(sp.folio_missing_count, 0) > 5 THEN 'monitor'
    WHEN COALESCE(sp.stay_mismatch_count, 0) + COALESCE(sp.folio_amount_mismatch_count, 0) > 0 THEN 'monitor'
    ELSE 'healthy'
  END AS recommendation,
  now() AS evaluated_at
FROM public.hotels h
LEFT JOIN public.v_parity_summary sp ON sp.hotel_id = h.id
LEFT JOIN (
  SELECT hotel_id,
    COUNT(*) FILTER (WHERE resolved_at IS NULL) AS unresolved_failures,
    MAX(created_at) FILTER (WHERE resolved_at IS NULL) AS last_failure_at
  FROM public.dual_write_failures GROUP BY hotel_id
) dwf ON dwf.hotel_id = h.id
LEFT JOIN (
  SELECT hotel_id, COUNT(*) AS failed_jobs_7d
  FROM public.ai_jobs
  WHERE status = 'failed' AND created_at > now() - interval '7 days'
  GROUP BY hotel_id
) aj ON aj.hotel_id = h.id
LEFT JOIN (
  SELECT i.hotel_id, COUNT(*) AS failed_events_7d
  FROM public.integration_events ie2
  JOIN public.integrations i ON i.id = ie2.integration_id
  WHERE ie2.status = 'failed' AND ie2.created_at > now() - interval '7 days'
  GROUP BY i.hotel_id
) ie ON ie.hotel_id = h.id
WHERE h.is_active = true;

ALTER VIEW public.v_migration_health SET (security_invoker = true);
