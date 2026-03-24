# Phase 6 — Housekeeping NextGen: Floor Map + Performance Dashboard

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `4fff599`

---

## Summary

Added two supervisor-only tabs to the Housekeeping page: a visual floor map showing
every room's live status, and a performance dashboard with KPIs, 7-day trends, and
a staff leaderboard.

---

## What Was Built

### HKFloorMap (`src/components/housekeeping/HKFloorMap.tsx`)

- Auto-generates a grid from `useRooms()` data — no manual floor configuration needed
- Rooms grouped by `floor` field, sorted by `room_number`; floors rendered top-to-bottom
  (highest floor first, as in a real building)
- `RoomCell` shows: room number, room type, status label with colour-coded border + background
- STATUS_CONFIG covers all 8 HK statuses:
  `available / occupied / checkout / dirty / in_progress / clean / inspected / maintenance`
- Summary badge strip at top showing count per status
- Grid: `grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10`

### HKPerformanceDashboard (`src/components/housekeeping/HKPerformanceDashboard.tsx`)

- `useHKTasksRange(from, to)` hook — fetches housekeeping_tasks for a date range
- `useProfiles(userIds)` — resolves staff names from the profiles table
- **KPI cards**: completed today, completed this week, 30-day completion rate %, active staff count
- **7-day BarChart**: completed (primary colour) vs total assigned (muted) bars via Recharts
- **Staff leaderboard**: ranked by completed tasks, progress bar showing individual rate

---

## Access Control

Both tabs wrapped in `{isSupervisor && ...}` — only visible to `isAdmin || isManager ||
isDepartmentManager('housekeeping')`. Regular HK staff are not affected.

---

## Files Changed

- `src/components/housekeeping/HKFloorMap.tsx` — new
- `src/components/housekeeping/HKPerformanceDashboard.tsx` — new
- `src/pages/Housekeeping.tsx` — added Floor Map + Performance tabs, Map + TrendingUp icons
