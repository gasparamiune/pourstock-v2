# PourStock Migration Master Plan
## From Restaurant Tool → 500+ Hotel Operations Platform

---

## Executive Summary

PourStock must evolve from a single-hotel restaurant-focused tool into a multi-tenant hotel operations platform serving 500+ properties. This plan defines 12 execution phases, each with explicit scope, source-of-truth rules, exit criteria, and rollback strategy. Phases 1–4 are complete. The plan prioritizes production safety at Sønderborg Strand Hotel while enabling rapid domain expansion.

**Current state**: Foundational multi-tenant schema in place. Low-risk admin reads adopted. All operational flows use legacy tables as source of truth. No destructive changes made.

**Target state**: Domain-driven architecture across 13 functional domains, with all reads and writes using normalized tables, full RLS isolation, and modular per-hotel configuration.

---

## Migration Rules (Non-Negotiable)

These rules apply to ALL phases:

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
| 5 | Config Write Adoption | **NEXT** | LOW | Config/Admin |
| 6 | Vendor & Category Normalization | Planned | MEDIUM | Inventory |
| 7 | Restaurant Domain Model | Planned | MEDIUM | Restaurant/Service |
| 8 | Guest & Stay Domain Model | Planned | HIGH | Guests/Stays/Rooms |
| 9 | Front Office & Housekeeping Events | Planned | HIGH | Front Office, HK |
| 10 | Billing & Folios | Planned | HIGH | Billing |
| 11 | Integrations & AI Automation | Planned | MEDIUM | Integrations, AI |
| 12 | Analytics & Legacy Cleanup | Planned | MEDIUM | Analytics, Cleanup |

---

## Phase Details

---

### Phase 5: Config Write Adoption

**Objective**: Enable CRUD on admin/settings tables that are currently read-only displays.

**Scope**: Add create/update/delete UI for settings entities introduced in Phases 2–4.

**Domains**: Config/Admin

**Tables affected**:
- `restaurants` — add/edit/delete restaurants
- `service_periods` — add/edit/delete periods
- `room_types` — add/edit/delete room types
- `product_categories` — add/edit/delete categories
- `vendors` — full CRUD
- `departments` — add/edit/reorder
- `reorder_rules` — full CRUD
- `hotel_modules` — toggle enable/disable

**Files likely affected**:
- `src/components/settings/RestaurantSettings.tsx` → add forms/dialogs
- `src/components/settings/RoomTypeSettings.tsx` → add forms/dialogs
- `src/components/settings/ProductCategorySettings.tsx` → add forms/dialogs
- `src/components/settings/VendorSettings.tsx` → add forms/dialogs
- `src/components/settings/DepartmentSettings.tsx` → add forms/dialogs
- `src/components/settings/ReorderRuleSettings.tsx` → add forms/dialogs
- `src/hooks/useHotelModules.tsx` → add mutation
- New: `src/hooks/useSettingsCRUD.tsx` (generic CRUD hook)

**Source of truth during phase**:
- These tables become the source of truth for their own data (they are new, not replacing legacy)
- Legacy `products.vendor` text field, `products.category` enum, `rooms.room_type` enum remain unchanged
- No operational flow changes

**Compatibility strategy**: Pure UI addition. No operational reads change. Legacy fields untouched.

**Required tests**:
- [ ] CRUD operations for each settings entity
- [ ] RLS enforcement: staff cannot write, managers/admins can
- [ ] Empty state handling
- [ ] Validation (duplicate slugs, required fields)

**Hardening pass**:
- RLS write policy verification for each table
- Input validation review
- Audit log integration check

**Rollback strategy**: Remove CRUD UI; tables revert to read-only displays. No data loss.

**Exit criteria**:
- All 8 settings entities have working CRUD
- RLS policies verified for write operations
- No operational flow affected

**Main risks**: LOW — all settings tables are isolated from operational flows

**Dependencies**: Phases 1–4 complete

---

### Phase 6: Vendor & Category Normalization

**Objective**: Link operational tables to normalized reference tables via optional FK columns.

**Scope**: Add `vendor_id` FK to `products` and `purchase_orders`. Add `category_id` FK to `products`. Dual-write from UI. Read from new columns where populated, fall back to legacy text/enum.

**Domains**: Inventory/Procurement

**Tables affected**:
- `products` — add `vendor_id uuid REFERENCES vendors(id)`, `category_id uuid REFERENCES product_categories(id)` (both nullable)
- `purchase_orders` — `vendor_id` already exists as text; migrate to uuid FK

**Files likely affected**:
- `src/hooks/useInventoryData.tsx` — read with fallback
- `src/api/queries.ts` — join vendors/categories
- `src/pages/Products.tsx` — vendor/category picker
- `src/pages/Orders.tsx` — vendor picker
- Product create/edit forms

**Source of truth during phase**:
- **Dual source**: if `vendor_id` is set, use it; else fall back to `products.vendor` text
- **Dual source**: if `category_id` is set, use it; else fall back to `products.category` enum
- Writes: set both old and new fields (dual-write)

**Compatibility strategy**: Nullable FK columns. Legacy text/enum fields unchanged. UI shows normalized data when available.

**Required tests**:
- [ ] Products with vendor_id resolve vendor name correctly
- [ ] Products without vendor_id still show legacy text
- [ ] Category filtering works with both old enum and new category_id
- [ ] Purchase order vendor selection uses vendors table
- [ ] Existing products remain unchanged

**Hardening pass**:
- Data consistency check: vendor names match between text and FK
- Performance: ensure joins don't slow product list
- RLS: verify vendor reads respect hotel isolation

**Rollback strategy**: Drop FK columns. UI reverts to legacy text/enum only.

**Exit criteria**:
- All new products use vendor_id and category_id
- Legacy products still display correctly
- No data loss or display regressions

**Main risks**: MEDIUM — first time changing an operational table's columns

**Dependencies**: Phase 5 (vendors/categories must have CRUD)

---

### Phase 7: Restaurant Domain Model

**Objective**: Migrate table plan from monolithic JSON to relational model. Link to restaurants and service periods.

**Scope**: Create `restaurant_reservations` and `table_assignments` tables. Dual-write from table plan save. Read from new tables with JSON fallback.

**Domains**: Restaurant/Service

**Tables affected**:
- New: `restaurant_reservations` (guest_name, party_size, room_number, course, dietary, notes, service_period_id, restaurant_id)
- New: `table_assignments` (reservation_id → restaurant_reservations, table_id, assigned_at, status)
- `table_plans` — continues as legacy source, dual-write to new tables
- `reservation_imports` — link to restaurant_reservations on import
- `table_plan_changes` — remains as-is

**Files likely affected**:
- `src/hooks/useTableLayout.tsx` — dual-write on save
- `src/components/tableplan/FloorPlan.tsx` — read with fallback
- `src/components/tableplan/assignmentAlgorithm.ts` — output to both formats
- `supabase/functions/parse-table-plan/index.ts` — write to restaurant_reservations
- New: `src/hooks/useRestaurantReservations.tsx`

**Source of truth during phase**:
- `table_plans.assignments_json` remains primary source of truth
- `restaurant_reservations` + `table_assignments` receive dual-writes
- Reads can optionally come from new tables if populated, with JSON fallback

**Compatibility strategy**: JSON blob stays. New relational tables are populated in parallel. Cutover happens in a later phase after validation.

**Required tests**:
- [ ] Table plan save writes to both JSON and relational tables
- [ ] Table plan load produces identical output from both sources
- [ ] AI PDF parser writes to restaurant_reservations
- [ ] Preparation summary works from both sources
- [ ] Drag-and-drop updates both sources
- [ ] Realtime sync still works

**Hardening pass**:
- Data parity check: JSON vs relational after 1 week of dual-write
- Performance: relational queries vs JSON parsing
- RLS on new tables

**Rollback strategy**: Stop dual-writes. Delete relational data. JSON source continues unchanged.

**Exit criteria**:
- Dual-write active for 1+ weeks
- Data parity confirmed
- No performance regression
- Ready for read cutover in next phase

**Main risks**: HIGH — core production feature (dinner service at Sønderborg Strand)

**Dependencies**: Phase 5 (restaurants/service_periods CRUD), Phase 6 not required

---

### Phase 8: Guest & Stay Domain Model

**Objective**: Introduce `stays` as the core operational unit replacing `reservations` for front office workflows.

**Scope**: Create `stays`, `stay_guests`, `room_assignments` tables. Dual-write from reservation mutations. Read from new tables in reception UI with fallback.

**Domains**: Guests/Stays/Rooms

**Tables affected**:
- New: `stays` (hotel_id, room_id, check_in, check_out, status, source, notes)
- New: `stay_guests` (stay_id, guest_id, is_primary, relation)
- New: `room_assignments` (stay_id, room_id, assigned_at, released_at)
- `reservations` — remains as legacy, dual-write to `stays`
- `rooms` — `room_type_id` FK added (nullable, optional)
- `guests` — unchanged

**Files likely affected**:
- `src/hooks/useReception.tsx` — dual-write mutations
- `src/components/reception/RoomBoard.tsx` — read with fallback
- `src/components/reception/CheckInDialog.tsx` — write to both
- `src/components/reception/CheckOutDialog.tsx` — write to both
- `src/components/reception/GuestDirectory.tsx` — join stay_guests
- New: `src/hooks/useStays.tsx`

**Source of truth during phase**:
- `reservations` remains primary source of truth
- `stays` receives dual-writes
- Reception UI reads from `reservations` with optional `stays` enrichment

**Compatibility strategy**: All mutations write to `reservations` first (primary), then `stays` (best-effort). UI reads `reservations`. No cutover in this phase.

**Required tests**:
- [ ] Check-in writes to both reservations and stays
- [ ] Check-out writes to both
- [ ] Room status updates work
- [ ] Guest directory still loads
- [ ] Housekeeping task generation still works
- [ ] Realtime updates still fire

**Hardening pass**:
- Data parity: reservations vs stays after 2 weeks
- RLS on stays, stay_guests, room_assignments
- Performance: reception page load time

**Rollback strategy**: Stop dual-writes. Drop stays data. Reservations continue unchanged.

**Exit criteria**:
- Dual-write active for 2+ weeks
- Data parity confirmed
- Reception UI stable
- Ready for read cutover

**Main risks**: HIGH — core production feature (front desk operations)

**Dependencies**: Phase 5 (room_types CRUD)

---

### Phase 9: Front Office & Housekeeping Events

**Objective**: Add event logging for check-in/check-out and structured task management.

**Scope**: Create `checkin_events`, `checkout_events` tables. Integrate with stays/reservations mutations. Enhance housekeeping with event-driven task generation.

**Domains**: Front Office, Housekeeping

**Tables affected**:
- New: `checkin_events` (stay_id/reservation_id, performed_by, timestamp, method, notes)
- New: `checkout_events` (stay_id/reservation_id, performed_by, timestamp, balance, notes)
- `housekeeping_tasks` — add optional `triggered_by_event_id`
- `maintenance_requests` — unchanged

**Files likely affected**:
- `src/hooks/useReception.tsx` — emit events on check-in/out
- `src/hooks/useHousekeeping.tsx` — event-driven task creation
- New: `src/hooks/useFrontOfficeEvents.tsx`
- New: database trigger for auto-creating HK tasks on checkout

**Source of truth during phase**:
- Events are additive (new data, not replacing anything)
- `reservations` / `stays` status changes remain the operational trigger
- Events provide audit trail and automation triggers

**Compatibility strategy**: Pure addition. No existing flow changes. Events are logged alongside existing mutations.

**Required tests**:
- [ ] Check-in creates event record
- [ ] Check-out creates event record
- [ ] HK task auto-creation on checkout event
- [ ] Existing HK manual task creation still works
- [ ] Event history viewable in admin UI

**Hardening pass**: RLS, trigger reliability, performance under load

**Rollback strategy**: Drop event tables. Remove trigger. No operational impact.

**Exit criteria**: Events logging for 1+ weeks. HK auto-tasks validated.

**Main risks**: MEDIUM — additive, but touches check-in/out mutation path

**Dependencies**: Phase 8 (stays model preferred but not required — can reference reservations)

---

### Phase 10: Billing & Folios

**Objective**: Introduce structured billing with folios, line items, and payment tracking.

**Scope**: Create `folios`, `folio_items`, `payments` tables. Link to stays/reservations. Migrate from `room_charges`.

**Domains**: Billing

**Tables affected**:
- New: `folios` (stay_id/reservation_id, guest_id, status, total, hotel_id)
- New: `folio_items` (folio_id, description, amount, charge_type, source_id, created_by)
- New: `payments` (folio_id, amount, method, reference, created_by)
- `room_charges` — dual-write to folio_items, remains legacy source

**Source of truth**: `room_charges` remains primary. `folio_items` receives dual-writes.

**Dependencies**: Phase 8 (stays model)

**Main risks**: HIGH — financial data, must be accurate

---

### Phase 11: Integrations & AI Automation

**Objective**: Formalize POS integration, external booking system connections, and AI automation pipelines.

**Scope**: Create `integrations`, `integration_events`, `ai_jobs` tables. Standardize webhook/API patterns.

**Domains**: Integrations, AI/Automation

**Tables affected**:
- New: `integrations` (hotel_id, type, config, status, last_sync)
- New: `integration_events` (integration_id, event_type, payload, status)
- New: `ai_jobs` (hotel_id, job_type, input, output, status, model, duration)
- `parser_profiles` — link to integrations

**Source of truth**: New tables (no legacy equivalent)

**Dependencies**: Phase 7 (restaurant model for AI parsing)

**Main risks**: MEDIUM — external system dependencies

---

### Phase 12: Analytics & Legacy Cleanup

**Objective**: Build analytics views on normalized data. Remove legacy columns/tables after full validation.

**Scope**: Create materialized views for reporting. Drop legacy text/enum columns. Archive old tables.

**Domains**: Analytics, Cleanup

**Tables affected**:
- Drop: `products.vendor` text column (after vendor_id fully adopted)
- Drop: `products.category` enum usage (after category_id fully adopted)
- Archive: `reservations` (after stays fully adopted, keep as historical)
- New: reporting views, materialized aggregations

**Source of truth**: All normalized tables become sole source of truth

**Dependencies**: ALL previous phases complete and validated

**Main risks**: MEDIUM — irreversible cleanup. Requires full validation.

---

## Phase Ordering & Domain Sequence

```
Phase 5: Config Write Adoption          [LOW risk]  ← NEXT
Phase 6: Vendor & Category Normalization [MEDIUM]
Phase 7: Restaurant Domain Model        [MEDIUM-HIGH]
Phase 8: Guest & Stay Domain Model      [HIGH]
Phase 9: Front Office & HK Events       [MEDIUM]
Phase 10: Billing & Folios              [HIGH]
Phase 11: Integrations & AI             [MEDIUM]
Phase 12: Analytics & Cleanup           [MEDIUM]
```

**Rationale**: Config writes first (zero risk, enables all later phases). Then normalize inventory data (medium risk, isolated domain). Then restaurant model (core feature but well-understood). Guests/stays after restaurant because it's higher risk and benefits from restaurant model stability. Events/billing after stays. Integrations and analytics last.

---

## Test Strategy

### After Every Phase

1. **Manual smoke test** (5 min):
   - Login → Dashboard → each module page loads
   - Table plan: load, drag, save
   - Inventory: view products, adjust stock
   - Reception: view rooms, check-in flow
   - Housekeeping: view tasks, update status

2. **RLS verification** (per affected table):
   - Confirm hotel isolation
   - Confirm role restrictions
   - Test with staff, manager, admin accounts

3. **Data parity check** (for dual-write phases):
   - Compare legacy and new table counts
   - Spot-check 10 random records for field accuracy

### Automation Targets

| Test | Priority | When |
|------|----------|------|
| Auth flow (login/logout/redirect) | P0 | Phase 8+ |
| RLS isolation (cross-hotel query returns 0) | P0 | Phase 6+ |
| Table plan save/load roundtrip | P1 | Phase 7+ |
| Stock level calculation accuracy | P1 | Phase 6+ |
| Reservation status transitions | P1 | Phase 8+ |

### Production-Critical Flows (Always Revalidate)

1. Login + hotel selection
2. Table plan load + save + AI parse
3. Inventory quick count + stock adjustment
4. Purchase order create + receive
5. Check-in / check-out
6. Housekeeping task assignment + completion
7. User creation + approval
8. Realtime updates across devices

---

## Hardening Strategy

| Phase Risk | Hardening Required |
|------------|-------------------|
| LOW | Code review + manual smoke test |
| MEDIUM | + RLS audit + data parity check + 48h soak |
| HIGH | + dedicated validation pass + 1-week soak + performance review |

### Hardening Checklist Template

- [ ] All new RLS policies reviewed
- [ ] No security regression (compare policy count before/after)
- [ ] Fallback behavior verified (disable new feature → old behavior works)
- [ ] Performance: page load times unchanged (±10%)
- [ ] No console errors in production
- [ ] Realtime subscriptions still work
- [ ] Cross-hotel isolation confirmed

---

## Recommended Next Phase

**Phase 5: Config Write Adoption**

**Why**:
- Zero operational risk (all settings tables are isolated)
- Unlocks Phases 6–8 (vendors/categories need CRUD before normalization)
- Immediate user value (admins can configure their hotel)
- Fast to implement (standard CRUD patterns)
- No source-of-truth migration involved

**Estimated scope**: 8 settings components get add/edit/delete dialogs + a shared CRUD hook.
