

# Reform Folder Structure & Workflow

## What We're Doing

Create three folders in the repo to track reform lifecycle, move existing documents into them, and establish a pre-flight check protocol.

## Folder Structure

```text
reforms/
├── future/          ← Queued plans not yet started
├── ongoing/         ← Active work in progress
└── done/            ← Completed reforms
```

## File Movements

| Document | From | To |
|----------|------|----|
| Verification Mode plan (current `.lovable/plan.md` content) | `.lovable/plan.md` | `reforms/ongoing/verification-mode.md` |
| SaaS Readiness Audit | `docs/saas-readiness-audit.md` | `reforms/future/saas-readiness-audit.md` |

The `.lovable/plan.md` will be updated to point to the ongoing reform and reflect the new structure.

## Pre-Flight Check Protocol

A `reforms/PRE-FLIGHT-CHECKLIST.md` file will define the mandatory status check to run before moving any plan from `future/` to `ongoing/`:

1. **Schema check** — Has the database schema changed since the plan was written?
2. **Dependency check** — Have any relevant packages or versions changed?
3. **Code conflict check** — Do the files the plan touches still match expected state?
4. **RLS/Auth check** — Have security policies or auth flows changed?
5. **Plan relevance check** — Is the plan's scope still valid given any new features or removals?

Each pre-flight produces a brief status note appended to the plan document before work begins.

## Files to Create/Modify

| File | Action |
|------|--------|
| `reforms/future/saas-readiness-audit.md` | Move from `docs/` |
| `reforms/ongoing/verification-mode.md` | New — the Verification Mode plan approved earlier |
| `reforms/done/.gitkeep` | Create empty folder |
| `reforms/PRE-FLIGHT-CHECKLIST.md` | New — protocol document |
| `.lovable/plan.md` | Update to reference new structure |
| `docs/saas-readiness-audit.md` | Remove (moved) |

