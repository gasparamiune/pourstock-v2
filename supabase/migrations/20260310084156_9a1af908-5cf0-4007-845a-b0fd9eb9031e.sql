
-- =============================================
-- PHASE 2: Operational Model Foundation Tables
-- All additive. No existing tables modified.
-- No reads migrated. No legacy tables touched.
-- =============================================

-- 1. RESTAURANTS — Multi-restaurant support per hotel
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  capacity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view restaurants" ON public.restaurants
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Hotel admins can manage restaurants" ON public.restaurants
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- 2. SERVICE_PERIODS — Breakfast/Lunch/Dinner periods
CREATE TABLE public.service_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  start_time time NOT NULL DEFAULT '18:00',
  end_time time NOT NULL DEFAULT '22:00',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

ALTER TABLE public.service_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view service periods" ON public.service_periods
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Hotel admins can manage service periods" ON public.service_periods
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- 3. RESERVATION_IMPORTS — Tracks PDF upload history
CREATE TABLE public.reservation_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  service_period_id uuid REFERENCES public.service_periods(id) ON DELETE SET NULL,
  import_date date NOT NULL DEFAULT CURRENT_DATE,
  file_name text,
  file_url text,
  parser_profile_id uuid REFERENCES public.parser_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reservation_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view imports" ON public.reservation_imports
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Members can insert imports" ON public.reservation_imports
  FOR INSERT TO authenticated
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Hotel admins can manage imports" ON public.reservation_imports
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- 4. ROOM_TYPES — Reference table for room type configuration
CREATE TABLE public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  default_capacity integer NOT NULL DEFAULT 2,
  base_rate numeric,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room types" ON public.room_types
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Hotel admins can manage room types" ON public.room_types
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- 5. PRODUCT_CATEGORIES — Replaces enum, enables custom categories
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, slug)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view product categories" ON public.product_categories
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Managers can manage product categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (is_hotel_admin_or_manager(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- 6. VENDORS — Normalized vendor directory
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, name)
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view vendors" ON public.vendors
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Managers can manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (is_hotel_admin_or_manager(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- 7. REORDER_RULES — Enriches reorder logic
CREATE TABLE public.reorder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  min_threshold numeric NOT NULL DEFAULT 0,
  reorder_quantity numeric NOT NULL DEFAULT 0,
  auto_order boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, product_id, location_id)
);

ALTER TABLE public.reorder_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reorder rules" ON public.reorder_rules
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Managers can manage reorder rules" ON public.reorder_rules
  FOR ALL TO authenticated
  USING (is_hotel_admin_or_manager(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_admin_or_manager(auth.uid(), hotel_id));

-- 8. GUEST_PREFERENCES — Additive guest data
CREATE TABLE public.guest_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  preference_type text NOT NULL,
  preference_value text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, guest_id, preference_type)
);

ALTER TABLE public.guest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reception can view guest preferences" ON public.guest_preferences
  FOR SELECT TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR has_hotel_department(auth.uid(), hotel_id, 'reception'));

CREATE POLICY "Reception can manage guest preferences" ON public.guest_preferences
  FOR ALL TO authenticated
  USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR has_hotel_department(auth.uid(), hotel_id, 'reception'))
  WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR has_hotel_department(auth.uid(), hotel_id, 'reception'));

-- =============================================
-- SEED: Backfill for existing hotels
-- =============================================

-- Seed default restaurant for all existing hotels
INSERT INTO public.restaurants (hotel_id, name, slug, description)
SELECT id, 'Main Restaurant', 'main-restaurant', 'Default restaurant'
FROM public.hotels
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Seed default service periods for all existing hotels
INSERT INTO public.service_periods (hotel_id, restaurant_id, name, slug, start_time, end_time, sort_order)
SELECT h.id, r.id, 'Dinner', 'dinner', '18:00', '22:00', 1
FROM public.hotels h
JOIN public.restaurants r ON r.hotel_id = h.id AND r.slug = 'main-restaurant'
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Seed room_types from current enum values for all existing hotels
INSERT INTO public.room_types (hotel_id, name, slug, default_capacity, sort_order)
SELECT h.id, t.name, t.slug, t.cap, t.sort
FROM public.hotels h
CROSS JOIN (VALUES
  ('Single', 'single', 1, 1),
  ('Double', 'double', 2, 2),
  ('Twin', 'twin', 2, 3),
  ('Suite', 'suite', 4, 4),
  ('Family', 'family', 4, 5)
) AS t(name, slug, cap, sort)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Seed product_categories from current enum values for all existing hotels
INSERT INTO public.product_categories (hotel_id, name, slug, sort_order)
SELECT h.id, c.name, c.slug, c.sort
FROM public.hotels h
CROSS JOIN (VALUES
  ('Wine', 'wine', 1),
  ('Beer', 'beer', 2),
  ('Spirits', 'spirits', 3),
  ('Coffee', 'coffee', 4),
  ('Soda', 'soda', 5),
  ('Syrup', 'syrup', 6)
) AS c(name, slug, sort)
ON CONFLICT (hotel_id, slug) DO NOTHING;

-- Add updated_at triggers
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_periods_updated_at BEFORE UPDATE ON public.service_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservation_imports_updated_at BEFORE UPDATE ON public.reservation_imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reorder_rules_updated_at BEFORE UPDATE ON public.reorder_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_preferences_updated_at BEFORE UPDATE ON public.guest_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
