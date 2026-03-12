# Changelog

All notable changes to PourStock are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html): `MAJOR.MINOR.PATCH`.

---

## [Unreleased]

> Changes that have been merged but not yet assigned a release version.

---

## [1.0.0] — 2026-03-12

### Added
- Initial production release of PourStock
- AI-powered table planning with PDF reservation parsing (Gemini)
- Beverage inventory management with quick-count workflows
- Purchase ordering and receiving workflows
- Role-based user management with manager approval workflow
- Real-time multi-device sync via Supabase Realtime WebSocket
- Multi-tenant architecture with Row Level Security (RLS) isolation
- 12-phase migration program for schema normalization
- `stays`, `stay_guests`, `room_assignments` mirror tables (Phase 8)
- `checkin_events`, `checkout_events` audit log + housekeeping trigger (Phase 9)
- `folios`, `folio_items`, `payments` billing mirror (Phase 10)
- `integrations`, `integration_events`, `ai_jobs` schema (Phase 11)
- Parity and analytics views: `v_daily_occupancy`, `v_revenue_summary`, `v_stay_parity`, `v_folio_parity` (Phase 12)
- `dual_write_failures` table with centralized logger for mirror safety
- `reconcile_stay_from_reservation()` and `reconcile_folio_from_charges()` repair functions
- `v_migration_health` per-hotel health dashboard
- 7-view soak validation framework for cutover readiness evidence
- Autonomous release creation edge function (`create-autonomous-release`)
- In-app Updates page (`/updates`) displaying published release announcements
- `useReleaseAnnouncements` hook with per-user read/acknowledge state
- Hotel modules feature flag system for per-hotel capability gating
- Drag-and-drop floor plan editor with auto-assignment algorithm
- Reception room board with check-in / check-out workflows
- Housekeeping task board with event-driven task generation
- Onboarding flow for new hotel setup
- Multi-language support (English / Danish) via `LanguageContext`

### Infrastructure
- Vite 5 + React 18 + TypeScript frontend
- Supabase PostgreSQL backend with 40+ normalized tables
- Deno Edge Functions for server-side logic (6 functions)
- Vitest test runner with jsdom environment
- ESLint with TypeScript + React Hooks rules
- GitHub Actions CI: lint + build on every push/PR to `main`

---

## How to Add a New Entry

When you ship a change:

1. Add a line under **[Unreleased]** in the appropriate section (`Added`, `Changed`, `Fixed`, `Removed`, `Security`).
2. At release time, replace `[Unreleased]` with the new version and today's date (e.g. `[1.1.0] — 2026-04-01`), and add a fresh empty `[Unreleased]` section above it.
3. Update `"version"` in `package.json` to match.
4. Set `VITE_APP_VERSION` in your build environment to the same value so the in-app release detection works.

See [`docs/versioning-process.md`](docs/versioning-process.md) for the full workflow.
