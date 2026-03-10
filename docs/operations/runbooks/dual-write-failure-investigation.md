# Runbook: Dual-Write Failure Investigation

## Trigger

Unresolved records appear in `dual_write_failures` or `v_dw_failure_hotspots` shows elevated failure counts.

## Diagnostic Steps

### 1. Identify Failure Patterns

```sql
SELECT * FROM v_dw_failure_hotspots;
```

This shows the top failure domains and operations in the last 24h and 7d. Look for:

- Concentrated failures in a single domain (e.g., `stays`, `billing`)
- A single operation type dominating (e.g., `mirror_charge`)
- Sudden spikes vs. steady background noise

### 2. Examine Grouped Failures

```sql
SELECT * FROM v_dw_failure_groups;
```

Groups near-identical unresolved failures by error signature. High-count groups indicate systematic issues rather than transient errors.

### 3. Inspect Individual Failures

```sql
SELECT id, domain, operation, error_message, error_code, payload, created_at
FROM dual_write_failures
WHERE resolved_at IS NULL
  AND hotel_id = '<hotel_id>'
ORDER BY created_at DESC
LIMIT 20;
```

### 4. Classify the Failure

| Error Pattern | Likely Cause | Action |
|---------------|-------------|--------|
| FK violation | Referenced record missing (e.g., stay not yet created) | Check ordering of mirror writes |
| Unique constraint violation | Duplicate mirror attempt | Usually safe — dedup working correctly |
| RLS violation | Policy misconfiguration | Review RLS policies on target table |
| Network/timeout | Transient infrastructure issue | Mark as resolved if data was written |

### 5. Resolution

For transient failures where data was eventually written:

```sql
UPDATE dual_write_failures
SET resolved_at = now()
WHERE id = '<failure_id>';
```

For systematic failures, address the root cause before resolving.

## Escalation

If failures persist for >24h in a single domain or >50 unresolved records accumulate for a hotel, investigate the mirror write code path in the relevant hook (`useStays.tsx`, `useBilling.tsx`, `useFrontOfficeEvents.tsx`).
