# PourStock Deployment Audit

**Prepared by**: DevOps & Deployment Analyst
**Date**: 2026-03-18
**Platform state**: Production — Sønderborg Strand Hotel (single tenant)

---

## 1. Current Deployment State

### Hosting Platform: Lovable Cloud

PourStock is hosted entirely on **Lovable Cloud** (`https://swift-stock-bar.lovable.app`). Lovable is an AI-assisted frontend platform that provides:

- Hosted build pipeline (Vite)
- Static asset delivery (CDN)
- Preview URLs for every edit (`id-preview--*.lovable.app`)
- Direct Git-to-deploy workflow (no explicit CI/CD pipeline file)

### What is automated

| Concern | Automated? | Notes |
|---------|-----------|-------|
| Frontend build | Yes | Lovable triggers a Vite build on each publish |
| Frontend deploy | Yes | Lovable serves the built static bundle |
| Edge Function deploy | Manual | Must use `supabase functions deploy <name>` CLI |
| Database migrations | Manual | Must use `supabase db push` or Supabase dashboard |
| Secrets rotation | Manual | No pipeline manages secrets |
| Release notes | In-app | `create-autonomous-release` edge function creates release records on demand |

### No CI/CD Pipeline Files

There is **no `.github/workflows/` directory** and no CI/CD pipeline configuration of any kind (GitHub Actions, CircleCI, etc.). All deployment activity is initiated manually:

1. Frontend: publish via Lovable UI
2. Edge Functions: deploy via Supabase CLI
3. Migrations: apply via Supabase CLI or dashboard

### Known Production Incident

A production black screen occurred in March 2026 when the Lovable Cloud build pipeline failed to inject `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` during the published build (preview worked; production did not). Root cause: Vite performs static replacement at build time — absent env vars compiled to `undefined`. Multiple republish attempts did not help.

**Resolution (ADR-006)**: Hardcoded fallback values for both variables were added directly to `vite.config.ts` using the `define` property. The fallback values are the production Supabase anon key and project URL — safe to commit since they are public credentials. This means the live site will always connect to the correct backend regardless of whether Lovable injects the env vars.

---

## 2. Environment Configuration

### Frontend Environment Variables

| Variable | Required | Source | Default in vite.config.ts | Notes |
|----------|----------|--------|--------------------------|-------|
| `VITE_SUPABASE_URL` | Yes | Lovable Project Settings | `https://wxxaeupbfvlvtofflqke.supabase.co` | Fallback hardcoded; injection unreliable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Lovable Project Settings | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon JWT) | Fallback hardcoded; injection unreliable |
| `VITE_SUPABASE_PROJECT_ID` | Optional | `.env` only | — | Referenced in `.env.example` but not used in production bundle |
| `VITE_APP_ENV` | Optional | `.env` | `development` | Not referenced in code at time of audit |

### Edge Function Environment Variables (Server-side, not committed)

All Edge Functions use `Deno.env.get()`. These must be set as **Supabase Edge Function Secrets** via the CLI or dashboard.

| Variable | Required by | Purpose |
|----------|-------------|---------|
| `SUPABASE_URL` | All functions | Backend API URL (auto-provided by Supabase runtime) |
| `SUPABASE_ANON_KEY` | All functions | Anon key for user-context clients (auto-provided) |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions | Service role for admin operations (auto-provided) |
| `LOVABLE_API_KEY` | `parse-table-plan`, `generate-release-notes`, `create-autonomous-release` | Lovable AI Gateway (OpenAI-compatible); if absent, AI features degrade to local fallback |
| `GITHUB_TOKEN` | `fetch-deployment-commits`, `create-autonomous-release` | GitHub PAT for reading commits; optional — function degrades gracefully if absent |
| `GITHUB_REPO_OWNER` | `fetch-deployment-commits`, `create-autonomous-release` | GitHub repo owner (e.g., `gaspa`) |
| `GITHUB_REPO_NAME` | `fetch-deployment-commits`, `create-autonomous-release` | GitHub repo name (e.g., `pourstock-v2`) |

**Note**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by the Supabase Edge Function runtime and do not need to be configured manually.

### Missing / Undocumented Variables

- `VITE_SUPABASE_PROJECT_ID` is in `.env.example` and `docs/development.md` but is **not referenced** in production code (only in `.env.example`). Its purpose is unclear.
- `VITE_APP_ENV` is in `.env.example` but **not used** in any detected code path.
- There is no documented process for rotating `LOVABLE_API_KEY` or `GITHUB_TOKEN` if they are compromised.

---

## 3. Build Pipeline

### Toolchain

| Tool | Version | Role |
|------|---------|------|
| Vite | ^5.4.19 | Build tool and dev server |
| @vitejs/plugin-react-swc | ^3.11.0 | React transform (SWC-based, fast) |
| TypeScript | ^5.8.3 | Type checking |
| Tailwind CSS | ^3.4.17 | Utility-first CSS |
| lovable-tagger | ^1.1.13 | Lovable component tagging (dev-only) |

### Build Scripts

| Script | Command | Output |
|--------|---------|--------|
| `npm run build` | `vite build` | `dist/` — production bundle |
| `npm run build:dev` | `vite build --mode development` | `dist/` — dev bundle (with source maps) |
| `npm run dev` | `vite` | Local dev server at `http://localhost:8080` |
| `npm run preview` | `vite preview` | Serves `dist/` locally |
| `npm run test` | `vitest run` | Runs test suite once |
| `npm run lint` | `eslint .` | Lints source files |

### Build Output

- Output directory: `dist/`
- Dev server port: `8080` (IPv6 `::`)
- HMR overlay: disabled (`hmr.overlay: false`)
- React deduplication enforced for `react`, `react-dom`, `react/jsx-runtime`
- `lovable-tagger` plugin active only in `development` mode

### Build-time env var injection

The `define` block in `vite.config.ts` hard-inlines `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at compile time (with fallback). This means:
- These values cannot be changed without a rebuild
- A new deploy is required if the Supabase project changes

---

## 4. Supabase Setup

### Project Details

| Parameter | Value |
|-----------|-------|
| Project ID | `wxxaeupbfvlvtofflqke` |
| Project URL | `https://wxxaeupbfvlvtofflqke.supabase.co` |
| Runtime | Deno (Edge Functions) |
| Config file | `supabase/config.toml` (project_id only) |

### Migrations

46 migration files exist, dating from **2026-01-31 to 2026-03-13**. They are UUID-named (Lovable-generated), not human-named. Migration names carry no semantic information — e.g., `20260310100142_e20c7226-681a-4ec1-bd2e-f1a7ad66bb4d.sql`.

No migration runner is configured in CI/CD; migrations must be applied manually with `supabase db push`.

### Edge Functions

6 Edge Functions deployed under `supabase/functions/`:

| Function | Purpose | Key External Calls |
|----------|---------|-------------------|
| `create-hotel` | Tenant provisioning — creates hotel, admin member, seeds departments/modules/room types | None (DB only) |
| `manage-users` | User CRUD, role assignment, department assignment, approval workflow | None (DB + Supabase Auth Admin) |
| `parse-table-plan` | AI-powered PDF reservation extraction, caching, audit logging, Phase 7 mirror write | Lovable AI Gateway → `google/gemini-2.5-flash` |
| `generate-release-notes` | AI conversion of raw notes/commits to user-friendly text (admin-only) | Lovable AI Gateway → `google/gemini-2.5-flash` |
| `fetch-deployment-commits` | Fetches recent commits from GitHub API | GitHub REST API |
| `create-autonomous-release` | End-to-end release pipeline: fetch commits, classify, generate notes, insert release record | GitHub REST API + Lovable AI Gateway |

All functions use the same CORS policy (see §7 Security).

### RLS (Row Level Security)

RLS is a foundational architectural principle. From code review and architecture documentation:

- Every operational table is scoped by `hotel_id`
- RLS policies enforce hotel isolation via `hotel_members` membership checks
- Security-definer reconciliation functions use fixed `search_path` and explicit role checks
- Analytics views use `security_invoker = true` — the querying user's RLS applies to all analytics queries
- No cross-hotel data access is possible at the database level

There is no automated RLS policy test suite or policy audit process documented.

### Key Database Objects

**Operational tables (primary sources of truth)**:
- `hotels`, `hotel_members`, `hotel_modules`, `hotel_settings`
- `reservations` (front office primary)
- `room_charges` (billing primary)
- `table_plans` with `assignments_json` (restaurant planning primary)
- `products`, `locations`, `purchase_orders`, `purchase_order_items`
- `housekeeping_tasks`, `housekeeping_logs`, `maintenance_requests`

**Normalized mirror tables (no UI reads yet)**:
- `stays`, `stay_guests`, `room_assignments`
- `folios`, `folio_items`, `payments`
- `restaurant_reservations`, `table_assignments`
- `checkin_events`, `checkout_events`

**Observability tables**:
- `dual_write_failures`, `reconciliation_log`, `audit_logs`, `ai_jobs`, `ai_cache`

**Analytics views**:
- `v_migration_health`, `v_stay_parity`, `v_folio_parity`, `v_parity_summary`
- `v_daily_occupancy`, `v_revenue_summary`
- `v_recent_stay_drift`, `v_recent_folio_drift`
- `v_dw_failure_hotspots`, `v_dw_failure_groups`
- `v_reconciliation_candidates`, `v_duplicate_stay_mirrors`, `v_duplicate_folio_mirrors`

**Reconciliation functions**:
- `reconcile_stay_from_reservation(_reservation_id)`
- `reconcile_folio_from_charges(_reservation_id)`

---

## 5. Hosting

### Frontend

| Parameter | Value |
|-----------|-------|
| Platform | Lovable Cloud |
| Production URL | `https://swift-stock-bar.lovable.app` |
| Preview URLs | `https://<id>-preview--<slug>.lovable.app` (auto-generated per edit) |
| CDN | Managed by Lovable (unknown provider) |
| Custom domain | Not configured |
| SSL | Managed by Lovable |

### Backend

| Parameter | Value |
|-----------|-------|
| Platform | Supabase (managed) |
| Database | PostgreSQL (Supabase-managed) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| Auth | Supabase Auth (email + password, email verification) |
| Realtime | Supabase Realtime (WebSocket subscriptions) |
| Storage | Not detected as in use |

### Deployment Trigger

There is no webhook, CI pipeline, or automated trigger. Deployments happen:
1. **Frontend**: developer publishes via Lovable UI
2. **Edge Functions**: developer runs `supabase functions deploy <name>` manually
3. **Database**: developer runs `supabase db push` manually

---

## 6. Missing Infrastructure

### No External Monitoring

There is no integration with any monitoring or observability platform:

| Concern | Status |
|---------|--------|
| Error tracking (Sentry, Datadog, Rollbar) | Not configured |
| Uptime monitoring (Better Uptime, Pingdom) | Not configured |
| Performance monitoring (APM) | Not configured |
| Alerting (PagerDuty, OpsGenie) | Not configured |
| Log aggregation (Logtail, Papertrail) | Not configured |

The only available logs are:
- Supabase dashboard → Edge Function logs (ephemeral, not persisted)
- `dual_write_failures` table (mirror write failures only)
- `audit_logs` table (user action audit trail)

### No Staging Environment

There is no staging environment. The Lovable preview URL is used as an informal staging, but it connects to the same production Supabase project. There is no separate staging database or Edge Function deployment.

### No Rollback Procedure

There is no documented rollback procedure for:
- A bad frontend deploy (no versioned deploy history)
- A bad Edge Function deploy
- A bad database migration

The database migration architecture is additive and designed to be reversible (see migration plan), but the procedure is not automated or documented as operational runbook steps.

### No Rate Limiting

No rate limiting is configured at the API gateway layer. Supabase provides basic database connection pooling but there is no explicit rate limiting on:
- Edge Function invocations
- AI API calls (`parse-table-plan` limits PDF size to 10MB but no per-user/per-hotel call rate limit)
- Authentication attempts

---

## 7. Security

### Secrets Management

| Secret | Where Stored | Risk |
|--------|-------------|------|
| `VITE_SUPABASE_URL` | `vite.config.ts` (fallback, committed) | Low — project URL is public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` (anon JWT) | `vite.config.ts` (fallback, committed) | Low — anon key is intentionally public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function runtime secrets | High risk if leaked — full DB access |
| `LOVABLE_API_KEY` | Supabase Edge Function secrets | Medium — AI credits, API access |
| `GITHUB_TOKEN` | Supabase Edge Function secrets | Medium — repo read access |

No secrets rotation policy is documented. No secret scanning is configured (no `.github/workflows/` or pre-commit hooks).

### CORS Policy

All 6 Edge Functions use a `getCorsHeaders()` function that:

1. Reads the `Origin` request header
2. Validates against `/^https:\/\/.*\.(lovable\.app|lovableproject\.com)$/`
3. If valid: reflects the origin back (allows all Lovable preview and production URLs)
4. If invalid: returns the hardcoded production origin (`https://swift-stock-bar.lovable.app`) — effectively blocking the request

This policy was tightened in March 2026 from `Access-Control-Allow-Origin: *`. See `docs/security/cors-policy.md`.

**Gap**: The CORS regex allows `*.lovableproject.com` in `parse-table-plan` but only `*.lovable.app` in the other 5 functions. There is a minor inconsistency that should be standardized.

### Authentication Flow

- Supabase Auth with email + password
- Sessions stored in `localStorage` with auto-refresh
- All Edge Functions verify JWT Bearer tokens
- Hotel membership is checked in Edge Functions using `hotel_members.is_approved`
- `hotel_role` determines admin vs. manager vs. staff permissions within a hotel
- `user_departments` provides department-level access scoping (e.g., restaurant access for `parse-table-plan`)
- Self-registration requires admin approval (`is_approved` flag)

### Auth Gaps

- No MFA (multi-factor authentication) is configured
- No IP-based access restrictions
- `localStorage` session storage is standard for SPAs but is vulnerable to XSS — no explicit XSS protection beyond React's default JSX escaping
- Password policy enforcement is handled by Supabase defaults (no documented minimum requirements visible in code)

---

## 8. Scalability Gaps

### Multi-Tenant Isolation

RLS enforcement is strong at the database level. However:

- **No per-tenant resource quotas** — one heavy tenant (many AI parse jobs) affects Supabase project limits for all tenants
- **AI cache is per-hotel** (`ai_cache` scoped by `hotel_id`) — this is correct
- **No tenant-level rate limiting** on Edge Function calls
- **Single Supabase project** hosts all tenants — no dedicated projects per hotel or per region

### Rate Limiting

| Surface | Rate Limiting | Notes |
|---------|--------------|-------|
| Frontend → Supabase DB | None explicit | Supabase connection limits apply globally |
| Frontend → Edge Functions | None explicit | No per-user throttle |
| `parse-table-plan` → AI | Size limit only (14MB base64) | No per-hotel daily limit |
| Supabase Auth | Supabase default limits | Not configurable at application layer |

### Caching

- **AI response caching**: `ai_cache` table with 7-day TTL and SHA-256 content hash key — well-designed
- **Frontend caching**: React Query (`@tanstack/react-query`) for client-side query caching — present
- **No CDN caching for API responses**: Edge Functions do not set cache headers
- **No database query caching** beyond Supabase's internal connection pool

### Realtime Scalability

- Supabase Realtime is used for live updates during service
- No channel-level isolation documented — unclear if all users in a hotel share one channel or per-user channels
- Supabase Realtime has connection limits that scale with plan tier

### Database

- Single PostgreSQL instance (Supabase managed)
- No read replicas
- No connection pooling configuration visible (using Supabase's built-in pooler)
- 46 migrations have been applied with no schema versioning automation

---

## Summary of Critical Findings

| Severity | Finding |
|----------|---------|
| High | No CI/CD pipeline — all deployments are fully manual with no automation or deployment gates |
| High | No staging environment — preview shares the production database |
| High | No error tracking or alerting — production errors are invisible until a user reports them |
| High | No rollback procedure documented for any layer |
| Medium | No MFA on authentication |
| Medium | No rate limiting on AI-intensive edge functions |
| Medium | Edge Function secrets have no rotation policy |
| Medium | CORS regex inconsistency between `parse-table-plan` and other functions |
| Medium | No automated RLS policy test suite |
| Low | `VITE_SUPABASE_PROJECT_ID` and `VITE_APP_ENV` in `.env.example` appear unused |
| Low | Migration files are UUID-named (no semantic description in filename) |
| Low | No custom domain — production is on `*.lovable.app` subdomain |
