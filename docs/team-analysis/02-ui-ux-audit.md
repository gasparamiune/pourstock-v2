# PourStock UI/UX Audit

**Date:** 2026-03-18
**Auditor:** Claude Code (automated analysis)
**Scope:** All pages, components, design system, accessibility, and mobile readiness

---

## 1. Page Inventory Summary Table

| Page | Route | Component File | Status | Completeness |
|------|-------|----------------|--------|--------------|
| Auth (Login/Signup) | `/auth` | `src/pages/Auth.tsx` | Fully built | 90% |
| Onboarding | `/onboarding` | `src/pages/Onboarding.tsx` | Fully built | 80% |
| Dashboard | `/` | `src/pages/Dashboard.tsx` | Fully built | 85% |
| Reception | `/reception` | `src/pages/Reception.tsx` | Fully built | 85% |
| Housekeeping | `/housekeeping` | `src/pages/Housekeeping.tsx` | Partially built — 2 stub tabs | 70% |
| Inventory | `/inventory` | `src/pages/Inventory.tsx` | Fully built | 85% |
| Products | `/products` | `src/pages/Products.tsx` | Mostly built — Edit action is stub | 75% |
| Import | `/import` | `src/pages/Import.tsx` | Fully built | 90% |
| Orders | `/orders` | `src/pages/Orders.tsx` | Fully built | 85% |
| Table Plan | `/table-plan` | `src/pages/TablePlan.tsx` | Fully built (complex) | 80% |
| Reports | `/reports` | `src/pages/Reports.tsx` | Partially built — Revenue tab is stub | 65% |
| User Management | `/user-management` | `src/pages/UserManagement.tsx` | Fully built | 85% |
| Settings | `/settings` | `src/pages/Settings.tsx` | Mostly built | 80% |
| Updates | `/updates` | `src/pages/Updates.tsx` | Fully built | 90% |
| 404 Not Found | `*` | `src/pages/NotFound.tsx` | Minimal stub | 30% |

**Total pages:** 15 (including 1 route-matched 404)
**Fully functional:** 9
**Partially built / stubs present:** 5
**Minimal stub:** 1

---

## 2. UX Gap List by Priority

### HIGH Priority

**H1 — Revenue Report is a placeholder**
`src/pages/Reports.tsx` line 288–301: The "Revenue" tab renders only a `DollarSign` icon and the text "Revenue analytics coming soon". Users who click this tab get zero value. This is a top-level navigation item prominently visible to admin users.

**H2 — Housekeeping Reports and Settings tabs are stubs**
`src/pages/Housekeeping.tsx` lines 107–121: Both the "Reports" tab and the "Settings" tab render plain text ("coming soon") inside a centered `div`. These tabs are visible in the tab bar, so supervisors and admins actively navigate to them and hit dead ends.

**H3 — Products Edit action is a no-op**
In `src/pages/Products.tsx` the `ProductCard` `DropdownMenuItem` for Edit (`<DropdownMenuItem><Edit ... /> Edit</DropdownMenuItem>`) has no `onClick` handler. Clicking Edit silently does nothing. Duplicate is similarly unimplemented. This is a core CRUD operation.

**H4 — Settings › Locations "Add Location" button does nothing**
`src/pages/Settings.tsx` line 155–158: The "Add Location" `<Button>` has no `onClick`. The Edit and Delete icon buttons on each location row also have no handlers. The entire Locations section is read-only despite looking interactive.

**H5 — Settings › Users panel only shows current user**
`src/pages/Settings.tsx` lines 196–222: The Users section hardcodes a single row (the current user) rather than rendering the `UserManagement` page or the `UserTable` component. Full user management exists at `/user-management` but is unreachable from this panel. Admins who expect to manage users from Settings are blocked.

**H6 — Occupancy Trend chart uses random mock data**
`src/pages/Reports.tsx` line 56–58: `occupancyTrend` is generated with `Math.random()`. This means the chart re-renders with different values on every page visit or state change, which is actively misleading in a production application. Real historical data is absent.

**H7 — SlidersHorizontal filter button is a non-functional stub**
`src/pages/Inventory.tsx` line 185–187: The "advanced filters" button (`SlidersHorizontal`) renders with no `onClick` handler. Users who click it expecting a filter panel get no feedback.

**H8 — No confirmation dialog before destructive actions (Delete Product)**
`src/pages/Products.tsx` `handleDelete` directly calls `supabase.delete()` when the menu item is clicked, with no intermediate confirmation. Combined with the absence of soft-delete on the products table, this is an irreversible operation with no guard.

---

### MEDIUM Priority

**M1 — Inventory count mode silently skips products with no stock level**
`src/pages/Inventory.tsx` lines 234–236: In count mode, `if (!stockLevel) return null`. Products that lack a stock level entry are silently omitted from the count grid. There is no indicator or empty-state telling the user why certain products are missing.

**M2 — No empty state on Dashboard when no modules are enabled**
`src/pages/Dashboard.tsx`: If a user has no departments assigned (`showReception`, `showHousekeeping`, and `showRestaurant` are all false), the stats grid and department cards section both render completely empty with no message. New users with misconfigured roles see a blank page.

**M3 — Reception page lacks department-access feedback for non-reception users**
`src/App.tsx` line 56: `/reception` is wrapped in `<ProtectedRoute requireDepartment="reception">`. Users without the reception department are silently redirected without an error or explanation. The same applies to housekeeping.

**M4 — No loading skeleton on Dashboard stats cards**
`src/pages/Dashboard.tsx`: The four stat cards (`arrivalsToday`, `dirtyRooms`, etc.) render `0` during data load rather than skeleton placeholders. This causes content to flash from 0 to real values on load.

**M5 — Auth page password toggle applies to both forms simultaneously**
`src/pages/Auth.tsx` line 37: A single `showPassword` state controls the eye icon for both the login password field and the signup password field. Toggling in the login tab also changes the icon state in the signup tab.

**M6 — Onboarding is limited to 6 Nordic countries**
`src/pages/Onboarding.tsx` lines 18–25: The country dropdown hard-codes DK, SE, NO, FI, IS, DE only. All other hospitality markets are excluded. There is no "Other" option or free-text fallback.

**M7 — Reports date range selector does not filter any data**
`src/pages/Reports.tsx` lines 73–105: The 7d / 30d / 90d range buttons update `dateRange` state but this state is never used to filter the underlying queries. The charts always show current snapshot data regardless of the selected range.

**M8 — Settings POS Integration panel uses hard-coded mock values**
`src/pages/Settings.tsx` lines 225–265: The POS section shows a hard-coded "Connected" badge and fixed serving sizes (150ml wine, 40ml spirit, 473ml beer) with no actual integration or user-editable values. This can mislead users about the system's actual state.

**M9 — Housekeeping table view uses raw emoji for assigned-to column**
`src/components/housekeeping/HKStatusBoard.tsx` line 314: The assigned-to cell renders the literal string `'👤'` instead of the actual staff member name. Screen readers announce this as "person" or an unclear code point. The staff name is available on the task object.

**M10 — Not Found page uses an `<a>` tag instead of React Router `Link`**
`src/pages/NotFound.tsx` line 12: The "Return to Home" link is `<a href="/">`, which causes a full page reload instead of a client-side navigation. It also has no styling beyond a `text-primary underline`, which is minimal for a branded 404 experience.

---

### LOW Priority

**L1 — Search assistant opens a duplicate input inside the dropdown**
`src/components/search/SearchAssistant.tsx`: When opened, the component renders two separate `<Input>` elements (one in the trigger area, one inside the dropdown panel). The user types into both simultaneously. This is confusing and redundant.

**L2 — Inventory list items are not keyboard-navigable**
`src/pages/Inventory.tsx` lines 251–289: The list items use `<div ... className="cursor-pointer">` with no `onClick` action and no keyboard event handler. Clicking a product in list mode does nothing at all.

**L3 — Orders tabs use custom `<button>` elements rather than shadcn `Tabs`**
`src/pages/Orders.tsx` lines 68–92: Orders uses hand-rolled tab buttons while other pages (Reception, Housekeeping) use the `Tabs` component from shadcn/ui. This is a consistency gap and the custom buttons lack proper `role="tab"` and `aria-selected` attributes.

**L4 — Hardcoded English strings outside i18n system**
Multiple pages bypass `t()` calls with hardcoded English strings. Examples:
- `Dashboard.tsx`: "Low Stock", "Products", "Count", "Add", "Receive", "Occupied", "Occupancy"
- `Reports.tsx`: "Room Status", "Occupancy Trend", "Revenue Overview", all card titles
- `OrderCard.tsx`: "Draft", "Sent", "Received", "Cancelled", "Send", "No vendor"
- `QuickCountCard.tsx`: "Par:", "Reorder at:", "Open bottle level", "Confirm Count"

**L5 — `font-display` utility references DM Sans which is only declared in `index.css` body, not in Tailwind config fontFamily**
`tailwind.config.ts` correctly registers `display: ['DM Sans', ...]` but `font-display` used in JSX (e.g. `Dashboard.tsx`) is a custom Tailwind utility class. This is correct via the config but relying on the CSS order means these classes silently fall back if the Google Font import fails.

**L6 — Sidebar search icon in mobile header is non-functional**
`src/components/layout/AppShell.tsx` lines 147–151: The `<Button variant="ghost" size="icon">` containing a `<Search>` icon in the mobile top bar has no `onClick` handler. Mobile users see a search button that does nothing.

---

## 3. Component Library Health Check

### shadcn/ui Components Present
The full standard shadcn set is present in `src/components/ui/`:
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip.

**Assessment: Excellent coverage.** All common components are available.

### Usage Consistency Issues

| Issue | Files Affected |
|-------|---------------|
| Mix of shadcn `Tabs` vs custom tab buttons | `Orders.tsx` (custom), `Reception.tsx`, `Housekeeping.tsx` (shadcn) |
| Two toast systems in use simultaneously | `App.tsx` renders both `Toaster` (shadcn/toast) and `Sonner` (sonner); `Onboarding.tsx` uses `sonner` toast directly while most other pages use `useToast` from shadcn |
| `size="icon-lg"` variant on Button in `QuickCountCard.tsx` | This is a non-standard size not defined in the shadcn Button variants — it will silently fall through to default |
| `variant="success"` on Button in `QuickCountCard.tsx` | Non-standard variant not in shadcn Button; will silently fall through |
| `Button` used as a link via `variant="link"` in some places, raw `<a>` in others | `NotFound.tsx` uses `<a href="/">` |

### Design Token Consistency
- The design system uses HSL CSS variables consistently via Tailwind config — well structured.
- `--warning` and `--primary` share the same HSL value (`38 92% 50%`). This means `text-warning` and `text-primary` are visually identical, which is confusing for components that distinguish them semantically (e.g., stock indicators where `warning` and `primary` look the same).
- Hard-coded color references (e.g., `text-amber-500`, `bg-amber-500` in `AppShell.tsx` banner and `FloorPlan.tsx` legend) bypass the token system, creating potential light/dark theme inconsistencies.

---

## 4. Accessibility Gaps

### Critical
- **No `aria-label` or `role="search"` on search inputs.** The `SearchAssistant` and all page-level search inputs (Inventory, Products, Reception) have no accessible labels. Screen readers announce these as unlabeled inputs.
- **Interactive `<div>` elements without keyboard support.** Inventory list items (`<div className="cursor-pointer">`) have no `tabIndex`, `role="button"`, or `onKeyDown` handlers. They are invisible to keyboard-only users.
- **Custom tab buttons lack ARIA tab pattern.** `Orders.tsx` tabs have no `role="tablist"`, `role="tab"`, `aria-selected`, or `aria-controls` attributes.
- **Color-only status indicators in RoomBoard.** Room status is conveyed via a colored dot (`bg-[hsl(...)]`) without any text alternative. Users with color vision deficiencies cannot distinguish room states without reading the text label that follows.

### Moderate
- **Search results dropdown has no focus management.** When `SearchAssistant` opens, focus stays on the background input rather than moving to the panel. There is no `Escape` key handler to close the panel.
- **Dialog/Sheet close events do not return focus** in most dialogs (no `onCloseAutoFocus` override). After closing `HKRoomDetailSheet` or `CheckInDialog`, focus moves to `<body>` rather than the triggering button.
- **Form fields in `Products.tsx` Add dialog lack `htmlFor`/`id` pairing** on the Select components (Category, Unit, Vendor selects have `<Label>` without `htmlFor` and no `id` on the trigger).
- **All category filter buttons use `<button>` without `aria-pressed` or `role="radio"`.** Users cannot tell which filter is active from assistive technology.
- **Icon-only buttons throughout have no `aria-label`.** Examples: `SlidersHorizontal` filter, NotePopover trigger in RoomBoard, view mode toggle buttons (Grid3X3 / List) in HKStatusBoard.

### Minor
- The sidebar toggle button (`Menu` icon) in the desktop top bar has no accessible label.
- `ElapsedTimer` in the housekeeping table uses a `🔧` emoji for a table column header (`<TableHead>🔧</TableHead>`). Screen readers announce raw emoji code descriptions.
- The Auth page `showPassword` toggle button has no `aria-label` — screen readers announce "button" only.

---

## 5. Mobile / Tablet Readiness Assessment

### What Works Well
- `touch-target` class (`min-h-[44px] min-w-[44px]`, extended to 48px on mobile) is applied consistently to interactive elements.
- Most pages use responsive grid classes (`grid-cols-2 md:grid-cols-4`, `sm:flex-row`, etc.).
- The sidebar correctly collapses to a full-screen overlay on mobile with a backdrop.
- Housekeeping tab labels hide icon text on small screens (`<span className="hidden sm:inline">`).
- The RoomBoard table uses `min-w-[640px]` with horizontal scroll, which is appropriate for tabular data on phones.
- The AppShell mobile header includes the branding and a hamburger.

### Mobile Issues
- **Settings page sidebar is hidden on mobile.** `src/pages/Settings.tsx` uses `grid lg:grid-cols-[260px_1fr]`. On screens below `lg` (1024px) the layout stacks vertically — the full sidebar renders above the content panel, requiring excessive scrolling to reach settings. No mobile-specific navigation (accordion, select, bottom sheet) exists.
- **Orders page header on mobile clips.** The header uses `flex items-center justify-between` without a responsive wrap, so "New Order" button and title can overlap on narrow screens.
- **Reports page report-type selector is a 2x4 grid (`grid-cols-2 lg:grid-cols-4`)** which is fine, but the embedded charts (`ResponsiveContainer height={250–280}`) are not given a minimum height clamp — on very small screens they can render too short to be readable.
- **Table Plan page** is the most desktop-centric feature. The `FloorPlan` SVG-style canvas has drag-and-drop interactions that are non-functional on touch devices (uses `React.DragEvent` HTML drag API, not touch events).
- **Inventory count mode QuickCountCard** buttons include `-10` and `+10` auxiliary buttons that are very small (`h-8 text-xs px-2`) and fall below the 44px touch target minimum.
- **The mobile header's search icon is a dead button** (no `onClick`), leaving mobile users without quick search access.

---

## 6. Missing UI Sections / Promises Without Implementation

| Feature Described or Implied | Current State |
|-------------------------------|---------------|
| Revenue analytics / financial reporting | Placeholder card with "coming soon" text |
| Housekeeping reports tab | Stub text only |
| Housekeeping settings tab | Stub text only |
| POS integration management (configure mapping, edit serving sizes) | Read-only mock display |
| Product Edit screen | Menu item renders, no handler |
| Product Duplicate action | Menu item renders, no handler |
| Mobile search via header icon | Button renders, no handler |
| Advanced inventory filter (SlidersHorizontal) | Button renders, no handler |
| Add Location functionality in Settings | Button renders, no handler |
| Edit/Delete Location in Settings | Buttons render, no handlers |
| Reports historical date-range filtering | Selector renders, state never consumed |
| Reservation detail editing from GuestDirectory | Rows are read-only; no click action |
| Notification settings persistence | Switches render with `defaultChecked` only; changes are not saved to any store |

---

## 7. Top 10 Actionable Improvements

### 1. Implement Product Edit Dialog
**Priority: High | Effort: Medium**
Wire the existing Edit `DropdownMenuItem` in `ProductCard` to a new `EditProductDialog` (modeled after the existing `AddProduct` dialog). The form state and `supabase.update()` logic already exists in nearby code. Add a confirmation `AlertDialog` before delete actions.

### 2. Implement Settings › Locations CRUD
**Priority: High | Effort: Medium**
Add `onClick` to the "Add Location" button that opens a `Dialog` with a `name` + `description` form. Add `onClick` to the Edit and Delete icon buttons. A `useSettingsCrud` hook (already exists, used by VendorSettings) can power the mutations.

### 3. Replace Mock Occupancy Trend with Real Data
**Priority: High | Effort: Medium**
Remove `Math.random()` from `Reports.tsx` occupancy trend. Query the `reservations` table grouping by `check_in_date` for the selected date range to produce real occupancy percentages by day. Wire the `dateRange` state to the query's `from`/`to` params.

### 4. Add Missing Aria Labels and Keyboard Navigation
**Priority: High | Effort: Low-Medium**
- Add `aria-label` to all icon-only `<Button>` elements (search, filter, view toggles, sidebar toggle, show/hide password, NotePopover trigger).
- Add `role="button" tabIndex={0} onKeyDown` to all `<div>` elements used as interactive controls (Inventory list items, SearchAssistant trigger wrapper).
- Add `role="search"` and label to all search `<Input>` elements.
- Add `aria-pressed` to category filter and status filter buttons.

### 5. Unify Tab Navigation to shadcn `Tabs` Component
**Priority: Medium | Effort: Low**
Replace the custom tab button implementation in `Orders.tsx` with the shadcn `Tabs` / `TabsList` / `TabsTrigger` pattern already used in `Reception.tsx` and `Housekeeping.tsx`. This eliminates the ARIA gap (no `role="tab"`, no `aria-selected`) and ensures keyboard navigation (arrow keys between tabs) works correctly.

### 6. Unify Toast System to Single Provider
**Priority: Medium | Effort: Low**
Remove the duplicate `<Sonner>` provider from `App.tsx` (or remove the shadcn `<Toaster>`) and migrate all `toast()` calls to a single system. Currently `Onboarding.tsx` uses `sonner` while most pages use `useToast()` from shadcn. Pick one and update all call sites.

### 7. Fix Settings Page Mobile Navigation
**Priority: Medium | Effort: Medium**
On screens below `lg`, replace the vertical-stacked sidebar with a `<Select>` dropdown or a scrollable horizontal pill list that lets users pick the active settings section. This prevents the "scroll past the whole sidebar to find the content" problem on tablets and phones.

### 8. Add Mobile Touch Support to Table Plan
**Priority: Medium | Effort: High**
The Table Plan uses the HTML Drag and Drop API exclusively (`onDragStart`, `onDrop`), which does not fire on iOS or Android. Replace or augment with Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) or a library like `@dnd-kit/core` that handles both mouse and touch. This is a key feature for floor managers using tablets.

### 9. Add Dashboard Empty State for Users with No Modules
**Priority: Medium | Effort: Low**
In `Dashboard.tsx`, when `showReception`, `showHousekeeping`, and `showRestaurant` are all false, render a guided empty state card explaining that the user has no department assignments and directing them to contact an admin or visit the onboarding flow. Currently the dashboard silently renders as blank.

### 10. Replace Hard-Coded English Strings with i18n Keys
**Priority: Low-Medium | Effort: Low (systematic)**
Add translation keys to `LanguageContext.tsx` for all the hard-coded English strings identified in the L4 gap. Priority targets: `Dashboard.tsx` quick action buttons and stat labels, `Reports.tsx` chart card titles, `OrderCard.tsx` status labels, `QuickCountCard.tsx` stock info labels. This is especially important for the Danish language users the product targets.

---

## Appendix: Design System Snapshot

| Token | Value | Note |
|-------|-------|------|
| `--primary` | `hsl(38 92% 50%)` — warm amber | Matches `--warning` exactly |
| `--warning` | `hsl(38 92% 50%)` | Same as primary — semantic collision |
| `--success` | `hsl(142 71% 45%)` | Green |
| `--info` | `hsl(199 89% 48%)` | Blue |
| `--destructive` | `hsl(0 72% 51%)` | Red |
| `--background` | `hsl(220 15% 8%)` | Dark navy (dark-only theme) |
| `--radius` | `0.75rem` | Applied consistently via `rounded-xl`, `rounded-2xl` |
| Font body | Inter | Via Google Fonts import |
| Font display | DM Sans | Via Google Fonts import |
| `glass-card` | `bg-card/60 backdrop-blur-xl border border-white/5 shadow-xl` | Used on ~80% of cards |

**Note:** The application is dark-mode only. The `index.css` defines a `.dark` block that is identical to `:root`, and `App.tsx` sets `defaultTheme="dark"`. There is no light mode. If a light theme is required in the future, the entire token set will need to be duplicated.

---

*This audit was generated from static code analysis. Runtime behaviour (e.g., actual API responses, precise layout rendering on specific devices) was not observed directly. All line-number references are based on the source files at the time of analysis.*
