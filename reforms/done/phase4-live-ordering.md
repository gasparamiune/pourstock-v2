# Phase 4 — Live Ordering: Table Plan → Kitchen → Folio

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `cf152bc`

---

## Summary

Connected the existing table plan to the kitchen module with a full end-to-end
ordering flow: waiter taps "Take Order" on any arrived table → selects items from
today's published menu → submits → kitchen tickets auto-created per course.

---

## What Was Built

### Order Flow

```
TableCard "Take Order" button
  → OrderSheet drawer (right-side Sheet)
    → MenuSelector (per-course item picker with qty +/-)
      → useTableOrders.submitOrder()
        → table_order + table_order_lines inserted
        → kitchen_order rows auto-created per course
          → KDS board updates in real-time
```

### Components

| Component | Detail |
|-----------|--------|
| `OrderSheet.tsx` | Right-side Sheet; handles no-menu, unpublished-menu, existing-order states |
| `MenuSelector.tsx` | Course-grouped item grid with +/− quantity controls; builds `OrderLine[]` |
| `TableCard.tsx` | Added "Take Order" / "Edit Order" button (shown only when `isArrived`) |
| `FloorPlan.tsx` | Wired `onTakeOrder` callback + `openOrderTableIds` Set for green highlight |

### Hooks

| Hook | Detail |
|------|--------|
| `useTableOrders` | Fetches open orders for date; `openOrder` upsert, `submitOrder` mutation |
| `useDailyMenu` | Fetches today's published menu items per course |

### Visual Cues

- Table card shows green "Edit Order" badge when an open order exists for that table
- `openOrderTableIds` Set derived from today's orders, passed down to both FloorPlan instances

---

## Migration

`supabase/migrations/20260324000004_live_ordering.sql`
- `table_orders`: plan_date, table_id, status FSM, waiter_id, folio_id
- `table_order_lines`: course, item_id, item_name, quantity, unit_price, special_notes, status
- Both with combined `USING + WITH CHECK` RLS using `is_hotel_member`
