-- Phase 8: SaaS Readiness
-- subscriptions, audit_logs tables + RLS

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id         uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE UNIQUE,
  plan             text NOT NULL DEFAULT 'trial',   -- 'trial' | 'starter' | 'professional' | 'enterprise'
  status           text NOT NULL DEFAULT 'trialing', -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
  trial_ends_at    timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  stripe_customer_id   text,
  stripe_subscription_id text,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  seats            integer NOT NULL DEFAULT 5,       -- max staff members allowed
  created_at       timestamptz DEFAULT NOW(),
  updated_at       timestamptz DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotel members can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed trial subscription when a new hotel is created
CREATE OR REPLACE FUNCTION public.seed_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (hotel_id, plan, status, trial_ends_at)
  VALUES (
    NEW.id,
    'trial',
    'trialing',
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (hotel_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hotel_created_seed_trial ON public.hotels;
CREATE TRIGGER on_hotel_created_seed_trial
  AFTER INSERT ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.seed_trial_subscription();

-- ── Audit Logs ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,          -- 'create' | 'update' | 'delete' | 'login' | 'export'
  entity_type text NOT NULL,          -- 'reservation' | 'guest' | 'room' | 'user' | ...
  entity_id   text,
  metadata    jsonb DEFAULT '{}',
  ip_address  text,
  user_agent  text,
  created_at  timestamptz DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Service role writes audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id) OR auth.role() = 'service_role');

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_hotel_id ON public.subscriptions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hotel_id ON public.audit_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
