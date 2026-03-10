# Migration Documentation

This directory contains documentation related to database migrations and the migration program.

## Migration Workflow

Database migrations are managed through the Lovable Cloud deployment pipeline. Each migration is a SQL file in `supabase/migrations/` that is executed automatically during deployment.

### How Migrations Are Generated

Migrations are created using the database migration tool within the Lovable development environment. Each migration produces a timestamped SQL file with a unique identifier.

### Naming Convention

Migration files follow the pattern:

```
YYYYMMDDHHMMSS_<uuid>.sql
```

The timestamp ensures execution order. The UUID provides uniqueness.

### Rollback Philosophy

All migrations are designed to be **additive**. New tables and columns are created before any removals. This ensures that:

1. Each migration is independently reversible
2. Legacy systems continue to function during the migration program
3. No destructive changes occur without validated parity evidence

### Relation to Migration Master Plan

The migration files in `supabase/migrations/` correspond to the 12-phase migration program documented in `.lovable/migration-master-plan.md`. That document provides the architectural context and rationale for each phase.

## Key References

| Document | Location | Purpose |
|----------|----------|---------|
| Migration Master Plan | `.lovable/migration-master-plan.md` | Complete historical record of the 12-phase migration program |
| Soak Readiness Report | `.lovable/soak-readiness-report.md` | Cutover criteria and soak validation requirements per domain |

## Migration Principles

1. All migrations are additive — new tables and columns before removals
2. Every migration includes RLS policies for hotel isolation
3. Indexes are added for FK columns and query-critical paths
4. No destructive changes without validated parity evidence
5. Each migration is independently reversible
6. Migrations are executed automatically and should not be modified after deployment
