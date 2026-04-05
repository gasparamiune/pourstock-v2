

# Updated Plan: Live Service Prep (Complete)

Incorporates all previous requests plus the new additions.

## Changes

### 1. Fix Stripe build error
**File**: `supabase/functions/stripe-connect/index.ts`
Change `import Stripe from 'npm:stripe@14'` to `import Stripe from 'https://esm.sh/stripe@14'` and same for supabase-js.

### 2. Seed daily menu
DB insert: professional 4-course menu for today (Rejesalat / Hummerbisque / Oksemørbrad / Crème brûlée).

### 3. Command Center full-screen width
**File**: `src/components/ordering/OrderCommandCenter.tsx`
Remove `max-w-4xl` constraint on upper row (line 462). Use `max-w-7xl` or full width.

### 4. 2-ret default = starter + main
**File**: `src/pages/TablePlan.tsx` (auto-food-insert logic)
When reservation is "2-ret", insert starter + main (not starter + mellemret). Already the case in the plan's `order.2retFH` button, just ensure the auto-insert follows the same pattern.

### 5. Make current order bigger and more visible
**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Increase font sizes in the order ticket: item names from `text-xs` to `text-sm`, quantity from small to bold `text-sm`
- Course headings from `text-[8px]` to `text-[10px]`
- Give the order panel more flex weight (`flex-[1.5]` instead of `flex-1`)
- Add subtle left border highlight on the panel

### 6. Fix double run button in custom run mode
**File**: `src/components/ordering/OrderCommandCenter.tsx`
When `customRunOpen` is true, hide the main "Run {course}" button. Only show the custom run panel's own button. This prevents two competing run buttons.

### 7. Allow deleting items from the order (including saved/existing lines)
**File**: `src/components/ordering/OrderCommandCenter.tsx`
Currently the `×` remove button only works for pending (unsaved) items. For existing (saved) lines that haven't been fired, add a delete button that:
- Removes the line from the DB via a new `deleteOrderLine` mutation
- Visually removes it from `existingLines` (refetch)

**File**: `src/hooks/useTableOrders.tsx`
Add a `deleteOrderLine` mutation that deletes from `table_order_lines` by line ID.

### 8. Auto-insert food from PDF reservations
**File**: `src/pages/TablePlan.tsx`
After table assignment, for 4-ret/3-ret/2-ret reservations, auto-create `table_orders` + `table_order_lines` using today's daily menu. 2-ret defaults to starter + main.

### 9. KDS course counters
**File**: `src/components/kitchen/KitchenDisplay.tsx`
Add a "Tonight's Service" bar showing remaining counts per course. Expected = sum of all `table_order_lines` today. Completed = kitchen tickets marked ready/served. Remaining = expected - completed.

### 10. Custom run fires with `fireCourses`
**File**: `src/components/ordering/OrderCommandCenter.tsx`
Fix `handleCustomRun` to derive the courses from selected items and pass them as `fireCourses` to `handleSubmit`, so only those courses get kitchen tickets (not all selected items at once).

## Files modified
| File | Change |
|------|--------|
| `supabase/functions/stripe-connect/index.ts` | Fix ESM imports |
| DB migration/insert | Seed daily menu |
| `src/components/ordering/OrderCommandCenter.tsx` | Full width, bigger order panel, fix double button, delete items, fix custom run |
| `src/hooks/useTableOrders.tsx` | Add deleteOrderLine mutation |
| `src/pages/TablePlan.tsx` | Auto-insert food from reservations |
| `src/components/kitchen/KitchenDisplay.tsx` | Course counters bar |

