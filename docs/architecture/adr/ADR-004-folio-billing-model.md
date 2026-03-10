# ADR-004: Folio Billing Model

**Status**: Accepted

**Date**: 2026-03-10

---

## Context

Billing was represented as individual `room_charges` rows with no grouping, payment tracking, or balance calculation. This flat model could not support:

- Guest-facing folio summaries
- Payment recording and balance tracking
- Multi-source charge aggregation
- Financial reporting and analytics

## Decision

Introduce a structured billing model as a mirror layer:

- **`folios`**: Groups charges for a stay/reservation/guest with status and running total
- **`folio_items`**: Individual line items with charge type, amount, and source linkage
- **`payments`**: Payment records against a folio with method and reference

Key design decisions:

- Folios are auto-created on the first charge (deterministic lifecycle)
- `folio_items` has a unique index on `(source_id, source_type)` to prevent duplicate mirror writes
- `room_charges` remains the primary source of truth
- All amounts use `numeric(10,2)` for financial precision
- Currency defaults to `DKK` with explicit field for future multi-currency support

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Add payment columns to `room_charges` | No new tables | Cannot aggregate, no folio concept |
| Replace `room_charges` directly | Clean model | Unacceptable risk for financial data |
| Third-party billing integration | Feature-rich | Dependency, cost, integration complexity |

## Consequences

### Positive

- Structured billing foundation for guest folios and financial reporting
- Payment tracking with method and reference
- Auditable charge history with `created_by` attribution
- Source dedup prevents corruption from retried mirror writes

### Negative

- Financial data in two places during soak period
- Folio totals must be carefully maintained or derived

### Risks

- Amount mismatches between `room_charges` and `folio_items` (mitigated by `v_folio_parity`)
- Higher parity threshold required (99%) due to financial sensitivity
