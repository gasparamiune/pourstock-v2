-- Phase 3: Kitchen department + tables
-- Adds kitchen to the department enum, daily menu management, and KDS orders.

-- 1. Extend enum (idempotent)
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'kitchen';

-- 2. Daily rotating menu (one per hotel per day)
CREATE TABLE IF NOT EXISTS daily_menus (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id        uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  menu_date       date        NOT NULL,
  starters        jsonb       NOT NULL DEFAULT '[]',   -- [{id, name, description, allergens, price}]
  mains           jsonb       NOT NULL DEFAULT '[]',
  desserts        jsonb       NOT NULL DEFAULT '[]',
  published_at    timestamptz,
  published_by    uuid        REFERENCES auth.users(id),
  notes           text,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW(),
  UNIQUE (hotel_id, menu_date)
);

CREATE INDEX idx_daily_menus_hotel_date ON daily_menus(hotel_id, menu_date DESC);

ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_daily_menus" ON daily_menus
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "kitchen_insert_daily_menus" ON daily_menus
  FOR INSERT WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "kitchen_update_daily_menus" ON daily_menus
  FOR UPDATE USING (is_hotel_member(auth.uid(), hotel_id));

-- 3. Kitchen orders (submitted from table plan)
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  table_id    uuid,                                -- references table plan tables (nullable for bar/room service)
  plan_date   date        NOT NULL DEFAULT CURRENT_DATE,
  table_label text,                                -- e.g. "Table 4" — denormalised for display
  status      text        NOT NULL DEFAULT 'pending', -- pending | in_progress | ready | served | void
  course      text        NOT NULL DEFAULT 'main',    -- starter | main | dessert
  items       jsonb       NOT NULL DEFAULT '[]',   -- [{menu_item_id, name, quantity, notes}]
  notes       text,
  waiter_id   uuid        REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT NOW(),
  updated_at  timestamptz DEFAULT NOW()
);

CREATE INDEX idx_kitchen_orders_hotel_date ON kitchen_orders(hotel_id, plan_date DESC);
CREATE INDEX idx_kitchen_orders_status     ON kitchen_orders(hotel_id, status);

ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_kitchen_orders" ON kitchen_orders
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "members_insert_kitchen_orders" ON kitchen_orders
  FOR INSERT WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "members_update_kitchen_orders" ON kitchen_orders
  FOR UPDATE USING (is_hotel_member(auth.uid(), hotel_id));
