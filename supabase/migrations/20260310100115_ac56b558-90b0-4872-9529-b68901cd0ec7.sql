
-- Phase 8: Guest & Stay Domain Model
-- stays table
CREATE TABLE public.stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  check_in timestamptz NOT NULL,
  check_out timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  source text,
  notes text,
  reservation_id uuid REFERENCES public.reservations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stay_guests table
CREATE TABLE public.stay_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id),
  is_primary boolean DEFAULT false,
  relation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- room_assignments table
CREATE TABLE public.room_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_stays_hotel_status ON public.stays(hotel_id, status);
CREATE INDEX idx_stays_hotel_dates ON public.stays(hotel_id, check_in, check_out);
CREATE UNIQUE INDEX idx_stays_reservation_unique ON public.stays(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX idx_stay_guests_stay ON public.stay_guests(stay_id);
CREATE INDEX idx_stay_guests_guest ON public.stay_guests(guest_id);
CREATE INDEX idx_room_assignments_stay ON public.room_assignments(stay_id);
CREATE INDEX idx_room_assignments_room ON public.room_assignments(room_id);

-- RLS for stays
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view stays" ON public.stays
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Reception can insert stays" ON public.stays
  FOR INSERT TO authenticated
  WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );

CREATE POLICY "Reception can update stays" ON public.stays
  FOR UPDATE TO authenticated
  USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );

CREATE POLICY "Admins can delete stays" ON public.stays
  FOR DELETE TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- RLS for stay_guests
ALTER TABLE public.stay_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view stay guests" ON public.stay_guests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = stay_guests.stay_id AND is_hotel_member(auth.uid(), s.hotel_id)
  ));

CREATE POLICY "Reception can insert stay guests" ON public.stay_guests
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = stay_guests.stay_id AND (
      has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), s.hotel_id, 'reception'::department)
    )
  ));

CREATE POLICY "Reception can update stay guests" ON public.stay_guests
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = stay_guests.stay_id AND (
      has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), s.hotel_id, 'reception'::department)
    )
  ));

CREATE POLICY "Admins can delete stay guests" ON public.stay_guests
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = stay_guests.stay_id AND has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
  ));

-- RLS for room_assignments
ALTER TABLE public.room_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room assignments" ON public.room_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = room_assignments.stay_id AND is_hotel_member(auth.uid(), s.hotel_id)
  ));

CREATE POLICY "Reception can insert room assignments" ON public.room_assignments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = room_assignments.stay_id AND (
      has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), s.hotel_id, 'reception'::department)
    )
  ));

CREATE POLICY "Reception can update room assignments" ON public.room_assignments
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = room_assignments.stay_id AND (
      has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), s.hotel_id, 'reception'::department)
    )
  ));

CREATE POLICY "Admins can delete room assignments" ON public.room_assignments
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stays s WHERE s.id = room_assignments.stay_id AND has_hotel_role(auth.uid(), s.hotel_id, 'hotel_admin'::hotel_role)
  ));

-- updated_at trigger for stays
CREATE TRIGGER update_stays_updated_at
  BEFORE UPDATE ON public.stays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
