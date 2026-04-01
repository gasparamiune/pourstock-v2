-- Restaurant POS: menu catalog, payments, Stripe Connect

-- ── Menu Items Catalog ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    uuid          NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  description text,
  allergens   text,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  course      text          NOT NULL DEFAULT 'main' CHECK (course IN ('starter', 'main', 'dessert', 'drinks')),
  is_active   boolean       NOT NULL DEFAULT true,
  sort_order  int           NOT NULL DEFAULT 0,
  product_id  uuid          REFERENCES products(id) ON DELETE SET NULL,
  created_at  timestamptz   DEFAULT NOW(),
  updated_at  timestamptz   DEFAULT NOW()
);

CREATE INDEX idx_menu_items_hotel ON menu_items(hotel_id, is_active);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_menu_items" ON menu_items
  USING (is_hotel_member(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

-- ── Payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                       uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id                 uuid          NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  order_id                 uuid          NOT NULL REFERENCES table_orders(id),
  amount                   numeric(10,2) NOT NULL,
  currency                 text          NOT NULL DEFAULT 'dkk',
  stripe_payment_intent_id text,
  stripe_reader_id         text,
  status                   text          NOT NULL DEFAULT 'pending',
  split_index              int,
  split_total              int,
  paid_at                  timestamptz,
  created_at               timestamptz   DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_hotel ON payments(hotel_id, created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_payments" ON payments
  USING (is_hotel_member(auth.uid(), hotel_id))
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

-- ── Stripe Connect on Hotels ──────────────────────────────────────────────────
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS stripe_connect_completed boolean NOT NULL DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS stripe_default_reader_id text;

-- ── Stock Reservation on Products ────────────────────────────────────────────
-- reserved_quantity tracks units held by open/submitted orders (not yet paid).
-- available = quantity - reserved_quantity
-- On order line add    → reserved_quantity += line.quantity
-- On order line delete → reserved_quantity -= line.quantity
-- On payment capture   → quantity -= line.quantity, reserved_quantity -= line.quantity
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity int NOT NULL DEFAULT 0;

-- Atomic: adjust reserved_quantity (delta can be + or -), floor at 0
CREATE OR REPLACE FUNCTION reserve_product_stock(p_product_id uuid, p_delta int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products
  SET reserved_quantity = GREATEST(0, reserved_quantity + p_delta)
  WHERE id = p_product_id;
END;
$$;

-- Atomic: on payment, permanently decrement quantity and release reservation
CREATE OR REPLACE FUNCTION sell_product_stock(p_product_id uuid, p_quantity int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products
  SET quantity          = GREATEST(0, quantity - p_quantity),
      reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
  WHERE id = p_product_id;
END;
$$;
