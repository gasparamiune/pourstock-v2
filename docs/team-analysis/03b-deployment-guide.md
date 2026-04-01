# PourStock Deployment Guide

**Prepared by**: DevOps & Deployment Analyst
**Date**: 2026-03-18

This guide covers everything needed to set up a local development environment, work with the staging preview, and deploy to production — including Edge Functions and database migrations.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Staging Environment](#3-staging-environment)
4. [Production Deployment](#4-production-deployment)
   - 4a. [Frontend](#4a-frontend-deploy)
   - 4b. [Edge Functions](#4b-edge-function-deploy)
   - 4c. [Database Migrations](#4c-database-migrations)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Deployment Checklist](#6-deployment-checklist)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Operational Monitoring](#8-operational-monitoring)

---

## 1. Prerequisites

### Required Tools

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 18.x | https://nodejs.org or `nvm install 18` |
| npm | 9.x (bundled with Node 18) | Bundled |
| Supabase CLI | Latest | `npm install -g supabase` or see https://supabase.com/docs/guides/cli |
| Git | Any recent | https://git-scm.com |

### Optional Tools

| Tool | Purpose | Install |
|------|---------|---------|
| Bun | Faster alternative to npm (project has `bun.lock`) | https://bun.sh |
| Deno | Required for local Edge Function development/testing | https://deno.land |

### Accounts Required

| Account | Purpose |
|---------|---------|
| Supabase account | Database access, Edge Function management |
| Lovable account | Frontend deployment |
| GitHub account | Source control, commit history for release notes |

---

## 2. Local Development Setup

### Step 1: Clone the repository

```bash
git clone <repository-url>
cd pourstock-v2
```

### Step 2: Install dependencies

```bash
npm install
# or, if using bun:
bun install
```

### Step 3: Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```bash
# .env
VITE_SUPABASE_PROJECT_ID=wxxaeupbfvlvtofflqke
VITE_SUPABASE_URL=https://wxxaeupbfvlvtofflqke.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_APP_ENV=development
```

**Note**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` have build-time fallback values in `vite.config.ts`. If you omit them from `.env`, the app will still connect to the production Supabase project. Set them explicitly if you want to point at a different project.

To find your anon key: Supabase Dashboard → Project Settings → API → `anon` `public` key.

### Step 4: Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**.

Hot Module Replacement (HMR) is active. The HMR error overlay is disabled (`hmr.overlay: false`) — check the browser console for errors.

### Step 5: Verify the connection

1. Open http://localhost:8080
2. The login page should render (not a black screen)
3. Check the browser console — no `Missing required environment variables` errors should appear
4. Open DevTools → Network tab — verify requests go to `https://wxxaeupbfvlvtofflqke.supabase.co`

### Step 6: Authenticate as a test user

Log in with a hotel admin account created via the `manage-users` Edge Function or directly via the Supabase Auth dashboard.

### Running Tests

```bash
npm run test          # Run all tests once
npm run test:watch    # Run in watch mode (re-runs on file save)
```

Tests use Vitest + jsdom + Testing Library. Test files must match `src/**/*.{test,spec}.{ts,tsx}`.

### Linting

```bash
npm run lint
```

Uses ESLint 9 with `typescript-eslint` and `eslint-plugin-react-hooks`.

---

## 3. Staging Environment

### Current State

PourStock does not have a dedicated staging environment. The Lovable preview URL acts as informal staging but **connects to the production Supabase database**.

This means:
- Any data changes made in preview affect production data
- There is no staging database to test migrations safely
- New Edge Function deployments affect production immediately

### Using Lovable Preview as Staging

Every time you save changes in Lovable, a new preview URL is generated:

```
https://<session-id>-preview--swift-stock-bar.lovable.app
```

This preview uses the same frontend code you just edited and the same production backend.

**Safe practices for preview testing:**
- Use a dedicated test hotel created specifically for preview testing
- Do not run destructive operations against live hotel data from preview
- Preview Edge Function calls hit the same production Edge Functions

### Recommended Future Improvement

Create a separate Supabase project for staging:

1. Create a new Supabase project (`pourstock-staging`)
2. Apply all migrations: `supabase db push --db-url <staging-db-url>`
3. Deploy all Edge Functions to the staging project
4. Create a separate Lovable project or build config pointing at the staging Supabase URL
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the staging project's env vars

---

## 4. Production Deployment

### Overview of production components

| Component | Platform | Deploy method |
|-----------|---------|---------------|
| Frontend (React/Vite SPA) | Lovable Cloud | Publish via Lovable UI |
| Edge Functions (6 Deno functions) | Supabase | `supabase functions deploy` |
| Database schema | Supabase PostgreSQL | `supabase db push` |
| Edge Function secrets | Supabase | `supabase secrets set` |

---

### 4a. Frontend Deploy

#### Method: Lovable UI Publish

1. Open the Lovable project at https://lovable.dev
2. Make or review your code changes
3. Click **Publish** (or the deploy button)
4. Lovable runs `vite build` and serves the output bundle
5. The production URL updates: `https://swift-stock-bar.lovable.app`

#### How build-time env vars work

The production bundle always contains hardcoded fallback values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (set in `vite.config.ts`). If Lovable injects the env vars during build, those take priority. If not, the fallbacks ensure the app connects to the production project.

**If you change the Supabase project**: update the fallback values in `vite.config.ts`:

```typescript
// vite.config.ts
const FALLBACK_SUPABASE_URL = "https://<new-project-id>.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "<new-anon-key>";
```

Then republish via Lovable.

#### Verifying a frontend deploy

1. Open `https://swift-stock-bar.lovable.app` in an incognito window
2. The login page must render (not a black screen)
3. Open DevTools → Console — no `Missing required environment variables` error
4. Verify network requests target the correct Supabase URL
5. Log in and confirm critical flows work (see §6 Deployment Checklist)

---

### 4b. Edge Function Deploy

#### Prerequisites

Log in and link the Supabase project:

```bash
supabase login
supabase link --project-ref wxxaeupbfvlvtofflqke
```

#### Deploy a single function

```bash
supabase functions deploy <function-name>
```

Available function names:
- `create-hotel`
- `manage-users`
- `parse-table-plan`
- `generate-release-notes`
- `fetch-deployment-commits`
- `create-autonomous-release`

#### Deploy all functions

```bash
supabase functions deploy create-hotel
supabase functions deploy manage-users
supabase functions deploy parse-table-plan
supabase functions deploy generate-release-notes
supabase functions deploy fetch-deployment-commits
supabase functions deploy create-autonomous-release
```

There is no single command to deploy all functions in this project. Run each individually.

#### Set Edge Function secrets

Secrets must be set before functions are invoked. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime. You only need to set application secrets:

```bash
# AI gateway (required for parse-table-plan, generate-release-notes, create-autonomous-release)
supabase secrets set LOVABLE_API_KEY=<your-lovable-api-key>

# GitHub integration (optional — functions degrade gracefully if absent)
supabase secrets set GITHUB_TOKEN=<your-github-pat>
supabase secrets set GITHUB_REPO_OWNER=<github-username-or-org>
supabase secrets set GITHUB_REPO_NAME=pourstock-v2
```

#### Verify function deployment

```bash
supabase functions list
```

Check the Supabase Dashboard → Edge Functions for deployment status and recent invocation logs.

---

### 4c. Database Migrations

#### Prerequisites

Ensure the Supabase CLI is linked to the project:

```bash
supabase link --project-ref wxxaeupbfvlvtofflqke
```

#### Check migration status

```bash
supabase db diff --schema public
```

This compares the local migration files against what is applied in the remote database.

#### Apply new migrations

```bash
supabase db push
```

This applies any unapplied migrations from `supabase/migrations/` to the remote database.

**Caution**: `supabase db push` applies migrations directly to production. There is no staging gate. Test migration SQL carefully before running in production.

#### Creating a new migration

```bash
supabase migration new <descriptive-name>
```

This creates a new timestamped `.sql` file in `supabase/migrations/`. Write your SQL DDL in the file, then apply with `supabase db push`.

**Note**: Existing migration files are UUID-named (generated by Lovable). Use a human-readable descriptive name for new migrations so they are identifiable.

#### Verify migration applied

```bash
supabase db diff --schema public
```

Output should show no difference after a successful `db push`.

---

## 5. Environment Variables Reference

### Frontend Variables (`.env` / build-time)

| Variable | Required | Default (fallback) | Description |
|----------|----------|-------------------|-------------|
| `VITE_SUPABASE_URL` | Yes | `https://wxxaeupbfvlvtofflqke.supabase.co` | Supabase project REST API endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anon key (safe to expose client-side) |
| `VITE_SUPABASE_PROJECT_ID` | No | — | Project ID (in `.env.example` but not used in code) |
| `VITE_APP_ENV` | No | `development` | App environment label (in `.env.example` but not used in code) |

**How to find these values**: Supabase Dashboard → Project Settings → API

### Edge Function Secrets (Supabase secrets store)

| Secret | Required | Auto-injected | Description |
|--------|----------|--------------|-------------|
| `SUPABASE_URL` | Yes | Yes (runtime) | Project API URL |
| `SUPABASE_ANON_KEY` | Yes | Yes (runtime) | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes (runtime) | Service role key — full DB access, keep secret |
| `LOVABLE_API_KEY` | Conditional | No | Lovable AI Gateway API key. Required for AI features. Without it: `parse-table-plan` will fail; `generate-release-notes` and `create-autonomous-release` fall back to local (non-AI) generation. |
| `GITHUB_TOKEN` | Optional | No | GitHub Personal Access Token with `repo:read` scope. Required for `fetch-deployment-commits` and `create-autonomous-release` to pull commit history. Without it: functions return `github_not_configured` and operate in fallback mode. |
| `GITHUB_REPO_OWNER` | Optional | No | GitHub username or org name of the repo (e.g., `gaspa`) |
| `GITHUB_REPO_NAME` | Optional | No | GitHub repository name (e.g., `pourstock-v2`) |

### Setting secrets via CLI

```bash
# View current secrets (names only, not values)
supabase secrets list

# Set a secret
supabase secrets set KEY_NAME=value

# Unset a secret
supabase secrets unset KEY_NAME
```

---

## 6. Deployment Checklist

### Before Any Deploy

- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] Reviewed changes in Lovable or `git diff`
- [ ] Informed production hotel (Sønderborg Strand) if changes affect live service flows

### After Frontend Deploy

- [ ] Open `https://swift-stock-bar.lovable.app` in incognito
- [ ] Login page renders (no black screen)
- [ ] No `Missing required environment variables` in DevTools console
- [ ] Network requests target `https://wxxaeupbfvlvtofflqke.supabase.co`
- [ ] Log in with a hotel admin account — dashboard loads
- [ ] Verify at least one critical flow:
  - Table plan loads
  - Inventory page loads
  - Reception page loads

### After Edge Function Deploy

- [ ] Check Supabase Dashboard → Edge Functions → function appears as deployed
- [ ] Trigger a test invocation (e.g., fetch-deployment-commits from the release notes UI)
- [ ] Check Edge Function logs for errors: Supabase Dashboard → Edge Functions → Logs

### After Migration Apply

- [ ] `supabase db diff --schema public` shows no diff
- [ ] Open the app and verify no console errors related to missing columns or tables
- [ ] Check `v_migration_health` (if accessible via app) for per-hotel status

### Production-Critical Flows to Revalidate

From the architecture documentation, these flows must work after any significant change:

1. Login → hotel selection → dashboard load
2. Table plan load → AI parse → save → realtime sync
3. Inventory quick count → stock adjustment
4. Purchase order create → send → receive
5. Check-in → room assignment → room status update
6. Check-out → HK task generation → room status update
7. Room charge creation → folio mirror
8. User creation → approval workflow
9. Realtime updates across devices
10. Settings CRUD for all 8 configuration domains

---

## 7. Rollback Procedures

### Frontend Rollback

Lovable does not expose a versioned deploy history via the UI. To roll back a bad frontend deploy:

1. Identify the last known-good commit in Git
2. In Lovable, revert the changes (or use Git to reset to the previous commit)
3. Republish from the Lovable UI

**Limitation**: Without deploy versioning, rollback requires knowing the exact previous code state.

### Edge Function Rollback

Supabase does not maintain a deployment history for Edge Functions.

To roll back:
1. Check out the previous version of the function from Git
2. Re-deploy: `supabase functions deploy <function-name>`

### Database Migration Rollback

Supabase does not automatically roll back migrations. The project's migration strategy is **additive** — new tables and columns are added before legacy ones are removed. This means most migrations are safe to leave applied.

To roll back a migration:
1. Write a new migration that reverses the DDL (e.g., `DROP TABLE IF EXISTS <new_table>`)
2. Apply the reversal: `supabase db push`

For mirror table removal (temporary rollback of dual-write):
1. Remove the mirror write calls from the relevant React hook
2. Deploy the updated frontend
3. Optionally drop mirror tables with a new migration

**Never modify existing migration files** — Supabase tracks which files have been applied by filename.

### Edge Function Secret Rollback

If a secret is compromised:

```bash
supabase secrets set KEY_NAME=<new-value>
```

Functions automatically pick up the new value on the next invocation (no redeploy needed for secret-only changes).

---

## 8. Operational Monitoring

### Available Monitoring (Current)

| Tool | Location | What it shows |
|------|---------|---------------|
| Edge Function logs | Supabase Dashboard → Edge Functions → Logs | Console output, errors (ephemeral — not persisted long-term) |
| Database audit trail | `audit_logs` table | User actions (hotel create, user create, table plan parse, etc.) |
| Migration health | `v_migration_health` view | Per-hotel parity %, failure counts, status recommendation |
| Dual-write failures | `dual_write_failures` table | Mirror write errors with domain, operation, payload |
| AI job log | `ai_jobs` table | AI call records, token usage, cost estimates |
| AI cache stats | `ai_cache` table | Cache hits/misses for PDF parsing |

### Daily Monitoring Queries (Soak Period)

Run these SQL queries via Supabase Dashboard → SQL Editor during the soak validation period:

```sql
-- Per-hotel migration health
SELECT * FROM v_migration_health;

-- Recent dual-write failures (last 24h)
SELECT * FROM v_dw_failure_hotspots WHERE period = '24h';

-- Duplicate stay mirrors
SELECT * FROM v_duplicate_stay_mirrors;

-- Duplicate folio mirrors
SELECT * FROM v_duplicate_folio_mirrors;

-- Recent reconciliation candidates
SELECT * FROM v_reconciliation_candidates LIMIT 20;
```

### Responding to Failures

If `v_migration_health` shows `monitor` or `not_ready`:

1. Check `v_dw_failure_hotspots` for failure domain patterns
2. Check `v_stay_parity` or `v_folio_parity` for row-level drift
3. Check `v_dw_failure_groups` for systematic errors
4. Use `v_reconciliation_candidates` to prioritize repairs
5. Run reconciliation functions for targeted fixes:
   ```sql
   SELECT reconcile_stay_from_reservation('<reservation-id>');
   SELECT reconcile_folio_from_charges('<reservation-id>');
   ```
6. Verify repairs in `reconciliation_log`

See `docs/operations/runbooks/` for full investigation runbooks.

### Recommended Future Monitoring Setup

| Tool | Priority | Purpose |
|------|----------|---------|
| Sentry (or similar) | High | Frontend error tracking with stack traces |
| Uptime Robot or Better Uptime | High | Alert when `swift-stock-bar.lovable.app` is unreachable |
| Supabase log drain → Logtail | Medium | Persistent Edge Function log retention |
| PagerDuty or similar | Medium | On-call alerting for production incidents |
| Grafana + Supabase metrics | Low | Database performance dashboards |
