
# Table Merging, B34 Isolation, and "B" Prefix Removal

This plan combines the previously approved but unimplemented changes (B34 isolation, remove "B" prefix) with the new table merging feature.

## What Changes

### 1. Remove "B" prefix from table numbers
Table badges will show "35", "36", "1" instead of "B35", "B36", "B1". Internal IDs stay unchanged.

### 2. Isolate B34 from clustering
- B34 is only assigned to parties of 7 or 8 guests
- When B34 is assigned, its row is excluded from the distance calculation so it doesn't pull the cluster to the back

### 3. Table merging for large parties
When no single table fits a party, the algorithm will merge adjacent tables in the same row (horizontal neighbors only). For example, tables 1 (4p) + 11 (2p) + 21 (2p) in row 8 can merge into an 8-person setup.

**How it works:**
- After trying single tables, the algorithm looks for groups of 2-3 consecutive tables in the same row whose combined capacity fits
- Merged tables render as a single wide card spanning multiple grid columns, showing combined table numbers (e.g., "1+11+21")
- A colored connector bar visually links the merged tables
- Merged groups are preferred near the bottom (same clustering logic)

**Merging rules:**
- Only same-row, adjacent columns (left-right neighbors)
- Groups of 2 or 3 tables (not more)
- Smallest combined capacity that fits the party
- Round tables (B4, B14, B32, B34) cannot be merged

## Technical Details

### File: `src/components/tableplan/FloorPlan.tsx`

**Assignment logic updates:**
```
For each reservation (largest first):
  1. Try single table (existing logic, with B34 restriction)
  2. If no single table fits, find mergeable groups:
     - For each row, find consecutive available non-round tables
     - Try pairs and triples of adjacent columns
     - Pick the group with smallest combined capacity that fits
     - Prefer bottom rows (same clustering/distance logic)
  3. Mark all tables in the group as used
  4. Store the merge info in a new Map<string, MergeGroup>
```

**New type:**
```typescript
interface MergeGroup {
  tables: TableDef[];        // The merged tables
  combinedCapacity: number;
  reservation: Reservation;
  startCol: number;          // Leftmost column
  colSpan: number;           // Number of columns spanned
}
```

**Return value changes:**
The function will return both single assignments and merge groups so the grid renderer knows which cells to span and which to skip.

**Grid rendering updates:**
- When rendering, check if a cell is part of a merge group
- The first cell of a merged group renders a wide TableCard spanning multiple columns using CSS `grid-column: span N`
- Subsequent cells in the group are skipped (not rendered)
- The merged TableCard shows combined table numbers: "1+11+21"

### File: `src/components/tableplan/TableCard.tsx`

- Display `table.id.replace('B', '')` instead of `table.id` in the badge
- Add optional `mergedIds` prop: when present, show all table numbers joined with "+" (e.g., "1+11+21")
- Add optional `colSpan` prop to control grid spanning via inline style
- Merged cards use rectangular shape regardless of individual table shapes

### Files Modified
- `src/components/tableplan/FloorPlan.tsx` -- merging logic, B34 isolation, grid rendering
- `src/components/tableplan/TableCard.tsx` -- "B" removal, merged display support
