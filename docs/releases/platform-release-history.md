# PourStock Platform Release History

A chronological record of major platform milestones.

---

## Initial System Launch

**Scope**: Single-hotel restaurant operations platform

- AI-powered table planning with PDF reservation parsing
- Beverage inventory management with quick counts
- Purchase ordering and receiving workflows
- Role-based user management with approval workflow
- Real-time updates via Supabase Realtime
- Multi-tenant architecture with RLS isolation

**Production deployment**: Sønderborg Strand Hotel

---

## Migration Program Launch (Phases 1–2)

**Scope**: Multi-tenant schema foundation

- Established 14 normalized reference tables across all domains
- Hotel modules feature flag system
- Membership roles for granular access control
- Parser profiles for configurable AI parsing
- Hotel settings key-value configuration

**Impact**: No operational changes. Additive schema only.

---

## Configuration Adoption (Phases 3–5)

**Scope**: Settings UI reads and writes from normalized tables

- Admin reads adopted for restaurants, service periods, room types, product categories, vendors, departments, reorder rules, hotel modules
- Full CRUD with shared `useSettingsCrud` hook
- Navigation visibility gated by hotel modules
- Soft-delete pattern with partial unique indexes
- Error sanitization for constraint violations

**Impact**: Settings management now uses normalized tables. No operational flow changes.

---

## Inventory Normalization (Phase 6)

**Scope**: Vendor and category FK references on products

- `vendor_id` and `category_id` FK columns added to products
- Dual-write on product creation
- `category_id` backfilled for all existing products
- Vendor/category picker dropdowns in product forms

**Impact**: Product creation dual-writes. Legacy text fields preserved.

---

## Restaurant Domain Mirror (Phase 7)

**Scope**: Relational mirror of table plan assignments

- `restaurant_reservations` and `table_assignments` tables
- Fire-and-forget mirror writes from UI and edge function
- Atomic delete-and-replace per service date

**Impact**: Table planning unchanged. Relational mirror accumulates data.

---

## Full Migration Completion (Phases 8–12)

**Scope**: Operational domain mirroring across stays, events, billing, integrations, and analytics

- **Phase 8**: `stays`, `stay_guests`, `room_assignments` mirror `reservations`
- **Phase 9**: `checkin_events`, `checkout_events` for audit logging; HK automation trigger
- **Phase 10**: `folios`, `folio_items`, `payments` mirror `room_charges`
- **Phase 11**: `integrations`, `integration_events`, `ai_jobs` schema deployed
- **Phase 12**: Parity and analytics views (`v_daily_occupancy`, `v_revenue_summary`, `v_stay_parity`, `v_folio_parity`)

**Impact**: All operational domains have normalized mirrors. No source-of-truth cutovers. Legacy systems remain primary.

---

## Hardening Layer Deployment

**Scope**: Production observability and reconciliation infrastructure

- Enhanced parity views for drift detection
- `dual_write_failures` table with centralized logger
- `reconcile_stay_from_reservation()` and `reconcile_folio_from_charges()` repair functions
- `reconciliation_log` audit trail
- `v_migration_health` per-hotel health dashboard
- Performance indexes on parity-critical columns
- `created_by` audit columns on `stays` and `folios`

**Impact**: Engineers and operators can now monitor mirror health and repair drift.

---

## Soak Validation Framework

**Scope**: Evidence-gathering infrastructure for cutover readiness

- 7 validation views for daily operational monitoring
- Failure grouping and noise control
- Reconciliation audit trail with actor/timestamp/result
- Percentage-based health thresholds for fair cross-hotel comparison
- Security hardening on reconciliation functions
- Documented cutover criteria per domain

**Impact**: System is in soak mode, accumulating parity evidence. No cutovers executed.

---

## Current State

As of March 2026, the platform is:

- Operational at Sønderborg Strand Hotel
- Running all 12 migration phases with dual-write active
- Collecting parity evidence via the soak validation framework
- Ready for domain-by-domain cutover decisions when thresholds are met
- Fully documented with architectural decision records, runbooks, and release history
