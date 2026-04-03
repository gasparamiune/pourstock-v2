# Plan: Revolutionary Restaurant Ordering UI Redesign

## Context
The ordering system (`OrderSheet` + `MenuSelector`) is functional but cramped and ugly — a narrow side drawer with a flat +/- button list that fails to convey the quality of a premium restaurant. The flow is working (daily menu → order → kitchen). This plan redesigns the waiter-facing ordering experience from scratch, polishes the daily menu editor, and upgrades the KDS (kitchen display) visuals. No schema changes, no hook changes — pure UI transformation.

---

## Phase 1: New Ordering Command Center (Core Redesign)

### New files to create

#### `src/components/ordering/OrderCommandCenter.tsx`
Full-screen overlay that replaces `OrderSheet`. Uses `fixed inset-0 z-50` with a CSS fade-scale entrance animation. Split layout:
- **Left 55%**: `VisualMenuBoard` (menu items grid)
- **Right 45%**: `OrderTicketPanel` (live order chit)
- **Header**: Table label, guest count, item count badge, mode switcher (Order | Bill & Pay), back button
- **When "Bill & Pay"**: hide split, show `BillViewWithPay` full-width

Copy verbatim from `OrderSheet.tsx:24–125`:
- All hook calls (`useDailyMenu`, `useTableOrders`, `useTableOrderMutations`, `useMenuItems`)
- `stockMap` construction (lines 31–36)
- `permanentStarters/Mains/Desserts` conversion (lines 39–74)
- `mergeItems` + `allStarters/allMains/allDesserts` (lines 81–88)
- `BillViewWithPay` inner component (lines 218–230)
- `handleSubmit` logic (lines 104–125) — same mutations, same toast

**Props:** identical to `OrderSheet` (`open`, `onOpenChange`, `tableId`, `tableLabel`)

---

#### `src/components/ordering/MenuItemCard.tsx`
Visual card replacing the flat `MenuItem` in `MenuSelector`. Each card is tappable to add:

```
div.glass-card.relative.rounded-2xl.p-4.cursor-pointer
  [top-right] quantity badge: absolute -top-2 -right-2, amber circle, tap = onRemove
  [bottom-right] note icon: MessageSquare 20px, tap = onRequestNote  
  span.font-semibold.text-base — item name
  span.text-xs.text-muted-foreground.line-clamp-2 — description
  div.flex.gap-2.mt-2 — price (amber bold) + stock dot + count
  div.flex.flex-wrap.gap-1.mt-1 — allergen pills (text-xs badge outline)
```

**Stock dot color:** `> 5` → green-500, `2-5` → amber-500, `1` → orange-500, `0` → red-500 (card opacity-50, pointer-events-none)

**Selection state via `cn()`:**
- Unselected: `border border-white/5 bg-card/60`
- Selected: `border border-primary/60 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]`

**Props:** `item`, `course`, `quantity`, `available`, `note?`, `onAdd`, `onRemove`, `onRequestNote`

**Reuse `SelectionMap` type** from `MenuSelector.tsx:80`

---

#### `src/components/ordering/VisualMenuBoard.tsx`
Course-tabbed grid of `MenuItemCard`. 

```
div.flex.flex-col.h-full
  [sticky top] Course pill tabs: Starter (N) | Main (N) | Dessert (N)
    amber pill when active, counts from selection
  ScrollArea.flex-1
    div.grid.grid-cols-2.gap-3.p-4
      MenuItemCard × N
```

**Props:** `starters`, `mains`, `desserts`, `stockMap`, `selection: SelectionMap`, `onAdd`, `onRemove`, `onRequestNote`

Tab item counts = number of distinct selected items per course (not total qty).

---

#### `src/components/ordering/OrderTicketPanel.tsx`
Styled like a restaurant chit — monospace aesthetic, live total.

```
div.flex.flex-col.h-full.bg-card/30.border-l.border-border/40
  Ticket header (px-5 pt-5 pb-3, dashed border-b):
    font-mono text-xs text-muted-foreground: "ORDER TICKET"
    font-bold text-xl: tableLabel
    text-xs text-muted-foreground: today's date
  ScrollArea.flex-1.px-5:
    Per course group: "── STARTERS ──" label (font-mono uppercase tracking-widest)
    Line item (flex justify-between py-2 dashed border-b):
      Left: "2× Salmon Tartar" (font-mono text-sm)
             note below in muted text-xs
      Right: "DKK 185" + × button (opacity-40 hover:opacity-100)
    Empty state: centered receipt icon + "No items yet"
  Footer (px-5 pb-5 pt-3, border-t):
    "TOTAL  DKK 0" (font-mono font-bold)
    Button.w-full.h-12 "Send to Kitchen (N items)"
```

Use `font-mono` for numbers/totals, `DM Sans` (already loaded) for labels.

**Props:** `tableLabel`, `lines`, `selection`, `onRemoveLine`, `onSubmit`, `submitting`

---

#### `src/components/ordering/NoteDialog.tsx`
Small Dialog (shadcn, `max-w-xs`) for per-item notes. Triggered from card's note icon.

**Props:** `itemId: string | null`, `itemName: string`, `initialNote: string`, `onSave(itemId, note)`, `onClose()`

---

### Modify existing files

#### `src/pages/TablePlan.tsx`
**One line change** — swap the component:
```tsx
// BEFORE
<OrderSheet open={!!orderSheetTable} onOpenChange={...} tableId={...} tableLabel={...} />
// AFTER
<OrderCommandCenter open={!!orderSheetTable} onOpenChange={...} tableId={...} tableLabel={...} />
```
Update import. `OrderSheet.tsx` stays untouched (not deleted — it contains `BillViewWithPay` which is re-used).

---

### CSS additions in `src/index.css`

```css
@keyframes commandCenterIn {
  from { opacity: 0; transform: scale(0.97) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.command-center-enter {
  animation: commandCenterIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes cardPop {
  0%  { transform: scale(1); }
  40% { transform: scale(0.93); }
  100%{ transform: scale(1); }
}
.card-pop { animation: cardPop 0.18s ease-out; }

@keyframes badgePop {
  0%  { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100%{ transform: scale(1); }
}
.badge-pop { animation: badgePop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
```

Apply `badge-pop` via `useEffect` in `MenuItemCard` when `quantity` transitions `0 → 1`.
Apply `card-pop` on the card container at same transition.
Apply `command-center-enter` to the root overlay div when `open` becomes true.

---

## Phase 2: KDS Visual Upgrade

### Modify `src/components/kitchen/OrderCard.tsx`

**Item-level checkboxes:** Add `const [checked, setChecked] = useState<Set<number>>(new Set())`. Each `<li>` in items list gets a `Checkbox` (shadcn) at left. Checked items render with `line-through text-muted-foreground`. Local UI only — no DB writes.

**Age progress bar:** Replace `<span>{age}</span>` with:
- A `Progress` (shadcn) bar + age text
- Thresholds (minutes): `starter=15, main=25, dessert=15`
- `percent = Math.min(100, (ageMinutes / threshold) * 100)`
- Bar fill color: `< 50%` → green-500, `< 80%` → amber-500, `≥ 80%` → red-500
- Apply via `style={{ '--progress-color': color }}` or conditional classes on a custom Progress wrapper

**Course header colors** (already good in `COURSE_COLOR`) — increase opacity slightly for dark BG: `bg-blue-500/20`, `bg-primary/20`, `bg-pink-500/20`

---

### Modify `src/components/kitchen/KitchenDisplay.tsx`

**New-order pulse detection:**
```tsx
const prevIdsRef = useRef<Set<string>>(new Set());
const [newIds, setNewIds] = useState<Set<string>>(new Set());

useEffect(() => {
  const currentIds = new Set(allOrders.map(o => o.id));
  const arrived = [...currentIds].filter(id => !prevIdsRef.current.has(id));
  if (arrived.length > 0) {
    setNewIds(new Set(arrived));
    setTimeout(() => setNewIds(new Set()), 4000);
  }
  prevIdsRef.current = currentIds;
}, [allOrders]);
```

Pass `isNew={newIds.has(order.id)}` to `OrderCard`. In `OrderCard`, apply `pulse-glow` class (already in `index.css`) when `isNew` is true.

---

## Phase 3: DailyMenuEditor Polish

### Modify `src/components/kitchen/DailyMenuEditor.tsx`

**Remove hardcoded 3-item limit** (lines 402–404):
```tsx
// Change all three:
max={3}  →  max={10}
```

**Preview mode toggle:**
- Add `const [previewMode, setPreviewMode] = useState(false)` 
- Add "Preview" button in the header toolbar (next to Save/Publish), toggles `previewMode`
- When `previewMode === true`: render `VisualMenuBoard` in read-only mode using the editor's current `starters/mains/desserts` state; pass no-op `onAdd/onRemove`, `pointer-events-none` wrapper, `opacity-50` on add buttons
- When `previewMode === false`: render normal course editors

**Published banner enhancement** — change from:
```tsx
bg-green-500/10 border-green-500/20
```
to:
```tsx
bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-500
```
Add the existing `pulse-glow` class to the status dot/icon.

---

## Implementation Order

1. CSS keyframes in `src/index.css` (2 min)
2. `MenuItemCard.tsx` — build + test in isolation (30 min)
3. `OrderTicketPanel.tsx` — static, then wire up (20 min)
4. `VisualMenuBoard.tsx` — assemble grid + tabs (15 min)
5. `NoteDialog.tsx` — small Dialog (10 min)
6. `OrderCommandCenter.tsx` — assemble full overlay, copy hook logic from `OrderSheet.tsx:24–125` (30 min)
7. `TablePlan.tsx` — one-line swap (2 min)
8. `OrderCard.tsx` — add checkboxes + progress bar (20 min)
9. `KitchenDisplay.tsx` — new-order pulse detection (15 min)
10. `DailyMenuEditor.tsx` — `max={3}→10`, preview toggle, banner (15 min)

---

## What to Preserve (do NOT touch)

| File | Reason |
|------|--------|
| `PaymentSheet.tsx` | Rendered untouched inside `BillViewWithPay` |
| `BillView.tsx` | Rendered untouched |
| `SplitBillDialog.tsx` | Lives inside PaymentSheet |
| `useTableOrders.tsx` | All mutations unchanged |
| `useDailyMenu.tsx` | Unchanged |
| `useMenuItems.tsx` | Unchanged |
| `OrderSheet.tsx` | Keep file — `BillViewWithPay` inner component re-used; just no longer the primary entry |
| `TableCard.tsx` | Unchanged — still calls `setOrderSheetTable` |
| `src/integrations/supabase/client.ts` | Never touch (auto-generated) |
| `src/integrations/supabase/types.ts` | Never touch (auto-generated) |

---

## Verification

1. **Dev server:** `npm run dev` — ensure no TypeScript errors
2. **Ordering flow:** Open table plan → click "Take Order" → command center slides in → add items → items appear in ticket panel → "Send to Kitchen" → order appears in KDS
3. **Bill & Pay:** Switch to "Bill & Pay" mode in command center → BillView renders → Pay button opens PaymentSheet
4. **Notes:** Tap note icon on menu item card → NoteDialog opens → save → note appears in ticket panel
5. **Sold out:** Verify sold-out items are visually disabled and cannot be added
6. **KDS:** Submit order → pending card appears in kitchen with pulse glow → check item checkboxes locally → advance status → progress bar fills
7. **Daily menu:** Kitchen page → increase items beyond 3 per course → verify max is now 10 → toggle Preview → see VisualMenuBoard read-only
8. **Regression:** Ensure no console errors; run `npm run build` to confirm no type errors
