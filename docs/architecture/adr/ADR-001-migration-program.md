# ADR-001: Migration Program Strategy

**Status**: Accepted

**Date**: 2026-03-10

---

## Context

PourStock originated as a single-hotel restaurant tool with a flat architecture: JSON blobs for table assignments, a monolithic `reservations` table, text fields for vendor references, and no structured billing or event logging. This architecture could not support multi-hotel scaling, cross-domain analytics, or modular feature expansion.

A comprehensive migration was needed, but the system was already operational in production at Sønderborg Strand Hotel. Any migration had to preserve full production stability.

## Decision

Adopt a 12-phase sequential migration program with the following constraints:

1. **Additive-first**: New tables and columns are introduced before any legacy behavior is changed
2. **No premature cutovers**: Legacy tables remain the source of truth until parity is explicitly validated
3. **Dual-write mirroring**: Normalized tables are populated alongside legacy writes via best-effort mirror operations
4. **Phase independence**: Each phase can be rolled back without affecting prior phases
5. **Sequential execution**: Phases build on each other but each is independently stable

The phases progress from low-risk configuration normalization (Phases 1–5) through medium-risk domain modeling (Phases 6–7) to high-risk operational mirroring (Phases 8–10) and finally to analytics and readiness validation (Phases 11–12).

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Big-bang migration (single cutover) | Simpler coordination, one switchover | Unacceptable production risk, no rollback path |
| Blue-green database deployment | Clean cutover, parallel systems | Requires full data sync infrastructure, high operational complexity |
| Strangler pattern with API layer | Gradual traffic migration | Over-engineered for a single-codebase SaaS product |

## Consequences

### Positive

- Production stability maintained throughout 12 phases
- Each phase independently reversible
- Parity evidence accumulated before any cutover decision
- Engineering team built confidence incrementally

### Negative

- Dual-write code paths add temporary complexity
- Legacy and normalized tables coexist indefinitely until cutovers
- Mirror consistency is eventual, not transactional

### Risks

- Extended soak period delays legacy cleanup
- Dual-write drift requires ongoing monitoring
