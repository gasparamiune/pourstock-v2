
-- Phase 11: Integrations & AI Automation

CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  type text NOT NULL,
  provider text NOT NULL,
  config jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id),
  event_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  job_type text NOT NULL,
  input jsonb,
  output jsonb,
  status text DEFAULT 'pending',
  model text,
  duration_ms integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_integrations_hotel_status ON public.integrations(hotel_id, status);
CREATE INDEX idx_integration_events_integration ON public.integration_events(integration_id);
CREATE INDEX idx_integration_events_status ON public.integration_events(status, created_at);
CREATE INDEX idx_ai_jobs_hotel_status ON public.ai_jobs(hotel_id, status);
CREATE INDEX idx_ai_jobs_hotel_time ON public.ai_jobs(hotel_id, created_at);

-- RLS for integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view integrations" ON public.integrations
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Admins can manage integrations" ON public.integrations
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- RLS for integration_events
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view integration events" ON public.integration_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.integrations i WHERE i.id = integration_events.integration_id AND is_hotel_member(auth.uid(), i.hotel_id)
  ));

CREATE POLICY "Admins can insert integration events" ON public.integration_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.integrations i WHERE i.id = integration_events.integration_id AND has_hotel_role(auth.uid(), i.hotel_id, 'hotel_admin'::hotel_role)
  ));

-- RLS for ai_jobs
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view AI jobs" ON public.ai_jobs
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Members can insert AI jobs" ON public.ai_jobs
  FOR INSERT TO authenticated
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Members can update AI jobs" ON public.ai_jobs
  FOR UPDATE TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

-- updated_at trigger
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
