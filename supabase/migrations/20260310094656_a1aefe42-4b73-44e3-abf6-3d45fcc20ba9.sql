
-- Phase 7: Restaurant domain relational mirror tables

-- Restaurant reservations (mirrors data from table_plans.assignments_json)
CREATE TABLE public.restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  guest_name text NOT NULL DEFAULT '',
  party_size integer NOT NULL DEFAULT 1,
  room_number text DEFAULT '',
  course text DEFAULT '',
  dietary text DEFAULT '',
  notes text DEFAULT '',
  service_period_id uuid REFERENCES public.service_periods(id),
  restaurant_id uuid REFERENCES public.restaurants(id),
  plan_date date NOT NULL,
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate mirror rows: unique on (hotel_id, plan_date, guest_name, room_number, party_size)
CREATE UNIQUE INDEX idx_restaurant_reservations_dedup
  ON public.restaurant_reservations (hotel_id, plan_date, guest_name, room_number, party_size);

CREATE INDEX idx_restaurant_reservations_hotel_date
  ON public.restaurant_reservations (hotel_id, plan_date);

-- Table assignments (links reservations to physical tables)
CREATE TABLE public.table_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.restaurant_reservations(id) ON DELETE CASCADE,
  table_id text NOT NULL,
  position_index integer NOT NULL DEFAULT 0,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'assigned',
  assigned_by uuid
);

-- Prevent duplicate assignment rows
CREATE UNIQUE INDEX idx_table_assignments_dedup
  ON public.table_assignments (reservation_id, table_id);

CREATE INDEX idx_table_assignments_reservation
  ON public.table_assignments (reservation_id);

-- Enable RLS
ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: restaurant_reservations
CREATE POLICY "Members can view restaurant reservations"
  ON public.restaurant_reservations FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Restaurant/admin can insert restaurant reservations"
  ON public.restaurant_reservations FOR INSERT TO authenticated
  WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin')
    OR has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "Restaurant/admin can update restaurant reservations"
  ON public.restaurant_reservations FOR UPDATE TO authenticated
  USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin')
    OR has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "Restaurant/admin can delete restaurant reservations"
  ON public.restaurant_reservations FOR DELETE TO authenticated
  USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin')
    OR has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

-- RLS: table_assignments (via reservation's hotel_id)
CREATE POLICY "Members can view table assignments"
  ON public.table_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_reservations rr
      WHERE rr.id = reservation_id AND is_hotel_member(auth.uid(), rr.hotel_id)
    )
  );

CREATE POLICY "Restaurant/admin can insert table assignments"
  ON public.table_assignments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurant_reservations rr
      WHERE rr.id = reservation_id
      AND (has_hotel_role(auth.uid(), rr.hotel_id, 'hotel_admin')
           OR has_hotel_department(auth.uid(), rr.hotel_id, 'restaurant'))
    )
  );

CREATE POLICY "Restaurant/admin can update table assignments"
  ON public.table_assignments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_reservations rr
      WHERE rr.id = reservation_id
      AND (has_hotel_role(auth.uid(), rr.hotel_id, 'hotel_admin')
           OR has_hotel_department(auth.uid(), rr.hotel_id, 'restaurant'))
    )
  );

CREATE POLICY "Restaurant/admin can delete table assignments"
  ON public.table_assignments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_reservations rr
      WHERE rr.id = reservation_id
      AND (has_hotel_role(auth.uid(), rr.hotel_id, 'hotel_admin')
           OR has_hotel_department(auth.uid(), rr.hotel_id, 'restaurant'))
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_updated_at_restaurant_reservations
  BEFORE UPDATE ON public.restaurant_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
