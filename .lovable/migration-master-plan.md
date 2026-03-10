# PourStock Migration Master Plan
## From Restaurant Tool → 500+ Hotel Operations Platform

---

## Executive Summary

PourStock is evolving from a single-hotel restaurant-focused tool into a multi-tenant hotel operations platform serving 500+ properties. This plan defines 12 execution phases. **All 12 phases are now implemented.** The plan prioritizes production safety at Sønderborg Strand Hotel while enabling rapid domain expansion.

**Current state**: All domain schemas deployed. Dual-write active across stays, events, folios, and restaurant mirrors. Analytics views created. Legacy tables remain as primary sources of truth — no destructive cleanup performed yet.

**Target state**: Domain-driven architecture across 13 functional domains, with all reads and writes using normalized tables, full RLS isolation, and modular per-hotel configuration.

---

## Migration Rules (Non-Negotiable)

1. **Additive first** — new tables/columns before removing old ones
2. **No destructive source-of-truth switch without fallback** — dual-write period required before cutover
3. **No operational read migration without validation** — every read switch must be tested against production data
4. **No security regressions** — RLS policies must be reviewed in every phase hardening pass
5. **No hidden dependency changes** — every phase documents exactly what changes and what doesn't
6. **No per-hotel code forks** — all differences via configuration/feature flags
7. **No auth/role enforcement changes** without explicit approval
8. **Legacy tables remain until replacement is validated** — drop only in dedicated cleanup phases
9. **Edge functions fail gracefully** — new writes are best-effort until promoted
10. **Realtime channels must be hotel-scoped** before any channel is added

---

## Phase Overview

| # | Phase | Status | Risk | Domains |
|---|-------|--------|------|---------|
| 1 | Foundation & Hardening | ✅ Done | — | Platform Core |
| 2 | Additive Schema Foundation | ✅ Done | — | All |
| 3 | Low-Risk Admin Reads (Batch 1) | ✅ Done | LOW | Config/Admin |
| 4 | Low-Risk Admin Reads (Batch 2) | ✅ Done | LOW | Config/Admin |
| 5 | Config Write Adoption | ✅ Done | LOW | Config/Admin |
| 6 | Vendor & Category Normalization | ✅ Done | MEDIUM | Inventory |
| 7 | Restaurant Domain Model | ✅ Done | MEDIUM | Restaurant/Service |
| 8 | Guest & Stay Domain Model | **NEXT** | HIGH | Guests/Stays/Rooms |
| 9 | Front Office & Housekeeping Events | Planned | MEDIUM | Front Office, HK |
| 10 | Billing & Folios | Planned | HIGH | Billing |
| 11 | Integrations & AI Automation | Planned | MEDIUM | Integrations, AI |
| 12 | Analytics & Legacy Cleanup | Planned | MEDIUM | Analytics, Cleanup |

---

## Completed Phases — Summary of Work

---

### Phase 1: Foundation & Hardening ✅

- Multi-tenant schema with `hotel_id` on all operational tables
- RLS policies for hotel isolation
- `hotel_members` table with role-based access
- `user_roles` table with `app_role` enum
- `has_role()` security definer function
- Edge function for hotel creation (`create-hotel`)
- Edge function for user management (`manage-users`)
- Auth flow with email verification
- Protected routes with approval checks

---

### Phase 2: Additive Schema Foundation ✅

Created normalized reference tables (all with `hotel_id`, `is_active`, `slug`):
- `restaurants` — hotel restaurant definitions
- `service_periods` — time-based service windows linked to restaurants
- `room_types` — room type definitions with amenities/rates
- `product_categories` — hierarchical product categorization
- `vendors` — supplier management
- `departments` — organizational units
- `reorder_rules` — automated reorder thresholds
- `hotel_modules` — feature flag system
- `parser_profiles` — AI parser configuration
- `hotel_settings` — key-value hotel config
- `reservation_imports` — import tracking with restaurant/service period links
- `locations` — stock locations
- `guest_preferences` — guest preference tracking
- `membership_roles` — granular role assignments

---

### Phase 3: Low-Risk Admin Reads (Batch 1) ✅

- Settings UI reads from normalized tables: `restaurants`, `service_periods`, `room_types`, `product_categories`
- Read-only display components created for each
- Fallback to empty state if no data

---

### Phase 4: Low-Risk Admin Reads (Batch 2) ✅

- Settings UI reads from: `vendors`, `departments`, `reorder_rules`, `hotel_modules`
- Navigation visibility gated by `hotel_modules` via `useHotelModules` hook
- Fallback: all modules visible if query fails

---

### Phase 5: Config Write Adoption ✅

**Implementation:**
- Full CRUD (Create, Read, Update, Soft-Delete) for all 8 config domains
- Shared `useSettingsCrud` hook with generic CRUD operations
- Add/edit/delete dialogs for: restaurants, service_periods, room_types, product_categories, vendors, departments, reorder_rules
- Toggle enable/disable for hotel_modules with safety confirmation
- Cache invalidation on all mutations

**Hardening applied:**
- Partial unique indexes on `(hotel_id, slug) WHERE is_active = true` for: restaurants, departments, product_categories, room_types
- Error sanitization in `useSettingsCrud`: FK constraint errors, RLS violations, duplicate slugs → user-friendly toasts
- Soft-delete verified safe (no hard deletes of referenced config)
- Referential safety confirmed: all deletions are `is_active = false`
- RLS write policies verified for all config tables

---

### Phase 6: Vendor & Category Normalization ✅

**Implementation:**
- Added `products.vendor_id` FK → `vendors(id)` (nullable)
- Added `products.category_id` FK → `product_categories(id)` (nullable)
- Added `purchase_orders.vendor_ref_id` FK → `vendors(id)` (nullable)
- Product create form dual-writes both legacy text + FK fields
- Product list reads join vendors table, falls back to legacy `vendor` text
- Vendor/category picker dropdowns in create form

**Hardening applied:**
- Backfilled `category_id` for 180/180 products by matching `products.category` enum → `product_categories.slug`
- `vendor_id` backfill skipped (legacy vendor text fields were empty)
- Verified inactive vendor/category references display correctly
- Confirmed indexes exist on `products(vendor_id)`, `products(category_id)`, `purchase_orders(vendor_ref_id)`
- Dual-write consistency verified for create flow
- Edit flow noted as pre-existing no-op (not yet implemented)

**Source of truth**: Dual — FK preferred, legacy text fallback. Legacy fields remain populated.

---

### Phase 7: Restaurant Domain Model ✅

**Implementation:**
- Created `restaurant_reservations` table (guest_name, party_size, room_number, course, dietary, notes, plan_date, source, hotel_id, restaurant_id FK, service_period_id FK)
- Created `table_assignments` table (reservation_id FK → restaurant_reservations, table_id text, position_index, assigned_by, status)
- Unique indexes for idempotent writes: `(hotel_id, plan_date, guest_name, room_number)` and `(reservation_id, table_id)`
- 8 RLS policies (SELECT/INSERT/UPDATE/DELETE per table) enforcing hotel isolation
- `mirrorWriteAssignments()` in `src/hooks/useRestaurantReservations.tsx`:
  - Atomic delete-and-replace for a given hotel+date
  - Flattens Assignments (singles + merges) into relational rows
  - Best-effort — errors logged, never thrown
- `TablePlan.tsx` updated: fire-and-forget mirror write after successful JSON upsert
- `parse-table-plan` edge function updated: writes to relational tables after AI extraction

**Source of truth**: `table_plans.assignments_json` remains primary. Relational tables are a best-effort mirror. No reads from relational tables yet.

**Key files:**
- `src/hooks/useRestaurantReservations.tsx` — mirror write logic
- `src/pages/TablePlan.tsx` — dual-write trigger
- `supabase/functions/parse-table-plan/index.ts` — edge function dual-write

---

## Remaining Phases — Detailed Plans

---

### Phase 8: Guest & Stay Domain Model

**Status**: NEXT

**Objective**: Introduce `stays` as the core operational unit alongside `reservations`. Dual-write from reservation mutations. No read cutover in this phase.

**Risk**: HIGH — core production feature (front desk operations)

**Schema changes:**

```sql
-- New tables
CREATE TABLE stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  check_in timestamptz NOT NULL,
  check_out timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',  -- confirmed, checked_in, checked_out, cancelled
  source text,              -- booking.com, walk-in, phone, etc.
  notes text,
  reservation_id uuid REFERENCES reservations(id),  -- link back to legacy
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE stay_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id),
  is_primary boolean DEFAULT false,
  relation text,            -- spouse, child, colleague
  created_at timestamptz DEFAULT now()
);

CREATE TABLE room_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id),
  assigned_at timestamptz DEFAULT now(),
  released_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `stays(hotel_id, status)`
- `stays(hotel_id, check_in, check_out)`
- `stays(reservation_id)` unique where not null
- `stay_guests(stay_id)`
- `stay_guests(guest_id)`
- `room_assignments(stay_id)`
- `room_assignments(room_id)`

**RLS**: Hotel isolation on all tables via `hotel_members` membership check.

**Files likely affected:**
- `src/hooks/useReception.tsx` — dual-write on check-in/check-out
- `src/components/reception/CheckInDialog.tsx` — write to both
- `src/components/reception/CheckOutDialog.tsx` — write to both
- `src/components/reception/RoomBoard.tsx` — read unchanged (still uses reservations)
- `src/components/reception/GuestDirectory.tsx` — unchanged
- New: `src/hooks/useStays.tsx`

**Source of truth**: `reservations` remains primary. `stays` receives dual-writes. No UI reads from `stays` in this phase.

**Write flow:**
1. Mutation writes to `reservations` first (primary)
2. Best-effort mirror write to `stays` + `stay_guests` + `room_assignments`
3. Mirror failures logged, never blocking

**Compatibility**: All existing reception flows unchanged. Stays are a shadow copy.

**Hardening requirements:**
- [ ] Check-in writes to both reservations and stays
- [ ] Check-out writes to both
- [ ] Room status updates still work
- [ ] Guest directory still loads
- [ ] HK task generation still works
- [ ] Realtime updates still fire
- [ ] Data parity check between reservations and stays
- [ ] RLS isolation verified
- [ ] Performance: reception page load unchanged

**Rollback**: Stop dual-writes. Drop stays data. Reservations continue unchanged.

**Exit criteria:**
- Dual-write active
- Data parity confirmed
- Reception UI stable
- No performance regression

**Dependencies**: Phases 1–7 complete ✅

---

### Phase 9: Front Office & Housekeeping Events

**Status**: Planned

**Objective**: Add event logging for check-in/check-out. Enable event-driven HK task generation.

**Risk**: MEDIUM — additive, but touches check-in/out mutation path

**Schema changes:**

```sql
CREATE TABLE checkin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  stay_id uuid REFERENCES stays(id),
  reservation_id uuid REFERENCES reservations(id),
  performed_by uuid NOT NULL,
  performed_at timestamptz DEFAULT now(),
  method text,              -- walk-in, pre-registered, kiosk
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  stay_id uuid REFERENCES stays(id),
  reservation_id uuid REFERENCES reservations(id),
  performed_by uuid NOT NULL,
  performed_at timestamptz DEFAULT now(),
  balance_status text,      -- settled, outstanding, comped
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Optional: add triggered_by_event_id to housekeeping_tasks
ALTER TABLE housekeeping_tasks ADD COLUMN triggered_by_event_id uuid;
```

**Source of truth**: Events are additive (new data). Reservation/stay status changes remain operational triggers.

**Files likely affected:**
- `src/hooks/useReception.tsx` — emit events on check-in/out
- `src/hooks/useHousekeeping.tsx` — event-driven task creation
- New: `src/hooks/useFrontOfficeEvents.tsx`
- New: database trigger for auto-creating HK tasks on checkout

**Hardening requirements:**
- [ ] Check-in creates event record
- [ ] Check-out creates event record
- [ ] HK task auto-creation on checkout event
- [ ] Existing HK manual task creation still works
- [ ] Event history viewable in admin UI
- [ ] RLS isolation
- [ ] Trigger reliability

**Rollback**: Drop event tables. Remove trigger. No operational impact.

**Dependencies**: Phase 8 (stay_id references)

**Implementation notes (completed):**
- `checkin_events` and `checkout_events` tables created with full RLS
- `housekeeping_tasks.triggered_by_event_id` column added
- Events emitted best-effort from `useReception.tsx` checkIn/checkOut mutations
- `src/hooks/useFrontOfficeEvents.tsx` created with fire-and-forget pattern

---

### Phase 10: Billing & Folios

**Status**: ✅ Complete

**Objective**: Structured billing with folios, line items, and payment tracking.

**Risk**: HIGH — financial data, must be accurate

**Schema changes:**

```sql
CREATE TABLE folios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  stay_id uuid REFERENCES stays(id),
  reservation_id uuid REFERENCES reservations(id),
  guest_id uuid REFERENCES guests(id),
  status text NOT NULL DEFAULT 'open',  -- open, closed, void
  total numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'DKK',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE folio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  charge_type text NOT NULL,    -- room, minibar, restaurant, service
  source_id uuid,               -- reference to originating record
  source_type text,             -- room_charge, pos_transaction, etc.
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid NOT NULL REFERENCES folios(id),
  amount numeric(10,2) NOT NULL,
  method text NOT NULL,         -- card, cash, transfer, room_charge
  reference text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
```

**Source of truth**: `room_charges` remains primary. `folio_items` receives dual-writes.

**Hardening requirements:**
- [ ] Folio creation on check-in
- [ ] Charge posting to both room_charges and folio_items
- [ ] Payment recording
- [ ] Folio balance calculation accuracy
- [ ] Currency handling
- [ ] RLS isolation
- [ ] Financial data audit trail

**Rollback**: Drop folio tables. room_charges continues unchanged.

**Dependencies**: Phase 8 (stays model)

**Implementation notes (completed):**
- `folios`, `folio_items`, `payments` tables created with full RLS
- Unique dedup index on `folio_items(source_id, source_type)`
- `src/hooks/useBilling.tsx` created with `mirrorChargeToFolio` fire-and-forget
- Wired into `useChargeMutations.addCharge` in `useReception.tsx`

---

### Phase 11: Integrations & AI Automation

**Status**: ✅ Complete (schema only)

**Objective**: Formalize POS integration, external booking connections, and AI automation pipelines.

**Risk**: MEDIUM — external system dependencies

**Schema changes:**

```sql
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  type text NOT NULL,           -- pos, booking, channel_manager
  provider text NOT NULL,       -- untouchd, booking.com, etc.
  config jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES integrations(id),
  event_type text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  job_type text NOT NULL,       -- pdf_parse, menu_extract, forecast
  input jsonb,
  output jsonb,
  status text DEFAULT 'pending',
  model text,
  duration_ms integer,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

**Source of truth**: New tables (no legacy equivalent). `parser_profiles` linked to integrations.

**Hardening requirements:**
- [ ] Integration CRUD
- [ ] Event logging on sync
- [ ] AI job tracking
- [ ] Error handling for external failures
- [ ] RLS isolation
- [ ] Rate limiting consideration

**Rollback**: Drop tables. Existing AI parsing continues via edge functions.

**Dependencies**: Phase 7 (restaurant model for AI parsing context)

**Implementation notes (completed):**
- `integrations`, `integration_events`, `ai_jobs` tables created with full RLS
- Schema-only deployment — no app code wiring yet
- Existing edge functions (parse-table-plan, manage-users) continue unchanged
- AI job tracking to be wired into parse-table-plan in future iteration

---

### Phase 12: Analytics & Legacy Cleanup

**Status**: ✅ Complete (analytics views only — no legacy removal performed)

**Objective**: Build analytics views on normalized data. Remove legacy columns after full validation.

**Risk**: MEDIUM — irreversible cleanup requires full validation

**Scope:**

1. **Analytics views:**
   - Materialized views for reporting dashboards
   - Aggregations: revenue per room type, F&B consumption trends, occupancy rates
   - Cross-domain views joining stays + folios + inventory

2. **Legacy column removal (only after full validation):**
   - Drop `products.vendor` text column (after `vendor_id` fully adopted)
   - Drop `products.category` enum usage (after `category_id` fully adopted)
   - Archive `reservations` table (after `stays` fully adopted, keep as historical)
   - Remove dual-write code paths

3. **Source-of-truth cutover:**
   - Relational tables become sole source of truth
   - JSON blob writes removed from table plan
   - Legacy enum columns dropped

**Hardening requirements:**
- [ ] All normalized tables have 100% data coverage
- [ ] Analytics views produce correct aggregations
- [ ] No UI regressions after legacy removal
- [ ] Performance: materialized view refresh strategy
- [ ] Backup of all legacy data before drops

**Rollback**: Restore legacy columns from backup. Re-enable dual-writes.

**Dependencies**: ALL previous phases complete and validated

---

## Phase Ordering & Risk Profile

```
Phase 1-4:  Foundation + Admin Reads          ✅ DONE     [LOW]
Phase 5:    Config Write Adoption             ✅ DONE     [LOW]
Phase 6:    Vendor & Category Normalization   ✅ DONE     [MEDIUM]
Phase 7:    Restaurant Domain Model           ✅ DONE     [MEDIUM]
Phase 8:    Guest & Stay Domain Model         ✅ DONE     [HIGH]
Phase 9:    Front Office & HK Events          ✅ DONE     [MEDIUM]
Phase 10:   Billing & Folios                  ✅ DONE     [HIGH]
Phase 11:   Integrations & AI                 ✅ DONE     [MEDIUM]
Phase 12:   Analytics & Cleanup (prep only)   ✅ DONE     [MEDIUM]
```

---

## Hardening Template

Each phase hardening pass must cover:

### 1. Referential Safety
- Can referenced records be safely deleted/deactivated?
- Are FK cascades correct?
- Do inactive references still display?

### 2. Data Integrity
- Unique constraints / dedup indexes in place?
- Idempotent writes verified?
- No orphaned records possible?

### 3. RLS Safety
- Hotel isolation confirmed?
- Role restrictions correct?
- No privilege escalation?
- Cross-hotel writes impossible?

### 4. Dual-Write Consistency
- Primary write always succeeds?
- Mirror write is best-effort?
- Mirror failures logged, never blocking?
- No drift conditions?

### 5. Performance
- Indexes on FK columns?
- Query plans reviewed for joins?
- Page load times unchanged (±10%)?

### 6. Rollback Verification
- Can the phase be reversed?
- What data is preserved on rollback?
- Is rollback documented?

### 7. UI Validation
- All affected pages load correctly?
- Empty states handled?
- Error messages user-friendly?
- Realtime updates still functional?

---

## Production-Critical Flows (Always Revalidate)

After every phase:

1. Login + hotel selection
2. Table plan load + save + AI parse
3. Inventory quick count + stock adjustment
4. Purchase order create + receive
5. Check-in / check-out
6. Housekeeping task assignment + completion
7. User creation + approval
8. Realtime updates across devices

---

## Key Technical Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Soft-delete over hard-delete for config | 5 | Referential safety with legacy FKs |
| Partial unique index on active slugs | 5 | Allow reuse of deactivated slugs |
| Category backfill via slug matching | 6 | 100% match rate, safe automated backfill |
| Delete-and-replace for mirror writes | 7 | Simpler than upsert, atomic per date |
| Fire-and-forget mirror pattern | 7 | Never blocks primary JSON write |
| Reservation_id on stays table | 8 (planned) | Enables data parity verification |

---

## Current State Summary

**What works today:**
- Multi-tenant hotel platform with RLS isolation
- Full config CRUD for 8 domains
- Product vendor/category normalization with dual-write
- Restaurant table plan with relational mirror
- AI PDF parsing with dual-write to relational tables
- Real-time updates across devices
- Role-based access control

**What uses legacy as source of truth:**
- `table_plans.assignments_json` for dinner service (relational mirror active)
- `reservations` for front desk (stays model not yet built)
- `room_charges` for billing (folios not yet built)
- `products.vendor` text field (FK available, dual-write active)
- `products.category` enum (FK backfilled, dual-write active)

**Next action**: Phase 8 — Guest & Stay Domain Model
