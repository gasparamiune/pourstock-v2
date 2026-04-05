

# Live Service Prep — Final Combined Plan

All previous items (auto-food-insert, counters, full-screen layout, delete items, fix double run button, fix custom run, stripe fix, seed menu) plus the two new additions below.

---

## NEW: Retro Ticket Machine Redesign (KDS)

**File**: `src/components/kitchen/KitchenTicket.tsx`

Redesign the ticket to look like a classic thermal printer receipt:

- **Background**: Off-white/cream (`bg-[#FFFEF5]`) with a subtle paper texture via CSS noise or grain shadow
- **Font**: Monospace throughout (`font-mono`)
- **Imperfections**: Slightly uneven torn-edge top/bottom via CSS clip-path or pseudo-elements with a jagged border. Subtle `rotate-[0.3deg]` or `-rotate-[0.2deg]` tilt on alternating tickets
- **Separators**: Dashed lines (`- - - - - - - - - - - -`) and double lines (`========================`) between sections
- **Layout**:
  ```text
  ========================
     TABLE 12    19:42
  ========================
  -- FORRET ---------------
   2× Rejesalat
   1× Serrano      (medium)
  - - - - - - - - - - - - -
  ⚠ Gluten-fri til 1 gæst
  ========================
       [ ✓ READY ]  [ ✗ ]
  ```
- **Course color**: Kept ONLY as the left border (3px), matching existing green/violet/red/sky scheme
- **Text**: All black on cream paper. Notes in a slightly different weight
- **Age indicator**: Time turns amber at 8m, red at 15m — same logic, monospace display
- **Ready state**: Strikethrough effect or faded, like a stamped/crossed ticket
- **Actions**: Buttons styled as simple bordered rectangles at the bottom, receipt-style

## NEW: Fix Full Order in KDS Ticket

**File**: `src/components/kitchen/KitchenTicket.tsx`

The "Full Order" expandable view (eye icon) currently only shows courses that have kitchen tickets. It must show the **complete table order** — current course + all upcoming courses — even those not yet fired.

Fix: When `showFull` is true, fetch from `table_order_lines` (via the table's `table_orders`) in addition to `kitchen_orders`. Build a merged view:

- For each course, check `table_order_lines` for expected items
- Overlay with `kitchen_orders` status (pending/ready/served) where tickets exist
- Courses with no kitchen ticket yet show items with a "Pending" or "—" status
- Display order: starter → mellemret → main → dessert, all four always shown

This requires:
1. Look up the `table_orders` row matching `table_label + plan_date + hotel_id`
2. Fetch its `table_order_lines` grouped by course
3. Merge with existing `allTickets` (kitchen_orders) for status info
4. Render all courses, marking unfired ones distinctly (dimmed text, no status icon)

---

## Previously Approved Items (unchanged)

### 1. Fix Stripe build error
**File**: `supabase/functions/stripe-connect/index.ts` — change `npm:stripe@14` to `https://esm.sh/stripe@14`

### 2. Seed daily menu
DB insert: 4-course sample (Rejesalat / Hummerbisque / Oksemørbrad / Crème brûlée) with proper UUIDs

### 3. Command Center full-screen width
**File**: `src/components/ordering/OrderCommandCenter.tsx` — remove `max-w-4xl`, use `max-w-7xl`

### 4. 2-ret default = starter + main
**File**: `src/pages/TablePlan.tsx` — auto-insert starter + main for 2-ret reservations

### 5. Make current order bigger and more visible
**File**: `src/components/ordering/OrderCommandCenter.tsx` — larger fonts, `flex-[1.5]` panel weight

### 6. Fix double run button
**File**: `src/components/ordering/OrderCommandCenter.tsx` — hide main Run when `customRunOpen` is true

### 7. Allow deleting items from order
**Files**: `OrderCommandCenter.tsx` + `useTableOrders.tsx` — add `deleteOrderLine` mutation, trash icon on unfired lines

### 8. Auto-insert food from PDF reservations
**File**: `src/pages/TablePlan.tsx` — after assignment, create `table_order_lines` for daily-menu reservations. Also self-heal on Command Center open.

### 9. KDS course counters — redesigned layout
**Files**: `src/components/kitchen/KitchenDisplay.tsx` + `src/pages/Kitchen.tsx`

Move counters to a right-aligned block in the kitchen header row (beside KDS/Waiter tabs). Always show all 4 courses even when 0. Visual format per counter:

```text
┌─────────────┐
│     3       │  ← large bold number (remaining)
│ missing / 8 │  ← tiny label: "missing" + "/ total"
│   Forret    │  ← course name, color-coded
└─────────────┘
```

### 10. Custom run fires correct courses
**File**: `src/components/ordering/OrderCommandCenter.tsx` — derive `fireCourses` from selected items

### 11. Auto-prefill on Command Center open
**File**: `src/components/ordering/OrderCommandCenter.tsx` — on open, check if table has a reservation with daily-menu type but no saved order lines yet; if so, auto-insert from daily menu (no kitchen fire)

---

## Files modified summary

| File | Change |
|------|--------|
| `src/components/kitchen/KitchenTicket.tsx` | Retro receipt redesign + fix full-order to show all courses from order lines |
| `src/components/kitchen/KitchenDisplay.tsx` | Redesigned counter block (right-aligned, always 4 courses) |
| `src/pages/Kitchen.tsx` | Move counters into header row layout |
| `src/components/ordering/OrderCommandCenter.tsx` | Full width, bigger panel, fix double button, delete items, custom run fix, auto-prefill |
| `src/hooks/useTableOrders.tsx` | Add deleteOrderLine mutation |
| `src/pages/TablePlan.tsx` | Auto-insert food from reservations |
| `supabase/functions/stripe-connect/index.ts` | Fix ESM imports |
| DB insert | Seed daily menu with UUIDs |

