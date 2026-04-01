# Technical Roadmap — PourStock v1.0

**Prepared**: March 2026
**Based on**: Gap analysis in `04-feature-gap-analysis.md`, codebase audit of `src/`, ADRs, and product docs

---

## Executive Summary

PourStock has a strong, production-deployed core across all six domains. The critical gaps are:
1. A broken receive-order flow (stock not updated on receipt)
2. Several dead UI buttons with no handlers
3. Fabricated data in occupancy trend charts
4. Minimal test coverage
5. Missing realtime channel scoping (multi-tenant correctness risk)

The roadmap organizes work into three phases:
- **Phase 1 (Sprints 1–2): Hardening** — fix broken flows, security/tenancy correctness, critical tests
- **Phase 2 (Sprints 3–5): Completeness** — finish all partial features, real reports, notifications
- **Phase 3 (Sprints 6–9): Growth** — roadmap features, domain cutovers, advanced capabilities

Total estimated runway to v1.0 launch quality: **8–10 weeks** (4–5 sprints of 2 weeks each).

---

## Blocking Issues (Pre-Sprint)

These must be resolved before the sprint plan starts or addressed in Sprint 1 with highest priority.

| Issue | File | Impact |
|-------|------|--------|
| Receive order does not update stock | `src/hooks/usePurchaseOrders.tsx`, `src/api/queries.ts` `receiveOrderItems()` | Core inventory loop broken |
| Realtime channels not hotel-scoped | `src/hooks/useReception.tsx` (rooms, guests, reservations channels), `src/hooks/useHousekeeping.tsx` | Cross-tenant data risk |

---

## Phase 1: Hardening (Weeks 1–4 / Sprints 1–2)

**Goal**: Fix all critical broken flows, eliminate fake data, tighten multi-tenant correctness, establish a baseline test suite.

---

### Sprint 1 — Critical Bug Fixes and Tenancy Hardening

**Sprint Goal**: Production is safe for multi-tenant use. No broken core workflows remain.

**Duration**: 2 weeks

#### Technical Tasks

**1. Fix receive-order stock update (G-01) — BLOCKING**
- File: `src/api/queries.ts` — `receiveOrderItems()` function
- File: `src/hooks/usePurchaseOrders.tsx` — `receiveOrder` mutation
- After updating `purchase_order_items.received_quantity`, add logic to upsert `stock_levels.on_hand` for each product/location. The location should come from either a default location or be selectable in `ReceiveOrderDialog`.
- Effort: **M**

**2. Scope all realtime channels by hotel_id (G-13, G-14)**
- File: `src/hooks/useReception.tsx` — three channels on `rooms`, `guests`, `reservations` — add `filter: hotel_id=eq.${activeHotelId}` to each
- File: `src/hooks/useHousekeeping.tsx` — `hk-tasks-realtime` and `maintenance-realtime` channels — add hotel filter
- Reference: `useRealtimeSubscription.tsx` already has hotel-scoped logic; align bare `supabase.channel()` calls in the other hooks to match
- Effort: **S**

**3. Wire up product edit dialog (G-02)**
- File: `src/pages/Products.tsx` — `ProductCard` component
- The `Edit` `DropdownMenuItem` (line ~469) has no `onClick`. Create an `EditProductDialog` component (modelled on `AddUserDialog`) or add inline edit state. Wire the existing `handleAddProduct`-style mutation for updates.
- Effort: **M**

**4. Fix Settings locations Add/Edit/Delete handlers (G-07)**
- File: `src/pages/Settings.tsx` — `activeSection === 'locations'` block
- The `Button` "Add Location" and the `Edit`/`Trash2` icon buttons have no handlers. Connect to Supabase `locations` table mutations using the same pattern as `useLocations()`.
- Effort: **S**

**5. Fix password reset no-op (G-04)**
- File: `src/pages/UserManagement.tsx` line 54 — `onResetPassword={async () => {}}`
- File: `src/hooks/useUsers.tsx` — add `resetPassword` mutation
- Implement via `supabase.auth.admin.generateLink({type: 'recovery', email})` called through the `manage-users` edge function (which already has service-role access). Wire back to `UserTable`.
- Effort: **M**

**6. Remove Math.random() from occupancy trend (G-05)**
- File: `src/pages/Reports.tsx` lines 54–58
- Replace with real data: query `reservations` where `check_in_date` spans the selected date range and group by day. Use `useReservations` hook with a wider date range. Show actual occupied-rooms-per-day from reservations with `status = 'checked_in'`.
- Effort: **M**

**7. Remove or gate mock data fallback (G-06)**
- File: `src/components/housekeeping/mockData.ts` — `USE_HK_MOCK` constant
- File: `src/hooks/useHousekeeping.tsx` — all `USE_HK_MOCK` conditional branches
- Set `USE_HK_MOCK = false` in production builds. Add `import.meta.env.DEV &&` guard or remove the mock path entirely. The mock state leaks into production if no HK tasks exist for the day (legitimate scenario early in the day).
- Effort: **S**

**Sprint 1 Deliverables**:
- Receive order flow correctly updates `stock_levels`
- Realtime channels are hotel-scoped
- Product edit dialog functional
- Location CRUD in Settings functional
- Password reset wired to `manage-users` edge function
- Occupancy trend shows real historical data
- Mock data only available in dev/test builds

---

### Sprint 2 — Test Foundation and Dead UI Cleanup

**Sprint Goal**: All visible but non-functional UI elements work. Core hooks have unit test coverage. CI is green.

**Duration**: 2 weeks

#### Technical Tasks

**8. Wire advanced filter button in Inventory (G-03)**
- File: `src/pages/Inventory.tsx` line 185 — `SlidersHorizontal` button has no `onClick`
- Implement a sort panel (sort by name/stock level/category) and additional filter (by vendor). Can be a `Sheet` or `Popover`. Persist sort state in `useState`.
- Effort: **S**

**9. Fix date range affecting all report charts (G-11)**
- File: `src/pages/Reports.tsx` — `dateRange` state used only in trend chart (which was mocked); other charts are current-state only
- For inventory and housekeeping charts: accept `dateRange` prop and either load historical snapshots (if available) or clearly label charts as "current snapshot" and hide the date range selector for those views.
- Effort: **S**

**10. Add passport number masking in guest forms (G-12)**
- File: `src/components/reception/CheckInDialog.tsx` and `GuestDirectory.tsx`
- The Settings/DataProtection page says "only last 4 digits and country code are kept". Add a utility function `maskPassport(raw: string): string` that keeps country code + last 4 digits. Apply on display and ensure raw value is not stored (or truncated before insert).
- Effort: **S**

**11. Write unit tests for core hooks**
- New test files:
  - `src/hooks/useInventoryData.test.tsx` — test `useProducts`, `useStockLevels` return shapes and loading states
  - `src/hooks/usePurchaseOrders.test.tsx` — test `receiveOrder` mutation calls `stock_levels` update
  - `src/api/queries.test.ts` — test `receiveOrderItems` calls correct Supabase tables
- Approach: mock `@/integrations/supabase/client` (same pattern as existing `useAuth.test.tsx`)
- Effort: **L**

**12. Write unit tests for critical utilities**
- Review existing `assignmentAlgorithm.test.ts` and `cutleryUtils.test.ts` — ensure edge cases are covered (empty input, overflow)
- Add `src/api/billing.test.ts` and `src/api/stays.test.ts` — test that failures log to `dual_write_failures` and never throw
- Effort: **M**

**13. CI pipeline verification**
- File: `.github/workflows/ci.yml` (referenced in README badge)
- Confirm `npm test` runs `vitest run` and fails on test errors
- Add a lint step (`npm run lint`) if not already present
- Effort: **S**

**Sprint 2 Deliverables**:
- All visible buttons have handlers or are removed
- Date range UI accurately reflects what data it controls
- Passport masking implemented
- Test coverage expanded to cover `receiveOrderItems`, `mirrorWriteStay`, `mirrorChargeToFolio`
- CI runs tests and lint on every commit

---

## Phase 2: Completeness (Weeks 5–10 / Sprints 3–5)

**Goal**: Finish all partial/stub features. Reports show real data across all dimensions. Notifications have a delivery backend. Billing has a usable UI path.

---

### Sprint 3 — Real Reports and Analytics

**Sprint Goal**: Every report tab in `Reports.tsx` shows real, useful data. No mocked values anywhere in production.

**Duration**: 2 weeks

#### Technical Tasks

**14. Variance report (G-16)**
- New component: `src/components/reports/VarianceReport.tsx`
- Logic: compare `stock_levels.on_hand` at last count vs expected level derived from `stock_movements` since last count
- Query: join `stock_movements` (type=adjustment/purchase_received/counted) per product/location for the period
- Display: table with columns — Product, Location, Expected, Counted, Variance %, Last Counted At
- Add as a new tab in `Reports.tsx`
- Effort: **L**

**15. Consumption trends report (G-17)**
- New component: `src/components/reports/ConsumptionTrends.tsx`
- Logic: aggregate `stock_movements` where `movement_type = 'adjustment'` (negative = consumption) by week/day over selected date range
- Chart: `LineChart` with one line per category or top-N products
- Effort: **L**

**16. Revenue report foundation (G-08)**
- File: `src/pages/Reports.tsx` — revenue tab (currently "coming soon")
- Phase 1 of revenue report: query `room_charges` grouped by charge_type and date range. Show total revenue, breakdown by charge type, and trend line.
- Full folio-based revenue report is a Phase 3 item (requires billing cutover)
- Effort: **M**

**17. Housekeeping reports tab (G-09)**
- File: `src/pages/Housekeeping.tsx` — reports tab renders "coming soon"
- New component: `src/components/housekeeping/HKReports.tsx`
- Metrics: average task duration (`completed_at - started_at`), tasks per staff member, rooms cleaned per day trend, pending vs completed at any given time
- Query from `housekeeping_tasks` and `housekeeping_logs`
- Effort: **M**

**18. Wire date range to all report queries**
- Ensure all report charts in `Reports.tsx` pass the selected `dateRange` value to their data queries as actual date bounds
- Effort: **M**

**Sprint 3 Deliverables**:
- Variance report tab with real data
- Consumption trends tab
- Revenue overview from `room_charges` (live data)
- Housekeeping reports tab functional
- Date range selector affects all charts

---

### Sprint 4 — Notifications, Billing UI, HK Settings

**Sprint Goal**: Notification system delivers alerts. Billing/folios are accessible in UI. Housekeeping settings tab functional.

**Duration**: 2 weeks

#### Technical Tasks

**19. Notification delivery backend**
- Currently: Settings UI has toggles (`low_stock_alerts`, `variance_alerts`, `order_reminders`, `count_reminders`) but no delivery
- New edge function: `notify-hotel` (or extend existing functions) — after relevant mutations (checkout, low stock detected, order due), call this function to send email via Supabase's built-in email or a transactional provider
- Alternatively: implement in-app notification feed using a `notifications` table + realtime subscription
- Recommended approach for v1.0: in-app notification badge (simpler, no external provider dependency)
- Files to create: `supabase/functions/create-notification/index.ts`, `src/components/layout/NotificationBell.tsx`
- Effort: **XL**

**20. Billing/folio read UI (G-20)**
- New component: `src/components/reception/FolioView.tsx` — accessible from `CheckOutDialog` or reservation detail
- Read from `folios` and `folio_items` tables (mirrors already populated by Phase 10 dual-write)
- Show itemized charges, total, payment status
- Note: this is a read-only view until billing cutover; `room_charges` remains primary
- Effort: **M**

**21. Housekeeping settings tab (G-10)**
- File: `src/pages/Housekeeping.tsx` — settings tab renders "coming soon"
- New component: `src/components/housekeeping/HKSettings.tsx`
- Include: task type configuration, default priority rules, zone CRUD (addresses G-21)
- Effort: **M**

**22. HK zone management CRUD (G-21)**
- New component: `src/components/housekeeping/HKZoneSettings.tsx`
- CRUD for `hk_zones` table — add/edit/delete zones, assign rooms to zones
- Use as part of HK settings tab (task 21)
- Effort: **M**

**Sprint 4 Deliverables**:
- In-app notification system with badge and feed
- Low stock and checkout events trigger notifications
- Folio/billing detail view accessible from reservation
- Housekeeping settings tab: zone management, task configuration

---

### Sprint 5 — COGS, Waste Tracking, Polish

**Sprint Goal**: All features listed in `features.md` have at least an MVP implementation. No "coming soon" placeholders remain in the UI.

**Duration**: 2 weeks

#### Technical Tasks

**23. COGS analysis (G-18)**
- New component: `src/components/reports/COGSReport.tsx`
- Logic: sum `(quantity_ordered * unit_cost)` from `purchase_order_items` where `status = 'received'` by date range
- Add to Reports page
- Effort: **M**

**24. Waste tracking (G-19)**
- A "waste" movement type in `stock_movements` (likely already exists as category in the schema)
- New component: `src/components/inventory/WasteEntryDialog.tsx` — log waste with reason codes
- Add waste totals to COGS report
- Effort: **M**

**25. Remove all remaining "coming soon" placeholders**
- Audit all `t('*.comingSoon')` keys in `LanguageContext.tsx`; ensure each referenced tab has real content
- Effort: **S**

**26. Product Edit dialog (complete the product management loop)**
- If not fully done in Sprint 1, ensure full edit capability including cost, barcode, container size, subtype
- Effort: **S** (mostly done in Sprint 1 if scheduled there)

**27. Integration of payment recording (billing domain)**
- Add simple payment recording to `FolioView.tsx` — select payment method, record amount in `payments` table
- Effort: **M**

**Sprint 5 Deliverables**:
- COGS report
- Waste tracking entry and reporting
- No "coming soon" text in any production tab
- Payment recording in folio view

---

## Phase 3: Growth (Weeks 11–18 / Sprints 6–9)

**Goal**: Execute domain cutovers. Implement multi-format AI. Lay groundwork for integrations.

---

### Sprint 6 — Domain Cutover: Table Planning

**Sprint Goal**: Table planning reads from normalized `restaurant_reservations`/`table_assignments` instead of `assignments_json`. Legacy column retired.

**Duration**: 2 weeks

**Dependencies**: Soak validation must show ≥98% parity for 14 consecutive days (per ADR-005).

#### Technical Tasks

**28. Build parity verification view for table planning**
- New Supabase migration: `CREATE VIEW restaurant_reservations_parity AS ...` comparing `table_plans.assignments_json` with `restaurant_reservations` for same `plan_date`
- Run validation and confirm ≥98% parity
- Effort: **M**

**29. Switch `TablePlan.tsx` read path**
- File: `src/hooks/useRestaurantReservations.tsx` — currently writes to `restaurant_reservations` via `mirrorWriteAssignments`
- Add a read path from `restaurant_reservations` for the cutover; switch `TablePlan.tsx` to use it
- Retire `assignments_json` column after validation
- Effort: **L**

**Effort total**: L

---

### Sprint 7 — Domain Cutover: Stays / Billing

**Sprint Goal**: Reception reads from `stays`/`stay_guests`/`room_assignments` and billing reads from `folios`/`folio_items`/`payments`. Legacy tables become archival.

**Dependencies**: Soak parity thresholds met (stays ≥98% for 14 days, billing ≥99% for 21 days per ADR-005).

#### Technical Tasks

**30. Stays cutover**
- File: `src/api/queries.ts` — add `fetchStays()` reading from normalized `stays` table with `stay_guests` join
- File: `src/hooks/useReception.tsx` — `useRooms` and `useReservations` hooks — switch to normalized models after parity confirmed
- Retire dual-write mirroring code (`src/api/stays.ts`) — keep as audit trail
- Effort: **L**

**31. Billing cutover**
- File: `src/hooks/useReception.tsx` — `useRoomCharges` — switch read path to `folio_items`
- File: `src/components/reception/FolioView.tsx` — now becomes primary billing UI
- Retire `room_charges` as primary; keep for audit trail
- Effort: **L**

---

### Sprint 8 — Multi-Format AI and Integration Foundations

**Sprint Goal**: PDF parser handles non-Køkkenliste formats. POS integration schema and webhook receiver exist.

**Duration**: 2 weeks

#### Technical Tasks

**32. Multi-format PDF support (G-22)**
- File: `supabase/functions/parse-table-plan/index.ts`
- Add format detection logic: identify if PDF is Køkkenliste or a generic reservation format
- Use parser profile settings (already exists via `ParserProfileEditor`) to drive different system prompts
- Effort: **XL**

**33. POS integration webhook receiver**
- New edge function: `supabase/functions/receive-pos-event/index.ts`
- Accept stock depletion events (beverage served = quantity consumed) from a POS
- On receipt: insert a `stock_movements` record with `movement_type = 'pos_depletion'`
- Schema is already in place; this is a network integration point
- Effort: **L** (backend only; POS partner agreement separate)

**34. Integration event log UI**
- File: `src/pages/Settings.tsx` — add new "Integrations" section
- Show recent events from `integration_events` table (if it exists) or `audit_logs` filtered by integration actions
- Effort: **M**

---

### Sprint 9 — Advanced Analytics and Enterprise Foundations

**Sprint Goal**: RevPAR calculation available. Cross-property view scaffolded for when second hotel onboards.

**Duration**: 2 weeks

#### Technical Tasks

**35. RevPAR calculation**
- RevPAR = Total Room Revenue / Total Available Rooms
- Query: `room_charges` or `folio_items` where `charge_type = 'accommodation'` / `rooms` count for a date range
- Add to Reports revenue tab
- Effort: **M**

**36. Occupancy analytics — rolling averages**
- Daily snapshot of `rooms.status` counts written to a new `occupancy_snapshots` table via a scheduled function (Supabase cron or daily trigger)
- Replace the current live-query approach in Reports with snapshot reads for historical accuracy
- Effort: **L**

**37. Multi-property selector UI**
- File: `src/components/layout/AppShell.tsx`
- Show hotel switcher prominently when user has multiple approved memberships
- Currently `switchHotel()` exists but no prominent UI in the app shell
- Effort: **S**

---

## Dependencies and Blocking Issues Map

```
Sprint 1 (must complete first)
  ├─ G-01 receive order → Sprint 2 stock tests depend on this
  └─ G-14 channel scoping → prerequisite for multi-hotel correctness

Sprint 2 → Sprint 3 (reports need real data foundations)
Sprint 3 variance report → needs stock_movements populated correctly (Sprint 1 fix)
Sprint 4 billing UI → needs Phase 10 dual-write running (already deployed)
Sprint 5 cutover prep → needs soak period to accumulate evidence (started now)
Sprint 6 table plan cutover → soak ≥98% 14 days (ADR-005)
Sprint 7 stays cutover → soak ≥98% 14 days (ADR-005)
Sprint 7 billing cutover → soak ≥99% 21 days (ADR-005)
Sprint 8 multi-format AI → depends on ParserProfileEditor data model (already built)
Sprint 8 POS integration → external: requires partner agreement (deferred per roadmap.md)
```

---

## Effort Summary by Sprint

| Sprint | Key Deliverable | Total Effort | Risk |
|--------|----------------|--------------|------|
| Sprint 1 | Broken flows fixed, channel scoping | M+M+M+S+S+S = 4M 2S | Low — targeted bug fixes |
| Sprint 2 | Dead UI, tests, CI | M+S+S+L+M+S = 2M 1L 3S | Low |
| Sprint 3 | Real reports (variance, consumption, revenue, HK) | 4M 2L | Medium — new queries |
| Sprint 4 | Notifications, billing UI, HK settings | 1XL 3M | High — XL notification work |
| Sprint 5 | COGS, waste, cleanup | 4M 1S | Low |
| Sprint 6 | Table plan cutover | 1M 1L | Medium — soak dependency |
| Sprint 7 | Stays/billing cutover | 2L | High — data migration risk |
| Sprint 8 | Multi-format AI, POS receiver | 1XL 1L 1M | High — AI prompt complexity |
| Sprint 9 | Advanced analytics, multi-property | 1L 1M 1S | Low |

**Effort key**: S = 0.5–1 day, M = 2–3 days, L = 4–6 days, XL = 1–2 weeks

---

## v1.0 Launch Criteria

The following conditions define "v1.0 launch quality":

1. All Phase 1 (Sprint 1–2) items complete — no broken core workflows
2. No "coming soon" placeholders in any production-visible UI
3. All report tabs show real data (no Math.random(), no static mock)
4. Realtime channels scoped by `hotel_id` for all tables
5. Test coverage: all API functions and critical hooks have unit tests; CI enforces green
6. Password reset functional for hotel admins
7. Stock levels correctly updated on order receipt

Phase 2 and Phase 3 items are post-launch improvements and do not block the v1.0 milestone.

---

## Deferred Items (Confirmed, Not in This Roadmap)

Per `docs/product/roadmap.md` and the March 2026 Technical Audit:

| Item | Reason for Deferral |
|------|---------------------|
| E2E tests (Cypress/Playwright) | Focus on unit tests first |
| PMS integrations (Mews, Opera) | Requires partnership agreements |
| Multi-property dashboards | No second hotel yet |
| Predictive occupancy / ML forecasting | Insufficient historical data |
| Redis/Pub-Sub at scale | Supabase Realtime sufficient for current load |
| Direct LLM API calls (bypass Lovable gateway) | Gateway handles key management |
| Local open-source models | Not feasible in serverless architecture |
