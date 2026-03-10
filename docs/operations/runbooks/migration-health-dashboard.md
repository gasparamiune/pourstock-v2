# Runbook: Migration Health Dashboard Interpretation

## Overview

The `v_migration_health` view provides a per-hotel summary of migration readiness. It is the primary entry point for monitoring the soak period.

## Querying the Dashboard

```sql
SELECT * FROM v_migration_health;
```

## Fields

| Field | Description |
|-------|-------------|
| `hotel_id` | Hotel identifier |
| `stay_parity_pct` | Percentage of active reservations with matching stay mirrors |
| `folio_parity_pct` | Percentage of room charges with matching folio item mirrors |
| `unresolved_failures` | Count of unresolved `dual_write_failures` for the hotel |
| `last_failure_at` | Timestamp of the most recent unresolved failure |
| `recommendation` | Automated status: `healthy`, `monitor`, or `not_ready` |

## Interpreting Recommendations

### Healthy

- Stay parity ≥95%
- Folio parity ≥95%
- Zero or minimal unresolved failures
- **Action**: Continue monitoring. Track toward cutover thresholds.

### Monitor

- Parity between 80–95% or minor unresolved failures
- **Action**: Investigate drift using `v_stay_parity` / `v_folio_parity`. Check `v_dw_failure_hotspots` for systematic errors. Consider targeted reconciliation.

### Not Ready

- Parity below 80% or significant unresolved failures
- **Action**: Investigate root cause. Do not consider cutover. Review mirror write code paths for the affected domain.

## Cutover Readiness

The dashboard recommendation is an operational signal, not a cutover gate. Cutover criteria (documented in `.lovable/soak-readiness-report.md`) require sustained parity over 14–21 days and explicit approval.

## Monitoring Cadence

| Check | Frequency |
|-------|-----------|
| `v_migration_health` | Daily |
| `v_dw_failure_hotspots` | Daily |
| `v_reconciliation_candidates` | Weekly |
| `v_duplicate_stay_mirrors` / `v_duplicate_folio_mirrors` | Weekly |
