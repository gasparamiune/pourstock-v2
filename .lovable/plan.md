

# Security-First Multi-Tenant Architecture Plan

## Current Security Audit — Risks Found

### Critical Risks

| # | Risk | Severity | Location |
|---|------|----------|----------|
| 1 | **Edge functions have no auth checks** — `parse-table-plan` has `verify_jwt = false` and does zero authentication. Anyone with the URL can call it and burn AI credits. | Critical | `supabase/config.toml`, `parse-table-plan/index.ts` |
| 2 | **`manage-users` trusts client-supplied params** — No input validation (email format, role values, department values). Accepts any string for role/department. | High | `manage-users/index.ts` |
| 3 | **No audit logging** — Role changes, user approvals, deletions, inventory adjustments leave no trail. | High | All mutation paths |
| 4 | **Settings stored in localStorage** — Auto-save preference lives client-side, easily manipulated. Not tenant-scoped. | Medium | `Settings.tsx` line 27 |
| 5 | **No tenant isolation** — All tables lack `hotel_id`. All data globally shared. | Critical | All business tables |
| 6 | **Realtime subscriptions unfiltered** — `useRealtimeSubscription` subscribes to entire tables, no tenant filter. | High | `useRealtimeSubscription.tsx` |
| 7 | **Frontend-only route guards** — Department/role checks in `ProtectedRoute` and `AppShell` nav filtering, but some RLS policies use permissive `true` for SELECT (e.g., products, stock_levels, rooms). Cross-tenant reads possible once multi-tenant. | Medium | Various RLS policies |
| 8 | **PDF uploads processed in memory only** — No storage bucket, no access control on uploaded files. Not a current leak but no retention policy. | Low | `PdfUploader.tsx` |
| 9 | **Personal data unclassified** — Guest passport numbers, emails, phone numbers stored without field-level access distinction or retention policy. | Medium | `guests` table |

---

## Revised Phase Plan (Security-Integrated)

### Phase 1: Security Foundations + Tenant Core (do first, together)

**A. Create `hotels` table + `hotel_members` + `hotel_settings`**
- As previously designed (hotels, hotel_members with hotel_role enum, hotel_settings)
- Insert Sonderborg Strand as first tenant
- Create `hotel_members` from existing `user_roles` + `profiles`

**B. Create `audit_logs` table**
```
id, hotel_id, user_id, action (text), target_type (text), target_id (text),
details (jsonb), ip_address (text nullable), created_at
```
- RLS: hotel_admins and managers can SELECT their hotel's logs. No UPDATE/DELETE.
- Actions logged: `user.approve`, `user.deny`, `user.create`, `user.delete`, `role.change`, `department.assign`, `stock.adjust`, `order.receive`, `reservation.import`, `settings.change`, `table_plan.upload`

**C. Add `hotel_id` to all 15 business tables**
- Nullable first → backfill → NOT NULL
- Add index on `hotel_id` for every table

**D. System notices table** (as previously approved)
- For maintenance banners during migration

---

### Phase 2: RLS + Edge Function Hardening

**A. New security-definer functions**
```sql
-- Resolve hotel membership
is_hotel_member(user_id, hotel_id) → boolean
has_hotel_role(user_id, hotel_id, role) → boolean
```

**B. Rewrite ALL RLS policies**
- Every business table: `USING (is_hotel_member(auth.uid(), hotel_id))`
- Role-specific operations add `has_hotel_role()` checks
- Profiles: users see own + hotel co-members (for contact directory feature)
- Audit logs: SELECT only, hotel-scoped, admin/manager only

**C. Harden edge functions**

`parse-table-plan/index.ts`:
- Add auth header validation using `getClaims()`
- Verify user is authenticated and approved
- Verify user has restaurant department access
- Add rate limiting (max 10 calls/hour per user)
- Log each parse to `audit_logs`

`manage-users/index.ts`:
- Add input validation with explicit allowlists for role/department values
- Add `hotel_id` parameter, verify caller is member of that hotel
- Log every action to `audit_logs`
- Validate email format, password length, name length

**D. Realtime subscription security**
- All realtime channels must include `.eq('hotel_id', activeHotelId)` filter
- Update `useRealtimeSubscription` hook to accept and require `hotelId` parameter

---

### Phase 3: Auth Context + Tenant Resolution

**A. Refactor `useAuth` hook**
- Add `activeHotel`, `hotels[]`, `switchHotel()`, `hotelRole`
- Single-hotel users auto-resolve; multi-hotel users get picker
- Store `activeHotelId` in React state only (not localStorage)
- All permission checks (`isAdmin`, `hasDepartment`) become hotel-scoped via `hotel_members` + `hotel_departments`

**B. Approval flow hardening**
- `is_approved` moves to `hotel_members.is_approved` (per-hotel approval)
- Unapproved members cannot query any hotel data (RLS enforced)
- `handle_new_user` trigger: creates profile only, no auto-membership

**C. User lifecycle**
- Signup → profile created → no hotel access until invited/approved
- Invitation flow: admin creates `hotel_members` record → user gets approved
- Disable flow: set `hotel_members.is_approved = false` (soft disable, no deletion)
- Self-role-escalation impossible: `user_roles` / `hotel_members` only writable by service role via edge function

---

### Phase 4: Frontend Security + API Layer

**A. Create `src/api/` data access layer**
- Every query function takes `hotelId` and includes `.eq('hotel_id', hotelId)`
- Centralized mutation functions that include audit context
- No direct `supabase.from()` calls in components

**B. Permission enforcement pattern**
- Frontend: `ProtectedRoute` and nav filtering for UX (keep existing pattern)
- Backend: RLS + edge function checks are the real enforcement
- Never rely on hidden buttons alone

**C. Hotel-scoped hooks**
- `useHotelQuery(table, hotelId)` wrapper
- All existing hooks (`useInventoryData`, `useReception`, `useHousekeeping`, `useUsers`) refactored to accept `hotelId`

---

### Phase 5: Data Protection + GDPR Structure

**A. Classify personal data fields**

| Table | PII Fields | Sensitivity |
|-------|-----------|-------------|
| `guests` | first_name, last_name, email, phone, passport_number, nationality | High |
| `profiles` | email, full_name, phone_number | Medium |
| `reservations` | special_requests | Low-Medium |

**B. Actions**
- `guests.passport_number`: encrypt at rest (or don't store — recommend storing only last 4 digits + country code)
- Add `data_retention_days` to `hotel_settings` (default 365 for guest data)
- Create a scheduled function (future) to purge guest PII older than retention period
- `audit_logs`: retain for 2 years minimum, then anonymize user references

**C. File handling**
- PDFs are processed in-memory and not stored — this is good for GDPR (no unnecessary retention)
- If PDF storage is added later, use a private bucket with hotel-scoped RLS and auto-expiry

---

### Phase 6: Config-Driven Features

- Move `TABLE_LAYOUT` from hardcoded to `table_layouts` table (hotel-scoped)
- Move parser prompt config to `parser_profiles` table (hotel-scoped)
- Move settings from localStorage to `hotel_settings`
- Module enable/disable per hotel

### Phase 7: Onboarding + Layout Builder

- Scaffolding for new hotel setup wizard
- Table layout editor UI

---

## Implementation Priority (what gets built first)

1. **`system_notices` table + banner** — inform live users immediately
2. **`hotels` + `hotel_members` + `audit_logs` tables** — tenant foundation + audit trail
3. **Add `hotel_id` to all business tables + backfill** — data isolation structure
4. **Harden `parse-table-plan` with auth** — closes the biggest active vulnerability
5. **Harden `manage-users` with input validation + audit logging** — closes privilege escalation vectors
6. **Rewrite RLS policies** — enforce tenant isolation at DB level
7. **Refactor `useAuth` + realtime subscriptions** — frontend tenant awareness
8. **API layer + hotel-scoped hooks** — clean data access pattern
9. **GDPR classification + passport field handling** — data protection compliance
10. **Config migration** (layouts, parser, settings) — multi-tenant readiness

---

## Simple Explanation

Think of it like a hotel building with locked floors. Right now, all the data lives on one open floor with no doors. The refactor adds:

- **Tenant walls**: Every piece of data gets tagged with which hotel it belongs to
- **Door locks (RLS)**: The database itself refuses to show Hotel A's data to Hotel B's staff
- **ID badges (auth)**: Edge functions check your badge before doing anything
- **Security cameras (audit logs)**: Every sensitive action gets recorded
- **Guest privacy (GDPR)**: Personal information is classified and handled with care

The key principle: **security is enforced at the database and server level, never just in the UI**. Hiding a button is a convenience — the database refusing the query is the real protection.

