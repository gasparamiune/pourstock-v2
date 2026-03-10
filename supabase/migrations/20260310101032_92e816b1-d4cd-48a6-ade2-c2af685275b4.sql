
-- H2: Structured dual-write failure logging

CREATE TABLE public.dual_write_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id),
  domain text NOT NULL,
  operation text NOT NULL,
  source_record_id uuid,
  payload jsonb,
  error_message text,
  error_code text,
  retryable boolean DEFAULT true,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dwf_hotel_domain ON public.dual_write_failures(hotel_id, domain);
CREATE INDEX idx_dwf_unresolved ON public.dual_write_failures(hotel_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_dwf_created ON public.dual_write_failures(created_at);

ALTER TABLE public.dual_write_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view dual write failures" ON public.dual_write_failures
  FOR SELECT TO authenticated
  USING (
    hotel_id IS NULL
    OR has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR is_hotel_admin_or_manager(auth.uid(), hotel_id)
  );

CREATE POLICY "Members can insert dual write failures" ON public.dual_write_failures
  FOR INSERT TO authenticated
  WITH CHECK (
    hotel_id IS NULL
    OR is_hotel_member(auth.uid(), hotel_id)
  );

CREATE POLICY "Admins can update dual write failures" ON public.dual_write_failures
  FOR UPDATE TO authenticated
  USING (
    hotel_id IS NULL
    OR has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
  );
