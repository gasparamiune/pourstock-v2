
-- Phase 9: Front Office & Housekeeping Events

-- checkin_events
CREATE TABLE public.checkin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  stay_id uuid REFERENCES public.stays(id),
  reservation_id uuid REFERENCES public.reservations(id),
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- checkout_events
CREATE TABLE public.checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  stay_id uuid REFERENCES public.stays(id),
  reservation_id uuid REFERENCES public.reservations(id),
  performed_by uuid NOT NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  balance_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Additive column on housekeeping_tasks
ALTER TABLE public.housekeeping_tasks ADD COLUMN IF NOT EXISTS triggered_by_event_id uuid;

-- Indexes
CREATE INDEX idx_checkin_events_hotel_time ON public.checkin_events(hotel_id, performed_at);
CREATE INDEX idx_checkin_events_reservation ON public.checkin_events(reservation_id);
CREATE INDEX idx_checkin_events_stay ON public.checkin_events(stay_id);
CREATE INDEX idx_checkout_events_hotel_time ON public.checkout_events(hotel_id, performed_at);
CREATE INDEX idx_checkout_events_reservation ON public.checkout_events(reservation_id);
CREATE INDEX idx_checkout_events_stay ON public.checkout_events(stay_id);

-- RLS for checkin_events
ALTER TABLE public.checkin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checkin events" ON public.checkin_events
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Reception can insert checkin events" ON public.checkin_events
  FOR INSERT TO authenticated
  WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );

-- RLS for checkout_events
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checkout events" ON public.checkout_events
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Reception can insert checkout events" ON public.checkout_events
  FOR INSERT TO authenticated
  WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );
