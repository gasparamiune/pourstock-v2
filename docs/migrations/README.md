# Migration Documentation

This directory contains documentation related to database migrations and the migration program.

## Key References

| Document | Location | Purpose |
|----------|----------|---------|
| Migration Master Plan | `.lovable/migration-master-plan.md` | Complete historical record of the 12-phase migration program |
| Soak Readiness Report | `.lovable/soak-readiness-report.md` | Cutover criteria and soak validation requirements per domain |

## Migration Files

Database migration SQL files are located in `supabase/migrations/` and are managed by the Lovable Cloud deployment pipeline. Migrations are executed automatically and should not be modified after deployment.

## Migration Principles

1. All migrations are additive — new tables and columns before removals
2. Every migration includes RLS policies for hotel isolation
3. Indexes are added for FK columns and query-critical paths
4. No destructive changes without validated parity evidence
5. Each migration is independently reversible
