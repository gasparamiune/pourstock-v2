

# Fix Plan: Dishes Not Appearing + Query Invalidation

## What's Already Working

All the structural wiring is in place:
- WTF warning triangles: state, realtime subscription, prop drilling through FloorPlan → TableCard all connected and rendering correctly
- AngryChefOverlay animation
- rejectTicket mutation
- Table plan lifecycle (publish/close/history)
- KDS counter queries (expected from order lines, completed from kitchen tickets)

## What's Broken

### 1. Dishes not appearing in Command Center (root cause)

The prefill effect in `OrderCommandCenter.tsx` (line 296) inserts `table_order_lines` rows directly into the database via `supabase.from('table_order_lines').insert(...)`, but **never invalidates the React Query cache** (`table-orders`). The component's `existingLines` comes from `useTableOrders()` which uses cached data — so the UI stays empty even after rows exist in DB.

**Fix**: Import `useQueryClient` and call `queryClient.invalidateQueries({ queryKey: ['table-orders'] })` after the prefill insert succeeds.

### 2. Prefill race condition with reload effect

The "reload unfired courses" effect (line 393) runs with a 500ms delay, but the prefill effect (line 296) also runs on open and writes to DB asynchronously. These two effects race against each other — the reload may run before the prefill DB write completes, finding zero lines.

**Fix**: After prefill inserts lines and invalidates the cache, set a ref flag (`prefillJustRan`) that the reload effect checks. If prefill ran, the reload effect should wait for the invalidation to complete before reading.

### 3. KDS counter accuracy

The counter logic correctly queries `table_order_lines` for expected counts and `kitchen_orders` items for completed counts. However, the counter refetches every 15 seconds — it should also invalidate on the realtime channel that already exists for `kitchen_orders`. Add `service-counter-lines` and `service-counter-tickets` to the invalidation in the realtime subscription.

## Changes

### File: `src/components/ordering/OrderCommandCenter.tsx`

1. Add `useQueryClient` import and get `queryClient` instance
2. After the prefill's `supabase.from('table_order_lines').insert(lines)` call (around line 386), add:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['table-orders'] });
   ```
3. Add a `prefillRanRef` to prevent the reload effect from clobbering the prefill

### File: `src/components/kitchen/KitchenDisplay.tsx`

1. In the realtime channel handler (around line 140), also invalidate `service-counter-lines` and `service-counter-tickets` query keys so counters update in real-time rather than every 15s

## Files Modified

| File | Change |
|------|--------|
| `src/components/ordering/OrderCommandCenter.tsx` | Add queryClient invalidation after prefill insert, fix race with reload effect |
| `src/components/kitchen/KitchenDisplay.tsx` | Invalidate counter queries on realtime events |

