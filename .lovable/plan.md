

# Fix: Table Alignment, Course-by-Course Running, 4-Course Menu, KDS Styling, Menu Editor Layout

## Issues to fix

1. **Alsinger table 41 alignment**: A41 should align with B31's row. Both are at row 7 in the data, but B31 is at col 4 and appears only in rows 3 and 7 (B33/B31). The visual grid already places them at row 7 — verify if the issue is in the Alsinger-only view where the grid recalculates its own min/max rows, causing A41 to appear at the top instead of aligned. Fix: ensure Alsinger-only view uses the global row range or at least starts A41 at the correct position relative to B31.

2. **"Run Dish" sends ALL courses at once**: The `handleSubmit()` call on the main Run button submits all `pendingLines` regardless of course. Fix: filter to only submit items matching `nextCourseToRun`.

3. **Add "mellemret" (intermediate course)**: The system currently uses 3 courses (`starter | main | dessert`). Need to add `mellemret` as a 4th course between starter and main. This affects:
   - `CourseKey` type in OrderCommandCenter
   - `OrderLine.course` type in useTableOrders
   - `KitchenOrder.course` type in KitchenTicket
   - `COURSE_LABELS`, `COURSE_BORDER`, `COURSE_BG`, `COURSE_BADGE` maps
   - Daily menu data model (`DailyMenu` interface — add `mellemret` field)
   - DailyMenuEditor sections
   - Order flow course progression order: starter → mellemret → main → dessert
   - Database: `kitchen_orders.course` column may need updating, `daily_menus` table needs a `mellemret` jsonb column

4. **Kitchen ticket color coding too subtle**: Currently uses `border-l-4` only. Change to a full border (all sides) with thicker lines and more visible background tint.

5. **Menu Editor takes permanent space**: Currently a fixed right panel (380–440px). Change to a collapsible panel or sub-tab within the Kitchen page, so during service the KDS gets full width.

## Technical plan

### File: `src/hooks/useTableOrders.tsx`
- Update `OrderLine.course` type: `'starter' | 'mellemret' | 'main' | 'dessert'`

### File: `src/hooks/useDailyMenu.tsx`
- Add `mellemret: DailyMenuItem[]` to `DailyMenu` interface

### File: `src/components/ordering/OrderCommandCenter.tsx`
- Add `'mellemret'` to `CourseKey` type and `COURSE_LABELS`
- **Fix Run button**: Change `handleSubmit()` to `handleSubmit(pendingLines.filter(l => l.course === nextCourseToRun))` so it only runs the next course
- Add mellemret to course iteration arrays and merge logic
- Update `allMellemret` items from daily menu + catalog

### File: `src/components/kitchen/KitchenTicket.tsx`
- Add `mellemret` to color maps (use orange/amber)
- Change card styling from `border-l-4` to `border-2` (all sides) with stronger background tints:
  - Starter: green border all around, `bg-green-500/15`
  - Mellemret: amber/orange border, `bg-amber-500/15`
  - Main: red border, `bg-red-500/15`
  - Dessert: ice blue border, `bg-sky-300/15`

### File: `src/components/kitchen/DailyMenuEditor.tsx`
- Add "Mellemret" section between Forretter and Hovedretter
- Default 4 dishes per section (forret, mellemret, hovedret, dessert)

### File: `src/pages/Kitchen.tsx`
- Replace the permanent right panel with a toggle button/tab
- Add a "Menu Editor" tab alongside KDS and Waiter tabs, or a floating button that opens the editor as a slide-out panel
- When collapsed, the KDS/Waiter view gets full width

### File: `src/components/tableplan/assignmentAlgorithm.ts`
- Verify A41 row alignment. Currently A41 is row 7 = same as B31. If visual misalignment persists, it's in the FloorPlan grid rendering for Alsinger-only view. The `renderCompactGrid` recalculates `gridMinRow`/`gridMaxRow` per section, which is correct for compact mode. For Alsinger-only view in the section toggle, need to ensure the row offset accounts for empty rows at the top.

### Database migration
- Add `mellemret` jsonb column to `daily_menus` table (default `'[]'::jsonb`)
- Update `kitchen_orders.course` to accept `'mellemret'` value (if it's an enum or check constraint)

## Files modified/created
| File | Change |
|------|--------|
| `src/hooks/useTableOrders.tsx` | Add mellemret to CourseKey |
| `src/hooks/useDailyMenu.tsx` | Add mellemret to DailyMenu |
| `src/components/ordering/OrderCommandCenter.tsx` | Fix run-by-course, add mellemret |
| `src/components/kitchen/KitchenTicket.tsx` | Thicker color borders, add mellemret |
| `src/components/kitchen/DailyMenuEditor.tsx` | Add mellemret section |
| `src/pages/Kitchen.tsx` | Menu editor as toggle/tab instead of fixed panel |
| `src/components/tableplan/assignmentAlgorithm.ts` | Verify/fix A41 alignment |
| `src/contexts/LanguageContext.tsx` | Add mellemret translations |
| DB migration | Add mellemret column to daily_menus |

