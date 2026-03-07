

## Clarification & Corrected Plan

You're absolutely right — tables merge **horizontally** (same row, adjacent columns like B7 + B17 + B27). My wording was wrong. For 18+ guests, the system splits into N groups (ceil(guests/8)), each group merges tables horizontally within one row, and the groups are placed on **adjacent rows** so they sit near each other.

## Plan: 8 Table Plan Improvements

### 1. Large parties 18+ (recursive N-way split)
Generalize splitting to N groups where N = ceil(guestCount / 8). Each group merges tables horizontally in one row. Groups placed on adjacent rows with overlapping columns.

**Files:** `FloorPlan.tsx`, `TablePlan.tsx`

### 2. Auto-unmerge on reservation removal
Dissolve merge groups back to individual tables when their reservation is deleted.

**Files:** `TablePlan.tsx`

### 3. "Vinmenu" quick note button
Add wine glass toggle to QuickNoteButtons. Display wine icon on TableCard.

**Files:** `QuickNoteButtons.tsx`, `TableCard.tsx`, `AddReservationDialog.tsx`, `ReservationDetailDialog.tsx`

### 4. Remove ⚠️ from allergy notes
Change `⚠️ Allergi:` to `Allergi:` since the red badge already signals it.

**Files:** `QuickNoteButtons.tsx`

### 5. Remove 🇩🇰 from flag note
Change `🇩🇰 Flag på bord` to `Flag på bord`.

**Files:** `QuickNoteButtons.tsx`

### 6. Shine animation on new reservation
3-second circular glow on table border when reservation is added. Track via transient `justAdded` set.

**Files:** `TableCard.tsx`, `FloorPlan.tsx`, `TablePlan.tsx`, `src/index.css`

### 7. Undo/Redo buttons
History stack recording each assignment change. Undo2/Redo2 icons at top of page.

**Files:** `TablePlan.tsx`

### 8. Course timing alert border
Pulsing red ring when elapsed time exceeds course threshold (Forret 15m, Mellemret 10m, Hovedret 25m, Dessert 15m).

**Files:** `TableCard.tsx`

