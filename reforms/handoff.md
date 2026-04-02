# Agent Handoff Queue

This file is the structured communication channel between **Claude Code** and **Lovable**.

## How it works

1. **Claude Code** adds a new entry under `## Pending Requests` with status `PENDING`
2. **Lovable** picks up pending items, executes or rejects them, and moves them to `## Completed`
3. The user can also relay requests manually between agents

## Entry Format

```
### [DATE] — [SHORT TITLE]
- **Status:** PENDING | IN PROGRESS | DONE | REJECTED
- **Requestor:** Claude Code | Lovable | User
- **Type:** migration | secret | deploy | question | refactor
- **Request:**
  (describe what you need — include SQL, file paths, or questions)
- **Response:**
  (filled in by the executing agent)
```

---

## Pending Requests

_(none currently)_

---

## Completed

### 2026-04-01 — Create `daily_menus` table
- **Status:** DONE
- **Requestor:** Claude Code
- **Type:** migration
- **Request:**
  Create `daily_menus` table with hotel_id, menu_date, starters/mains/desserts (jsonb), published_at, published_by, notes. Unique on (hotel_id, menu_date). RLS for hotel members.
- **Response:**
  Executed by Lovable with corrections:
  - `published_by` changed from `REFERENCES auth.users(id)` to plain `uuid` (project convention)
  - INSERT/UPDATE policies use `restaurant` department + `hotel_admin` role (no `kitchen` department exists)
  - Added DELETE policy for `hotel_admin` only
  - Migration: `20260401192553_0a59d054-a651-4312-9082-5547b61ecc2a.sql`
