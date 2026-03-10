
-- ============================================================
-- PHASE 1: FOUNDATION TABLES (ADDITIVE ONLY)
-- ============================================================
-- No existing tables are modified, renamed, or dropped.
-- All changes are purely additive: new tables, new functions, new policies.
-- ============================================================

-- 1. hotel_modules
-- PURPOSE: Feature flags per hotel. Controls which modules (reception,
--   housekeeping, restaurant, inventory, billing, etc.) are enabled.
-- FUTURE: UI will check this before showing module navigation.
--   Phase 2+ will gate features behind module checks.
-- COMPAT: Without rows, all modules default to "enabled" in code,
--   so existing hotels see zero change.

CREATE TABLE public.hotel_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  module text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, module)
);

ALTER TABLE public.hotel_modules ENABLE ROW LEVEL SECURITY;

-- Members can see which modules their hotel has
CREATE POLICY "Members can view hotel modules"
  ON public.hotel_modules FOR SELECT TO authenticated
  USING (public.is_hotel_member(auth.uid(), hotel_id));

-- Only hotel admins can manage modules
CREATE POLICY "Hotel admins can manage modules"
  ON public.hotel_modules FOR ALL TO authenticated
  USING (public.has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (public.has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- Index for fast lookups
CREATE INDEX idx_hotel_modules_hotel_id ON public.hotel_modules(hotel_id);

-- Trigger for updated_at
CREATE TRIGGER update_hotel_modules_updated_at
  BEFORE UPDATE ON public.hotel_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. departments
-- PURPOSE: Configurable departments per hotel. Replaces the hardcoded
--   'department' enum with a data-driven approach. Hotels can have
--   custom department names and ordering.
-- FUTURE: Phase 3+ will migrate user_departments to reference this table.
--   For now this is a config table only — user_departments continues to
--   use the enum and is the source of truth for access control.
-- COMPAT: Existing department enum and user_departments table untouched.
--   RLS helpers (has_hotel_department, etc.) still use user_departments.

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  slug text NOT NULL,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (public.is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Hotel admins can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (public.has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

CREATE INDEX idx_departments_hotel_id ON public.departments(hotel_id);

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. membership_roles
-- PURPOSE: Hotel-scoped roles attached to a specific hotel_members row.
--   This is the future replacement for the global user_roles table.
-- FUTURE: Phase 3+ will migrate role checks from user_roles to this table.
--   New security-definer helpers will be added to check membership_roles.
--   Eventually user_roles will be deprecated.
-- COMPAT: This table is ADDITIVE ONLY. user_roles remains the source of
--   truth for is_admin(), is_manager_or_admin(). hotel_members.hotel_role
--   remains the primary hotel-scoped role check. This table adds granular
--   role capability for future multi-role scenarios.
-- DUAL-WRITE: manage-users edge function will be updated to write here
--   IN ADDITION TO existing user_roles and hotel_members writes.
--   Reads continue from hotel_members.hotel_role (no change).

CREATE TABLE public.membership_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.hotel_members(id) ON DELETE CASCADE,
  role text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(membership_id, role)
);

ALTER TABLE public.membership_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own membership roles
CREATE POLICY "Users can view own membership roles"
  ON public.membership_roles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotel_members hm
      WHERE hm.id = membership_id AND hm.user_id = auth.uid()
    )
  );

-- Admins/managers can view all membership roles in their hotel
CREATE POLICY "Hotel admins can view all membership roles"
  ON public.membership_roles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotel_members hm
      WHERE hm.id = membership_id
        AND public.is_hotel_admin_or_manager(auth.uid(), hm.hotel_id)
    )
  );

-- Only hotel admins can manage membership roles
CREATE POLICY "Hotel admins can manage membership roles"
  ON public.membership_roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotel_members hm
      WHERE hm.id = membership_id
        AND public.has_hotel_role(auth.uid(), hm.hotel_id, 'hotel_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotel_members hm
      WHERE hm.id = membership_id
        AND public.has_hotel_role(auth.uid(), hm.hotel_id, 'hotel_admin')
    )
  );

CREATE INDEX idx_membership_roles_membership_id ON public.membership_roles(membership_id);

-- ============================================================
-- HELPER FUNCTIONS (new, additive — existing helpers untouched)
-- ============================================================

-- Check if a hotel has a specific module enabled
-- Returns FALSE if no row exists (safe default — existing hotels
-- without module rows continue to work because code defaults to true)
CREATE OR REPLACE FUNCTION public.has_hotel_module(_hotel_id uuid, _module text)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.hotel_modules
     WHERE hotel_id = _hotel_id AND module = _module),
    false
  )
$$;

-- Check if a membership has a specific role in membership_roles
CREATE OR REPLACE FUNCTION public.has_membership_role(_membership_id uuid, _role text)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membership_roles
    WHERE membership_id = _membership_id AND role = _role
  )
$$;

-- ============================================================
-- BACKFILL: Seed departments for ALL existing hotels
-- ============================================================
-- Creates the 3 standard departments for every hotel that exists.
-- This is idempotent (UNIQUE constraint prevents duplicates).

INSERT INTO public.departments (hotel_id, slug, display_name, sort_order)
SELECT h.id, d.slug, d.display_name, d.sort_order
FROM public.hotels h
CROSS JOIN (VALUES
  ('reception', 'Reception', 1),
  ('housekeeping', 'Housekeeping', 2),
  ('restaurant', 'Restaurant', 3)
) AS d(slug, display_name, sort_order)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- ============================================================
-- BACKFILL: Seed hotel_modules for ALL existing hotels
-- ============================================================
-- Enable all current modules for existing hotels so they see no change.

INSERT INTO public.hotel_modules (hotel_id, module, is_enabled)
SELECT h.id, m.module, true
FROM public.hotels h
CROSS JOIN (VALUES
  ('reception'),
  ('housekeeping'),
  ('restaurant'),
  ('inventory'),
  ('procurement'),
  ('table_plan'),
  ('reports')
) AS m(module)
ON CONFLICT (hotel_id, module) DO NOTHING;

-- ============================================================
-- BACKFILL: Seed membership_roles from existing hotel_members
-- ============================================================
-- Mirror each hotel_members.hotel_role into membership_roles.
-- This creates the initial dual-write baseline.

INSERT INTO public.membership_roles (membership_id, role)
SELECT hm.id, hm.hotel_role::text
FROM public.hotel_members hm
WHERE hm.is_approved = true
ON CONFLICT (membership_id, role) DO NOTHING;

-- ============================================================
-- ENABLE REALTIME for new tables (operational awareness)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
