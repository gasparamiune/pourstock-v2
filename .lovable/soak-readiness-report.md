# PourStock — Soak Readiness Report

Generated: 2026-03-10

## Overview

All 12 migration phases and post-migration hardening are complete.
No source-of-truth cutovers have been performed.
The system is in **soak mode** — collecting parity evidence for cutover decisions.

---

## Domain: Stays (Guest & Stay Model)

### Current State
- `reservations` is primary source of truth
- `stays`, `stay_guests`, `room_assignments` are mirrors via dual-write
- Parity tracked via `v_stay_parity`, `v_migration_health`

### Cutover Criteria
| Criterion | Threshold | Notes |
|---|---|---|
| Stay parity % | ≥ 98% for 14 consecutive days | Per hotel, via `v_migration_health.stay_parity_pct` |
| Missing stays | ≤ 2% of active reservations | Excluding cancelled/no-show |
| Status mismatches | 0 for 7 consecutive days | checked_in/checked_out must match |
| Duplicate stays | 0 | Via `v_duplicate_stay_mirrors` |
| Unresolved DW failures (stays domain) | 0 for 7 days | Via `v_dw_failure_hotspots` |
| Soak duration | Minimum 14 days at healthy | After all above criteria met |

### Rollback Requirement
- Revert reception reads to `reservations` table (no code change needed — it's current state)
- Drop mirror write calls from `useReception.tsx`
- Tables can remain for future re-attempt

### Approval Gate
- Hotel admin confirms parity report
- Engineering confirms no drift in last 14 days
- No outstanding reconciliation candidates for hotel

---

## Domain: Billing / Folios

### Current State
- `room_charges` is primary source of truth
- `folios`, `folio_items`, `payments` are mirrors via dual-write
- Parity tracked via `v_folio_parity`, `v_migration_health`

### Cutover Criteria
| Criterion | Threshold | Notes |
|---|---|---|
| Folio parity % | ≥ 99% for 14 consecutive days | Financial data requires higher bar |
| Amount mismatches | 0 for 14 consecutive days | Any drift = block cutover |
| Missing folio items | ≤ 1% of room charges | Via `v_folio_parity` |
| Duplicate folios | 0 | Via `v_duplicate_folio_mirrors` |
| Unresolved DW failures (billing domain) | 0 for 14 days | Financial writes are critical |
| Soak duration | Minimum 21 days at healthy | Higher bar for financial data |

### Rollback Requirement
- Revert billing reads to `room_charges` (current state)
- Drop folio mirror writes from `useBilling.tsx`
- `room_charges` data is always preserved

### Approval Gate
- Hotel admin reviews folio parity report
- Finance/accounting sign-off on amount accuracy
- Engineering confirms zero amount drift for 14 days
- No reconciliation candidates with `partial_folio` or `missing_folio` status

---

## Domain: Table Planning (Relational Mirror)

### Current State
- `table_plans.assignments_json` is primary source of truth
- `restaurant_reservations` and `table_assignments` are mirrors
- No parity view exists yet for this domain

### Cutover Criteria
| Criterion | Threshold | Notes |
|---|---|---|
| Table assignment parity % | ≥ 98% for 14 consecutive days | Requires parity view (future work) |
| Missing mirrors | ≤ 2% of JSON assignments | Per service date |
| Unresolved DW failures (tableplan domain) | 0 for 7 days | |
| Soak duration | Minimum 14 days at healthy | |

### Pre-Cutover Requirement
- **Build `v_tableplan_parity` view** comparing `assignments_json` entries to `table_assignments` rows
- This view does not exist yet and must be created before cutover can be considered

### Rollback Requirement
- Revert table plan reads to `assignments_json` (current state)
- Drop relational mirror writes
- JSON data is always preserved

### Approval Gate
- Restaurant manager confirms table assignments match
- Engineering confirms parity view passes
- No service disruption during soak period

---

## Global Requirements Before ANY Cutover

1. **All validation views return clean data** for the target hotel
2. **`v_migration_health` shows "healthy"** for the hotel for the required soak duration
3. **Zero unresolved `dual_write_failures`** in the target domain
4. **Reconciliation log** shows no recent repairs needed
5. **No duplicate mirrors** in any domain
6. **Security review** of all affected RLS policies is current
7. **Backup/export** of legacy data before any destructive change
8. **Explicit written approval** from hotel admin + engineering lead

---

## Soak Timeline

```
Day 0:     Soak mode begins (current state)
Day 1-14:  Monitor parity daily via validation queries
Day 7:     First review — identify any systematic drift
Day 14:    Stays domain eligible for cutover consideration (if criteria met)
Day 21:    Billing domain eligible for cutover consideration (if criteria met)
Day 14+:   Table planning eligible once parity view is built and validated
```

## Monitoring Cadence

| Check | Frequency | Tool |
|---|---|---|
| Parity percentages | Daily | `v_migration_health` |
| Failure hotspots | Daily | `v_dw_failure_hotspots` |
| Duplicate detection | Daily | `v_duplicate_stay_mirrors`, `v_duplicate_folio_mirrors` |
| Reconciliation candidates | Weekly | `v_reconciliation_candidates` |
| Failure groups | Weekly | `v_dw_failure_groups` |

---

## Decision Authority

- **No cutover without explicit approval** — this report defines criteria, not authorization
- Each domain is evaluated independently
- Partial cutover is acceptable (e.g., stays first, billing later)
- Rollback must be tested before cutover is attempted
