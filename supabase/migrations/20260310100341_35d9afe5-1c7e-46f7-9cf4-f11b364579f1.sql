
-- Phase 10: Billing & Folios

CREATE TABLE public.folios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  stay_id uuid REFERENCES public.stays(id),
  reservation_id uuid REFERENCES public.reservations(id),
  guest_id uuid REFERENCES public.guests(id),
  status text NOT NULL DEFAULT 'open',
  total numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'DKK',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.folio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  charge_type text NOT NULL,
  source_id uuid,
  source_type text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid NOT NULL REFERENCES public.folios(id),
  amount numeric(10,2) NOT NULL,
  method text NOT NULL,
  reference text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_folios_hotel_status ON public.folios(hotel_id, status);
CREATE INDEX idx_folios_stay ON public.folios(stay_id);
CREATE INDEX idx_folios_reservation ON public.folios(reservation_id);
CREATE INDEX idx_folios_guest ON public.folios(guest_id);
CREATE INDEX idx_folio_items_folio ON public.folio_items(folio_id);
CREATE INDEX idx_folio_items_source ON public.folio_items(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX idx_payments_folio ON public.payments(folio_id);
CREATE UNIQUE INDEX idx_folio_items_source_unique ON public.folio_items(source_id, source_type) WHERE source_id IS NOT NULL;

-- RLS for folios
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view folios" ON public.folios
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Reception can insert folios" ON public.folios
  FOR INSERT TO authenticated
  WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );

CREATE POLICY "Reception can update folios" ON public.folios
  FOR UPDATE TO authenticated
  USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department)
  );

CREATE POLICY "Admins can delete folios" ON public.folios
  FOR DELETE TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- RLS for folio_items
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view folio items" ON public.folio_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.folios f WHERE f.id = folio_items.folio_id AND is_hotel_member(auth.uid(), f.hotel_id)
  ));

CREATE POLICY "Reception can insert folio items" ON public.folio_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.folios f WHERE f.id = folio_items.folio_id AND (
      has_hotel_role(auth.uid(), f.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), f.hotel_id, 'reception'::department)
    )
  ));

CREATE POLICY "Admins can delete folio items" ON public.folio_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.folios f WHERE f.id = folio_items.folio_id AND has_hotel_role(auth.uid(), f.hotel_id, 'hotel_admin'::hotel_role)
  ));

-- RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.folios f WHERE f.id = payments.folio_id AND is_hotel_member(auth.uid(), f.hotel_id)
  ));

CREATE POLICY "Reception can insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.folios f WHERE f.id = payments.folio_id AND (
      has_hotel_role(auth.uid(), f.hotel_id, 'hotel_admin'::hotel_role)
      OR has_hotel_department(auth.uid(), f.hotel_id, 'reception'::department)
    )
  ));

-- updated_at trigger for folios
CREATE TRIGGER update_folios_updated_at
  BEFORE UPDATE ON public.folios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
