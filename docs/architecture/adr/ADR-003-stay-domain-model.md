# ADR-003: Stay Domain Model

**Status**: Accepted

**Date**: 2026-03-10

---

## Context

The `reservations` table served as both the booking record and the operational state tracker for guest stays. This conflation made it difficult to:

- Track multi-room stays
- Associate multiple guests with a single stay
- Record room assignment history
- Separate booking lifecycle from operational lifecycle

A dedicated stay model was needed to support the platform's evolution toward a full front-office system.

## Decision

Introduce three new tables as a shadow operational model:

- **`stays`**: Core operational unit with check-in/out timestamps, status, and a back-reference to `reservations` via `reservation_id`
- **`stay_guests`**: Many-to-many relationship between stays and guests, with primary guest designation
- **`room_assignments`**: Room assignment history with assigned/released timestamps

These tables are populated via dual-write from reservation mutations but are not yet read by any UI component. The `reservation_id` column enables direct parity comparison via `v_stay_parity`.

A unique index on `stays(reservation_id) WHERE reservation_id IS NOT NULL` prevents duplicate mirror rows.

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Extend `reservations` with additional columns | No new tables, simpler | Deepens the conflation problem, harder to normalize later |
| Replace `reservations` immediately | Clean architecture | Unacceptable production risk, no fallback |
| Event-sourced stay model | Full history, flexible | Over-engineered for current requirements, complex implementation |

## Consequences

### Positive

- Clean separation of booking and operational concerns
- Multi-guest and room assignment history supported
- Parity validation possible via `reservation_id` linkage
- Foundation for future front-office features

### Negative

- Two parallel models exist during soak period
- Mirror writes add code complexity to check-in/check-out flows

### Risks

- Drift between `reservations` and `stays` during soak (mitigated by `v_stay_parity` and reconciliation helpers)
