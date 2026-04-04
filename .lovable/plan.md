

# Complete Remaining Plan: Menu Separation, Fast Ordering, Order Persistence, KDS Naming

## What's already done
- Run button shows correct next-course count
- `fireCourses` parameter exists in `submitOrder`
- KDS has ready/active sections
- Mellemret course added throughout
- Cooking preference dialog works

## What's still missing

### 1. Fix duplicate line insertion on 2nd run
**File**: `src/hooks/useTableOrders.tsx` — `submitOrder` mutation

Currently, when running mains after starters, `handleSubmit` passes ALL remaining `pendingLines` again, which tries to INSERT lines that were already saved on the first run. Fix: before inserting, query existing `table_order_lines` for this order and only insert lines whose `item_id + course` combo doesn't already exist.

### 2. Reload unfired courses when reopening command center
**File**: `src/components/ordering/OrderCommandCenter.tsx`

Add a `useEffect` that, on mount (when `open` becomes true), checks `existingLines` against `kitchen_orders` to find lines saved but not yet fired to kitchen. Populate `selection` state from those unfired lines so the user can continue running courses.

Approach: compare `existingLines` courses against existing kitchen tickets. Any course in `existingLines` that has no matching kitchen ticket = unfired. Load those items into `selection`.

### 3. Separate daily vs à la carte menus strictly
**File**: `src/components/ordering/OrderCommandCenter.tsx`

- À la carte view (line 654): change from `allStarters/allMains/allMellemret/allDesserts` to `permanentStarters/permanentMellemret/permanentMains/permanentDesserts` only
- Daily view (line 642): already correct (passes `menu?.starters` etc.)
- Remove the `mergeItems` function and `allStarters/allMellemret/allMains/allDesserts` variables entirely

### 4. Add `source` field to order lines
**File**: `src/components/ordering/OrderCommandCenter.tsx`

- Add `source: 'daily' | 'alacarte'` to `SelectionMap` entries
- When adding items in daily mode, tag `source: 'daily'`; in à la carte mode, tag `source: 'alacarte'`
- Pass `source` through `pendingLines` into `submitOrder`

**File**: `src/hooks/useTableOrders.tsx`
- Include `source` in `OrderLine` type
- Pass `source` into kitchen ticket items

### 5. Daily menu fast ordering buttons
**File**: `src/components/ordering/OrderCommandCenter.tsx`

When `foodMode === 'daily'`, render a row of 4 quick-tap buttons above the VisualMenuBoard:
- **4-ret menu**: adds 1× starter + 1× mellemret + 1× main + 1× dessert (first item from each daily course)
- **3-ret menu**: adds 1× starter + 1× main + 1× dessert (skips mellemret)
- **2-ret (F+H)**: adds 1× starter + 1× main
- **2-ret (H+D)**: adds 1× main + 1× dessert

Each button increments quantity if tapped again (for multiple guests choosing same combo).

### 6. Fix KDS ticket naming by source
**File**: `src/components/kitchen/KitchenTicket.tsx`

Already partially done. Refine the `isDailyMenu` check to use actual `source` field:
- `source === 'daily'`: show `{qty}× Dagens {course}` with allergy sub-notes
- `source === 'alacarte'` or no source: show `{qty}× {item.name}` (short menu name)

### 7. Translations
**File**: `src/contexts/LanguageContext.tsx`

Add: `order.4ret`, `order.3ret`, `order.2retFH`, `order.2retHD`, `kitchen.course.label.starter` → "Dagens forret", etc.

## Files modified
| File | Change |
|------|--------|
| `src/hooks/useTableOrders.tsx` | Deduplicate inserts, add source field |
| `src/components/ordering/OrderCommandCenter.tsx` | Menu separation, fast order buttons, reload unfired courses, source tagging |
| `src/components/kitchen/KitchenTicket.tsx` | Refine naming by source field |
| `src/contexts/LanguageContext.tsx` | Add translations |

