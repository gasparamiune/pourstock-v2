# PourStock Platform Evolution

A chronological record of the platform's architectural development.

---

## Platform Origins

PourStock began as a restaurant operations tool for Sønderborg Strand Hotel in Denmark. The initial system provided:

- AI-powered dinner service table planning using PDF reservation uploads
- Beverage inventory management with quick counts and stock tracking
- Purchase ordering and receiving workflows
- Role-based user management with approval workflows

The architecture was designed for a single hotel with:

- A monolithic `reservations` table for all front office state
- JSON blobs (`table_plans.assignments_json`) for table assignments
- Text fields on `products` for vendor and category references
- No structured billing, event logging, or integration tracking
- Supabase backend with Row Level Security for data protection

---

## Multi-Tenant Foundation

The platform was designed from the start with multi-tenancy via `hotel_id` on all operational tables and RLS policies enforcing hotel isolation. The `hotel_members` table with role-based access (`hotel_admin`, `manager`, `staff`) provided the authorization framework.

Edge functions for hotel creation and user management handled onboarding flows. Authentication used email verification with Supabase Auth.

---

## Inventory System

The inventory module provided:

- Product catalog with beverage categorization
- Multi-location stock tracking
- Quick count workflows for bar staff
- Partial bottle tracking
- Stock movement history
- Reorder threshold configuration
- Purchase order lifecycle (draft → sent → received)

Products used text fields for vendor names and an enum for category, which later became targets for normalization.

---

## Restaurant Table Planning System

The table planning system used AI (Gemini) to extract reservation data from uploaded PDFs:

- Guest name, room number, party size, course, dietary requirements
- Configurable parser profiles per hotel
- Auto-assignment algorithm considering table capacity and guest preferences
- Drag-and-drop seating adjustments
- Real-time updates across devices during service
- Preparation summaries for cutlery, glassware, and service items

Table assignments were stored as JSON blobs in `table_plans.assignments_json`, providing a flexible but unstructured data model.

---

## Migration Program (Phases 1–12)

### Phases 1–2: Foundation

Established the normalized schema foundation with 14 reference tables covering restaurants, service periods, room types, product categories, vendors, departments, reorder rules, hotel modules, parser profiles, hotel settings, reservation imports, locations, guest preferences, and membership roles.

### Phases 3–5: Configuration Adoption

Progressively adopted normalized tables for admin/settings reads and then full CRUD operations across 8 configuration domains. Navigation visibility was gated by `hotel_modules` feature flags. Shared `useSettingsCrud` hook provided generic CRUD with error sanitization.

### Phase 6: Inventory Normalization

Added FK references (`vendor_id`, `category_id`) to `products` alongside legacy text fields. Implemented dual-write on product creation. Backfilled `category_id` for all existing products via slug matching.

### Phase 7: Restaurant Domain Mirror

Created `restaurant_reservations` and `table_assignments` as a relational mirror of `table_plans.assignments_json`. Both the UI and the `parse-table-plan` edge function perform fire-and-forget mirror writes after successful JSON operations.

### Phase 8: Guest Stay Model

Introduced `stays`, `stay_guests`, and `room_assignments` as a shadow model mirroring `reservations`. Check-in and check-out mutations dual-write to both systems. No UI reads from stays tables.

### Phase 9: Front Office Events

Added `checkin_events` and `checkout_events` as additive audit logs. Events are emitted best-effort after successful operational mutations. `housekeeping_tasks.triggered_by_event_id` enables event-driven HK automation.

### Phase 10: Billing Model

Introduced `folios`, `folio_items`, and `payments` as a structured billing mirror of `room_charges`. Folio auto-creation on first charge. Source dedup index prevents duplicate mirror writes.

### Phase 11: Integrations & AI

Deployed schema for `integrations`, `integration_events`, and `ai_jobs`. Schema-only — no app code wiring. Preserves existing edge function behavior.

### Phase 12: Analytics Views

Created parity and analytics views (`v_daily_occupancy`, `v_revenue_summary`, `v_stay_parity`, `v_folio_parity`) using `security_invoker = true` for RLS-compliant analytics.

---

## Hardening & Observability Layer

After migration completion, a comprehensive hardening pass established:

- **Enhanced parity views** for drift detection across stays and folios
- **Structured failure logging** via `dual_write_failures` table and centralized `dualWriteLogger`
- **Reconciliation helpers** — security-definer SQL functions for idempotent mirror repair
- **Audit trail** — `reconciliation_log` table for repair traceability
- **Performance indexes** — targeted indexes on parity-critical columns
- **Health dashboard** — `v_migration_health` view with per-hotel automated status recommendations

---

## Soak Validation Framework

The soak validation framework provides the evidence-gathering infrastructure for future cutover decisions:

- **Validation query pack** — 7 views for daily operational monitoring
- **Failure noise control** — grouped failure analysis for efficient triage
- **Reconciliation audit trail** — full traceability for all repair operations
- **Percentage-based health thresholds** — fair assessment across hotels of different sizes
- **Security hardening** — reconciliation functions with fixed search_path and role checks

---

## Current Platform State

As of March 2026:

- All 12 migration phases complete
- Post-migration hardening deployed
- Soak validation infrastructure active
- Legacy tables remain primary sources of truth
- No domain cutover has been executed
- System is stable and collecting parity evidence for future cutover decisions
