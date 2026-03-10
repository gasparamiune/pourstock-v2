# Runbook: Parity Drift Investigation

## Trigger

`v_migration_health` shows a hotel with status `monitor` or `not_ready`, or parity percentage below expected thresholds.

## Diagnostic Steps

### 1. Check Overall Health

```sql
SELECT * FROM v_migration_health WHERE hotel_id = '<hotel_id>';
```

Review `stay_parity_pct`, `folio_parity_pct`, `unresolved_failures`, and `recommendation`.

### 2. Identify Missing Mirrors (Stays)

```sql
SELECT *
FROM v_stay_parity
WHERE hotel_id = '<hotel_id>'
  AND stay_id IS NULL
  AND res_status NOT IN ('cancelled', 'no_show');
```

Missing stays for active reservations indicate mirror write failures during check-in.

### 3. Identify Status Mismatches (Stays)

```sql
SELECT *
FROM v_stay_parity
WHERE hotel_id = '<hotel_id>'
  AND stay_id IS NOT NULL
  AND res_status != stay_status;
```

Status mismatches indicate mirror writes succeeded but subsequent status updates were missed.

### 4. Identify Amount Mismatches (Folios)

```sql
SELECT *
FROM v_folio_parity
WHERE hotel_id = '<hotel_id>'
  AND charge_amount != folio_amount;
```

Amount mismatches in financial data require immediate investigation.

### 5. Check for Duplicates

```sql
SELECT * FROM v_duplicate_stay_mirrors WHERE hotel_id = '<hotel_id>';
SELECT * FROM v_duplicate_folio_mirrors WHERE hotel_id = '<hotel_id>';
```

Duplicates indicate dedup constraint issues.

### 6. Check Recent Drift

```sql
SELECT * FROM v_recent_stay_drift WHERE hotel_id = '<hotel_id>';
SELECT * FROM v_recent_folio_drift WHERE hotel_id = '<hotel_id>';
```

## Resolution

- **Missing mirrors**: Use reconciliation helpers (see [Reconciliation Execution](reconciliation-execution.md))
- **Status mismatches**: Investigate `dual_write_failures` for the affected reservation
- **Amount mismatches**: Manual review required — do not auto-repair financial data without verification
- **Duplicates**: Investigate dedup constraint and clean up manually

## Escalation

Folio amount mismatches or persistent stay drift affecting >5% of a hotel's reservations require engineering review before reconciliation.
