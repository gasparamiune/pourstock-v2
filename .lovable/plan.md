# Technical Report Implementation Plan

## Status: Phases 1–3 COMPLETE ✅ | Phase 4 IN PROGRESS

### Phase 1: Security Hardening — DONE
- [x] Restricted CORS in all 6 Edge Functions (`*.lovable.app` only)
- [x] Ran database linter — 1 warning (leaked password protection), no RLS gaps
- [x] Reviewed Edge Function auth checks — all consistent and correct
- [x] Created `docs/security/cors-policy.md`

### Phase 2: AI Cost Optimization — DONE
- [x] Add PDF content hashing in `parse-table-plan` (SHA-256 cache key)
- [x] Create `ai_cache` table for cached results
- [x] Add `tokens_used` and `estimated_cost` to `ai_jobs` table

### Phase 3: Test Coverage — DONE
- [x] Unit tests for `assignmentAlgorithm.ts` (11 tests)
- [x] Unit tests for `cutleryUtils.ts` (9 tests)
- [x] Unit tests for `useAuth` hook (4 tests)

### Phase 4: Mobile UX — DONE
- [x] Audit all pages at 375px viewport
- [x] Fix Reception board (horizontal scroll, hidden columns, responsive padding)
- [x] Fix Table Plan (responsive toolbar with flex-wrap, mobile padding)
- [x] Fix Inventory (responsive header, full-width buttons on mobile)

### Phase 5: Documentation — DONE
- [x] Created `docs/product/monetization-model.md`
- [x] Updated `docs/product/roadmap.md` with deferred items and discarded recommendations

### Linter Finding
- WARN: Leaked password protection disabled — requires Supabase dashboard config change
