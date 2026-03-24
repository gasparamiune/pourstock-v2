-- Phase 4: Live ordering system
-- Connects table plan → order sheet → kitchen display → room folio.

-- Table-level orders (one open order per table per service)
CREATE TABLE IF NOT EXISTS table_orders (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id        uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  plan_date       date        NOT NULL DEFAULT CURRENT_DATE,
  table_id        text        NOT NULL,  -- table label/id from the floor plan
  table_label     text,
  status          text        NOT NULL DEFAULT 'open', -- open | submitted | complete | void
  waiter_id       uuid        REFERENCES auth.users(id),
  opened_at       timestamptz DEFAULT NOW(),
  submitted_at    timestamptz,
  completed_at    timestamptz,
  folio_id        uuid,                  -- optional link to guest folio / reservation
  notes           text,
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

CREATE INDEX idx_table_orders_hotel_date ON table_orders(hotel_id, plan_date DESC);
CREATE INDEX idx_table_orders_table      ON table_orders(hotel_id, table_id, plan_date);

ALTER TABLE table_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_table_orders" ON table_orders
  USING (is_hotel_member(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

-- Individual order lines (per course)
CREATE TABLE IF NOT EXISTS table_order_lines (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        uuid        NOT NULL REFERENCES table_orders(id) ON DELETE CASCADE,
  hotel_id        uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  course          text        NOT NULL DEFAULT 'main',   -- starter | main | dessert
  item_id         text        NOT NULL,                  -- menu item id from daily_menus JSONB
  item_name       text        NOT NULL,
  quantity        int         NOT NULL DEFAULT 1,
  unit_price      numeric(10,2) NOT NULL DEFAULT 0,
  special_notes   text,
  status          text        NOT NULL DEFAULT 'pending', -- pending | sent_to_kitchen | ready | served | voided
  created_at      timestamptz DEFAULT NOW()
);

CREATE INDEX idx_order_lines_order ON table_order_lines(order_id);

ALTER TABLE table_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_order_lines" ON table_order_lines
  USING (is_hotel_member(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));
