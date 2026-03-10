
-- H4: Operational Auditability - additive metadata columns

-- stays: add created_by to track who triggered the mirror
ALTER TABLE public.stays ADD COLUMN IF NOT EXISTS created_by uuid;

-- folios: add created_by
ALTER TABLE public.folios ADD COLUMN IF NOT EXISTS created_by uuid;

-- checkin_events: already has performed_by ✓
-- checkout_events: already has performed_by ✓
-- folio_items: already has created_by ✓
-- payments: already has created_by ✓
-- room_assignments: no actor needed (system-generated)
-- stay_guests: no actor needed (system-generated)

-- Add source tracking to stays for origin identification
-- (source column already exists on stays ✓)

-- Add indexes for auditability queries
CREATE INDEX IF NOT EXISTS idx_stays_created_by ON public.stays(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_folios_created_by ON public.folios(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkin_events_performer ON public.checkin_events(performed_by);
CREATE INDEX IF NOT EXISTS idx_checkout_events_performer ON public.checkout_events(performed_by);
