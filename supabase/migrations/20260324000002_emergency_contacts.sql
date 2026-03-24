-- Phase 2: Emergency contacts / problem solver directory
-- Hotel staff can look up vendors, contractors, and emergency services by category.

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id      uuid        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category      text        NOT NULL, -- plumbing | electrical | hvac | elevator | it | fire_safety | medical | locksmith | pest_control | cleaning | other
  name          text        NOT NULL,
  contact_person text,
  phone         text,
  email         text,
  contract_ref  text,
  last_service  date,
  sla_notes     text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT NOW(),
  updated_at    timestamptz DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_hotel ON emergency_contacts(hotel_id);
CREATE INDEX idx_emergency_contacts_cat   ON emergency_contacts(hotel_id, category);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_emergency_contacts" ON emergency_contacts
  FOR SELECT USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "managers_insert_emergency_contacts" ON emergency_contacts
  FOR INSERT WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "managers_update_emergency_contacts" ON emergency_contacts
  FOR UPDATE USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "managers_delete_emergency_contacts" ON emergency_contacts
  FOR DELETE USING (is_hotel_member(auth.uid(), hotel_id));
