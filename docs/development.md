# Development Guide

## Prerequisites

- Node.js 18+
- npm or bun

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in backend credentials
npm run dev
```

The app runs at `http://localhost:8080`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Backend API endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public client key |
| `VITE_SUPABASE_PROJECT_ID` | Backend project identifier |

> **Note:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` have build-time fallbacks defined in `vite.config.ts`. If the hosting platform fails to inject them, the fallback values ensure the app connects to the correct backend. See [ADR-006](docs/architecture/adr/ADR-006-build-time-env-fallback.md) and [Troubleshooting: Black Screen](docs/troubleshooting/live-black-screen.md) for details.

Edge Functions use additional server-side secrets (not committed):
- `GITHUB_TOKEN` — for deployment commit fetching
- `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` — repository coordinates

## Project Layout

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Route-level page components |
| `src/components/` | UI components organized by domain (dashboard, reception, housekeeping, tableplan, inventory, settings, users) |
| `src/hooks/` | Business logic hooks — each module has a primary hook (e.g. `useReception`, `useHousekeeping`, `useInventoryData`) |
| `src/contexts/` | React contexts for auth, language, sidebar state |
| `src/lib/` | Utilities, error handling, version detection, dual-write logging |
| `src/integrations/supabase/` | Auto-generated backend client and TypeScript types |
| `supabase/functions/` | Edge Functions (Deno runtime) for server-side logic |
| `supabase/migrations/` | Database schema migrations |
| `docs/` | Architecture decisions, runbooks, product docs |

## Backend Integration

All backend queries use the generated client at `src/integrations/supabase/client.ts`. This file is auto-generated — do not edit it manually.

Type definitions at `src/integrations/supabase/types.ts` are also auto-generated from the database schema.

### Edge Functions

Located in `supabase/functions/`. Each function is a self-contained Deno module:

| Function | Purpose |
|----------|---------|
| `create-hotel` | Hotel tenant provisioning |
| `manage-users` | User role and approval management |
| `parse-table-plan` | AI-powered reservation PDF extraction |
| `generate-release-notes` | AI release note generation |
| `fetch-deployment-commits` | GitHub commit ingestion |
| `create-autonomous-release` | End-to-end release pipeline |

## Testing

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
```

Tests use Vitest with jsdom and Testing Library.

## Build

```bash
npm run build       # Production build
npm run build:dev   # Development build
```

Output is written to `dist/`.
