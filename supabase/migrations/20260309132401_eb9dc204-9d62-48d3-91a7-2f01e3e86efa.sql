-- =============================================
-- PHASE 1A: Core tenant tables + system notices + audit logs
-- =============================================

-- 1. Hotel role enum
CREATE TYPE public.hotel_role AS ENUM ('hotel_admin', 'manager', 'staff');

-- 2. Hotels (tenant core)
CREATE TABLE public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  country text NOT NULL DEFAULT 'DK',
  timezone text NOT NULL DEFAULT 'Europe/Copenhagen',
  language_default text NOT NULL DEFAULT 'da',
  subscription_plan text NOT NULL DEFAULT 'starter',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- 3. Hotel members (user-hotel binding with role)
CREATE TABLE public.hotel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_role public.hotel_role NOT NULL DEFAULT 'staff',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, user_id)
);
ALTER TABLE public.hotel_members ENABLE ROW LEVEL SECURITY;

-- 4. Hotel settings (key-value per hotel)
CREATE TABLE public.hotel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, key)
);
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- 5. Table layouts (configurable floor plans per hotel)
CREATE TABLE public.table_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  layout_json jsonb NOT NULL DEFAULT '[]',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.table_layouts ENABLE ROW LEVEL SECURITY;

-- 6. Parser profiles (AI PDF extraction config per hotel)
CREATE TABLE public.parser_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parser_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Audit logs (immutable trail of sensitive actions)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. System notices (maintenance/info banners)
CREATE TABLE public.system_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.system_notices ENABLE ROW LEVEL SECURITY;

-- Enable realtime on system_notices
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notices;

-- =============================================
-- Security-definer helper functions for multi-tenant
-- =============================================

CREATE OR REPLACE FUNCTION public.is_hotel_member(_user_id uuid, _hotel_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_members
    WHERE user_id = _user_id AND hotel_id = _hotel_id AND is_approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.has_hotel_role(_user_id uuid, _hotel_id uuid, _role hotel_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_members
    WHERE user_id = _user_id AND hotel_id = _hotel_id AND hotel_role = _role AND is_approved = true
  )
$$;

-- =============================================
-- RLS Policies for new tables
-- =============================================

-- Hotels: members can see their hotel; hotel_admins can update
CREATE POLICY "Members can view their hotel" ON public.hotels
  FOR SELECT USING (
    is_hotel_member(auth.uid(), id) OR is_admin()
  );

CREATE POLICY "Hotel admins can update their hotel" ON public.hotels
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), id, 'hotel_admin') OR is_admin()
  );

-- Hotel members: see co-members; hotel_admins manage
CREATE POLICY "Members can view co-members" ON public.hotel_members
  FOR SELECT USING (
    is_hotel_member(auth.uid(), hotel_id) OR auth.uid() = user_id OR is_admin()
  );

CREATE POLICY "Hotel admins can manage members" ON public.hotel_members
  FOR ALL USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR is_admin()
  );

-- Hotel settings: members can read; hotel_admins can write
CREATE POLICY "Members can view settings" ON public.hotel_settings
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id) OR is_admin());

CREATE POLICY "Hotel admins can manage settings" ON public.hotel_settings
  FOR ALL USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR is_admin());

-- Table layouts: members read; hotel_admins write
CREATE POLICY "Members can view layouts" ON public.table_layouts
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id) OR is_admin());

CREATE POLICY "Hotel admins can manage layouts" ON public.table_layouts
  FOR ALL USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR is_admin());

-- Parser profiles: members read; hotel_admins write
CREATE POLICY "Members can view parser profiles" ON public.parser_profiles
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id) OR is_admin());

CREATE POLICY "Hotel admins can manage parser profiles" ON public.parser_profiles
  FOR ALL USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR is_admin());

-- Audit logs: hotel_admins and managers can read; NO update/delete; insert via service role only
CREATE POLICY "Admins and managers can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    is_admin() OR 
    (hotel_id IS NOT NULL AND (
      has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR 
      has_hotel_role(auth.uid(), hotel_id, 'manager')
    ))
  );

-- System notices: all authenticated can read; only platform admins can manage
CREATE POLICY "Authenticated can view active notices" ON public.system_notices
  FOR SELECT TO authenticated USING (
    is_active = true AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Admins can manage notices" ON public.system_notices
  FOR ALL USING (is_admin());

-- updated_at triggers for new tables
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotel_settings_updated_at BEFORE UPDATE ON public.hotel_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_table_layouts_updated_at BEFORE UPDATE ON public.table_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parser_profiles_updated_at BEFORE UPDATE ON public.parser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();