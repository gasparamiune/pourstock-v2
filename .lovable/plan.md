

# Plan: Table Layout Editor for Hotel Admins

## Goal
Give hotel admins a visual way to create and edit their restaurant table layout from Settings, so new hotels can self-configure without database access.

## What to Build

### 1. Layout Editor Component (`src/components/settings/TableLayoutEditor.tsx`)

A grid-based editor where admins can:
- **Add tables**: Click "Add Table" → enters name, capacity, shape (rectangular/round), grid position (row/col)
- **Edit tables**: Click an existing table card to modify name, capacity, shape
- **Remove tables**: Delete button on each table
- **Reorder**: Row/col inputs (simple number fields — a full drag-and-drop grid editor is a later enhancement)
- **Preview**: Shows a mini FloorPlan preview of the current layout
- **Save**: Upserts to `table_layouts` with `is_default = true`

### 2. API Mutations (`src/api/queries.ts`)

Add two functions:
- `upsertTableLayout(hotelId, layoutJson, name)` — creates or updates the default layout
- `deleteTableLayout(hotelId, layoutId)` — removes a layout

### 3. Settings Integration

Add a new settings section "Restaurant Layout" (or extend the existing "Table Plan" section) with the layout editor embedded.

### 4. Hook Update (`src/hooks/useTableLayout.tsx`)

Add a `saveLayout` mutation that invalidates the cache after save.

---

## How It Works for a New Hotel

1. Admin goes to **Settings → Table Plan**
2. Sees "No layout configured" with a "Create Layout" button
3. Adds tables one by one: name (e.g. "Bord 1"), capacity (4), shape (rectangular), position (row 1, col 1)
4. Clicks Save → layout is stored in `table_layouts` as the hotel's default
5. Table Plan page immediately uses the new layout via `useTableLayout`

## Technical Notes

- Layout is stored as JSON array of `TableDef` objects: `{id, name, capacity, row, col, shape}`
- The `id` field is auto-generated (e.g. `table-1`, `table-2`)
- Only hotel admins can edit (enforced by existing RLS)
- Audit log entry on save: `action: 'table_layout.update'`

