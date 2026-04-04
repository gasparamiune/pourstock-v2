

# Fix Order Persistence, Run Button Count, KDS Ready Section, and Seed Daily Menu

## Problems

1. **Mains/desserts deleted after running starters**: When running only starters, the `handleSubmit` clears submitted items from `selection` state correctly, but the issue is that items for other courses (mains, desserts) that haven't been run yet are lost when the user closes and re-opens the command center — because `selection` is local component state that resets on mount. The pending (not-yet-run) items are never saved to the database until they are "run."

2. **Run button shows total count instead of next-course count**: Line 406 uses `pendingCount` (sum of ALL pending items) instead of counting only items for `nextCourseToRun`.

3. **KDS needs a "Ready for Service" subsection**: Currently active and ready tickets are mixed in the same grid. Need a visual divider with ready tickets below.

4. **Need a sample daily menu** with professional dishes to test.

## Plan

### 1. Fix: Preserve unsubmitted courses when closing command center
**File**: `src/components/ordering/OrderCommandCenter.tsx`

The real fix: when running a course, save ALL pending lines to the table_order (as `table_order_lines`) but only create kitchen tickets for the course being run. Currently `submitOrder` in `useTableOrders.tsx` both inserts lines AND creates kitchen tickets for those lines. We need to split this:

- On first "Run" (e.g., starters): save ALL pending lines to `table_order_lines`, but only create kitchen tickets for starters
- On subsequent "Run" (e.g., mains): the lines are already saved, so just create kitchen tickets for that course

**Approach**: Modify `handleSubmit` in OrderCommandCenter to:
1. First call: save all `pendingLines` to DB via `addLines`, then fire kitchen tickets only for the current course via a new approach
2. Track which lines have been saved vs which are still local

Actually simpler: change the flow so that when the user adds items, they're immediately persisted as order lines (not just local state). Then "Run" only fires kitchen tickets. But this is a bigger refactor.

**Pragmatic fix**: On "Run Course X":
1. Call `submitOrder` with ALL remaining pending lines (this saves them to DB + creates kitchen tickets for each course)
2. But we only want kitchen tickets for the current course

Better approach — modify `submitOrder` in `useTableOrders.tsx` to accept a `fireCourses` parameter:
- Save all lines to `table_order_lines` 
- Only create kitchen tickets for courses in `fireCourses`

Then in OrderCommandCenter:
- "Run Starters": call `submitOrder({ orderId, lines: allPendingLines, fireCourses: ['starter'] })`
- This saves everything but only fires starters to kitchen
- Clear only starter items from selection
- Next time user opens, mains/desserts are already in DB as existing lines

### 2. Fix: Run button count
**File**: `src/components/ordering/OrderCommandCenter.tsx`

Change line 406 from `pendingCount` to a new computed value `nextCourseCount` that only counts items matching `nextCourseToRun`.

### 3. KDS Ready subsection
**File**: `src/components/kitchen/KitchenDisplay.tsx`

Split the grid into two sections:
- Active tickets (pending/in_progress) in the main grid
- A horizontal divider line with "Ready for Service" label
- Ready tickets in a second grid below, slightly muted styling

### 4. Seed daily menu
**Database migration**: Insert a sample daily menu for today's date with professional Danish-style dishes:
- Starter: e.g., "Røget laks med peberrodscreme"
- Mellemret: e.g., "Hummerbisque med kryddercroutoner"  
- Hovedret: e.g., "Oksemørbrad med trøffeljus og sæsonens grøntsager"
- Dessert: e.g., "Crème brûlée med vanilje fra Tahiti"

## Technical details

### `src/hooks/useTableOrders.tsx` — `submitOrder` mutation
Add optional `fireCourses?: CourseKey[]` parameter. When provided, only create kitchen tickets for those courses. Lines for all courses are still inserted into `table_order_lines`.

### `src/components/ordering/OrderCommandCenter.tsx`
- `handleSubmit`: pass `fireCourses: [nextCourseToRun]` along with ALL pending lines
- After submit, clear only the fired course items from selection (not all)
- Add `nextCourseCount`: `pendingLines.filter(l => l.course === nextCourseToRun).reduce((s,l) => s + l.quantity, 0)`
- Update button text to use `nextCourseCount`

### `src/components/kitchen/KitchenDisplay.tsx`
- Separate `activeOrders` and `readyOrders` into two grids
- Add a `<Separator />` + "Ready for Service" label between them
- Ready section uses slightly different styling (muted background)

### Database seed migration
- Insert into `daily_menus` for hotel using `DEFAULT_HOTEL_ID` pattern or a known hotel_id, with today's date

## Files modified
| File | Change |
|------|--------|
| `src/hooks/useTableOrders.tsx` | Add `fireCourses` param to `submitOrder` |
| `src/components/ordering/OrderCommandCenter.tsx` | Fix run logic + button count |
| `src/components/kitchen/KitchenDisplay.tsx` | Split active/ready into sections |
| `src/contexts/LanguageContext.tsx` | Add "Ready for Service" translations |
| DB migration | Seed sample daily menu |

