

## Plan: Reception Change Requests for Bordplan + Flag Icon Consistency

### 1. Flag Icon Consistency

**Problem**: The British flag in `LanguageSwitcher` uses a flat rectangular SVG, while the Danish flag uses a pennant-style SVG with a pole. They should match in style.

**Fix**: Restyle `BritishFlag.tsx` to match the Danish pennant style (pole + rectangular flag body), keeping both as pole-mounted flag icons.

---

### 2. Reception → Restaurant Change Request System

This is a significant feature requiring a new database table, a sidebar panel, and a notification system.

#### Architecture

```text
Reception makes change ──► Saved as "pending_change" in DB
                              │
                              ▼
              Restaurant sees change in sidebar panel (inside bordplan)
              Can Accept ✓ or Decline ✗
                              │
                              ▼
              If accepted: change applied to assignments_json
              If declined: change discarded, reception notified
              
              If restaurant user is NOT on /table-plan:
              Persistent notification badge until dismissed
```

#### Database

New table: `table_plan_changes`
- `id` (uuid, PK)
- `plan_date` (date, NOT NULL) — links to specific day's plan
- `table_id` (text) — which table was changed
- `change_type` (text) — 'add_reservation', 'edit_room', 'add_buff', 'edit_buff', 'remove_buff'
- `change_data` (jsonb) — the reservation data / field changes
- `previous_data` (jsonb, nullable) — snapshot before change for context
- `status` (text) — 'pending', 'accepted', 'declined' (default: 'pending')
- `requested_by` (uuid) — the reception user
- `reviewed_by` (uuid, nullable)
- `reviewed_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

RLS: Restaurant + Admin can SELECT/UPDATE. Reception can SELECT (own) + INSERT. Enable realtime.

#### Frontend Changes

**A. Reception workflow (`TablePlan.tsx`)**
- When `isReceptionOnly` is true, instead of directly calling `updateAssignments`, intercept changes and INSERT into `table_plan_changes` with status='pending'.
- Show a toast: "Ændring sendt til restaurant" (Change sent to restaurant).
- Reception can still see the table plan live (read-only sync) but their changes become requests.

**B. Change Request Sidebar (`src/components/tableplan/ChangeRequestSidebar.tsx`)**
- A vertical panel on the left side of the floor plan, visible only to restaurant/admin users.
- Shows pending changes as a scrollable list, each with:
  - Table number, change type, timestamp, requested by
  - Accept (✓) and Decline (✗) buttons
- Accepting: applies the change to the live assignments and updates status to 'accepted'
- Declining: updates status to 'declined'
- Uses realtime subscription to show new requests instantly.

**C. Auto-close sidebar on entering specific bordplan**
- When a plan is loaded (assignments !== null), programmatically close the AppShell sidebar by passing a prop or using a layout context.

**D. Persistent notification for restaurant users outside bordplan**
- In `AppShell.tsx`, subscribe to `table_plan_changes` where status='pending'.
- If count > 0 and route is NOT `/table-plan`, show a persistent banner/toast with count + "Got it" dismiss button.
- Badge on the Bordplan nav item showing pending count.

#### Technical Details

- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.table_plan_changes;`
- The sidebar uses the existing `Sheet` component or a custom fixed-left panel.
- Reception's change interception wraps the existing `handleAddReservation`, `handleEditReservation`, and `handleRemoveReservation` to redirect to DB inserts instead of direct state mutations.

