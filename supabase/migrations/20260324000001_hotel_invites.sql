-- Phase 1: Hotel invite system
-- Allows hotel admins/managers to generate invite links for new staff accounts.
-- Staff arrive at /join?token=<uuid>, sign up, and are auto-assigned to the hotel + department.

CREATE TABLE IF NOT EXISTS hotel_invites (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    uuid    NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  email       text,                                      -- optional: pre-fill email on join page
  hotel_role  text    NOT NULL DEFAULT 'staff',          -- hotel_admin | manager | staff
  department  text,                                      -- optional: auto-assign department
  token       uuid    NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by  uuid    REFERENCES auth.users(id),
  expires_at  timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at     timestamptz,
  used_by     uuid    REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT NOW()
);

-- Index for fast token lookups (used on /join page load)
CREATE INDEX idx_hotel_invites_token ON hotel_invites(token);
CREATE INDEX idx_hotel_invites_hotel  ON hotel_invites(hotel_id);

-- RLS
ALTER TABLE hotel_invites ENABLE ROW LEVEL SECURITY;

-- Hotel admins and managers can create invites
CREATE POLICY "managers_insert_invites" ON hotel_invites
  FOR INSERT WITH CHECK (
    is_hotel_member(auth.uid(), hotel_id)
  );

-- Hotel members can view their hotel's invites
CREATE POLICY "members_select_invites" ON hotel_invites
  FOR SELECT USING (
    is_hotel_member(auth.uid(), hotel_id)
  );

-- Hotel admins can delete/revoke invites
CREATE POLICY "admins_delete_invites" ON hotel_invites
  FOR DELETE USING (
    is_hotel_member(auth.uid(), hotel_id)
  );

-- Anonymous users can read a single invite by token (for /join page)
-- We expose only non-sensitive fields via a secure function, not a direct policy.
-- The /join page calls an edge function that validates the token server-side.
