# PourStock Code Audit

**Date:** 2026-03-18
**Auditor:** Claude Code (automated analysis)
**Codebase:** `C:\Users\gaspa\pourstock-v2`
**Branch:** `main` (commit `58e66d5`)

---

## Executive Summary

- **The core product is structurally sound and production-capable.** Auth, multi-tenancy, routing, realtime subscriptions, AI PDF parsing, housekeeping, reception, and inventory modules are all implemented end-to-end. The platform is reportedly live at Sønderborg Strand Hotel.
- **A deliberate multi-phase migration ("dual-write") architecture is in progress** (Phases 7–10 visible in code). The legacy `reservations`/`rooms` tables are still the system of truth; normalized domain models (`stays`, `folios`, `checkin_events`, etc.) are being populated via best-effort mirror writes. This is not a bug — it is intentional — but it adds surface area and complexity that needs a completion roadmap.
- **Housekeeping module ships with `USE_HK_MOCK = true` hardcoded**, meaning all housekeeping data falls back to generated in-memory mock data when the real DB returns nothing. This flag is in committed source code and should be removed before scaling to new hotels.
- **TypeScript type safety is actively eroded** by 64+ `as any` casts across 18 files, plus `@typescript-eslint/no-explicit-any` set to `warn` (not `error`) in ESLint config. Several mutations interact with tables whose shapes are not in the generated types file.
- **Test coverage is minimal.** There are 3 test files total: a smoke test, `useAuth` unit tests (4 cases), and algorithm unit tests for the table planner. No tests exist for hooks, mutations, edge functions, or any page-level behavior.

---

## Per-Module Breakdown

| Module | Status | Notes |
|--------|--------|-------|
| **Auth / ProtectedRoute** | Complete | JWT + Supabase auth, RBAC, approval gate, multi-hotel switching, onboarding redirect — all working. Minor: `fetchUserData` uses `setTimeout(0)` workaround to prevent race condition; could be replaced with proper state sequencing. |
| **Onboarding** | Complete | Two-step hotel creation wizard; calls `create-hotel` edge function which seeds departments and modules. Country list is limited to 6 Nordic/German countries — intentional for target market. |
| **Dashboard** | Complete | Department-aware stat cards with live data. Occupancy trend chart uses `Math.random()` mock data (not historical data from DB). |
| **Inventory** | Complete | Product catalog, multi-location stock, quick-count workflow, low-stock filtering. Uses hook-based data fetching with realtime subscriptions. |
| **Products** | Complete | Full CRUD with category filtering and barcode support. Import page handles XLSX bulk import. |
| **Import (XLSX)** | Complete | Client-side XLSX parsing with validation and preview before commit. |
| **Orders (Purchase)** | Complete | Draft → sent → received lifecycle, vendor management, suggested order generation from low-stock alerts. |
| **Table Plan** | Complete | AI PDF parsing (Gemini via Lovable Gateway), auto-assignment algorithm, drag-and-drop, undo/redo, save/load, preparation summary. Best-tested module (algorithm and cutlery unit tests). |
| **Reception** | Mostly Complete | Room board, check-in/check-out workflows, guest directory. Check-out triggers housekeeping task creation. Folio and charge display exists. |
| **Housekeeping** | Partially Complete | Task board, assignment, inspection, maintenance reporting, zone management all implemented. **`USE_HK_MOCK = true` is hardcoded in `mockData.ts`** — real DB tasks only display when mock is disabled. |
| **Reports** | Partially Complete | Occupancy (pie + line chart), housekeeping (bar chart), inventory (category bar chart) reports use real data. **Revenue tab shows "coming soon" placeholder.** Occupancy trend is random mock data, not queried from DB. |
| **User Management** | Complete | Full CRUD via `manage-users` edge function with role, department, and approval management. |
| **Settings** | Mostly Complete | 16 sub-sections. Locations section has Edit/Delete/Toggle buttons wired to no handler (UI shell only — buttons render but mutations are missing). POS Integration, Notifications, and Data Protection sections appear to be stubs. |
| **Realtime** | Complete | `useRealtimeSubscription` hook subscribes to postgres_changes; tenant-scoped filter support present but not always applied (hotel_id filter is opt-in via `options.hotelId`, and several callers in `useReception.tsx` and `useHousekeeping.tsx` use direct `supabase.channel()` without tenant filtering). |
| **Edge Functions** | Mostly Complete | `parse-table-plan` (complete, with cache and audit logging), `manage-users` (complete), `create-hotel` (complete). `generate-release-notes` and `fetch-deployment-commits` and `create-autonomous-release` exist but their call sites are only in the release management components. |
| **Billing / Folios** | Stub / In Progress | `api/billing.ts` writes `folios` and `folio_items` as best-effort mirror (Phase 10). No folio read path in the UI — billing data is written but not surfaced. Revenue report is placeholder. |
| **Stays Domain** | Stub / In Progress | `api/stays.ts` writes `stays`, `stay_guests`, `room_assignments` on check-in/out (Phase 8). These tables exist but are not read anywhere in the UI. |
| **Front Office Events** | Stub / In Progress | `api/frontOfficeEvents.ts` writes `checkin_events` and `checkout_events` (Phase 9). No read path in the UI. |
| **AI Cache** | Complete | SHA-256 content-addressed cache with TTL in `ai_cache` table, hit-count increment via RPC with graceful fallback. |
| **Release System** | Complete | Autonomous release creation, approval workflow, announcements modal, admin approval UI. Uses Gemini/Lovable Gateway for release note generation. |
| **Language/i18n** | Partially Complete | EN + DA translations via `LanguageContext`. Some strings are hardcoded in English in component JSX rather than routed through `t()` (e.g., `Dashboard.tsx` "Products", "Low Stock", "Occupied"). |
| **Search** | Partial | `SearchAssistant` in `src/components/search/SearchAssistant.tsx` exists — not audited in depth but referenced from Dashboard. |

---

## TODOs and Incomplete Features

### Hardcoded mock / demo flags
- `src/components/housekeeping/mockData.ts` line 312: `export const USE_HK_MOCK = true;` — this flag is always on, causing all housekeeping hooks to fall back to in-memory mock data whenever the DB returns nothing. The comment says "Remove this file and the useMock flags before production." It is in production code.

### Stub UI in Settings
- `src/pages/Settings.tsx` — Locations section: **Edit, Delete, and Toggle Switch buttons are rendered but have no `onClick` handlers or mutations wired**. Clicking them does nothing.
- POS Integration (`pos`), Notifications, and Data Protection sections likely render placeholder content (not confirmed beyond the section list).

### Revenue / Financial Reports
- `src/pages/Reports.tsx` line 294–299: Revenue tab is an explicit "coming soon" placeholder with the message "Financial reports will be available once billing data is integrated."

### Occupancy trend chart uses random data
- `src/pages/Reports.tsx` lines 53–58: Weekly occupancy trend uses `Math.random()` on every render, generating a new chart on every re-render. There is no historical occupancy data query.

### Hardcoded DEFAULT_HOTEL_ID
- `src/lib/hotel.ts`: `DEFAULT_HOTEL_ID` is a hardcoded UUID for Sønderborg Strand Hotel. The comment says "This will be replaced by the active hotel from AuthContext in Phase 3." The `useAuth` hook does use `activeHotelId` correctly, but the constant is still used as the initial `useState` fallback, tying new accounts to the wrong starting hotel_id until their first hotel membership loads.

### Dual-write migration phases not complete
- Phases 7–10 (restaurant_reservations mirror, stays domain, front office events, folio billing) are implemented as best-effort fire-and-forget writes only. The normalized read paths have not been cut over. These tables exist but no UI queries them as the source of truth.

### `as any` usage obscuring real type issues
- 64 `as any` casts across 18 source files. Most are in mutation insert/update calls where the Supabase generated types do not match the actual table shape (because migrations have outpaced the types regeneration, or because new tables like `stays`, `folios`, `checkin_events` are not yet in `types.ts`).

### Missing realtime tenant filtering
- `useReception.tsx` creates three `supabase.channel()` subscriptions for `rooms`, `guests`, and `reservations` without hotel_id filters. In a multi-tenant setup this means any change on these tables (for any hotel) triggers a refetch for all connected clients.

### Test coverage gaps
- No tests for: any hooks with mutations, all API query functions, all edge functions, any React component, any page, or the billing/stays mirror write logic.

---

## Missing Features Referenced in README or Implied by Product

| Feature | Current State |
|---------|--------------|
| **Revenue / financial analytics** | Placeholder in Reports page. Folio/billing tables exist but no read path. |
| **PMS connectors (Mews, Opera)** | Listed in roadmap. No code exists. |
| **POS synchronization** | Listed in roadmap. Settings section is a stub. |
| **Occupancy trend historical data** | Reports page uses random mock data, not queried. |
| **Multi-property dashboard** | Listed as Enterprise feature. Only one active hotel UI at a time. |
| **Cross-hotel benchmarking / RevPAR** | Listed in roadmap. No code exists. |
| **Inventory forecasting (AI)** | Listed in roadmap. No code exists. |
| **Multi-format document support (AI)** | Currently only Danish Køkkenliste PDF format is supported by the AI parser prompt. |
| **Variance reports / consumption trends** | Listed in README. Reports page shows current stock levels, not historical movement analysis. |
| **Cost-of-goods analysis** | Listed in README. No code exists. |
| **HK zone-based staff auto-assignment** | Zones exist in DB and mock data; assignment board UI exists. Auto-assignment algorithm not implemented — only manual drag assignment. |
| **Photo attachments for maintenance requests** | Schema has `photos` field; UI form does not include a photo upload input. |
| **Channel managers integration** | Listed in roadmap. No code exists. |
| **Partial bottle tracking** | Listed in README. `container_size` and `container_unit` fields exist in products table. No UI for tracking partial containers separately from whole units. |

---

## Security Concerns

### CRITICAL: Production Supabase credentials committed in `vite.config.ts`
`vite.config.ts` contains hardcoded fallback values:
```
const FALLBACK_SUPABASE_URL = "https://wxxaeupbfvlvtofflqke.supabase.co";
const FALLBACK_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```
This is the production anon key for Sønderborg Strand Hotel embedded in the public repository. The anon key is by design public (it is rate-limited), but the URL exposes the project reference. Combined with any misconfigured RLS policy this becomes a direct attack vector. The ADR-006 documents this as a deliberate trade-off for Lovable deployment, but the git history means this credential cannot be safely rotated without also purging git history.

### Realtime subscriptions lack tenant filtering
As noted above, `rooms`, `guests`, and `reservations` realtime channels do not filter by `hotel_id`. If a second hotel is onboarded, their write events will trigger UI refreshes (and potentially data leaks via the refetch) in the first hotel's clients. RLS on the DB side prevents data leakage at read time, but the realtime notification itself still fires cross-tenant.

### Edge function CORS is restricted to `*.lovable.app` and `*.lovableproject.com`
`parse-table-plan/index.ts` and `manage-users/index.ts` restrict CORS to Lovable-hosted origins. This is good for production but means the functions cannot be called from a self-hosted deployment without modifying the CORS header logic.

### `USE_HK_MOCK = true` mock data includes hardcoded fake user IDs
Mock staff IDs like `mock-staff-maria`, `mock-staff-lars` etc. are exposed in the mock data file and flow through the mutations. If a real DB write were to happen while mock mode is on (the mock guard checks for task IDs prefixed `mock-`), a real mutation would use a fake user ID as `assigned_to`.

### Settings mutations missing for location CRUD
The location Edit/Delete UI exists with no handler. A future developer wiring these up must ensure they also respect RLS and admin-only authorization. The `updateSetting` and CRUD pattern is established for other settings; the location section simply needs to be completed.

---

## Priority Recommendations

### P0 — Fix before onboarding any new hotel

1. **Remove or gate `USE_HK_MOCK`** (`src/components/housekeeping/mockData.ts`). The flag should be `false` by default or removed entirely. If demo/preview mode is needed for marketing, it should be controlled by an environment variable, not committed code.

2. **Add hotel_id filters to realtime subscriptions in `useReception.tsx`** (channels for `rooms`, `guests`, `reservations`). Currently any hotel's changes trigger all connected clients.

### P1 — Technical debt with production impact

3. **Wire up Settings → Locations CRUD mutations.** Edit/Delete/Toggle buttons are rendered but non-functional. This creates a confusing experience where admins attempt to manage locations and nothing happens.

4. **Replace the occupancy trend chart's `Math.random()` data** with a real historical query from the `reservations` table (count occupied rooms per day for the last 7/30/90 days).

5. **Regenerate `src/integrations/supabase/types.ts`** to include the new domain tables (`stays`, `stay_guests`, `room_assignments`, `folios`, `folio_items`, `checkin_events`, `checkout_events`, `departments`, `dual_write_failures`, etc.). This will reduce `as any` casts and catch schema drift at compile time.

6. **Tighten ESLint rules**: change `"@typescript-eslint/no-explicit-any": "warn"` to `"error"` and work through the 64 existing violations. This will surface genuine type mismatches.

### P2 — Complete in-progress features

7. **Complete the Revenue Reports tab.** Wire it to real data: `room_charges` for charge totals, `reservations` for ADR/RevPAR, and `stock_movements` for COGS. The folio/billing tables exist but need a read path.

8. **Define a migration cutover plan for dual-write phases.** Phases 7–10 have been running as mirror writes but the read path has never been cut over. Decide when each normalized table becomes the source of truth, and complete the cutover per the ADR-001 migration program. The migration infrastructure (soak validation, parity checks) is already documented.

9. **Wire photo upload to maintenance request form.** The `maintenance_requests.photos` column exists; the `HKInspectionForm.tsx` and maintenance reporting UI do not have an upload input.

10. **Expand test coverage.** Minimum targets:
    - Unit tests for all `api/queries.ts` functions (mock Supabase client)
    - Integration tests for `manage-users` and `create-hotel` edge functions
    - Component tests for `ProtectedRoute` behavior
    - Mutation tests for check-in/check-out workflow (including mirror write triggers)
