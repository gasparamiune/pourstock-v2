
-- Add unique constraint for stay_guests upsert idempotency
CREATE UNIQUE INDEX idx_stay_guests_unique ON public.stay_guests(stay_id, guest_id);
