# Phase 3 — Kitchen Module: KDS + Daily Menu Editor

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `6df1946`

---

## Summary

Introduced a brand-new `kitchen` department with two operational tools: a real-time
Kitchen Display System (KDS) board for order management, and a daily menu editor
used by management to publish the menu that waiters order from.

---

## What Was Built

### Kitchen Display System (`KitchenDisplay.tsx`)

- 3-column layout: **Pending** (amber) → **In Progress** (blue) → **Ready** (green)
- Realtime updates via Supabase channel subscription on `kitchen_orders` filtered by hotel_id
- 30-second polling fallback (`refetchInterval`)
- Age indicator: card border turns red after 15 minutes
- Status FSM: `pending → in_progress → ready → served` advanced via single-click on each card

### Daily Menu Editor (`DailyMenuEditor.tsx`)

- Three course sections: starters, mains, desserts (max 3 items each)
- Draft → Published workflow; published status activates ordering for waiters
- Save (persists draft) + Publish (sets `published_at`, enables ordering)
- Date displayed in Danish locale

### Infrastructure

- `kitchen` added to `Department` type union in `useAuth.tsx` + `ProtectedRoute.tsx`
- New nav item in AppShell (ChefHat icon, `department: 'kitchen'`)
- `Kitchen.tsx` page with KDS and Today's Menu tabs
- Route: `/kitchen` protected by `requireDepartment="kitchen"`

---

## Migration

`supabase/migrations/20260324000003_kitchen_module.sql`
- `ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'kitchen'` (idempotent)
- `daily_menus` table: date-unique per hotel, JSONB course arrays, published_at
- `kitchen_orders` table: table_id, status, course, items JSONB, waiter_id
