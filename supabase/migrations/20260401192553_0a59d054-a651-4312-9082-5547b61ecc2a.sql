
CREATE TABLE IF NOT EXISTS public.daily_menus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  menu_date date NOT NULL,
  starters jsonb NOT NULL DEFAULT '[]',
  mains jsonb NOT NULL DEFAULT '[]',
  desserts jsonb NOT NULL DEFAULT '[]',
  published_at timestamptz,
  published_by uuid,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE (hotel_id, menu_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_menus_hotel_date ON daily_menus(hotel_id, menu_date DESC);

ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_daily_menus" ON daily_menus
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "kitchen_insert_daily_menus" ON daily_menus
  FOR INSERT WITH CHECK (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'restaurant'::department)
  );

CREATE POLICY "kitchen_update_daily_menus" ON daily_menus
  FOR UPDATE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
    OR has_hotel_department(auth.uid(), hotel_id, 'restaurant'::department)
  );

CREATE POLICY "admin_delete_daily_menus" ON daily_menus
  FOR DELETE USING (
    has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)
  );
