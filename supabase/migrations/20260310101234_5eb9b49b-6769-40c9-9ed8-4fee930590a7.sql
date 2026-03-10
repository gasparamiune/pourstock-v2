
-- H5: Index & Performance Review
-- Verify/add missing FK and query-path indexes across all Phase 8-12 tables

-- stays: hotel_id already in composite indexes. Add reservation_id standalone for lookups.
CREATE INDEX IF NOT EXISTS idx_stays_reservation ON public.stays(reservation_id) WHERE reservation_id IS NOT NULL;

-- folios: reservation_id, stay_id, guest_id already indexed ✓
-- folio_items: folio_id already indexed ✓

-- checkin_events: reservation_id, stay_id already indexed ✓
-- checkout_events: reservation_id, stay_id already indexed ✓

-- dual_write_failures: add domain+operation for diagnostics
CREATE INDEX IF NOT EXISTS idx_dwf_domain_op ON public.dual_write_failures(domain, operation);

-- integration_events: add created_at for time queries
CREATE INDEX IF NOT EXISTS idx_integration_events_created ON public.integration_events(created_at);

-- ai_jobs: add status for pending job queries
CREATE INDEX IF NOT EXISTS idx_ai_jobs_pending ON public.ai_jobs(status) WHERE status = 'pending';

-- payments: add created_at for history
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at);

-- room_assignments: add composite for active assignment lookups
CREATE INDEX IF NOT EXISTS idx_room_assignments_active ON public.room_assignments(room_id, released_at) WHERE released_at IS NULL;
