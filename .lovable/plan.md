

# Table Plan: Comprehensive Improvements (Updated)

This plan implements all 7 areas from the approved plan, with two user-requested adjustments:
1. **Keep the pulse animation on notes** (do NOT remove `animate-pulse`)
2. **BUFF tables use 3-ret cutlery** for preparation counts, with their own distinct color

---

## 1. Fix: Dragging reservation into merged table

Update `onMoveReservation` in `TablePlan.tsx` to check if the source or target table belongs to a merge group. Currently it only updates the `singles` map, making reservations disappear when dropped onto merged tables.

**Changes**: `src/pages/TablePlan.tsx` -- rewrite `onMoveReservation` to inspect both `singles` and `merges` for source/target, updating the correct structure.

---

## 2. Support merging 3 and 4 tables

When clicking "+" between two tables where one is already merged, extend that merge group instead of creating a new 2-table merge.

**Changes**:
- `src/pages/TablePlan.tsx`: Add `onExtendMerge` logic -- when merging and one table is already in a merge group, append the other table to it
- `src/components/tableplan/FloorPlan.tsx`: Update merge button rendering to show "+" between a merge group's edge and an adjacent unmerged table, passing the correct IDs
- `findMergeGroup` in `FloorPlan.tsx`: Add 4-table combos for auto-assignment

---

## 3. Improve PDF extraction (OCR notes accuracy + Kaffe/Te)

Update `supabase/functions/parse-table-plan/index.ts`:
- Refine the system prompt to explicitly instruct: "Each note/comment belongs to the reservation on the same line or row. Associate notes with the correct room number."
- Add instruction to extract "Kaffe/te + sodt" entries after the restaurant section, adding them as notes or a `coffeeTeaSweet: boolean` field
- Add `coffeeTeaSweet` to the function schema

**Changes**:
- `supabase/functions/parse-table-plan/index.ts`: Updated prompt + schema
- `src/components/tableplan/TableCard.tsx`: Add optional `coffeeTeaSweet` field to `Reservation` type
- `src/components/tableplan/PreparationSummary.tsx`: Show coffee/tea cup count

---

## 4. BUFF table concept

When clicking a free table, add a "Mark as BUFF" button alongside the regular reservation form.

**Changes**:
- `src/components/tableplan/cutleryUtils.ts`: Add `'buff'` to `ReservationType` union with a distinct **rose/pink** color (dashed border style). For cutlery calculation, `getCutleryForType('buff')` returns the same values as `'3-ret'` (2 forks, 1 steak knife, 1 butter knife, 1 spoon).
- `src/components/tableplan/AddReservationDialog.tsx`: Add a "Mark as BUFF" button that creates a reservation with `reservationType: 'buff'`, `guestName: 'BUFF'`, and `guestCount` set to the table's capacity. Receive `tableCapacity` as a new prop.
- `src/components/tableplan/TableCard.tsx`: Render BUFF tables with a dashed border style
- `src/components/tableplan/FloorPlan.tsx`: Add BUFF to legend
- `src/pages/TablePlan.tsx`: Pass table capacity to AddReservationDialog
- `src/components/tableplan/ReservationDetailDialog.tsx`: Add `'buff'` option to the type selector

---

## 5. Tablet service mode: Arrived, Timer, Clear

Add real-time service tracking to each table.

**Changes to `Reservation` type** (`TableCard.tsx`):
- Add `arrivedAt?: string` and `clearedAt?: string` optional fields

**Changes to `TableCard.tsx`**:
- When occupied and `arrivedAt` not set: show a small "Arrived" checkmark button
- When `arrivedAt` is set: show a live timer (e.g., "0:42") counting up from arrival, updated every minute
- When arrived: show a "Clear" button to remove the reservation
- Increase touch target sizes for tablet use

**Changes to `FloorPlan.tsx`**:
- Add a "Clear All" button in the header (with confirmation dialog)

**Changes to `TablePlan.tsx`**:
- Add `onMarkArrived(tableId)` and `onClearTable(tableId)` callbacks
- Add `onClearAll()` callback

---

## 6. Notes styling (KEEP animation)

In `TableCard.tsx`:
- Change notes text from `text-[10px]` to `text-xs` (12px) for readability
- Increase padding slightly
- Allow 3 lines instead of 2 (`line-clamp-3`)
- **Keep `animate-pulse`** as requested

---

## 7. Auto-save and saved table plans list

### Database migration
Create a `table_plans` table:
- `id`: uuid primary key
- `created_by`: uuid (references auth user, nullable for now)
- `plan_date`: date
- `name`: text (auto-generated, e.g., "28 Feb 2026 - Aften")
- `assignments_json`: jsonb (serialized singles + merges)
- `created_at`: timestamptz (default now)
- `updated_at`: timestamptz (default now)

RLS policies: All authenticated users can read. All authenticated can insert/update their own. Admins can delete.

### Auto-save logic (`TablePlan.tsx`)
- After any change, debounce 2 seconds then upsert to database keyed on `plan_date`
- Show "Saving..." / "Saved" indicator in header
- Serialize `Map` to plain object for JSON storage

### Saved plans list
- Show a "Saved Plans" section above the PDF uploader with recent plans sorted by date
- Click to load a saved plan
- Delete old plans option

### Settings toggle (`Settings.tsx`)
- Add a "Table Plan" settings section with auto-save toggle
- Store preference in localStorage (`pourstock-autosave-tableplan`, default: enabled)

---

## Translation keys

Add to both EN and DA in `LanguageContext.tsx`:
- BUFF-related: `tablePlan.markAsBuff`, `tablePlan.buff`
- Service mode: `tablePlan.arrived`, `tablePlan.clearTable`, `tablePlan.clearAll`, `tablePlan.clearAllConfirm`, `tablePlan.timer`
- Persistence: `tablePlan.saving`, `tablePlan.saved`, `tablePlan.savedPlans`, `tablePlan.loadPlan`, `tablePlan.deletePlan`
- Settings: `settings.tablePlan`, `settings.autoSave`, `settings.autoSaveDesc`
- Coffee/tea: `prep.coffeeTea`

---

## Files summary

| File | Action |
|------|--------|
| `src/pages/TablePlan.tsx` | Fix drag-to-merged, extend merge, arrived/clear/clearAll, auto-save, load saved plans |
| `src/components/tableplan/FloorPlan.tsx` | Extended merge buttons (3-4 tables), clear all button, BUFF in legend, 4-table auto-merge |
| `src/components/tableplan/TableCard.tsx` | Arrived button, timer, clear button, BUFF dashed style, notes text-xs + line-clamp-3 (keep pulse), coffeeTeaSweet field |
| `src/components/tableplan/AddReservationDialog.tsx` | BUFF button, receive tableCapacity prop |
| `src/components/tableplan/ReservationDetailDialog.tsx` | BUFF option in type selector |
| `src/components/tableplan/PreparationSummary.tsx` | Coffee/tea count row |
| `src/components/tableplan/cutleryUtils.ts` | Add 'buff' type (3-ret cutlery, rose color) |
| `supabase/functions/parse-table-plan/index.ts` | Improved prompt for notes accuracy + kaffe/te extraction |
| `src/contexts/LanguageContext.tsx` | New translation keys (EN + DA) |
| `src/pages/Settings.tsx` | New "Table Plan" section with auto-save toggle |
| **New migration** | Create `table_plans` table with RLS |

