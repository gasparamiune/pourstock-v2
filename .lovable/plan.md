

# Consolidated Plan: Reception Overhaul + Sidebar Cleanup + Housekeeping Notes + Table Plan Print & Course Tracking

---

## 1. Sidebar Cleanup

**`src/components/layout/AppShell.tsx`**: Remove static "Reception" and "Housekeeping" entries from `navItems`. Users navigate via the department dropdown only. Restaurant sub-pages remain in the sidebar.

---

## 2. Reception: Professional Floor-Tabbed Grid

Replace the current card-based RoomBoard with a professional, data-dense table layout.

### Layout
- **Floor tabs** (Floor 1 / Floor 2 / Floor 3) as prominent buttons at top
- Each floor shows rooms in a **table/grid** with columns: Room Number, Type + Capacity, Status (color dot + label), Guest Name, Check-in/out dates, Notes (inline editable popover), Action button
- Left border color indicates status (green=available, blue=occupied, amber=checkout, red=maintenance, purple=reserved)
- Rooms show as **clean/available by default**

### Files
- **Rewrite** `src/components/reception/RoomBoard.tsx` — floor-tabbed table layout
- **Replace** `src/components/reception/RoomCard.tsx` — becomes inline row component
- **Minor update** `src/pages/Reception.tsx` — adjust imports
- **Update** `src/hooks/useReception.tsx` — add `updateRoomNotes` convenience mutation

---

## 3. Housekeeping: Manager Notes

- **Update** `src/components/housekeeping/HKRoomCard.tsx` — show `notes` field; HK managers get an edit button (popover)
- **Update** `src/hooks/useHousekeeping.tsx` — add `updateTaskNotes` mutation
- **Update** `src/components/housekeeping/HKStatusBoard.tsx` — pass `isManager` prop

---

## 4. Table Plan: Prettier Print Layout

Rewrite `handlePrint` in `src/pages/TablePlan.tsx` (lines 556-636).

### New print design
- **White background** to save ink — no colored fills
- **Round tables** rendered with `border-radius: 50%` in a flexbox cell
- **Larger table numbers** (18px bold) and guest text (13px)
- **Colored left borders** (4px) matching reservation type colors (sky/amber/emerald/violet/slate/rose) — minimal ink, maximum clarity
- BUFF tables get a dashed left border
- Notes shown in red text with ⚠ prefix
- Coffee/tea indicators preserved
- Layout mirrors the 9×4 digital grid using an HTML table
- Title: "Bordplan — [date]" with reservation count subtitle
- `@media print` optimized margins

---

## 5. Table Plan: Course Tracking System

Add per-table course progression tracking after "Arrived" is pressed.

### Data model change
Extend the `Reservation` interface in `TableCard.tsx` with optional timestamp fields:
```text
starterServedAt?: string;    // Kør forret
interServedAt?: string;      // Kør mellemret (only for 4-ret)
mainServedAt?: string;       // Kør hovedret
dessertServedAt?: string;    // Kør dessert
```

### Course progression logic
After "Arrived": show "Kør forret" button.
After forret served: 
- If 4-ret → show "Kør mellemret"
- Otherwise → show "Kør hovedret"
After mellemret (4-ret only) → show "Kør hovedret"
After hovedret → show "Kør dessert"
After dessert → show elapsed time only (service complete)

### UI in `TableCard.tsx`
- Replace current arrived section (lines 228-243) with course progression buttons
- Each button records timestamp + shows elapsed since last course
- Buttons styled with the table's reservation color
- Compact layout: current course button + elapsed timer on same line

### Course tracking helper in `TablePlan.tsx`
- New `onAdvanceCourse(tableId)` callback that sets the next timestamp
- Passed down through `FloorPlan` to `TableCard`

### Files
- **Update** `src/components/tableplan/TableCard.tsx` — add course fields to Reservation type, render course buttons
- **Update** `src/components/tableplan/FloorPlan.tsx` — pass `onAdvanceCourse` prop
- **Update** `src/pages/TablePlan.tsx` — implement `onAdvanceCourse` callback, update print handler

---

## 6. Translations

Add new EN/DA keys to `src/contexts/LanguageContext.tsx`:
- Floor tabs: `reception.floor1/2/3`
- Room types: `reception.roomType.single/double/twin/suite/family`
- Notes: `reception.addNote`, `reception.notes`
- Course tracking: `tablePlan.starter`, `tablePlan.intermediate`, `tablePlan.main`, `tablePlan.dessert`, `tablePlan.serviceComplete`
- HK notes: `housekeeping.managerNote`, `housekeeping.addNote`

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/components/layout/AppShell.tsx` — remove dept nav items |
| Rewrite | `src/components/reception/RoomBoard.tsx` — floor-tabbed table grid |
| Rewrite | `src/components/reception/RoomCard.tsx` — row component |
| Modify | `src/pages/Reception.tsx` — adjust for new board |
| Modify | `src/hooks/useReception.tsx` — add updateRoomNotes |
| Modify | `src/components/housekeeping/HKRoomCard.tsx` — notes display/edit |
| Modify | `src/components/housekeeping/HKStatusBoard.tsx` — pass isManager |
| Modify | `src/hooks/useHousekeeping.tsx` — add updateTaskNotes |
| Modify | `src/components/tableplan/TableCard.tsx` — course fields + buttons |
| Modify | `src/components/tableplan/FloorPlan.tsx` — pass onAdvanceCourse |
| Modify | `src/pages/TablePlan.tsx` — print redesign + course callback |
| Modify | `src/contexts/LanguageContext.tsx` — new translation keys |

No database migrations needed.

