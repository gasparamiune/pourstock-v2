

# Order Command Center Redesign + Kitchen View Toggle

## Changes

### 1. Order Command Center — Use screenshot card style as center piece
**File**: `src/components/ordering/OrderCommandCenter.tsx`

Replace the imported `TableCard` component in the center column (lines 432–441) with a custom card matching the user's first screenshot:
- Large rounded square with the table number prominently displayed
- Guest count, guest name, room number below
- Green "● Arrived" with elapsed timer
- Course type badge
- Service icons row (coffee, wine, welcome, flag)
- This is purely visual — built inline, not using the `TableCard` component

Keep the three-column layout but make the **right panel the Bill section** (replace Table Info):
- Show `BillView` component inline
- Add "Split Bill" and "Pay" buttons
- Move allergy/dietary notes to a small collapsible section at bottom of left panel (order ticket)

Fix scroll leak:
- Add `onWheel={e => e.stopPropagation()}` on the portal root
- Add `useEffect` to toggle `overflow-hidden` on `document.body` when open

### 2. Kitchen page — Toggle between Kitchen Display and Waiter Side
**File**: `src/pages/Kitchen.tsx`

Add a third tab: "Waiter Side" alongside "Kitchen Display" and "Today's Menu".

**File**: New `src/components/kitchen/WaiterDisplay.tsx`

Create a waiter-side display that:
- Queries `kitchen_orders` with status `ready` only
- Shows the same `OrderCard` layout but with:
  - "Pinch" button instead of "Mark served" (same action — advances to `served`)
  - No "Start cooking" or "Mark ready" actions
  - Prominent table number for quick identification
- Same realtime subscription as KitchenDisplay
- Same fullscreen styling option

The waiter display is essentially "tickets that the kitchen has marked ready, waiting for waiters to pick up."

### 3. Kitchen page toggle for testing
**File**: `src/pages/Kitchen.tsx`

The existing Tabs already support this — just add the third tab trigger "Waiter Side" pointing to the new `WaiterDisplay` component.

## Files to create/modify
| File | Action |
|------|--------|
| `src/components/ordering/OrderCommandCenter.tsx` | Replace center TableCard with custom card, right panel → Bill, fix scroll, move allergies |
| `src/components/kitchen/WaiterDisplay.tsx` | New — waiter-side display showing "ready" orders with "Pinch" action |
| `src/pages/Kitchen.tsx` | Add "Waiter Side" tab |

