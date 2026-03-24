-- Phase 7: GDPR & Compliance
-- gdpr_consents, data_retention_policies tables + RLS

-- ── GDPR Consents ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gdpr_consents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id      uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  consent_type  text NOT NULL, -- 'terms_of_service' | 'privacy_policy' | 'marketing'
  consented_at  timestamptz NOT NULL DEFAULT NOW(),
  ip_address    text,
  version       text NOT NULL DEFAULT '1.0',
  withdrawn_at  timestamptz,
  created_at    timestamptz DEFAULT NOW()
);

ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel members can view their own consents"
  ON public.gdpr_consents FOR SELECT
  USING (user_id = auth.uid() OR is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Users can insert their own consents"
  ON public.gdpr_consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consents"
  ON public.gdpr_consents FOR UPDATE
  USING (user_id = auth.uid());

-- ── Data Retention Policies ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id        uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  data_type       text NOT NULL, -- 'guest_pii' | 'reservation_history' | 'financial_records' | 'hk_photos'
  retention_days  integer NOT NULL DEFAULT 1825, -- 5 years default
  auto_action     text NOT NULL DEFAULT 'anonymise', -- 'anonymise' | 'delete'
  notes           text,
  updated_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW(),
  UNIQUE(hotel_id, data_type)
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel members can view retention policies"
  ON public.data_retention_policies FOR SELECT
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Admins can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (is_hotel_member(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_id ON public.gdpr_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_hotel_id ON public.gdpr_consents(hotel_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_hotel_id ON public.data_retention_policies(hotel_id);
