

# Restaurant Ordering UI Redesign

This is a large redesign touching the table plan interaction model, order command center layout, and adding drag-to-fire-course functionality. Here's the breakdown of all issues and changes.

## Problem Analysis

1. **Items disappearing after ordering**: The `submitOrder` mutation changes order status from `open` to `submitted`. When reopening the command center, `existingOrder` looks for `status === 'open'` and finds nothing, so previously ordered items don't appear. The `BillView` works but only shows on the "Bill" tab. Need to show submitted order lines alongside new items.

2. **"Take Order" button**: Currently a small button inside the TableCard that only appears after marking "arrived". User wants: clicking/touching any occupied table directly opens the order command center (no separate button).

3. **Join tables "+" button positioning**: The merge button uses percentage-based positioning (`left: calc(${leftPercent}% - 12px)`) which doesn't align properly between tables. Need to position it relative to the actual grid cells.

4. **Order Command Center redesign**: User wants a full-screen immersive experience matching the wireframes — three-column layout (current order on left, table visual in center, table info on right), with menu categories (Drinks/Food/Daily menu) below, and allergen warnings.

5. **Drag-to-fire-course**: New interaction where dragging a table reveals a drop zone below to automatically fire the next course.

## Technical Plan

### 1. Fix order persistence (items disappearing)
**File**: `src/hooks/useTableOrders.tsx`
- Change `existingOrder` logic in `OrderCommandCenter` to find any non-void order (not just `open`)
- In `submitOrder`, don't change status to `submitted` on first send — keep as `open` so additional items can be added
- Only mark `submitted` when waiter explicitly finalizes (or use a separate "close order" action)
- Alternative: keep current status flow but show already-submitted lines in the command center ticket panel alongside new pending items

**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Fetch and display existing order lines (from DB) at the top of the ticket panel
- New pending items appear below a separator
- "Fire order" only sends the NEW items to kitchen

### 2. Remove "Take Order" button, open on table click
**File**: `src/components/tableplan/TableCard.tsx`
- Remove the "Take Order" button entirely
- When an occupied+arrived table is clicked, directly trigger `onTakeOrder` instead of `onClickOccupiedTable`

**File**: `src/components/tableplan/FloorPlan.tsx`
- Update click handler: for arrived tables, call `onTakeOrder` directly
- Keep `onClickOccupiedTable` for non-arrived tables (to see reservation details)
- Add a small edit button (circle) in the top-right corner of occupied cards for accessing reservation details

**File**: `src/pages/TablePlan.tsx`
- Adjust the handler — clicking an arrived table opens OrderCommandCenter directly

### 3. Fix merge "+" button positioning
**File**: `src/components/tableplan/FloorPlan.tsx`
- Replace absolute positioning with a CSS approach that overlays the "+" button at the border between two grid cells
- Use a wrapper div or CSS `transform: translateX(-50%)` relative to the grid gap between columns
- Calculate position from actual grid layout rather than percentage guesses

### 4. Redesign Order Command Center (immersive full-screen)
**File**: `src/components/ordering/OrderCommandCenter.tsx` (major rewrite)

Layout (matching wireframes):
```text
┌─────────────────────────────────────────────────────┐
│  ← Back          TABLE 7          [Order] [Bill]    │
├──────────┬──────────────┬───────────────────────────┤
│ CURRENT  │   [table     │  TABLE INFO               │
│ ORDER    │    visual]   │  Covers: 4                │
│          │              │  Occasion: Birthday        │
│ Items    │  4 covers    │  Notes: Window seat        │
│ with qty │  open 19:42  │                           │
│ +/- btns │              │  ⚠ Guest 2: nut allergy   │
│          │  [AI order]  │  Guest 4: lactose          │
│ Allergen │              │                           │
│ warnings │              │                           │
│          ├──────────────┴───────────────────────────┤
│ Total    │  [Drinks] [Food] [Daily menu]            │
│          │  [Wine] [Beer] [Cocktails] [Spirits]...  │
│ [Fire →] │  [items grid...]                         │
└──────────┴──────────────────────────────────────────┘
```

Key features:
- Left panel: current order ticket with allergen warnings based on ordered items
- Center: table visual with cover count, time open, AI ordering button
- Right: table info from reservation (covers, occasion, notes, allergen warnings per guest)
- Bottom: full menu browser with Drinks/Food/Daily Menu tabs, subcategories, and item cards
- Brightness/animation: when opened, the command center is full-screen with a smooth enter animation (already has `command-center-enter` class)

### 5. Drag-to-fire-course system
**File**: `src/components/tableplan/FloorPlan.tsx`
- During drag of an arrived table, show a drop zone at the bottom of the floor plan: "Drop here to fire next course"
- On drop, call `onAdvanceCourse` for that table and also trigger `fireNextCourse` mutation
- Visual: the drop zone appears with a slide-up animation, has a chef hat icon and the course label

**File**: `src/pages/TablePlan.tsx`
- Wire up the new `onFireCourse` callback that both advances the reservation state and fires the kitchen ticket

### 6. Dimming animation for selected table
**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Already renders as a portal over the full screen
- The existing implementation is already immersive (full-screen with `z-[9999]`)
- Enhance the enter animation with a scale-up effect on the table element

## Files Modified
- `src/hooks/useTableOrders.tsx` — fix order persistence
- `src/components/ordering/OrderCommandCenter.tsx` — major redesign
- `src/components/ordering/OrderTicketPanel.tsx` — show existing + new items
- `src/components/tableplan/TableCard.tsx` — remove Take Order button, add edit circle
- `src/components/tableplan/FloorPlan.tsx` — fix merge button, add drag-to-fire drop zone, direct-open ordering
- `src/pages/TablePlan.tsx` — wire up new interactions
- `src/index.css` — new animations for the command center

## Implementation Order
1. Fix order persistence (critical bug)
2. Remove Take Order button, open on table click
3. Fix merge button positioning
4. Redesign Order Command Center
5. Add drag-to-fire-course drop zone
6. Polish animations and dimming

