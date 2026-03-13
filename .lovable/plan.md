

# Housekeeping Module — Complete UI/UX Specification

---

## 1. Module Overview

The Housekeeping module is the **room-operations control center** for PourStock's hotel side. It connects room readiness, reservation pressure, maintenance blockers, inspections, inventory-linked replenishment, and operational history into a single cohesive experience.

It replaces the current two-tab shell (`Status Board` + `My Tasks`) with a full-featured module containing 9 top-level sections and 6 expanded sub-modules.

---

## 2. Navigation Structure

### 2.1 Left Sidebar (AppShell)

No changes to the left sidebar. The single `/housekeeping` route remains under **Operations** with the `SprayCan` icon. All sub-navigation lives **inside** the Housekeeping page via tabs, not as separate top-level routes.

### 2.2 Internal Tab Bar

The Housekeeping page uses a horizontal `TabsList` (same pattern as Reception). Tabs are role-filtered — workers see fewer tabs than supervisors.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Overview │ Board │ My Tasks │ Assign │ Inspect │ Reports │ Settings│
└─────────────────────────────────────────────────────────────────────┘
```

| Tab | Visible to | Route param |
|-----|-----------|-------------|
| Overview | Supervisor, Admin, Manager | `overview` |
| Board | All HK staff + Reception (read-only) | `board` |
| My Tasks | HK Staff, Supervisor | `mytasks` |
| Assign | Supervisor, Admin | `assign` |
| Inspect | Supervisor, Admin | `inspect` |
| Reports | Supervisor, Admin, Manager | `reports` |
| Settings | Admin only | `settings` |

**Mobile**: Tabs scroll horizontally. On phones, `My Tasks` is the default landing tab for staff; `Overview` is default for supervisors.

---

## 3. Screen-by-Screen Breakdown

---

### A. Overview Dashboard

**Purpose**: Supervisor/manager landing page — high operational density, instant clarity.

**Layout**: Responsive grid of stat cards + alert strips.

```text
┌──────────────────────────────────────────────────────────┐
│ [Status Summary Bar]  Dirty:12  InProg:4  Clean:8  Insp:22 │
├───────────┬───────────┬───────────┬───────────────────────┤
│ Arrivals  │ Departures│ Stayovers │ Not Ready for Check-in│
│    8      │    12     │    34     │    3 ⚠                │
├───────────┼───────────┼───────────┼───────────────────────┤
│ Maint.    │ Inspect Q │ Unassigned│ Open Pool             │
│ Blocked:2 │    6      │    4      │    7                  │
├───────────┴───────────┴───────────┴───────────────────────┤
│ [Staff Activity Strip]  Maria:4rooms  Lars:2rooms  ...    │
├──────────────────────────────────────────────────────────┤
│ [Alert Strips]                                            │
│  ⚠ 2 rooms late-ready for 14:00 arrivals                 │
│  🔧 Room 204 blocked by maintenance since yesterday       │
│  📦 Minibar restock needed: 5 rooms                       │
│  🧺 Linen shortage: Twin sheets (3 short)                 │
│  🔍 1 incident needs review                               │
│  📦 Lost & found: 2 items pending                         │
├──────────────────────────────────────────────────────────┤
│ [Public Areas]  Lobby ✓  Corridors 50%  Restrooms ⏳      │
│ [Deep Cleans]   2 due today, 1 overdue                    │
│ [Avg Clean Time]  Checkout: 38min  Stayover: 22min        │
└──────────────────────────────────────────────────────────┘
```

**Components**:
- `HKOverviewStats` — grid of `StatCard` components (reuse pattern from `QuickStats`)
- `HKAlertStrip` — colored alert rows with action links
- `HKStaffActivity` — horizontal avatar+count strip
- `HKPublicAreaProgress` — progress bars per area
- `HKDeepCleanDue` — count badge with link to filtered board

**Data sources**: Aggregation queries on `housekeeping_tasks`, `maintenance_requests`, `rooms`, `reservations` (today), new tables for public areas, deep cleans, lost & found.

**Realtime**: Subscribe to `housekeeping_tasks` and `maintenance_requests` changes to keep counts live.

**Empty state**: "No tasks generated yet for today. Generate tasks to begin." with Generate button.

**Role access**: View only for Supervisor/Admin/Manager. Reception sees a stripped-down version (room readiness counts only) via the Reception module, not here.

---

### B. Status Board

**Purpose**: Central room-operations board. The most-used screen.

**View modes** (toggle in toolbar):
1. **Card Grid** (default) — colored room cards in a responsive grid
2. **Compact Table** — dense rows, more rooms visible at once

**Grouping options**: None (flat), By Floor, By Zone, By Status, By Worker

**Filters** (toolbar, collapsible on mobile):
- Status: dirty / in_progress / clean / inspected / all
- Floor
- Zone
- Room type
- Priority (normal / urgent / VIP)
- Task type (checkout / stayover / deep_clean / turndown / public_area)
- Assignment: Assigned / Unassigned (Open Pool) / All
- Maintenance: blocked / clear / all
- Reservation context: arrival today / departure today / stayover / vacant

**Room Card anatomy** (card view):

```text
┌─────────────────────────┐
│ 204        🔧 ★VIP      │  ← room number, maintenance flag, priority badge
│ Double                   │  ← room type
│ ─────────────────────── │
│ Checkout · Arr 14:00     │  ← task type + reservation context
│ 👤 Maria  ⏱ ~35min       │  ← assigned worker or "Open Pool", est. duration
│ 🧹 ☑ Inspect  📝2        │  ← amenity/linen icons, inspect required, notes count
│ ─────────────────────── │
│ [Start Cleaning →]       │  ← action button (context-sensitive)
│           updated 5m ago │
└─────────────────────────┘
```

**Room Card colors**: Same CSS variable pattern as existing (`--hk-dirty`, `--hk-in-progress`, `--hk-clean`, `--hk-inspected`) + new states for `out_of_order`, `maintenance_hold`, `dnd`.

**Compact table row anatomy**:

```text
│ 204 │ Dbl │ Checkout │ Dirty │ Maria │ Urgent │ 🔧 │ 📝 │ [→] │
```

**Quick actions per room** (via card button or row action menu):
- Progress status (dirty→in_progress→clean→inspected)
- Assign / Reassign
- Report maintenance issue
- Add note
- Open Room Detail drawer
- Mark DND / Return Later
- Flag for inspection

**Realtime**: Board updates live via Supabase Realtime subscription on `housekeeping_tasks`.

**Empty state**: "No rooms match your filters." or "No tasks for today. Generate tasks to start."

**Role access**:
- HK Staff: View + progress own assigned tasks
- HK Supervisor: View all + progress any + assign + inspect
- Admin: Full access
- Reception: Read-only view (see room readiness, no actions)

---

### C. My Tasks (Worker-First Mobile Experience)

**Purpose**: The primary screen for cleaning staff on their phones/tablets.

**Design philosophy**: Extremely simple. Large touch targets. Minimal text. Icon-driven.

**Layout**: Vertical card stack, sorted by priority then floor proximity.

**Task card anatomy** (mobile):

```text
┌─────────────────────────────────┐
│  🏠 Room 204                     │
│  Double · Floor 2                │
│  Checkout Clean                  │
│  ★ VIP · Arrival 14:00          │
│                                  │
│  ┌──────────┐ ┌──────────┐      │
│  │ 🚫 Can't  │ │ ▶ Start  │      │
│  │  Access   │ │ Cleaning │      │
│  └──────────┘ └──────────┘      │
└─────────────────────────────────┘
```

**Sections**:
1. **My Assigned** — tasks directly assigned to this user
2. **Open Pool** — claimable tasks (visually distinct with dashed border or pool icon)
3. **Zone Tasks** — tasks in user's assigned zone, not yet claimed

**Interactions**:
- **Claim task** (open pool): Tap "Claim" → task moves to My Assigned, `assigned_to` set
- **Start cleaning**: dirty → in_progress, sets `started_at`
- **Pause / Return Later**: in_progress → paused state (notes reason)
- **DND**: Mark room as "Do Not Disturb — return later"
- **Can't access**: Opens reason picker (guest inside, locked, maintenance)
- **Complete**: in_progress → clean, sets `completed_at`
- **Quick issue**: Opens lightweight maintenance report (description + severity + optional photo)
- **Minibar/Amenity check**: Checklist of items to verify/restock
- **Linen delivery**: Mark linen delivered/collected

**"Next Best Room" suggestion**: A highlighted card at top suggesting the optimal next room based on floor proximity, priority, and arrival time pressure. Tap to start.

**Checklist completion**: When worker starts a task, an expandable checklist appears based on room type + task type (configured in Settings). Items are tappable checkboxes.

**Offline-friendly**: Show optimistic UI. Queue mutations if offline. Display "Syncing..." indicator. Use `navigator.onLine` + retry logic.

**Multilingual**: All labels come from `useLanguage()` / `t()`. Icons reduce text dependency.

**Empty state**: "All done for today! 🎉 No tasks assigned to you." with option to check Open Pool.

---

### D. Assignment Board

**Purpose**: Supervisor screen for distributing work.

**Layout**: Two-panel on desktop, stacked on mobile.

```text
┌──────────────────────┬──────────────────────────────┐
│ STAFF PANEL          │ UNASSIGNED TASKS              │
│                      │                               │
│ 👤 Maria (4 tasks)   │ [Room 301] Checkout  Urgent   │
│   Room 201 ✓         │ [Room 305] Stayover  Normal   │
│   Room 204 🔄        │ [Room 401] Checkout  VIP      │
│   Room 207           │ [Room 103] Deep Clean         │
│   Room 210           │                               │
│ ─────────────────── │                               │
│ 👤 Lars (2 tasks)    │                               │
│   Room 102           │                               │
│   Room 105           │                               │
│ ─────────────────── │                               │
│ 👤 Open Pool (3)     │                               │
│   Room 501           │                               │
│   Room 502           │                               │
│   Room 503           │                               │
└──────────────────────┴──────────────────────────────┘
```

**Assignment modes** (toolbar selector):
1. **Direct**: Drag task → drop on worker name (or select worker from dropdown)
2. **Open Pool**: Drag task → drop on "Open Pool" section
3. **Zone/Floor**: Select floor/zone → "Assign all to Maria" bulk action
4. **Auto-distribute**: Button that evenly distributes unassigned by workload + room complexity

**Bulk actions toolbar**:
- Select multiple tasks (checkboxes) → Assign to [worker dropdown]
- Select multiple → Move to Open Pool
- Select by floor → Assign all

**Workload indicator**: Each worker shows task count + estimated total minutes. Color-coded: green (light), yellow (moderate), red (overloaded).

**Drag-and-drop**: Use existing patterns. On mobile, use tap-to-select + "Assign to..." action sheet instead of drag.

**Unassigned tasks**: Visually distinguished with dashed border and "🏊 Pool" label.

**Role access**: Supervisor and Admin only. Staff cannot see this tab.

---

### E. Room Detail (Drawer)

**Purpose**: Deep-dive into a single room's operational state. Opens as a `Sheet` (right-side drawer, consistent with PourStock patterns).

**Trigger**: Click room number/card anywhere in the module.

**Sections** (vertical scroll):

1. **Header**: Room number, type, floor, current status badge, ready-for-sale indicator
2. **Reservation Context**: Guest name (if checked in), arrival/departure dates, special requests relevant to housekeeping (e.g., extra pillows, allergies)
3. **Current Task**: Status, assigned worker, started/completed times, checklist progress
4. **Minibar & Amenities**: Item list with stock levels, restock needed indicators. Links to inventory but does not duplicate inventory management.
5. **Linen**: Current linen set, exceptions, delivery status
6. **Maintenance Issues**: Active issues on this room, severity, blocking status
7. **Inspection History**: Last 5 inspections with pass/fail, inspector name, defects
8. **Damage Reports**: Active damage items with photos, severity
9. **Lost & Found**: Items associated with this room
10. **Activity Timeline**: Chronological log of all HK events (status changes, assignments, notes, maintenance reports)

**Actions available from drawer**:
- Progress task status
- Assign/reassign
- Report maintenance
- Report damage
- Log lost & found item
- Add note
- Block/unblock room
- Mark ready for sale

**Role-filtered**: Reception viewers see sections 1-3 (read-only) + maintenance blocking status. They cannot edit anything.

---

### F. Inspection / QA

**Purpose**: Supervisor quality assurance workflow.

**Layout**: Queue list on left, inspection form on right (or full-screen on mobile).

**Queue**: Rooms with status `clean` that require inspection. Sorted by priority/arrival urgency.

**Inspection card**:

```text
┌─────────────────────────────────────────┐
│ Room 204 · Double · Floor 2              │
│ Cleaned by: Maria · 35 min              │
│                                          │
│ Checklist:                               │
│  ☑ Bathroom        ☑ Bed made            │
│  ☑ Vacuum          ☐ Minibar checked     │
│  ☑ Dusting         ☑ Windows             │
│                                          │
│ Defects found:                           │
│  [+ Add defect]                          │
│  ☐ Stain on carpet (category: Flooring)  │
│                                          │
│ Notes: ___________________________       │
│ Photo: [📷 Add photo]                    │
│                                          │
│ ┌────────┐  ┌────────┐  ┌──────────┐   │
│ │ ✗ Fail │  │ ✓ Pass │  │ Re-open  │   │
│ └────────┘  └────────┘  └──────────┘   │
└─────────────────────────────────────────┘
```

**On Fail**: Room returns to `dirty` status, task reopened, original worker notified (toast). Defect categories logged.

**On Pass**: Room → `inspected`, becomes ready for sale. Room status updated to `available` in rooms table.

**Inspection history**: Accessible per room (in Room Detail) and per worker (in Reports). Tracks repeat issues.

**Role access**: Supervisor and Admin only.

---

### G. Maintenance Follow-Up

Not a separate tab — it is **integrated** into the Board, Room Detail, and Overview. Maintenance data comes from the existing `maintenance_requests` table.

**Integration points**:
- Board: Room cards show 🔧 icon when maintenance active. Filter "Maintenance: blocked" shows only affected rooms.
- Room Detail: Maintenance section shows all active/recent issues.
- Overview: "Rooms blocked by maintenance" stat card.
- Quick action from any HK task: "Report maintenance issue" opens a small dialog (description, severity, optional photo, blocking vs. cosmetic toggle).
- Post-maintenance: When maintenance resolves an issue, a new HK task is auto-generated if room was blocked (dirty status, type: `post_maintenance_clean`).

**Blocking vs. non-blocking**: A toggle on maintenance reports. Blocking issues set room to `out_of_order` and prevent task progression. Cosmetic issues are logged but don't block.

---

### H. Reports

**Purpose**: Operational reporting for supervisors and managers.

**Report types** (sub-tabs or dropdown selector):

| Report | Description |
|--------|-------------|
| Daily Summary | Rooms cleaned, by status, by type |
| Worker Performance | Clean count, avg time, inspection pass rate per worker |
| Room Turnaround | Avg time from checkout to inspected, by room type |
| Inspection Results | Pass/fail rates, defect frequency by category |
| Maintenance Impact | Rooms blocked, avg block duration, frequency |
| Minibar & Amenity | Restock activity, shortage frequency |
| Public Areas | Task completion rates by area |
| Deep Cleaning | Completion vs. schedule, overdue rooms |
| Linen & Laundry | Deliveries, shortages, exceptions |
| Lost & Found | Items logged, claimed, discarded |
| Incidents | Damage reports by type, room, trend |

**Date range picker**: Today, Yesterday, This Week, This Month, Custom range.

**Export**: CSV download for any report.

**Visualization**: Simple bar/line charts using existing chart components. Keep it operational, not vanity.

**Role access**: Supervisor, Admin, Manager. Staff cannot see Reports.

---

### I. Settings

**Purpose**: Configuration for the housekeeping module. Admin-only.

**Sub-sections** (accordion or vertical tabs):

1. **Task Templates**: Define default task types and their properties (estimated duration, checklist, priority rules)
2. **Checklists**: Create/edit checklists by room type × task type. Drag to reorder items.
3. **Zones & Floors**: Define zones, assign floors to zones, name public areas
4. **Room State Definitions**: Configure which room states are active (customizable beyond the 4 defaults)
5. **Inspection Templates**: Defect categories, inspection checklist items
6. **Priority Rules**: Auto-escalation rules (e.g., VIP rooms always urgent, rooms with arrival in <2hrs auto-escalate)
7. **Minibar & Amenity Categories**: Item types for HK-side tracking (links to but doesn't replace inventory products)
8. **Linen Types**: Define linen categories (sheets, towels, bathrobes, etc.)
9. **Incident Categories**: Damage types, severity levels
10. **Lost & Found Categories**: Item categories, storage locations
11. **Assignment Defaults**: Default assignment mode (direct/pool/zone/hybrid), auto-generate behavior

**Role access**: Admin only. Settings changes logged to `audit_logs`.

---

## 4. Expanded Modules (Integrated into the Above Screens)

These are not separate tabs. They live inside the existing screens.

### 4.1 Public Area Housekeeping

- **Board**: A toggle/filter on the Status Board: "Guest Rooms" vs "Public Areas". Public areas appear as cards with area name instead of room number.
- **Overview**: Public area progress strip.
- **My Tasks**: Public area tasks appear alongside room tasks, visually distinguished with a 🏢 icon.
- **Settings**: Public area definitions (lobby, corridors, restrooms, gym, etc.) with recurring schedules.
- **Data model**: Reuse `housekeeping_tasks` with `room_id` nullable + new `area_id` column pointing to a `public_areas` table.

### 4.2 Deep Cleaning

- **Board**: Filter by task_type `deep_clean`. Room cards show deep clean due date badge.
- **Overview**: "Deep cleans due today" + "Overdue deep cleans" stats.
- **Settings**: Deep clean schedule per room (every N days), checklist templates.
- **Data model**: New `deep_clean_schedules` table (room_id, interval_days, last_completed, next_due). The generate-tasks flow creates deep_clean tasks when due.

### 4.3 Linen & Laundry

- **Room Detail**: Linen section shows current set, exceptions, delivery status.
- **My Tasks**: Linen delivery/pickup tasks as a task type.
- **Overview**: Linen shortage alert strip.
- **Data model**: New `linen_tasks` table or extend `housekeeping_tasks` with `linen_items` JSONB column. Lightweight — not a full laundry ERP.

### 4.4 Minibar & Amenity Service

- **Room Detail**: Minibar section with item checklist linked to `products` and `stock_levels`.
- **My Tasks**: Minibar check/restock as checklist items within a room task.
- **Board**: Minibar restock icon on room cards when items need replenishment.
- **Overview**: "Minibar restock needed: N rooms" stat.
- **Integration**: Read from `products` (category = minibar/amenity) and `stock_levels`. HK creates `stock_movements` when restocking. Does NOT duplicate inventory UI.

### 4.5 Damage & Incident Reporting

- **Quick action**: "Report damage" from any room card or Room Detail.
- **Dialog**: Description, severity (cosmetic/moderate/severe), room-blocking toggle, photo upload, category.
- **Room Detail**: Incident history section.
- **Overview**: "Incidents needing review" stat.
- **Data model**: New `hk_incidents` table (hotel_id, room_id, reported_by, category, severity, blocking, photos JSONB, status, resolved_at, financial_note).

### 4.6 Lost & Found

- **Drawer/Dialog**: "Log lost item" from Room Detail or a standalone action.
- **Fields**: Description, room, date found, category, storage location, photo, status (stored/claimed/returned/discarded).
- **Chain of custody**: Activity log per item.
- **Reception visibility**: Reception can search/view lost & found items (read-only) to respond to guest inquiries.
- **Data model**: New `lost_found_items` table (hotel_id, room_id, found_by, found_date, description, category, storage_location, photos JSONB, status, claimed_by_guest, returned_at, discarded_at).

---

## 5. Task & Room States

### Task States (extended from current enum)

```text
dirty → in_progress → clean → inspected
                  ↘ paused (DND/can't access) → in_progress
         ← (failed inspection) ←──────────────┘
```

Current enum values: `dirty`, `in_progress`, `clean`, `inspected`
**Proposed additions**: Add `paused` to `hk_status` enum. Use `notes` field to capture pause reason.

### Room Readiness States (for reception visibility)

Derived from combination of `housekeeping_tasks.status`, `maintenance_requests.status`, and `rooms.status`:
- **Ready for sale**: inspected + no active maintenance
- **Not ready**: any other combination
- **Blocked**: active blocking maintenance

These are computed, not stored.

### Task Types (extended)

Current: `checkout_clean`, `stay_over`, `deep_clean`, `turndown`
**Proposed additions** to `hk_task_type`: `public_area`, `post_maintenance`, `linen_delivery`, `minibar_restock`, `amenity_setup`, `vip_setup`

---

## 6. Assignment Modes — UX Detail

### Mode Selector (Assignment Board toolbar)

```text
[Direct ▼] [Open Pool] [Zone/Floor] [Auto-Distribute]
```

### How workers experience each mode

| Mode | Worker sees | Claim behavior |
|------|-----------|----------------|
| Direct | Only their assigned tasks in "My Tasks" | No claiming needed |
| Open Pool | "Available" section with claimable tasks | Tap "Claim" → atomic DB update with optimistic lock |
| Zone | Tasks in their assigned zone | Tap "Claim" same as pool |
| Hybrid | Mix of assigned + pool + zone sections | Assigned first, then pool/zone below |

### Claim conflict resolution

When two workers tap "Claim" simultaneously, the DB update uses a conditional: `UPDATE ... SET assigned_to = $uid WHERE assigned_to IS NULL AND id = $taskId`. If 0 rows affected, show toast "Task already claimed by someone else" and refresh list.

---

## 7. Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| < 640px (phone) | Single column. My Tasks is default. Board shows cards in 1-2 cols. Assignment board is stacked. Tab bar scrolls horizontally. |
| 640-1024px (tablet) | Board 3-4 cols. Assignment board side-by-side. |
| > 1024px (desktop) | Board 5-6 cols. Full tab bar visible. Room Detail as right-side Sheet. |

**Mobile-specific**:
- Bottom action bar on My Tasks for current task (Start/Complete/Pause)
- Swipe gestures on task cards (swipe right = progress, swipe left = report issue) — future enhancement, not MVP
- Large touch targets (min 44px)

---

## 8. Realtime & Activity Patterns

| Event | Channel | UI Response |
|-------|---------|-------------|
| Task status change | `housekeeping_tasks` | Board cards update, Overview stats refresh, My Tasks refresh |
| Task assigned/claimed | `housekeeping_tasks` | Assignment board updates, claimed task disappears from pool |
| Maintenance created/resolved | `maintenance_requests` | Room card shows/hides 🔧, Overview blocked count updates |
| Inspection completed | `housekeeping_tasks` | Room moves to inspected, reception room board updates |

**Toast notifications** for supervisors:
- "Maria completed Room 204 (35 min)"
- "Maintenance issue reported: Room 301"
- "Room 204 failed inspection — returned to queue"

---

## 9. Empty States

| Screen | Empty State |
|--------|-------------|
| Overview (no tasks) | "No tasks for today. Generate daily tasks to begin." + [Generate Tasks] button |
| Board (filtered to nothing) | "No rooms match your filters. Try adjusting your selection." |
| My Tasks (all done) | "All done! No tasks assigned to you. Check the open pool for available work." |
| My Tasks (no tasks at all) | "No tasks assigned yet. Ask your supervisor or check back later." |
| Inspection Queue (empty) | "No rooms awaiting inspection. All clear." |
| Assignment Board (all assigned) | "All tasks are assigned. The unassigned panel is empty." |
| Reports (no data for range) | "No data available for the selected date range." |
| Lost & Found (empty) | "No lost items logged. Use the Room Detail drawer to log found items." |

---

## 10. Edge Cases

- **Simultaneous claim**: Handled by conditional UPDATE (see section 6)
- **Task generated twice**: `UPSERT` on `(room_id, task_date)` prevents duplicates (already implemented)
- **Room with no reservation**: Show "Vacant" context, still cleanable
- **Worker loses connectivity**: Optimistic UI + retry queue. Show "Offline — changes will sync when connected" banner
- **Inspection fails after guest checked in**: Task reopens but room shows "occupied" — supervisor must decide whether to re-clean during occupancy or defer
- **Maintenance resolved mid-shift**: Auto-generate post-maintenance task, notify assigned zone worker
- **VIP arrival in <1 hour, room still dirty**: Auto-escalate priority to urgent, surface in Overview alerts
- **Multiple tasks on same room same day**: Allow (e.g., morning stayover + evening turndown). Sort by task_type.

---

## 11. Integration Points with Existing Modules

| Module | Integration |
|--------|------------|
| **Reception** | Read-only room readiness status. When HK marks inspected, room becomes available on reception board. Check-out triggers HK task generation. |
| **Rooms table** | HK updates `rooms.status` to `available` on inspection pass. Does not overwrite other room statuses. |
| **Reservations** | HK reads arrival/departure dates, special requests, VIP flags to contextualize tasks. |
| **Maintenance** | Bidirectional: HK reports issues → maintenance. Maintenance resolution → triggers post-clean HK task. |
| **Inventory** | Minibar/amenity restock reads `products` + `stock_levels`. HK restocks create `stock_movements`. |
| **Audit Logs** | All status changes, assignments, inspections, damage reports write to `audit_logs`. |
| **User Management** | HK worker list comes from `hotel_members` + `user_departments` where department = 'housekeeping'. |

---

## 12. Suggested Data Model Additions

Only tables truly needed beyond existing schema:

```sql
-- 1. Public areas (for non-room tasks)
CREATE TABLE public.public_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  name text NOT NULL,
  area_type text NOT NULL DEFAULT 'lobby',  -- lobby, corridor, restroom, gym, spa, meeting_room, restaurant_shared
  floor integer,
  zone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Deep clean schedules
CREATE TABLE public.deep_clean_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  interval_days integer NOT NULL DEFAULT 90,
  last_completed_at timestamptz,
  next_due date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Housekeeping incidents (damage reporting)
CREATE TABLE public.hk_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  room_id uuid REFERENCES rooms(id),
  reported_by uuid NOT NULL,
  category text NOT NULL,           -- furniture, flooring, plumbing, electrical, other
  severity text NOT NULL DEFAULT 'cosmetic',  -- cosmetic, moderate, severe
  description text NOT NULL,
  is_blocking boolean NOT NULL DEFAULT false,
  photos jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'open',  -- open, reviewed, resolved
  resolved_at timestamptz,
  financial_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Lost and found
CREATE TABLE public.lost_found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  room_id uuid REFERENCES rooms(id),
  found_by uuid NOT NULL,
  found_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',  -- clothing, electronics, jewelry, documents, other
  storage_location text,
  photos jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'stored',  -- stored, claimed, returned, discarded
  claimed_by_guest text,
  returned_at timestamptz,
  discarded_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. HK checklists (settings-driven)
CREATE TABLE public.hk_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  name text NOT NULL,
  room_type text,           -- NULL = applies to all
  task_type text,           -- NULL = applies to all
  items jsonb NOT NULL DEFAULT '[]',  -- [{label, sort_order}]
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. HK zones (for zone-based assignment)
CREATE TABLE public.hk_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  name text NOT NULL,
  floors integer[] DEFAULT '{}',
  assigned_staff uuid[],        -- default staff for this zone
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Existing table modifications needed**:
- `housekeeping_tasks`: Add nullable `area_id uuid REFERENCES public_areas(id)`, `checklist_progress jsonb DEFAULT '{}'`, `paused_reason text`
- `hk_task_type` enum: Add values `public_area`, `post_maintenance`, `linen_delivery`, `minibar_restock`, `amenity_setup`, `vip_setup`
- `hk_status` enum: Add value `paused`

**RLS on all new tables**: Same pattern as existing — `is_hotel_member` for SELECT, `has_hotel_department(... 'housekeeping')` for INSERT/UPDATE, admin for DELETE.

---

## 13. Key Reusable Components

| Component | Used in |
|-----------|---------|
| `HKRoomCard` (enhanced) | Board, Assignment Board |
| `HKTaskCard` (mobile) | My Tasks |
| `HKStatCard` | Overview |
| `HKAlertStrip` | Overview |
| `HKStatusBadge` | Everywhere |
| `HKWorkerAvatar` | Assignment Board, Board |
| `HKChecklist` | Room Detail, My Tasks, Inspection |
| `HKQuickIssueDialog` | Board, My Tasks |
| `HKRoomDetailSheet` | Global (triggered from any room reference) |
| `HKInspectionForm` | Inspect tab |
| `HKLostFoundDialog` | Room Detail |
| `HKDamageReportDialog` | Room Detail, My Tasks |
| `HKFilterBar` | Board, Assignment Board |
| `HKDatePicker` | Board, Reports |

---

## 14. Architecture Protection Notes

- No changes to `AppShell.tsx` navigation structure beyond what exists
- No changes to `src/integrations/supabase/client.ts` or `types.ts` (auto-generated)
- All new hooks follow `useHousekeeping*.tsx` naming pattern
- All new components go in `src/components/housekeeping/`
- All new pages stay in `src/pages/Housekeeping.tsx` with lazy-loaded tab content
- API functions go in `src/api/housekeeping.ts`
- Realtime subscriptions follow existing `useRealtimeSubscription` pattern
- Existing `housekeeping_tasks` and `maintenance_requests` tables are extended, not replaced
- Reception module continues to read room readiness via `rooms.status` — no new coupling
- Inventory integration is read-only from HK side (reads products/stock_levels, creates stock_movements)

---

## 15. Implementation Priority (for phased build)

| Phase | Scope | Effort |
|-------|-------|--------|
| **P1** | Enhanced Board + My Tasks + Room Detail drawer + Overview stats | 3-4 days |
| **P2** | Assignment Board + Inspection + zone/pool modes | 2-3 days |
| **P3** | Public areas + Deep cleaning + Checklists | 2 days |
| **P4** | Minibar/Amenity integration + Linen | 2 days |
| **P5** | Damage/Incidents + Lost & Found | 1-2 days |
| **P6** | Reports + Settings | 2 days |
| **Total** | | **~12-15 days** |

