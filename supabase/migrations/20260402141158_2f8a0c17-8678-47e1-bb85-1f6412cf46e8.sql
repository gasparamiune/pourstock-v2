
-- ══════════════════════════════════════════════════════════════════════════════
-- 1. menu_items — Permanent à la carte catalog
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  allergens text,
  price numeric NOT NULL DEFAULT 0,
  course text NOT NULL DEFAULT 'main',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  product_id uuid,
  available_units integer,
  reserved_units integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_hotel ON public.menu_items(hotel_id);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_menu_items" ON public.menu_items
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "restaurant_insert_menu_items" ON public.menu_items
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "restaurant_update_menu_items" ON public.menu_items
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "admin_delete_menu_items" ON public.menu_items
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. table_orders — Order headers per table per day
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.table_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  plan_date date NOT NULL DEFAULT CURRENT_DATE,
  table_id text NOT NULL,
  table_label text,
  status text NOT NULL DEFAULT 'open',
  notes text,
  waiter_id uuid,
  folio_id uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_orders_hotel_date ON public.table_orders(hotel_id, plan_date);

ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_table_orders" ON public.table_orders
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "restaurant_insert_table_orders" ON public.table_orders
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "restaurant_update_table_orders" ON public.table_orders
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "admin_delete_table_orders" ON public.table_orders
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. table_order_lines — Individual items in an order
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.table_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.table_orders(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  course text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  special_notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_order_lines_order ON public.table_order_lines(order_id);

ALTER TABLE public.table_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_table_order_lines" ON public.table_order_lines
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "restaurant_insert_table_order_lines" ON public.table_order_lines
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "restaurant_update_table_order_lines" ON public.table_order_lines
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "restaurant_delete_table_order_lines" ON public.table_order_lines
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. kitchen_orders — Tickets for KDS display
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.kitchen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  table_id text,
  table_label text,
  plan_date date NOT NULL DEFAULT CURRENT_DATE,
  course text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]',
  notes text,
  waiter_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_hotel_date ON public.kitchen_orders(hotel_id, plan_date);

ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_orders;

CREATE POLICY "members_select_kitchen_orders" ON public.kitchen_orders
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "restaurant_insert_kitchen_orders" ON public.kitchen_orders
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "restaurant_update_kitchen_orders" ON public.kitchen_orders
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin') OR
    has_hotel_department(auth.uid(), hotel_id, 'restaurant')
  );

CREATE POLICY "admin_delete_kitchen_orders" ON public.kitchen_orders
  FOR DELETE USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'));

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Add available_units column to daily_menus jsonb items (tracked in app)
-- Also add a dedicated available_units column for daily menu level tracking
-- ══════════════════════════════════════════════════════════════════════════════
-- No schema change needed — available_units are tracked per-item inside the jsonb
