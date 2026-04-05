

# KDS Counter Fix + Table Plan History + Command Center Overhaul + WTF Button + Retro Tickets

All previously approved items, plus: **angry chef animation on WTF button press**.

---

## Changes

### 1. Fix KDS Service Counters
**File**: `src/components/kitchen/KitchenDisplay.tsx`
- Query `table_order_lines` via `table_orders` with proper hotel_id filtering
- Count completed items from `kitchen_orders` by summing quantities
- Always show all 4 courses even with 0

### 2. Table Plan: Today vs History
**File**: `src/pages/TablePlan.tsx`
- Split into **Today's Plan** (active) and **History** (closed, read-only)
- Add "Close & Save to History" button that sets `status = 'closed'`

**DB migration**: `ALTER TABLE table_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`

### 3. Command Center as Centralized Hub
**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Aggregate top bar with all tables' status chips (click to switch)
- Food vector sidebar: total dishes across ALL tables by course
- All reservation info visible (guest name, room, notes, allergies, preferences)
- Fix auto-prefill to use `activeHotelId` instead of `existingOrder?.hotel_id`

### 4. Easier Order Editing
**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Inline notes per dish (small text input, saves to `special_notes` on `table_order_lines`)
- Always-visible trash icon for touch devices
- +/- quantity buttons on existing lines
- PDF notes merge into order-level notes on prefill

### 5. WTF Button (Kitchen Reject) + Angry Chef Animation
**File**: `src/components/kitchen/KitchenTicket.tsx`
- Add "WTF" button (⚠ styled) on each ticket
- On press: show a **1-second fullscreen overlay animation** of an angry chef emoji/illustration slamming the ticket down — CSS keyframe animation with scale-up, shake, and fade-out. Built with a large 👨‍🍳 emoji + 💢 anger symbol + the ticket flying away, all pure CSS (no external assets)
- After animation completes: set `kitchen_orders.status = 'rejected'`, ticket disappears from KDS

**New file**: `src/components/kitchen/AngryChefOverlay.tsx`
- Fullscreen fixed overlay, dark semi-transparent background
- Center: large chef emoji (👨‍🍳) with shake animation + anger marks (💢) popping in
- Below: ticket representation sliding down and crumpling
- Auto-dismisses after 1s via `onAnimationEnd`
- Keyframes: `shake` (rapid x-axis jitter), `slam` (scale 0→1.2→1), `fadeOut` (opacity 1→0 at 0.8s)

**File**: `src/hooks/useTableOrders.tsx`
- Add `rejectTicket` mutation updating status to `'rejected'`

**File**: `src/components/tableplan/TableCard.tsx`
- Show ⚠ warning triangle on tables with rejected tickets

**File**: `src/components/ordering/OrderCommandCenter.tsx`
- Banner on open: "Kitchen returned: {course}" for rejected tickets
- Reset fired status for that course so it can be re-run

### 6. Retro Ticket Machine Redesign (KDS)
**File**: `src/components/kitchen/KitchenTicket.tsx`
- Off-white/cream background (`bg-[#FFFEF5]`), monospace font throughout
- Jagged torn-edge top/bottom via CSS clip-path
- Subtle rotation tilt on alternating tickets
- Dashed and double-line separators between sections
- Course color as left border only (3px)
- Receipt-style action buttons at bottom
- Age indicator: amber at 8m, red at 15m

### 7. Fix Full Order in KDS Ticket
**File**: `src/components/kitchen/KitchenTicket.tsx`
- When `showFull` is true, fetch `table_order_lines` for the table and merge with `kitchen_orders`
- Show all 4 courses always, marking unfired ones as dimmed/pending
- Order: starter → mellemret → main → dessert

### 8. Translations
**File**: `src/contexts/LanguageContext.tsx`
- Keys for: `tablePlan.todaysPlan`, `tablePlan.history`, `tablePlan.closeAndSave`, `kitchen.wtf`, `kitchen.rejected`, `kitchen.ticketReturned`, `order.addNote`, `order.editQty`

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/kitchen/KitchenTicket.tsx` | Retro redesign, full-order merge, WTF button trigger |
| `src/components/kitchen/AngryChefOverlay.tsx` | **NEW** — 1s angry chef animation overlay |
| `src/components/kitchen/KitchenDisplay.tsx` | Fix counters, filter rejected tickets |
| `src/components/ordering/OrderCommandCenter.tsx` | Centralized hub, inline notes, qty edit, prefill fix, reject banner |
| `src/hooks/useTableOrders.tsx` | `rejectTicket` mutation |
| `src/pages/TablePlan.tsx` | Today/History split, Close & Save, WTF warnings |
| `src/components/tableplan/TableCard.tsx` | Warning triangle for rejected tickets |
| `src/contexts/LanguageContext.tsx` | New translations |
| DB migration | `status` column on `table_plans` |

