

# Table Plan Lifecycle: Publish → Serve → Close

## Problem

The table plan area is confusing: users can upload PDFs at any time, re-parse mid-service, and there's no clear "this is THE plan for tonight." The KDS, counters, and command center have no single source of truth for the active service.

## Design

Introduce a clear lifecycle with three states:

```text
[No Plan] → Upload PDF → Arrange → "Publish Bordplan" → [Published/Active] → Service → "Close & Save to History" → [Closed]
```

**Published** = the single active plan. Once published, PDF upload is hidden. All KDS/counters/command center reference this plan. No re-parsing possible until the plan is closed.

**Closed** = archived, read-only. Closing resets all service data (kitchen_orders for that plan_date) and allows a new PDF upload.

## Changes

### 1. Table Plan State Machine

**File**: `src/pages/TablePlan.tsx`

Current flow: upload PDF → auto-save → floor plan appears. New flow:

- **No active plan**: Show PDF uploader + history list. This is the landing screen.
- **Draft plan** (uploaded but not published): Show floor plan with editing tools + a prominent **"Publish Bordplan"** button. Users can rearrange, edit, verify. PDF re-upload still possible in this state (replaces current draft).
- **Published plan** (`status = 'published'`): Floor plan is shown, PDF uploader is hidden, editing is limited to reservation details (not full re-parse). The **"Close & Save to History"** button appears at the bottom.
- **On publish**: Update `table_plans.status` to `'published'`. This triggers auto-insert of food for daily-menu reservations (the existing `autoInsertFoodFromReservations`).
- **On close**: Confirmation dialog → update `status` to `'closed'` → clear `assignments` state → return to landing (PDF upload visible again).

Add a `status` field check: `'active'` (current default, treat as draft), `'published'`, `'closed'`.

### 2. DB Migration

```sql
-- No new columns needed; status column already exists with default 'active'.
-- We just use new values: 'active' (draft), 'published', 'closed'.
```

### 3. Auto-load logic change

**File**: `src/pages/TablePlan.tsx`

Current: loads any plan for today. New: loads plan for today where `status IN ('active', 'published')`. If `status = 'published'`, enter published mode directly (no PDF uploader). If `status = 'active'`, enter draft mode.

### 4. History section

**File**: `src/pages/TablePlan.tsx`

The saved plans list currently shows all plans. Split into:
- **Active/Draft**: The current working plan (if any) — loaded automatically
- **History**: Plans with `status = 'closed'`, shown as a collapsible list below the PDF uploader, read-only (clicking opens floor plan in view-only mode)

### 5. KDS & Command Center reference the published plan

No code changes needed in KDS/Command Center — they already query by `plan_date` and `hotel_id`. The key change is that only ONE plan can be published per day, and closing it means closing the service. The `autoInsertFoodFromReservations` only runs at publish time (not on every save).

### 6. Service reset on close

**File**: `src/pages/TablePlan.tsx`

When "Close & Save to History" is confirmed:
1. Update `table_plans.status = 'closed'` for today's plan
2. This naturally ends the service — KDS will show no pending tickets for a new plan_date
3. The next PDF upload creates a fresh plan (new plan_date or same date with a new plan)

### 7. Publish Bordplan button

Prominent button in the toolbar area (green, large) that:
- Saves the plan with `status = 'published'`
- Runs `autoInsertFoodFromReservations` (food pre-fill)
- Hides PDF uploader
- Shows toast: "Bordplan published — service is live"

### 8. Close & Save to History button

At the bottom of the floor plan (only visible when `status = 'published'`):
- Opens a confirmation dialog: "Are you sure? This will close tonight's service."
- On confirm: updates status to `'closed'`, clears local state, returns to landing

### 9. Translations

**File**: `src/contexts/LanguageContext.tsx`

Add keys: `tablePlan.publishBordplan`, `tablePlan.closeConfirmTitle`, `tablePlan.closeConfirmDesc`, `tablePlan.serviceIsLive`, `tablePlan.draft`

## Files modified

| File | Change |
|------|--------|
| `src/pages/TablePlan.tsx` | Lifecycle states (draft/published/closed), publish button, close+confirm, auto-load by status, history section |
| `src/contexts/LanguageContext.tsx` | New translation keys |

