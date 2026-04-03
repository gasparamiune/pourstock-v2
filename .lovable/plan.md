

# Alsinger Section — Corrected Table Alignment

## Correction from previous plan

Alsinger tables are physically to the right of Bellevue's column 3 (the B2x column), starting at the same row as B22, not at the top. The numbering goes **upward** (A41 at the bottom, A45 at the top of the section).

## Corrected grid mapping

Bellevue column 3 reference:
- Row 7: B22 → neighbor A41, A51, A61
- Row 6: B23 → neighbor A42, A52, A62
- Row 5: B32 → neighbor A43, A53, A63
- Row 4: B25 → neighbor A44, A54, A64
- Row 3: B26 → neighbor A45, A55, A65

```text
        Bellevue                          Alsinger
Col1  Col2  Col3  Col4       Col5  Col6  Col7
 B8   B18   B28   B34        —     —     —       Row 1
 B7   B17   B27              —     —     —       Row 2
 B6   B16   B26   B33       A45   A55   A65      Row 3
 B5   B15   B25             A44   A54   A64      Row 4
 B4   B14   B32             A43   A53   A63      Row 5
 B3   B13   B23             A42   A52   A62      Row 6
 B2   B12   B22   B31       A41   A51   A61      Row 7
 B1   B11   B21                                  Row 8
B35   B36   B37                                  Row 9
```

## Changes

### 1. Remove "Kør" button from TableCard
**File**: `src/components/tableplan/TableCard.tsx`
- Delete the course-advance button block; drag-to-fire and order center handle this now

### 2. Add Alsinger layout
**File**: `src/components/tableplan/assignmentAlgorithm.ts`
- Add `ALSINGER_LAYOUT: TableDef[]` with 15 tables at rows 3–7, cols 5–7
- Col 5 (A41–A45): capacity 2, rows 7→3
- Col 6 (A51–A55): capacity 2, rows 7→3
- Col 7 (A61–A65): capacity 4, rows 7→3
- Add overflow rule: Alsinger only used when Bellevue is full (B34 exempt)

### 3. View toggle in TablePlan page
**File**: `src/pages/TablePlan.tsx`
- State: `viewMode: 'bellevue' | 'alsinger' | 'full'`
- Toggle bar at top with three buttons
- Pass filtered table set to FloorPlan
- Full mode combines both layouts

### 4. Compact full-restaurant view
**File**: `src/components/tableplan/FloorPlan.tsx`
- `compact` prop: square table cards showing only table number, colored by status
- Full view: Bellevue grid (cols 1–4) on left, Alsinger grid (cols 5–7) on right with a visual divider
- Click only opens OrderCommandCenter

### 5. Compact TableCard variant
**File**: `src/components/tableplan/TableCard.tsx`
- `compact` prop: small square, table number only, status color, click to open orders

## Files modified
- `src/components/tableplan/TableCard.tsx` — remove Kør, add compact
- `src/components/tableplan/assignmentAlgorithm.ts` — add Alsinger layout + overflow
- `src/components/tableplan/FloorPlan.tsx` — compact mode, section support
- `src/pages/TablePlan.tsx` — view toggle

