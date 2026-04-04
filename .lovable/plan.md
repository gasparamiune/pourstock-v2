

# Unified Order Display + Course Progress Indicator + Last-Run Timer

## Problem

The left "Current Order" panel in the Command Center shows dishes duplicated: once in the top "existing lines" section (from DB) and again in the "+ New" section (from local `selection` state). This happens because unfired courses are reloaded into `selection` on mount (lines 286-329), but they also remain in `existingLines`.

## Solution

### 1. Single unified order view — no more "New" section

Replace the two-section layout (existing lines + "+ New" lines) with a **single list grouped by course** that merges both sources. Each course section shows all items for that course regardless of whether they came from DB or local selection.

- Merge `existingLines` and `pendingLines` into one `allLinesByCourse` structure
- Deduplicate by `item_id` (prefer pending entry if it exists, since it's editable)
- Pending-only items get a subtle indicator (e.g., a small dot or "new" badge) so the waiter knows they haven't been saved yet

### 2. Visual course progress indicator

Each course heading gets a status marker:

| State | Visual |
|-------|--------|
| **Fired/sent to kitchen** | Green checkmark or "Sent" badge, items slightly dimmed |
| **Currently being served** (last fired course) | Animated arrow or pulsing highlight in course color |
| **Pending (not yet fired)** | Normal styling, editable |
| **Empty (no items)** | Not shown |

Course color coding on the heading:
- Starter: green
- Mellemret: violet/purple  
- Main: red
- Dessert: sky blue

This replaces the old `emerald-500/60` uniform color for all course headings.

### 3. "Last dish ran" timer

Below the course list (or near the Run button area), display a small line:

> "Starters sent 12 min ago"

Logic: query `kitchen_orders` for this table today, find the most recent ticket's `created_at`, compute elapsed time. Update every 30s via interval. Show the course name of the last fired ticket.

### 4. Implementation details

**File**: `src/components/ordering/OrderCommandCenter.tsx`

- Add a `firedCourses` state (populated by the existing `loadUnfired` useEffect — it already queries kitchen tickets)
- Expose `lastFiredAt` and `lastFiredCourse` from the same query
- Replace lines 396-432 (the two-section rendering) with a single merged view:
  - For each course in order, show items from either `existingByCourse` or `pendingLines` (deduplicated)
  - Fired courses: show with checkmark, dimmed text, no remove button
  - Current/active course (last fired): pulsing arrow indicator
  - Unfired courses with items: normal styling, remove button visible
- Remove the `+ New` separator and section entirely
- Add elapsed-since-last-run display in the total/run button area

**File**: `src/contexts/LanguageContext.tsx`
- Add translations for "sent X min ago", "Sent", course status labels

## Files modified
| File | Change |
|------|--------|
| `src/components/ordering/OrderCommandCenter.tsx` | Unified order view, course progress markers, last-run timer |
| `src/contexts/LanguageContext.tsx` | Add translations |

