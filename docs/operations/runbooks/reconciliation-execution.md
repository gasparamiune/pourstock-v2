# Runbook: Reconciliation Execution

## Purpose

Repair drift between legacy primary tables and normalized mirror tables using idempotent reconciliation functions.

## Prerequisites

- Caller must be authenticated
- Caller must have `hotel_admin` role for the affected hotel
- Source data in primary tables must be verified correct before reconciliation

## Available Functions

### Re-mirror a Stay from Reservation

```sql
SELECT reconcile_stay_from_reservation('<reservation_id>');
```

This function:
1. Reads the reservation and its guest from the primary `reservations` table
2. Creates or updates the corresponding `stays` row
3. Creates or updates the `stay_guests` link
4. Creates or updates the `room_assignments` entry
5. Logs the action to `reconciliation_log`

### Re-mirror Folio Items from Room Charges

```sql
SELECT reconcile_folio_from_charges('<reservation_id>');
```

This function:
1. Reads all `room_charges` for the reservation
2. Creates a folio if none exists
3. Creates `folio_items` for any charges missing from the folio
4. Logs the action to `reconciliation_log`

## Verification

After reconciliation, verify the repair:

```sql
-- Check stay parity for the specific reservation
SELECT * FROM v_stay_parity WHERE reservation_id = '<reservation_id>';

-- Check folio parity
SELECT * FROM v_folio_parity WHERE reservation_id = '<reservation_id>';

-- Review the reconciliation log
SELECT * FROM reconciliation_log
WHERE source_record_id = '<reservation_id>'
ORDER BY created_at DESC
LIMIT 5;
```

## Bulk Reconciliation

For multiple missing mirrors, use `v_reconciliation_candidates` to prioritize:

```sql
SELECT * FROM v_reconciliation_candidates
WHERE hotel_id = '<hotel_id>'
ORDER BY impact_score DESC;
```

Execute reconciliation for each candidate individually. Do not batch without reviewing each case.

## Safety Notes

- Reconciliation functions are idempotent — running them multiple times is safe
- They read from the primary source and repair the mirror — they never modify primary data
- All actions are logged with the actor and timestamp
- Functions enforce `hotel_admin` role — unauthorized callers receive an error result
