

# Housekeeping UI Overhaul Plan

## Summary of All Collected Feedback

1. Overview widgets must be interactive — navigate to relevant tab on click
2. Staff activity in overview: show room/task list per employee with check/cross completion icons
3. "Maintenance blocked" → "Out of Order"
4. Remove VIP concept entirely — no VIP priority, badges, or sorting anywhere
5. Status Board + Overview = primary manager tools with live timers and clearer status labels
6. Dangerous/critical actions restricted to manager role only
7. Proper filtering, default sort order, priorities
8. "Regenerate Mock Data" button for testing
9. Status Board grid: more interactive — inline actions, fewer clicks
10. My Tasks = employee's main shift view with ALL needed info; manager-configurable visibility of other employees' tasks
11. Move Assign tab next to Overview and Status Board (reorder tabs)
12. Audit all HK permissions — correct role splits across all tabs/actions
13. Assign tab: more interactive and visual
14. Status Board inspect action → open same full inspection dialog as Inspect tab
15. Inspection notes from manager visible and prioritized on Status Board cards; after inspection, cards re-open showing notes

---

## Changes by File

### 1. `mockData.ts`
- Remove all `priority: 'vip'` — replace with `'urgent'` or `'normal'`
- Remove VIP-related notes text
- Add `regenerateMockData()` function: randomizes 18-25 tasks across rooms, weighted statuses (40% dirty, 25% in_progress, 5% paused, 20% clean, 10% inspected), random staff assignments (60%), random `started_at` timestamps for active tasks, random priorities. Calls `notifyMockListeners()` after.
- Export `regenerateMockData`

### 2. `Housekeeping.tsx` (page)
- **Reorder tabs**: Overview → Status Board → Assign → My Tasks → Inspect → Reports → Settings
- Move Assign tab to appear right after Status Board (supervisor-only)
- Pass `onNavigateTab` callback to `HKOverview` so clicking widgets switches tab
- Pass `onNavigateTab` to `HKStatusBoard` for inspect action wiring

### 3. `HKOverview.tsx`
- **Interactive stat cards**: Accept `onClick` prop. Each card navigates:
  - Unassigned → Assign tab
  - Inspect Queue → Inspect tab
  - Out of Order → Status Board (filtered to maintenance)
  - Staff Active → Status Board
  - Arrivals/Departures/Stayovers → Status Board
- **Rename**: "Maintenance Blocked" → "Out of Order" (label + alert strip)
- **Remove**: All VIP references from urgentCount filter and alert
- **Staff activity redesign**: Under each staff member, show collapsible list of assigned rooms with:
  - Room number + task type
  - Green check if clean/inspected, red cross if dirty/paused, clock spinner if in_progress
  - Live elapsed timer (MM:SS) for in_progress tasks
- **Regenerate Mock Data** button (visible when `USE_HK_MOCK` is true), top-right

### 4. `HKStatusBoard.tsx`
- **Remove VIP** from priority filter dropdown and all VIP badge rendering
- **Default sort**: Priority (urgent first) → Status (dirty → in_progress → paused → clean → inspected) → Floor → Room number
- **Clearer status labels**: Map to "To be cleaned", "Cleaning...", "Ready for inspection", "Inspected & Ready"
- **Live elapsed timer** on in_progress cards (both grid and table views)
- **More interactive grid cards**: Show inline action buttons directly on hover/touch without needing to open detail sheet — Start Cleaning, Mark Clean, Inspect (one-tap actions)
- **Inspect action on grid**: When pressing "Inspect" on a `clean` room card, open a **Dialog** (not the detail sheet) containing the same full inspection form as `HKInspectionQueue` (defects, notes, pass/fail/reopen). Extract inspection form into a shared `HKInspectionForm` component used by both `HKInspectionQueue` and `HKStatusBoard`.
- **Manager-only actions**: Progress buttons and Generate Tasks restricted to `isSupervisor`. Non-supervisors see read-only grid.
- **Inspection notes visibility**: After inspection fail, the task's notes are updated with `[Inspection FAIL]` prefix. On status board cards, notes starting with `[Inspection` are shown with a highlighted badge and the note text is displayed prominently (not truncated).
- **Regenerate Mock Data** button next to Generate Tasks

### 5. `HKRoomCard.tsx`
- Remove VIP badge rendering entirely
- Add **human-readable status label** overlay: "To be cleaned", "Cleaning...", "Ready for inspection", "Inspected & Ready"
- Add **live elapsed timer** (MM:SS) for `in_progress` status using `useState` + `useEffect` with 1s interval from `started_at`
- Show **inline quick-action buttons** on hover/tap: context-appropriate (Start, Done, Inspect) — reduce need to open detail sheet
- Highlight inspection notes: if `task.notes` starts with `[Inspection`, show in a distinct warning-colored strip
- Progress button only if `isManager` is true

### 6. `HKInspectionQueue.tsx`
- Remove VIP from priority sort order and badges
- **Extract** the inspection form (defects + notes + pass/fail/reopen) into a new `HKInspectionForm.tsx` component
- `HKInspectionQueue` uses `HKInspectionForm` internally

### 7. New: `HKInspectionForm.tsx`
- Shared inspection form component accepting `task`, `onPass`, `onFail`, `onReopen` callbacks
- Contains defect categories, notes textarea, pass/fail/reopen buttons
- Used by both `HKInspectionQueue` and `HKStatusBoard` (via Dialog)

### 8. `MyTasksList.tsx`
- Remove VIP badges and VIP priority references
- **Enhance as shift headquarters**: Show summary header with total tasks, completed count, estimated remaining time
- Show manager inspection notes prominently on task cards (highlighted if `[Inspection FAIL]`)
- Add setting-aware toggle: if manager has enabled "see other tasks" (stored as a prop/context flag for now), show a collapsible section "Other staff tasks" with read-only view of colleagues' tasks
- Show shift progress bar (completed/total)

### 9. `HKAssignmentBoard.tsx`
- Remove VIP badges and priority references
- **More interactive and visual**:
  - Staff cards show workload as a mini progress bar (tasks done / total assigned)
  - Color-coded capacity indicators (green/yellow/red)
  - Drag-drop remains, but add quick-assign buttons: click an unassigned task → dropdown of staff appears inline
  - Show room status color dot on each task in the staff panel
- Pool tasks: show all (not just first 5)

### 10. `HKRoomDetailSheet.tsx`
- Remove VIP badge and VIP priority display
- Highlight inspection notes with distinct styling when present

### 11. `useHousekeeping.tsx`
- Export `regenerateAllMockData()` that resets `mockTaskState` with output from `regenerateMockData()`, resets `mockMaintenanceState`, and calls `notifyMockListeners()`
- Remove VIP from any mock priority references

### 12. `LanguageContext.tsx`
- Add/update translation keys:
  - `housekeeping.outOfOrder` (EN/DA)
  - `housekeeping.toBeCleaned` / `housekeeping.cleaning` / `housekeeping.readyForInspection` / `housekeeping.inspectedReady`
  - `housekeeping.regenerateMock`
  - `housekeeping.shiftProgress` / `housekeeping.estimatedRemaining`
  - `housekeeping.otherStaffTasks`
- Remove VIP-related keys

---

## Permission Audit

| Action | Admin | Manager | HK Dept Manager | HK Staff | Reception |
|--------|-------|---------|-----------------|----------|-----------|
| View Overview | Yes | Yes | Yes | No | No |
| View Status Board | Yes | Yes | Yes | Yes | Read-only |
| Progress task status | Yes | Yes | Yes | No | No |
| Generate/Regenerate tasks | Yes | Yes | Yes | No | No |
| Assign tasks | Yes | Yes | Yes | No | No |
| View Assign tab | Yes | Yes | Yes | No | No |
| Inspect rooms | Yes | Yes | Yes | No | No |
| View My Tasks | N/A | N/A | N/A | Yes | No |
| Claim pool tasks | N/A | N/A | N/A | Yes | No |
| Add notes on cards | Yes | Yes | Yes | No | No |
| View Reports/Settings | Yes | Yes | Yes (reports) | No | No |

---

## Technical Notes

**ElapsedTimer component**: Small inline component using `useState` + `useEffect` with 1-second `setInterval`. Props: `startTime: string`. Displays `MM:SS`. Cleanup on unmount. Placed in `HKRoomCard.tsx` (can be extracted if reused).

**Shared InspectionForm**: Props: `task: HousekeepingTask`, `onPass(notes)`, `onFail(notes, defects)`, `onReopen()`. Self-contained state for defects and notes. Used inside `Dialog` on Status Board and inline in Inspection Queue.

**Tab reorder**: Overview → Board → Assign → My Tasks → Inspect → Reports → Settings

