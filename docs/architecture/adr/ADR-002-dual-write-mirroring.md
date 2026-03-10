# ADR-002: Dual-Write Mirroring Pattern

**Status**: Accepted

**Date**: 2026-03-10

---

## Context

During the migration program, normalized tables needed to be populated with production data to validate their correctness before any source-of-truth cutover. The system had to continue operating against legacy tables while simultaneously building data in the new schema.

## Decision

Implement a **fire-and-forget dual-write pattern** where:

1. The primary mutation executes against the legacy table (e.g., `reservations`, `room_charges`)
2. After successful primary write, a mirror write is attempted against the normalized table (e.g., `stays`, `folio_items`)
3. Mirror write failures are logged to `dual_write_failures` and `console.warn` but never thrown
4. Mirror writes use idempotent operations with unique constraints to prevent duplicates
5. No UI component reads from mirror tables

The pattern is implemented in dedicated hooks (`useStays.tsx`, `useBilling.tsx`, `useFrontOfficeEvents.tsx`) called from the primary mutation hooks.

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Database triggers | Automatic, no app code changes | Hard to debug, can't access user context, risk of cascading failures |
| Transactional dual-write | Strong consistency | Mirror failure blocks primary operation — unacceptable for production |
| Change Data Capture (CDC) | Decoupled, reliable | Requires infrastructure not available in current stack |
| Batch sync job | Simple, low risk | Delayed data, not suitable for parity validation |

## Consequences

### Positive

- Primary operations never blocked by mirror failures
- Mirror data accumulates naturally from real user activity
- Failure patterns are visible via structured logging
- Idempotent writes handle retries safely

### Negative

- Mirror data is eventually consistent, not guaranteed
- Drift is possible and requires monitoring
- Dual-write code adds temporary complexity to mutation hooks

### Risks

- Systematic mirror failures could go unnoticed without active monitoring (mitigated by `v_migration_health`)
- Drift accumulation during high-traffic periods (mitigated by reconciliation helpers)
