# Restaurant UI Redesign — Handoff Document for Lovable

**Branch:** `feat/restaurant-pos-mvp`
**Author:** Claude Code
**Date:** 2026-04-03
**Status:** Implemented, needs Lovable verification + deployment

---

## What Was Done & Why

This document explains every change made so Lovable can verify correctness, fix anything broken, and deploy.

---

## 1. New Ordering System — OrderCommandCenter

### Problem
The old `OrderSheet` was a narrow side drawer with a flat list and +/- buttons. Too cramped, ugly, and slow to use on a tablet.

### Solution
Replaced with a **full-screen overlay** (`OrderCommandCenter`) that portals to `document.body` using `createPortal`.

### Files Created

#### `src/components/ordering/OrderCommandCenter.tsx`
- **Props:** `open`, `onOpenChange`, `tableId`, `tableLabel` (identical to old `OrderSheet`)
- **Layout:** Full-screen `fixed inset-0 z-[9999]` with CSS entrance animation (`.command-center-enter`)
- **Left 55%:** `VisualMenuBoard` (tabbed menu grid)
- **Right 45%:** `OrderTicketPanel` (live order chit)
- **Header:** Table label, item count badge, pill switcher (Order | Bill & Pay), back button
- **Bill & Pay mode:** Switches to full-width `BillView` + Pay button + `PaymentSheet` (same components as before, nothing changed in those)
- **Uses `createPortal(document.body)`** to bypass any parent CSS stacking context

**All data hooks are identical to old `OrderSheet`:**
- `useDailyMenu()` — daily menu items
- `useMenuItems()` — permanent à la carte catalog
- `useTableOrders()` — existing orders
- `useTableOrderMutations()` — `openOrder`, `submitOrder`
- Merges daily + catalog items, deduplicates by ID (same logic as before)

#### `src/components/ordering/MenuItemCard.tsx`
- Visual glass card for each menu item
- Tap card body → add 1 to order
- Tap quantity badge (top-right corner) → remove 1
- Note icon (bottom-right) → opens `NoteDialog`
- Stock dot: green (>5), amber (2-5), orange (1), red (sold out / disabled)
- Allergen pills rendered from comma-separated string
- CSS animations: `card-pop` on add, `badge-pop` on first quantity appearance

#### `src/components/ordering/VisualMenuBoard.tsx`
- Course pill tabs: Starters | Mains | Desserts (tabs hide if no items)
- 2-column grid of `MenuItemCard`
- Accepts `readOnly` prop — used in `DailyMenuEditor` preview mode (pointer-events disabled)
- Props: `starters`, `mains`, `desserts`, `stockMap`, `selection`, `onAdd`, `onRemove`, `onRequestNote`, `readOnly?`

#### `src/components/ordering/OrderTicketPanel.tsx`
- Restaurant chit aesthetic (monospace font for numbers/totals)
- Items grouped by course with dashed separators
- Remove button (×) per line item — calls `onRemoveLine(itemId)`
- Empty state with receipt icon
- "Send to Kitchen (N)" CTA button
- Props: `tableLabel`, `lines`, `selection`, `onRemoveLine`, `onSubmit`, `submitting`, `existingOrder`

#### `src/components/ordering/NoteDialog.tsx`
- Small `Dialog` (max-w-xs) for per-item special notes
- Enter key saves, Cancel clears
- Props: `itemId`, `itemName`, `initialNote`, `onSave(itemId, note)`, `onClose`

### File Modified: `src/pages/TablePlan.tsx`
**One-line swap** at the bottom of the file:
```tsx
// BEFORE
import { OrderSheet } from '@/components/ordering/OrderSheet';
<OrderSheet open={...} onOpenChange={...} tableId={...} tableLabel={...} />

// AFTER
import { OrderCommandCenter } from '@/components/ordering/OrderCommandCenter';
<OrderCommandCenter open={...} onOpenChange={...} tableId={...} tableLabel={...} />
```

**`OrderSheet.tsx` is NOT deleted** — it still exists but is no longer used as the entry point. `BillViewWithPay` lives there but is duplicated inline inside `OrderCommandCenter`.

---

## 2. KDS Course Sequencing — Fire Courses Progressively

### Problem
When a waiter submitted an order, `submitOrder` created **all course kitchen tickets at once** (starter + main + dessert all showing "pending" in the KDS). This cluttered the kitchen display with future courses.

### Expected Flow
1. Waiter submits order → **only the first course** (starter if ordered, else main) appears in KDS as pending
2. Kitchen cooks starter, marks ready
3. Waiter clicks **"Kør forret"** on the table card → **main kitchen ticket is created** (now appears in KDS)
4. Waiter clicks **"Kør mellemret/Kør hovedret"** → **dessert kitchen ticket is created**
5. Kitchen never sees future courses until the waiter fires them

### Files Modified

#### `src/hooks/useTableOrders.tsx`

**`submitOrder` mutation** — changed from creating ALL course tickets to only the first:
```tsx
// OLD: looped through ['starter', 'main', 'dessert'] and created all
// NEW:
const firstCourse = (['starter', 'main', 'dessert']).find(c => lines.some(l => l.course === c));
if (firstCourse) {
  // create kitchen_order for firstCourse only
}
```

**New `fireNextCourse` mutation added:**
```tsx
fireNextCourse({ orderId: string, courseToFire: 'main' | 'dessert' })
```
- Queries `table_order_lines` for the given `orderId` and `courseToFire`
- If lines exist, inserts a new `kitchen_orders` record
- If no lines for that course, silently does nothing
- Returns from `useTableOrderMutations()` alongside existing mutations

#### `src/pages/TablePlan.tsx`

**`onAdvanceCourse` callback** — extended to also fire the next kitchen ticket:
```tsx
// BEFORE advancing the reservation timestamps, determine what course to fire:
// - !res.starterServedAt → courseToFire = 'main'
// - is4ret && !res.interServedAt → courseToFire = 'main'
// - !res.mainServedAt → courseToFire = 'dessert'
// - !res.dessertServedAt → nothing to fire

// Find the submitted order for this table from todayOrders
const tableOrder = todayOrders.find(o => o.table_id === tableId && (o.status === 'submitted' || o.status === 'open'));
if (tableOrder && courseToFire) {
  fireNextCourse.mutate({ orderId: tableOrder.id, courseToFire });
}
```
Added `assignments`, `todayOrders`, `fireNextCourse` to the `useCallback` dependency array.

---

## 3. Daily Menu Catalog Isolation

### Problem
`DailyMenuEditor`'s "Load from Catalog" button copied items with their **original `menu_items` UUIDs**. This caused confusion — if the same ID appeared in both `daily_menus` JSON and `menu_items` table, the waiter ordering screen deduplicated them (daily menu won), making it look like editing the daily menu overwrote the à la carte catalog.

### Fix: `src/components/kitchen/DailyMenuEditor.tsx`

`handleLoadFromCatalog` now generates **fresh UUIDs** via `crypto.randomUUID()` for each copied item:
```tsx
const toDaily = (i) => ({
  id: crypto.randomUUID(), // NEW: independent UUID, not the catalog item's ID
  name: i.name,
  description: i.description ?? '',
  allergens: i.allergens ?? '',
  price: i.price,
  available_units: i.available_units,
});
```

Deduplication changed from **by ID** → **by name (case-insensitive)** to prevent re-loading the same dish twice.

**Result:**
- Daily menu items are fully independent copies stored only in `daily_menus` JSON
- The permanent `menu_items` table is never touched by the daily menu editor
- Both daily menu items AND à la carte items show in the ordering screen (no more suppression)

---

## 4. DailyMenuEditor Polish

### Changes in `src/components/kitchen/DailyMenuEditor.tsx`

- **Max items per course:** Changed from `max={3}` to `max={10}` on lines for Starters, Mains, Desserts
- **Preview mode:** New "Preview" button toggles `previewMode` state
  - Preview renders `VisualMenuBoard` in read-only mode with the current draft items
  - Shows exactly what waiters will see when ordering
  - "Waiter view preview" label strip at top
- **Published banner:** Enhanced from plain `bg-green-500/10` to gradient + left border:
  ```
  bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-500
  ```
  Green dot gets `pulse-glow` CSS animation class

---

## 5. KDS Visual Upgrade

### `src/components/kitchen/OrderCard.tsx` (full rewrite)
- **Item-level checkboxes:** `Checkbox` (shadcn) per item, local state only (`Set<number>`). Checked items get `line-through` styling. No DB writes.
- **Age progress bar:** `Progress` bar fills 0→100% over course threshold (starter: 15min, main: 25min, dessert: 15min). Color: green (<50%) → amber (<80%) → red (≥80%)
- `isNew` prop: applies `.pulse-glow` CSS class for 4 seconds when order first appears

### `src/components/kitchen/KitchenDisplay.tsx`
- **New-order pulse detection:** `useRef` tracks previous order IDs, `useEffect` diffs them each render cycle
- New order IDs tracked in `newIds: Set<string>` state, cleared after 4s
- `KDSColumn` now accepts `newIds` prop, passes `isNew` to each `OrderCard`

---

## 6. CSS Animations Added — `src/index.css`

Three new keyframes in `@layer components`:

```css
@keyframes commandCenterIn {
  from { opacity: 0; transform: scale(0.97) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.command-center-enter { animation: commandCenterIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }

@keyframes cardPop {
  0%  { transform: scale(1); }
  40% { transform: scale(0.93); }
  100%{ transform: scale(1); }
}
.card-pop { animation: cardPop 0.18s ease-out; }

@keyframes badgePop {
  0%  { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100%{ transform: scale(1); opacity: 1; }
}
.badge-pop { animation: badgePop 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards; }
```

---

## What Was NOT Changed

| File | Status |
|------|--------|
| `src/components/restaurant/PaymentSheet.tsx` | Untouched |
| `src/components/restaurant/BillView.tsx` | Untouched |
| `src/components/restaurant/SplitBillDialog.tsx` | Untouched |
| `src/hooks/useDailyMenu.tsx` | Untouched |
| `src/hooks/useMenuItems.tsx` | Untouched |
| `src/integrations/supabase/client.ts` | Untouched |
| `src/integrations/supabase/types.ts` | Untouched |
| `src/components/ordering/OrderSheet.tsx` | Kept, not deleted, no longer primary entry |
| Database schema | No migrations — all changes are frontend only |
| Edge functions | Untouched |

---

## Known Issues / Things to Verify

1. **`OrderCommandCenter` visibility:** Uses `createPortal(document.body)` + `z-[9999]`. Verify it renders correctly in the Lovable deployment environment (especially if there are any custom portal roots or CSP restrictions).

2. **`fireNextCourse` — missing course edge case:** If a table only ordered starter + dessert (no main), pressing "Kør forret" fires `courseToFire = 'main'`. The mutation then queries `table_order_lines` for course='main', finds 0 rows, and returns silently. Dessert would never be fired. **Fix needed:** After firing 'main' if no main lines exist, also try 'dessert'. This should be handled in `fireNextCourse` by trying the next course if the requested one has no lines, OR in `onAdvanceCourse` by checking order lines before deciding `courseToFire`.

3. **Re-submitting orders (adding items to existing order):** When a waiter opens an existing table's order and adds more items (e.g., adds a dessert mid-meal), `submitOrder` fires only the first course again. This may create a duplicate starter ticket. Consider checking if a kitchen_order for that course already exists before creating a new one.

4. **Daily menu preview uses editor's local state:** The preview in `DailyMenuEditor` shows the draft state (unsaved). If items were loaded from catalog with new UUIDs, the preview reflects those correctly. However, `stockMap` is passed as empty `{}` to `VisualMenuBoard` in preview mode, so stock dots won't show. This is acceptable for a preview.

5. **`SelectionMap` type** is defined locally in `MenuSelector.tsx` and also in `OrderCommandCenter.tsx` and `VisualMenuBoard.tsx`. These are duplicated inline (not imported). Lovable may want to extract this to a shared types file at `src/types/ordering.ts`.

---

## Flow Verification Checklist

### Ordering Flow
- [ ] Click "Take Order" on a table → full-screen overlay appears (not side drawer)
- [ ] Course tabs show Starters / Mains / Desserts with item count badges
- [ ] Tap a menu item card → quantity badge appears with pop animation
- [ ] Tap quantity badge → decrements by 1 (removes at 0)
- [ ] Tap note icon on selected item → NoteDialog opens → note saves and shows on ticket
- [ ] Right panel shows live ticket with course groupings and running total
- [ ] Click × on ticket line → removes item
- [ ] "Send to Kitchen" fires → overlay closes → KDS shows ONLY the first course ticket
- [ ] Sold-out items show red dot, are disabled

### Course Sequencing Flow
- [ ] Order submitted → KDS shows only starter (or main if no starters)
- [ ] Waiter clicks "Kør forret" on table card → KDS shows main ticket appear
- [ ] Waiter clicks "Kør mellemret" (4-course) → KDS shows main ticket
- [ ] Waiter clicks "Kør hovedret" → KDS shows dessert ticket appear
- [ ] No duplicate tickets for the same course+table

### KDS Flow
- [ ] New ticket shows amber pulse glow for ~4 seconds
- [ ] Checkboxes on items work (local state, no DB)
- [ ] Age bar fills over threshold, turns red when urgent
- [ ] "Start cooking" → "Mark ready" → "Mark served" workflow intact

### Daily Menu Flow
- [ ] Load from Catalog → items appear with new names (not catalog IDs)
- [ ] Edit item name/price in daily menu → does NOT change the à la carte stock manager items below
- [ ] Preview button → shows VisualMenuBoard read-only
- [ ] Publish → banner turns green with gradient + pulse
- [ ] Max items per course is now 10 (not 3)

### Bill & Pay Flow
- [ ] Switch to "Bill & Pay" tab in OrderCommandCenter → BillView renders
- [ ] "Pay" button → PaymentSheet opens
- [ ] Stripe Terminal flow unchanged
