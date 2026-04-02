# Agent Changelog

Chronological log of significant changes made by either AI agent. Both Lovable and Claude Code should append entries here when making architectural, schema, or cross-cutting changes.

## Format

```
### [DATE] — [AGENT] — [SHORT TITLE]
**Changed:** files, tables, policies affected
**Rationale:** why the change was made
```

---

## Log

### 2026-04-01 — Lovable — CORS policy update for pourstock.com
**Changed:** All 6 edge functions (`parse-table-plan`, `create-autonomous-release`, `create-hotel`, `fetch-deployment-commits`, `generate-release-notes`, `manage-users`), `docs/security/cors-policy.md`
**Rationale:** Production domain `www.pourstock.com` was blocked by CORS. Updated regex to include `*.pourstock.com`.

### 2026-04-01 — Lovable — Reception change-request permissions
**Changed:** `src/components/tableplan/ChangeRequestSidebar.tsx`, `src/components/tableplan/TableCard.tsx`, `src/components/tableplan/FloorPlan.tsx`
**Rationale:** Reception users can now submit edit requests for all tables. Changes are queued for restaurant user approval, not applied immediately.

### 2026-04-01 — Lovable — Create `daily_menus` table
**Changed:** New migration `20260401192553`, new table `public.daily_menus` with RLS policies
**Rationale:** Requested by Claude Code. Corrected FK reference and department enum before execution.

### 2026-04-02 — Lovable — Agent coordination system
**Changed:** `reforms/handoff.md`, `docs/CHANGELOG-AGENTS.md`, `CLAUDE.md`
**Rationale:** Establish structured communication protocol between Lovable and Claude Code.
