# Technical Report Implementation Plan

## Status: Phase 1 COMPLETE ✅

### Phase 1: Security Hardening — DONE
- [x] Restricted CORS in all 6 Edge Functions (`*.lovable.app` only)
- [x] Ran database linter — 1 warning (leaked password protection), no RLS gaps
- [x] Reviewed Edge Function auth checks — all consistent and correct
- [x] Created `docs/security/cors-policy.md`

### Phase 2: AI Cost Optimization — DONE
- [x] Add PDF content hashing in `parse-table-plan` (SHA-256 cache key)
- [x] Create `ai_cache` table for cached results
- [x] Add `tokens_used` and `estimated_cost` to `ai_jobs` table

### Phase 3: Test Coverage
- [ ] Unit tests for `assignmentAlgorithm.ts`
- [ ] Unit tests for `cutleryUtils.ts`
- [ ] Unit tests for key hooks (`useAuth`, `useBilling`)

### Phase 4: Mobile UX
- [ ] Audit all pages at 375px viewport
- [ ] Fix Reception board, Table Plan, Inventory mobile issues

### Phase 5: Documentation
- [ ] Create `docs/product/monetization-model.md`
- [ ] Update `docs/product/roadmap.md` with deferred items

### Linter Finding
- WARN: Leaked password protection disabled — requires Supabase dashboard config change
