# PourStock Platform Migration Record

## 1. Overview

### What is PourStock

PourStock is a multi-tenant SaaS platform for hotel and restaurant operations in the Nordic region. It combines AI-powered dinner service table planning, beverage inventory management, purchase ordering, housekeeping coordination, front office operations, and operational reporting into a single, real-time platform designed for use on tablets and phones during live service.

The platform is operational at Sønderborg Strand Hotel and architected to scale to hundreds of properties across Denmark and the Nordic region.

### Why the Migration Was Undertaken

PourStock originated as a restaurant-focused tool for a single hotel. The early architecture used:

- Flat JSON blobs for table plan assignments
- A monolithic `reservations` table for all front office state
- Text fields for vendor and category references on products
- No structured billing model
- No event logging or audit trail
- No formalized integration or AI job tracking

These limitations prevented multi-hotel scaling, operational analytics, and domain-driven feature expansion. The migration program was designed to introduce a normalized, domain-driven architecture while preserving full production stability.

### Migration Goals

1. Establish a domain-driven relational architecture across 13 functional domains
2. Enable multi-hotel scaling with strict tenant isolation
3. Create structured billing, event logging, and integration tracking
4. Build observability infrastructure for data parity validation
5. Prepare for domain-by-domain source-of-truth cutovers without service disruption

### Safety Principles

The migration was governed by strict safety principles applied in every phase:

| Principle | Description |
|-----------|-------------|
| **Additive Schema Evolution** | New tables and columns added before any legacy behavior is removed |
| **Source-of-Truth Preservation** | Legacy tables remain authoritative until parity is validated and cutover is explicitly approved |
| **Dual-Write Mirroring** | Normalized tables populated via best-effort writes alongside primary operations |
| **Fire-and-Forget Mirrors** | Mirror write failures are logged but never block the primary user flow |
| **Reversible Migrations** | Every phase can be rolled back by removing mirror writes and dropping new tables |
| **RLS Isolation** | Hotel-scoped Row Level Security enforced on every table in every phase |
| **Observability-First** | Parity views, failure logging, and health dashboards deployed before any cutover consideration |
| **No Per-Hotel Forks** | All behavioral differences handled via configuration, settings, and feature flags |

---

## 2. Migration Program Summary

| Phase | Domain | Objective | Risk | Status |
|-------|--------|-----------|------|--------|
| 1 | Platform Core | Multi-tenant foundation, RLS, auth, edge functions | — | Complete |
| 2 | All Domains | Additive schema foundation — 14 normalized reference tables | — | Complete |
| 3 | Config/Admin | Low-risk admin reads (Batch 1) — settings UI reads from normalized tables | Low | Complete |
| 4 | Config/Admin | Low-risk admin reads (Batch 2) — navigation gated by hotel_modules | Low | Complete |
| 5 | Config/Admin | Full CRUD adoption for 8 configuration domains | Low | Complete |
| 6 | Inventory | Vendor and category normalization with FK dual-write | Medium | Complete |
| 7 | Restaurant | JSON → relational mirror for table assignments | Medium | Complete |
| 8 | Guests/Stays | Reservation → stays mirror with stay_guests and room_assignments | High | Complete |
| 9 | Front Office | Check-in/check-out event logging, HK automation triggers | Medium | Complete |
| 10 | Billing | Structured folios, folio items, and payments mirror | High | Complete |
| 11 | Integrations | Integration registry, event logging, AI job tracking (schema only) | Medium | Complete |
| 12 | Analytics | Parity views, occupancy, and revenue summary views | Medium | Complete |

**Post-migration hardening** and **soak validation** layers were deployed after Phase 12.

---

## 3. Architectural Safety Model

### Source-of-Truth Discipline

Throughout the migration, the following sources of truth were preserved and remain active:

| Domain | Primary Source | Mirror Tables | Cutover Status |
|--------|---------------|---------------|----------------|
| Front Office | `reservations` | `stays`, `stay_guests`, `room_assignments` | No cutover |
| Billing | `room_charges` | `folios`, `folio_items`, `payments` | No cutover |
| Restaurant Planning | `table_plans.assignments_json` | `restaurant_reservations`, `table_assignments` | No cutover |
| Inventory (Vendor) | `products.vendor` (text) | `products.vendor_id` → `vendors` | Dual-write active |
| Inventory (Category) | `products.category` (enum) | `products.category_id` → `product_categories` | FK backfilled |

No domain has been cut over. Legacy systems remain authoritative.

### Dual-Write Mirror Pattern

All mirror writes follow a consistent pattern:

1. **Primary write executes first** — the operational mutation against the legacy table
2. **Mirror write follows** — best-effort insert/upsert into the normalized table
3. **Failure handling** — mirror errors are logged to `dual_write_failures` and `console.warn`, never thrown
4. **Idempotency** — unique constraints and dedup indexes prevent duplicate mirror rows
5. **No UI dependency** — no UI component reads from mirror tables

### Rollback Guarantees

Every phase was designed to be reversible:

- Remove mirror write calls from hooks
- Drop new tables (no operational impact since no reads depend on them)
- Legacy data remains intact and unmodified

### RLS Isolation

All tables use Row Level Security policies enforcing hotel-scoped access via `hotel_members` membership. Security-definer functions use fixed `search_path` and explicit role checks. No cross-hotel data access is possible at the database level.

---

## 4. Final Architecture (Post-Migration)

### Inventory

- **Source of truth**: `products` table with legacy `vendor` text and `category` enum fields
- **Normalized FKs**: `vendor_id` → `vendors`, `category_id` → `product_categories` (dual-written)
- **Supporting tables**: `reorder_rules`, `locations`, `purchase_orders`, `purchase_order_items`
- **Observability**: Standard query-based validation

### Restaurant Operations

- **Source of truth**: `table_plans.assignments_json` (JSON blob per service date)
- **Mirror model**: `restaurant_reservations` + `table_assignments` (relational mirror)
- **Mirror mechanism**: Fire-and-forget from `TablePlan.tsx` and `parse-table-plan` edge function
- **Supporting tables**: `restaurants`, `service_periods`, `parser_profiles`, `reservation_imports`
- **Observability**: No parity view yet (noted as pre-cutover requirement)

### Reception / Guest Stays

- **Source of truth**: `reservations` table
- **Mirror model**: `stays` + `stay_guests` + `room_assignments`
- **Mirror mechanism**: `useStays.tsx` → `mirrorWriteStayOnCheckIn/Out` (fire-and-forget)
- **Event streams**: `checkin_events`, `checkout_events` (additive audit logs)
- **Observability**: `v_stay_parity`, `v_recent_stay_drift`, `v_duplicate_stay_mirrors`

### Housekeeping

- **Source of truth**: `housekeeping_tasks` table
- **Automation**: `triggered_by_event_id` column links tasks to checkout events
- **Event-driven**: HK tasks can be auto-created on checkout (additive, idempotent)
- **Supporting tables**: `housekeeping_logs`, `maintenance_requests`

### Billing / Folios

- **Source of truth**: `room_charges` table
- **Mirror model**: `folios` + `folio_items` + `payments`
- **Mirror mechanism**: `useBilling.tsx` → `mirrorChargeToFolio` (fire-and-forget)
- **Dedup**: Unique index on `folio_items(source_id, source_type)`
- **Observability**: `v_folio_parity`, `v_recent_folio_drift`, `v_duplicate_folio_mirrors`

### Integrations

- **Tables**: `integrations`, `integration_events` (schema deployed, no app wiring yet)
- **Status**: Registry and event logging schema ready for future integration CRUD

### AI Automation

- **Tables**: `ai_jobs` (schema deployed)
- **Existing**: `parse-table-plan` edge function operational (not yet wired to `ai_jobs`)
- **Status**: Job lifecycle tracking ready for future wiring

### Analytics

- **Views**: `v_daily_occupancy`, `v_revenue_summary`, `v_stay_parity`, `v_folio_parity`
- **Security**: All views use `security_invoker = true` (RLS of querying user enforced)

---

## 5. Hardening Layer

After all 12 migration phases, a comprehensive hardening pass was deployed to ensure production stability during the soak period.

### Parity Observability

Enhanced parity views detect missing rows, status mismatches, room assignment drift, and amount discrepancies between primary and mirrored tables.

**Key objects**: `v_stay_parity`, `v_folio_parity`, `v_parity_summary`, `v_recent_stay_drift`, `v_recent_folio_drift`

### Dual-Write Failure Logging

The `dual_write_failures` table provides structured diagnostics for every mirror write failure, replacing ad-hoc `console.warn` logging as the primary debugging mechanism. The centralized logger in `src/lib/dualWriteLogger.ts` captures domain, operation, payload, and error details without blocking the UI.

### Reconciliation Helpers

Security-definer SQL functions enable idempotent, hotel-scoped repair of mirrored data:

- `reconcile_stay_from_reservation(_reservation_id)` — re-mirrors a stay from its source reservation
- `reconcile_folio_from_charges(_reservation_id)` — re-mirrors folio items from room charges

All reconciliation actions are logged to the `reconciliation_log` table with actor, timestamp, and result.

### Operational Auditability

`created_by` columns were added to `stays` and `folios` for actor traceability. Mirror-created records are identifiable as user actions, system mirrors, AI processes, or integration syncs via standardized `source` fields.

### Index / Performance Review

Targeted indexes were added on `reservation_id`, `status`, `stay_id`, `folio_id`, and active `room_assignments` to support parity view performance without degrading operational page loads.

### Migration Health Dashboard

The `v_migration_health` view provides a per-hotel summary including stay parity percentage, folio parity percentage, unresolved failure counts, and an automated recommendation (`healthy`, `monitor`, `not_ready`) using percentage-based thresholds.

---

## 6. Soak Validation Framework

### Purpose

Before any source-of-truth cutover can be considered, the system must accumulate evidence of data parity and operational stability over a sustained period. The soak validation framework provides the tools and criteria for this process.

### Drift Detection

| View | Purpose |
|------|---------|
| `v_recent_stay_drift` | Identifies stay mirror rows with status or room mismatches in the last 24h/7d |
| `v_recent_folio_drift` | Identifies folio items with amount or type mismatches |
| `v_duplicate_stay_mirrors` | Detects duplicate stay rows for the same reservation |
| `v_duplicate_folio_mirrors` | Detects duplicate folio items for the same source charge |

### Failure Analysis

| View | Purpose |
|------|---------|
| `v_dw_failure_hotspots` | Top failure domains and operations in the last 24h and 7d |
| `v_dw_failure_groups` | Groups near-identical unresolved failures for triage |

### Reconciliation

| Object | Purpose |
|--------|---------|
| `v_reconciliation_candidates` | Ranks drift candidates by impact for repair prioritization |
| `reconciliation_log` | Audit trail for all reconciliation actions |
| `reconcile_stay_from_reservation()` | Idempotent stay repair from primary source |
| `reconcile_folio_from_charges()` | Idempotent folio repair from primary source |

### Health Scoring

`v_migration_health` provides per-hotel automated status:

- **Healthy**: ≥95% parity, zero unresolved failures
- **Monitor**: ≥80% parity or minor unresolved failures
- **Not Ready**: <80% parity or significant unresolved failures

---

## 7. Cutover Readiness Criteria

Full cutover criteria are documented in `.lovable/soak-readiness-report.md`.

### Summary

| Domain | Parity Threshold | Soak Duration | Status |
|--------|-----------------|---------------|--------|
| Stays | ≥98% for 14 consecutive days | 14 days minimum | Not started |
| Billing/Folios | ≥99% for 14 consecutive days | 21 days minimum | Not started |
| Table Planning | ≥98% for 14 consecutive days | 14 days minimum | Parity view required first |

### Global Requirements

- Zero unresolved `dual_write_failures` in target domain
- Zero duplicate mirrors
- Clean reconciliation log
- Explicit written approval from hotel admin and engineering lead
- Backup of legacy data before any destructive change

**No domain cutover has occurred.**

---

## 8. Operational Observability

### Available Monitoring Tools

| Tool | Type | Purpose |
|------|------|---------|
| `v_migration_health` | View | Per-hotel parity summary with automated recommendation |
| `v_stay_parity` | View | Row-level stay mirror comparison |
| `v_folio_parity` | View | Row-level folio mirror comparison |
| `v_parity_summary` | View | Compact per-hotel parity counts |
| `v_dw_failure_hotspots` | View | Failure frequency by domain/operation |
| `v_dw_failure_groups` | View | Grouped failures for dedup triage |
| `v_reconciliation_candidates` | View | Prioritized drift repair targets |
| `dual_write_failures` | Table | Structured failure records |
| `reconciliation_log` | Table | Audit trail for repair actions |

### Investigation Workflow

1. Check `v_migration_health` for per-hotel status
2. If status is `monitor` or `not_ready`, check `v_dw_failure_hotspots` for failure patterns
3. Use `v_stay_parity` or `v_folio_parity` for row-level drift analysis
4. Check `v_dw_failure_groups` for systematic errors
5. Use `v_reconciliation_candidates` to prioritize repairs
6. Execute reconciliation functions for targeted fixes
7. Verify repairs in `reconciliation_log`

---

## 9. Rollback Philosophy

Every migration phase was designed to be independently reversible.

### Rollback Approach by Layer

| Layer | Rollback Method | Data Impact |
|-------|----------------|-------------|
| Mirror write hooks | Remove fire-and-forget calls from React hooks | None — primary writes unaffected |
| Mirror tables | Drop tables | Mirror data lost, primary data preserved |
| Event tables | Drop tables and remove event emission | Audit history lost, operations unaffected |
| Parity views | Drop views | Observability removed, operations unaffected |
| Hardening tables | Drop `dual_write_failures`, `reconciliation_log` | Diagnostic data lost |
| Health dashboard | Drop `v_migration_health` and related views | Monitoring removed |

### Key Guarantees

- Legacy tables are never modified by mirror writes
- No UI component reads from mirror tables
- Primary operational mutations are independent of mirror success
- All normalized tables can be dropped without breaking any user-facing flow

---

## 10. Future Evolution

### Domain-by-Domain Cutovers

The architecture now supports independent cutover decisions per domain. Each domain has:

- A validated mirror model with parity tracking
- Reconciliation tooling for drift repair
- Health scoring for readiness assessment
- Documented rollback procedures

Cutovers should be executed one domain at a time, starting with the lowest-risk domain (likely inventory vendor/category normalization), with explicit validation gates at each step.

### Advanced Analytics

The `v_daily_occupancy` and `v_revenue_summary` views demonstrate the foundation for cross-domain analytics. Once cutovers are complete, richer materialized views can aggregate stays, folios, and inventory data for operational dashboards.

### Operational AI

The `ai_jobs` table provides lifecycle tracking for AI automation. Future work includes wiring `parse-table-plan` to record job metadata and expanding AI capabilities to forecasting, automated reorder suggestions, and guest preference analysis.

### Scalable Integrations

The `integrations` and `integration_events` tables provide the foundation for POS integration (Untouchd), booking channel managers, and external system synchronization with structured event logging and error capture.

### Long-Term Maintainability

The migration program established patterns that will govern future platform evolution:

- Additive schema changes before behavioral changes
- Dual-write periods before source-of-truth switches
- Parity validation before legacy removal
- Hotel-scoped RLS on every table
- Structured failure logging for all background operations

---

## Appendix: Key Technical Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Soft-delete over hard-delete for config entities | 5 | Preserves referential integrity with existing FK references |
| Partial unique index on active slugs | 5 | Allows slug reuse after deactivation |
| Category backfill via slug matching | 6 | Achieved 100% match rate for automated migration |
| Delete-and-replace for restaurant mirror writes | 7 | Simpler than upsert, atomic per service date |
| Fire-and-forget mirror pattern | 7+ | Never blocks primary operational write |
| `reservation_id` on stays table | 8 | Enables direct parity verification between primary and mirror |
| Folio auto-creation on first charge | 10 | Deterministic folio lifecycle without manual creation |
| Source dedup index on `folio_items` | 10 | Prevents duplicate mirror writes from retries |
| `security_invoker` on analytics views | 12 | RLS enforced on all analytics queries |
| Percentage-based health thresholds | Hardening | Fair assessment across hotels of different sizes |
| Reconciliation audit logging | Soak | Full traceability for all repair operations |

---

## Appendix: Production-Critical Flows

These flows must be revalidated after any architectural change:

1. Login → hotel selection → dashboard load
2. Table plan load → AI parse → save → realtime sync
3. Inventory quick count → stock adjustment
4. Purchase order create → send → receive
5. Check-in → room assignment → room status update
6. Check-out → HK task generation → room status update
7. Room charge creation → folio mirror
8. User creation → approval workflow
9. Realtime updates across devices
10. Settings CRUD for all 8 configuration domains
