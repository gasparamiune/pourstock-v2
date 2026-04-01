# Feature Gap Analysis — PourStock v1.0

**Prepared**: March 2026
**Scope**: Cross-reference of README/features.md promises against actual implementation in `src/`

---

## 1. Complete Feature Inventory

### 1.1 Table Planning (Restaurant)

| Feature | Status | Evidence |
|---------|--------|----------|
| PDF upload UI | BUILT | `src/components/tableplan/PdfUploader.tsx` |
| AI PDF parsing (Gemini via Lovable Gateway) | BUILT | `supabase/functions/parse-table-plan/index.ts` — full Gemini 2.5 Flash integration with function calling |
| Danish Køkkenliste format extraction | BUILT | System prompt in edge function with Danish month map, 18:00+ filter, icon extraction |
| AI result caching (SHA-256) | BUILT | Cache check/store logic in edge function; `ai_cache` table |
| Token usage and cost tracking | BUILT | `ai_jobs` table insert with `tokens_used` and `estimated_cost` |
| Auto table assignment algorithm | BUILT | `src/components/tableplan/assignmentAlgorithm.ts` with tests |
| Interactive floor plan | BUILT | `src/components/tableplan/FloorPlan.tsx` with `TABLE_LAYOUT` constant |
| Drag-and-drop seating | BUILT | Implemented in `FloorPlan.tsx` (drag state management) |
| Table merging for large parties | BUILT | `findLargePartyMerges()` in `FloorPlan.tsx` |
| Arrival timers | BUILT | `src/components/housekeeping/ElapsedTimer.tsx` shared component |
| Preparation summaries (cutlery, glassware) | BUILT | `src/components/tableplan/PreparationSummary.tsx` with `cutleryUtils.ts` |
| Change request sidebar | BUILT | `src/components/tableplan/ChangeRequestSidebar.tsx` |
| Manual reservation entry | BUILT | `src/components/tableplan/AddReservationDialog.tsx` |
| Reservation detail dialog | BUILT | `src/components/tableplan/ReservationDetailDialog.tsx` |
| Quick note buttons | BUILT | `src/components/tableplan/QuickNoteButtons.tsx` |
| Undo/redo | BUILT | `useRef`-based history stack in `TablePlan.tsx` |
| Save/load plans by date | BUILT | `table_plans` table via `fetchTablePlan()` in `api/queries.ts` |
| Print view | BUILT | Print button with `Printer` icon in `TablePlan.tsx` |
| Mirror write to `restaurant_reservations` | BUILT | Phase 7 in edge function |
| Per-hotel parser profiles | BUILT | `src/components/settings/ParserProfileEditor.tsx` |
| Configurable table layout | BUILT | `src/components/settings/TableLayoutEditor.tsx`; `table_layouts` table |
| Multi-format PDF support (non-Køkkenliste) | MISSING | Only Danish Køkkenliste format hardcoded in system prompt |

### 1.2 Inventory Management

| Feature | Status | Evidence |
|---------|--------|----------|
| Product catalog | BUILT | `src/pages/Products.tsx`, `products` table |
| Beverage categories (wine/beer/spirits/coffee/soda/syrup) | BUILT | Hardcoded in `src/types/inventory.ts` |
| Multi-location stock tracking | BUILT | `stock_levels` table; location selector in `Inventory.tsx` |
| Quick count workflow (tablet-optimized) | BUILT | `src/components/inventory/QuickCountCard.tsx`; count session in `Inventory.tsx` |
| Partial bottle tracking | BUILT | `partial_amount` in `stock_levels`; `isPartialMode` on spirits/syrup |
| Stock movement history | BUILT | `stock_movements` table; `fetchStockMovements()` |
| Configurable reorder thresholds | BUILT | `reorder_threshold`, `par_level` in `stock_levels`; `src/components/settings/ReorderRuleSettings.tsx` |
| Low stock alerts | BUILT | `useDashboardData()` hook; LowStockCard in dashboard components |
| Product barcode field | BUILT | `barcode` column in products schema; searchable in `Inventory.tsx` |
| Product bulk import (Excel/CSV) | BUILT | `src/pages/Import.tsx` with XLSX parsing, template download, preview |
| Vendor management | BUILT | `src/components/settings/VendorSettings.tsx`; `vendors` table with FK |
| Product edit (inline) | PARTIAL | Archive/delete work; Edit menu item exists but no edit dialog wired up — `Edit` in `DropdownMenuItem` has no `onClick` |
| Advanced sort/filter (SlidersHorizontal button) | PARTIAL | Button renders in `Inventory.tsx` line 185 but has no `onClick` handler — dead UI |
| Product category settings | BUILT | `src/components/settings/ProductCategorySettings.tsx` |
| Cost-of-goods tracking | PARTIAL | `cost_per_unit` stored on products; no COGS report built |

### 1.3 Hotel Reception

| Feature | Status | Evidence |
|---------|--------|----------|
| Room board (real-time status) | BUILT | `src/components/reception/RoomBoard.tsx`; Supabase Realtime in `useReception.tsx` |
| Guest check-in workflow | BUILT | `src/components/reception/CheckInDialog.tsx`; `checkIn` mutation in `useReception.tsx` |
| Guest check-out workflow | BUILT | `src/components/reception/CheckOutDialog.tsx`; `checkOut` mutation |
| Housekeeping task auto-generation on checkout | BUILT | `checkOut` mutation upserts `housekeeping_tasks` directly |
| Guest directory | BUILT | `src/components/reception/GuestDirectory.tsx` |
| Today's overview (arrivals/departures) | BUILT | `src/components/reception/TodayOverview.tsx` |
| Reservation creation | BUILT | `createReservation` mutation in `useReception.tsx` |
| Room assignment management | BUILT | `room_assignments` mirror via `stays` API |
| Room charge recording | BUILT | `useChargeMutations()` in `useReception.tsx`; folio mirror write Phase 10 |
| Multi-device real-time sync | BUILT | Realtime channels on `rooms`, `guests`, `reservations` tables |
| Reservation editing | BUILT | `updateReservation` mutation |
| Room maintenance flag | BUILT | `maintenance` status in rooms |
| Guest passport/ID storage | PARTIAL | Field exists in schema; Settings notes "only last 4 digits kept" but no masking logic visible in frontend guest forms |

### 1.4 Housekeeping

| Feature | Status | Evidence |
|---------|--------|----------|
| Task status board | BUILT | `src/components/housekeeping/HKStatusBoard.tsx` |
| My tasks list (staff view) | BUILT | `src/components/housekeeping/MyTasksList.tsx`; `useMyTasks()` hook |
| Task assignment board (supervisor) | BUILT | `src/components/housekeeping/HKAssignmentBoard.tsx` |
| Overview dashboard (supervisor) | BUILT | `src/components/housekeeping/HKOverview.tsx` |
| Inspection queue | BUILT | `src/components/housekeeping/HKInspectionQueue.tsx` |
| Room detail sheet | BUILT | `src/components/housekeeping/HKRoomDetailSheet.tsx` |
| Room card | BUILT | `src/components/housekeeping/HKRoomCard.tsx` |
| Inspection form | BUILT | `src/components/housekeeping/HKInspectionForm.tsx` |
| Status transitions (dirty → in_progress → clean → inspected) | BUILT | `updateTaskStatus` mutation with timestamp updates |
| Task claiming (unassigned pool) | BUILT | `claimTask` mutation |
| Manual task creation | BUILT | `createTask` mutation |
| Task reopening | BUILT | `reopenTask` mutation |
| Maintenance reporting | BUILT | `reportMaintenance` mutation |
| Daily task generation from room status | BUILT | `generateDailyTasks` mutation |
| Staff assignment from user_departments | BUILT | `useHKStaff()` queries `user_departments` table |
| Mock data fallback (demo mode) | BUILT | `USE_HK_MOCK` flag in `mockData.ts` — note: production concern, see gaps |
| HK zone management | PARTIAL | `hk_zones` table queried; mock fallback but no zone CRUD UI found |
| Housekeeping reports | MISSING | Tab renders "coming soon" placeholder (`Housekeeping.tsx` lines 109–112) |
| Housekeeping settings (admin tab) | MISSING | Tab renders "coming soon" placeholder (`Housekeeping.tsx` lines 116–120) |
| Priority escalation / SLA timers | MISSING | `priority` field exists but no escalation logic |

### 1.5 Purchase Orders

| Feature | Status | Evidence |
|---------|--------|----------|
| New order creation | BUILT | `src/components/orders/NewOrderDialog.tsx`; `createPurchaseOrder()` in `api/queries.ts` |
| Order card display | BUILT | `src/components/orders/OrderCard.tsx` |
| Order status flow (draft → sent → received) | BUILT | `markSent`, `markCancelled`, `receiveOrder` mutations in `usePurchaseOrders` |
| Receive order dialog | BUILT | `src/components/orders/ReceiveOrderDialog.tsx` |
| Reorder suggestions from low stock | BUILT | `lowStockAlerts` feed into suggestion tab; pre-fill from suggestions flow |
| Vendor management | BUILT | `src/components/settings/VendorSettings.tsx` |
| Order history | BUILT | History tab in `Orders.tsx` |
| Stock level update on receive | PARTIAL | `receiveOrder` updates `purchase_order_items.received_quantity` and order status but does NOT increment `stock_levels.on_hand` — receiving does not automatically update physical stock |
| Order cancellation | BUILT | `markCancelled` mutation |
| Unit cost on order items | BUILT | `unit_cost` field on order items |

### 1.6 Reports and Analytics

| Feature | Status | Evidence |
|---------|--------|----------|
| Occupancy report (current snapshot) | BUILT | Pie chart of room status in `Reports.tsx` |
| Occupancy trend chart | PARTIAL | Line chart renders but uses **randomly generated mock data** (`Reports.tsx` lines 54–58 — `Math.random()`) |
| Housekeeping task status report | BUILT | Bar chart from live `useHousekeepingTasks()` data |
| Inventory stock by category | BUILT | Bar chart from live `useDashboardData()` |
| Stock health summary | BUILT | Low stock count card |
| Revenue overview | MISSING | Renders "Revenue analytics coming soon" placeholder (`Reports.tsx` lines 288–300) |
| Variance reports | MISSING | Listed in `features.md`; no page or component found |
| Beverage consumption trends | MISSING | Listed in `features.md`; no page or component found |
| Cost-of-goods analysis | MISSING | Listed in `features.md`; no page or component found |
| Waste tracking | MISSING | Listed in `features.md`; no page or component found |
| Date-range filtering (working) | PARTIAL | UI toggle for 7d/30d/90d exists but only occupancy trend uses date state; other charts ignore it |

### 1.7 User Management

| Feature | Status | Evidence |
|---------|--------|----------|
| User list | BUILT | `src/components/users/UserTable.tsx`; `useUsers()` hook |
| Add user | BUILT | `src/components/users/AddUserDialog.tsx`; `createUser` mutation via `manage-users` edge function |
| Edit user (role, departments) | BUILT | `src/components/users/EditUserDialog.tsx`; `updateUser` mutation |
| Approve user | BUILT | `approveUser` mutation; `is_approved` flag on `hotel_members` |
| Delete user | BUILT | `deleteUser` mutation |
| Role-based access control (admin/manager/staff) | BUILT | Enforced in `useAuth.tsx`; hotel roles in `hotel_members` |
| Department-scoped access | BUILT | `user_departments` table; `hasDepartment()` / `isDepartmentManager()` |
| Password reset | PARTIAL | `onResetPassword={async () => {}}` in `UserManagement.tsx` line 54 — handler is a no-op |

### 1.8 Multi-Tenancy

| Feature | Status | Evidence |
|---------|--------|----------|
| Per-hotel data isolation (RLS) | BUILT | All queries use `hotel_id`; RLS on all operational tables |
| Hotel onboarding flow | BUILT | `src/pages/Onboarding.tsx`; `create-hotel` edge function |
| Hotel member approval workflow | BUILT | `hotel_members.is_approved`; `approveUser` mutation |
| Multi-hotel switching (for users in multiple hotels) | BUILT | `switchHotel()` in `useAuth.tsx`; `hotelMemberships` state |
| Per-hotel settings | BUILT | `hotel_settings` table; `useHotelSettings` hook |
| Module enable/disable per hotel | BUILT | `src/components/settings/HotelModuleSettings.tsx` |

### 1.9 Auth and System

| Feature | Status | Evidence |
|---------|--------|----------|
| Sign in / sign up | BUILT | `src/pages/Auth.tsx` |
| JWT-based auth with Supabase | BUILT | `useAuth.tsx`; all edge functions validate JWT |
| Protected routes | BUILT | `src/components/auth/ProtectedRoute.tsx` |
| Audit logs | BUILT | `audit_logs` table; `AuditLogViewer` component; edge functions log actions |
| Release notes / announcements | BUILT | `src/components/system/ReleaseNotesModal.tsx`; `AdminReleaseApproval.tsx`; `useReleaseAnnouncements` |
| Language switching (EN/DA) | BUILT | `src/contexts/LanguageContext.tsx`; `LanguageSwitcher` component |
| Dark mode (implied by CSS vars) | BUILT | `index.css` HSL custom properties |
| Real-time multi-device sync | BUILT | `useRealtimeSubscription.tsx` with hotel-scoped filters |
| AI job tracking | BUILT | `ai_jobs` table; populated by `parse-table-plan` edge function |
| Search assistant | BUILT | `src/components/search/SearchAssistant.tsx` |
| Data retention settings | BUILT | `data_retention_days` in hotel settings; UI in Settings page |
| Password reset (admin action) | PARTIAL | `onResetPassword` is a no-op stub in `UserManagement.tsx` |
| Email notifications | MISSING | Settings UI has toggles for low stock alerts / variance alerts but no delivery backend |

### 1.10 Billing / Folios

| Feature | Status | Evidence |
|---------|--------|----------|
| Room charge recording | BUILT | `room_charges` table; `useChargeMutations()` |
| Folio mirror writes (Phase 10) | BUILT | `src/api/billing.ts`; dual-write from `room_charges` → `folios`/`folio_items` |
| Folio read path | MISSING | Normalized `folios`/`folio_items` tables exist but no UI reads from them; source of truth remains `room_charges` pending soak cutover |
| Payment tracking | PARTIAL | `payments` table in schema (from ADR-004); no UI for payment recording found |
| Billing report / folio printout | MISSING | No billing report or folio export UI found |

---

## 2. README Promises vs Implementation

| README Promise | Implementation Reality |
|----------------|------------------------|
| "AI automatically extracts guest names, room numbers, party sizes, course types, and dietary requirements" | ACCURATE — edge function extracts all these fields plus icons (wineMenu, welcomeDrink, flagOnTable) |
| "Interactive floor plan with drag-and-drop seating, live arrival timers, and preparation summaries" | ACCURATE — all three exist |
| "Staff can count 50+ items in minutes using a tablet" | ACCURATE — quick count mode with touch-optimized cards |
| "Integrated ordering from draft through sent to received, with automatic reorder suggestions" | ACCURATE — but receiving does not auto-update stock levels (gap) |
| "Variance reports, consumption trends, cost-of-goods analysis, occupancy analytics, and revenue summaries" | OVERSTATED — only occupancy snapshot and HK/inventory snapshots are live data; occupancy trend uses mock data; revenue, variance, consumption, COGS are all missing |
| "Event-driven housekeeping task generation with priority queues and inspection workflows" | ACCURATE — checkout triggers task creation; full inspection workflow exists |
| "Role-based access control (admin / manager / staff), approval workflows" | ACCURATE |
| "All operational pages synchronize instantly across tablets, phones, and desktops" | ACCURATE — Realtime channels on all key tables |
| "Configurable parser profiles per hotel" | ACCURATE — `ParserProfileEditor.tsx` exists |
| "Configurable reorder thresholds and vendor management" | ACCURATE |

---

## 3. Gap Prioritization

### 3.1 Must-Have for v1.0 Launch (Blocking)

These gaps affect production use or represent broken promises to existing customers.

| # | Gap | Domain | Severity |
|---|-----|--------|----------|
| G-01 | Receiving an order does NOT update `stock_levels.on_hand` — the core workflow of "receive stock → inventory is updated" is broken | Orders/Inventory | Critical |
| G-02 | Product Edit button in `Products.tsx` has no `onClick` handler — edit dialog never opens | Products | High |
| G-03 | Advanced filter button (SlidersHorizontal) in `Inventory.tsx` is dead UI with no handler | Inventory | Medium |
| G-04 | Password reset (`onResetPassword`) is a no-op stub in `UserManagement.tsx` — admins cannot reset staff passwords | Users | High |
| G-05 | Occupancy trend chart uses `Math.random()` data — it shows fake historical data to users | Reports | High |
| G-06 | HK mock data (`USE_HK_MOCK` flag in `mockData.ts`) may render demo data in production if real DB returns empty | Housekeeping | Medium |
| G-07 | Settings locations section has Edit/Delete buttons with no `onClick` handlers | Settings | Medium |
| G-08 | Revenue report is entirely missing ("coming soon" placeholder) — promised in README | Reports | Medium |
| G-09 | Housekeeping reports tab is "coming soon" | Housekeeping | Low |
| G-10 | Housekeeping settings tab is "coming soon" | Housekeeping | Low |

### 3.2 Must-Have for v1.0 Launch (Polish / Correctness)

| # | Gap | Domain | Severity |
|---|-----|--------|----------|
| G-11 | Date range selector on Reports page does not affect any chart except (broken) occupancy trend — all other charts show current state regardless of range | Reports | Medium |
| G-12 | Passport number masking described in Settings UI ("only last 4 digits kept") but no frontend masking implementation found in guest forms | Reception | Medium |
| G-13 | `hotel_id` filter missing in `useHousekeepingTasks` realtime channel — channel listens globally on `housekeeping_tasks`, not tenant-scoped | Housekeeping | Medium |
| G-14 | `useRooms`, `useGuests` realtime channels not scoped by `hotel_id` — risk of cross-tenant data on auth state change | Reception | Medium |

### 3.3 Nice-to-Have for v1.0 (Post-Launch but Near-Term)

| # | Gap | Domain |
|---|-----|--------|
| G-15 | Email/push notification delivery for low stock alerts, variance alerts (UI toggles exist but no backend) | System |
| G-16 | Variance reports (stock counted vs expected from movements) | Reports |
| G-17 | Consumption trends over time | Reports |
| G-18 | COGS analysis | Reports |
| G-19 | Waste tracking workflow | Reports |
| G-20 | Folio/billing UI read path (currently only `room_charges` readable in UI) | Billing |
| G-21 | HK zone CRUD UI (zones queried but no management screen) | Housekeeping |
| G-22 | Multi-format PDF support (non-Køkkenliste documents) | Table Planning |

### 3.4 Future / Roadmap (v1.1+)

| # | Gap | Domain |
|---|-----|--------|
| G-23 | Domain cutovers (stays, billing, table planning) from legacy to normalized tables after soak validation | Architecture |
| G-24 | PMS integrations (Mews, Opera) | Integrations |
| G-25 | POS synchronization for stock depletion tracking | Integrations |
| G-26 | Advanced analytics (RevPAR, cross-hotel benchmarking) | Analytics |
| G-27 | Multi-property management dashboard | Enterprise |
| G-28 | AI inventory forecasting | AI |
| G-29 | Natural language operational queries | AI |

---

## 4. Test Coverage Assessment

| Area | Tests | Notes |
|------|-------|-------|
| `useAuth` hook | 4 unit tests | `src/hooks/useAuth.test.tsx` — covers unauthenticated state |
| Assignment algorithm | Tests exist | `src/components/tableplan/assignmentAlgorithm.test.ts` |
| Cutlery utilities | Tests exist | `src/components/tableplan/cutleryUtils.test.ts` |
| All other hooks | None | `useReception`, `useHousekeeping`, `useInventoryData`, `usePurchaseOrders` — untested |
| All pages | None | No page-level or integration tests |
| Edge functions | None | `parse-table-plan` has no automated tests |
| API queries | None | `src/api/queries.ts` — untested |

Test coverage is minimal. Only the two most logic-heavy utility modules and the auth hook have tests.
