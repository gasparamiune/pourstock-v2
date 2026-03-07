

# Plan: Icon Bar Polish + Algorithm Changes (Batched)

## Summary of all queued changes

### 1. Icon Bar UI tweaks (`TableCard.tsx`)
- Keep the 🍪 cookie on Coffee+Sødt even when inactive (always show it, just dimmed)
- Center icons: add `justify-center` to the icon bar flex container
- Make icons 50% bigger: change from `h-3 w-3` to `h-[18px] w-[18px]`, and cookie text from `text-[9px]` to `text-[13px]`

### 2. Table 37 rule change (`assignmentAlgorithm.ts`)
- B37 is ONLY used when every other table (excluding B34) is occupied
- Replace the current two-phase logic (lines 152-159) with a simple check: if any non-B34, non-B37 table is still free, score = -Infinity for B37
- Remove B37 from FILL_ORDER's mid-position; move it after B34 (absolute end)
- Remove the `postProcessB37` migration logic entirely — no longer needed since B37 only fills when everything else is taken

### 3. Luxus-table preference for 4-ret (`assignmentAlgorithm.ts`)
- Define `LUXUS_TABLES = new Set(['B35', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'])` (the window/col-1 tables)
- Strengthen the existing window protection (lines 165-169):
  - 4-ret on a luxus table: large bonus (+80 instead of +30)
  - 3-ret on a luxus table when 4-ret reservations remain unassigned: stronger penalty (-80 instead of -30)
  - Other types on luxus table when 4-ret remain: moderate penalty (-40)
- This is a soft rule — capacity still wins because capacity mismatch returns -Infinity

### Files changed
| File | Changes |
|------|---------|
| `src/components/tableplan/TableCard.tsx` | Icon sizing, centering, persistent cookie |
| `src/components/tableplan/assignmentAlgorithm.ts` | B37 last-resort only, luxus-table 4-ret preference, remove postProcessB37 |

