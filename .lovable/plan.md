

# Table Layout Corrections and Expansion

## Summary
Correct all table capacities to match the real restaurant, add a new top row (B8, B18, B28) plus a large round 8-top table, mark round tables visually, and update the row-first assignment logic.

---

## 1. Corrected Table Capacities

The user clarified that **all tables default to capacity 2**, except:
- **Column 1** (B1-B8, B35): capacity **4** each
- **B4, B14, B32**: capacity **6**, round tables
- **B8** (new): capacity **4** (follows column 1 rule)
- **New large round table (B34)**: capacity **8**, round

This means the following tables change from their current values:

| Table | Current Cap | Correct Cap |
|-------|------------|-------------|
| B3    | 6          | 4           |
| B4    | 4          | 6 (round)   |
| B13   | 6          | 2           |
| B14   | 2          | 6 (round)   |
| B23   | 6          | 2           |
| B32   | 6          | 6 (round, add shape only) |
| B35   | 4          | 4 (unchanged) |

---

## 2. New Row Added (Top of Restaurant)

A new row is added at the **top** (back of restaurant), becoming the new Row 1. All existing rows shift down by one. The grid expands from 8 to **9 rows**.

New Row 1 contents:
- **B8** -- col 1, capacity 4
- **B18** -- col 2, capacity 2
- **B28** -- col 3, capacity 2
- **B34** -- col 4 (above B31), capacity 8, round

---

## 3. Complete Layout (9 rows x 4 columns)

```text
Row 1:  B8(4)    B18(2)   B28(2)   B34(8,round)
Row 2:  B7(4)    B17(2)   B27(2)   --
Row 3:  B6(4)    B16(2)   B26(2)   B31(2)
Row 4:  B5(4)    B15(2)   B25(2)   --
Row 5:  B4(6,R)  B14(6,R) B32(6,R) --
Row 6:  B3(4)    B13(2)   B23(2)   --
Row 7:  B2(4)    B12(2)   B22(2)   B33(2)
Row 8:  B1(4)    B11(2)   B21(2)   --
Row 9:  B35(4)   B36(2)   B37(2)   --
```

(R = round table)

---

## 4. Round Table Visual Indicator

Add `shape?: 'round' | 'rect'` to the `TableDef` interface. Round tables (B4, B14, B32, B34) will render with fully rounded corners (`rounded-full` or `rounded-3xl`) instead of the standard `rounded-xl`, making them visually distinct on the floor plan.

---

## 5. Row-First Assignment Logic

The assignment algorithm is updated to:
1. Sort reservations largest-first (unchanged)
2. For each reservation, find fitting tables sorted by:
   - Smallest capacity that fits
   - Prefer rows that already have an occupied table (fill the row first)
   - Then prefer higher row numbers (bottom-to-top)
   - Deprioritize B37 last
3. This ensures if B35 is filled, B36 fills before jumping to B1's row.

---

## Technical Details

### Files Modified

- **`src/components/tableplan/TableCard.tsx`**:
  - Add `shape?: 'round' | 'rect'` to `TableDef` interface
  - Apply `rounded-3xl` styling when `shape === 'round'`

- **`src/components/tableplan/FloorPlan.tsx`**:
  - Replace entire `TABLE_LAYOUT` array with corrected 31-table layout (9 rows)
  - Update grid rendering from `length: 8` to `length: 9`
  - Update `assignTablesToReservations()` with row-first logic: prefer rows with existing occupants before starting new rows
  - Update total table count display

### Assignment Sort Key
```text
sort by:
  1. capacity ASC (smallest fit)
  2. row already has occupants? (yes first)
  3. row DESC (bottom-to-top)
  4. B37 last
```

