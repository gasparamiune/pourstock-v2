# ADR-005: Soak Validation Framework

**Status**: Accepted

**Date**: 2026-03-10

---

## Context

After completing all 12 migration phases and the hardening layer, a decision framework was needed to determine when each domain is safe to cut over from legacy to normalized tables. Cutover decisions involve risk — premature cutover could cause data loss or operational disruption.

## Decision

Implement a soak validation framework that:

1. **Accumulates parity evidence** over time via views comparing legacy and mirror data
2. **Tracks failure patterns** via structured `dual_write_failures` logging and grouping views
3. **Provides reconciliation tooling** for repairing drift without changing source of truth
4. **Defines measurable cutover criteria** per domain with explicit thresholds and soak durations
5. **Requires explicit approval** — no automated cutover

Key thresholds:

| Domain | Parity Threshold | Soak Duration |
|--------|-----------------|---------------|
| Stays | ≥98% for 14 consecutive days | 14 days |
| Billing/Folios | ≥99% for 14 consecutive days | 21 days |
| Table Planning | ≥98% for 14 consecutive days | 14 days (parity view required first) |

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Immediate cutover after implementation | Faster migration completion | No safety evidence, high risk |
| Time-based cutover (e.g., "after 30 days") | Simple criterion | Ignores actual data quality |
| Automated cutover when thresholds met | Reduces manual steps | Too risky for financial data, removes human judgment |

## Consequences

### Positive

- Data-driven cutover decisions based on measurable evidence
- Independent assessment per domain allows incremental progress
- Reconciliation tooling enables proactive drift repair
- Full audit trail for all repair and validation actions

### Negative

- Extended timeline before legacy cleanup can begin
- Requires ongoing monitoring during soak period
- Operational overhead of running dual systems

### Risks

- Soak period may reveal systematic drift requiring architectural changes
- Low-traffic hotels may take longer to accumulate statistically meaningful parity data
