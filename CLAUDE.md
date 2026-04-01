# PourStock v2

AI-powered operations platform for hotels and restaurants. Multi-tenant SaaS with strict Row Level Security data isolation.

**Production:** Sønderborg Strand Hotel, Denmark

## Stack

- **Framework:** Vite + React 18 (SPA, not Next.js)
- **Language:** TypeScript 5 (strict mode OFF — `noImplicitAny: false`, `strictNullChecks: false`)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3 + shadcn/ui (40+ Radix UI components)
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Async state:** TanStack React Query v5
- **Forms:** react-hook-form + Zod
- **Testing:** Vitest + Testing Library (jsdom)
- **Package manager:** npm (also has bun.lock — either works)

## Commands

```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint (flat config)
npm test           # Vitest (single run)
npm run test:watch # Vitest watch mode
npm run preview    # Preview production build
```

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_APP_ENV=development
```

Never commit `.env` files.

## Project Structure

```
src/
  api/           # Supabase query functions
  components/    # Feature-grouped components + ui/ (shadcn)
  contexts/      # React contexts (Language, Sidebar)
  hooks/         # Custom hooks — one per domain (useAuth, useInventoryData, etc.)
  integrations/
    supabase/    # client.ts + auto-generated types.ts (DO NOT HAND-EDIT types.ts)
  lib/           # Utils (utils.ts has cn()), errorHandler, hotel.ts, dualWriteLogger
  pages/         # Route-level page components
  types/         # Shared TypeScript types
supabase/
  functions/     # Deno Edge Functions (separate runtime — deno.lock)
  migrations/    # SQL migrations (additive only — never destructive)
```

## Path Alias

Use `@/` for all internal imports: `import { cn } from '@/lib/utils'`

## Key Conventions

**Components:**
- Feature components live in `src/components/<feature>/`
- Reusable UI primitives live in `src/components/ui/` (shadcn — don't modify these manually)
- Use `cn()` from `@/lib/utils` for conditional class names

**Hooks:**
- Business logic goes in custom hooks (`src/hooks/`), not in components
- One hook per domain (e.g. `useInventoryData`, `useHousekeeping`)
- Data fetching uses React Query inside hooks

**Auth:**
- Use `useAuth()` hook for all auth state — never read Supabase session directly
- Role helpers: `isAdmin`, `isManager`, `isStaff`, `hasDepartment()`, `isDepartmentManager()`
- Multi-tenant: always scope queries to `activeHotelId`; default hotel via `DEFAULT_HOTEL_ID` in `@/lib/hotel`

**Supabase:**
- Client is at `@/integrations/supabase/client`
- Types are auto-generated at `@/integrations/supabase/types` — regenerate with Supabase CLI, never edit manually
- RLS is enforced at the DB level; do not bypass it in queries
- Migrations are additive — never alter/drop columns until a full cutover phase

**Styling:**
- Dark mode: class-based (`dark:` prefix)
- Custom color tokens: `--wine`, `--beer`, `--spirits`, `--coffee`, `--soda`, `--syrup` (beverage categories)
- Room status colors: available, occupied, checkout, maintenance, reserved
- Housekeeping status colors: dirty, in-progress, clean, inspected
- Fonts: Inter (sans), DM Sans (display)

**Forms:**
- Always use react-hook-form + Zod resolvers
- Never use uncontrolled inputs for business forms

**Error handling:**
- Use `@/lib/errorHandler` for centralized error handling
- Use `sonner` (via `<Toaster />`) for toast notifications

## Domains

| Domain | Pages | Key Hook |
|---|---|---|
| Inventory | `/inventory`, `/products` | `useInventoryData` |
| Reception/Stays | `/reception` | `useReception`, `useStays` |
| Housekeeping | `/housekeeping` | `useHousekeeping` |
| Restaurant | `/table-plan`, `/orders` | `useTableLayout`, `useRestaurantReservations` |
| Billing | (within reception) | `useBilling` |
| Users | `/user-management` | `useUsers` |
| Settings | `/settings` | `useHotelSettings`, `useSettingsCrud` |

## Edge Functions (Deno)

Located in `supabase/functions/`. These run on a separate Deno runtime — do not import Node.js modules.

- `parse-table-plan` — AI PDF parsing (Gemini integration)
- `manage-users` — User lifecycle management
- `create-hotel` — Multi-tenant hotel provisioning
- `generate-release-notes` — Automated release notes
- `create-autonomous-release` — Release automation
- `fetch-deployment-commits` — Git integration

## Testing

- Tests go in `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `src/test/setup.ts`
- Environment: jsdom (browser DOM simulation)
- Globals enabled (no need to import `describe`, `it`, `expect`)

## Architecture Notes

- **Dual-write pattern:** During migrations, writes go to both old and new schema — see `dualWriteLogger.ts`
- **Additive schema evolution:** Never drop/rename columns in a migration until the cutover phase. Add new columns alongside old ones.
- **Multi-tenancy:** Enforced via Supabase RLS policies scoped to `hotel_id`. All queries must include hotel context.
- **Migration phases:** 12+ migration phases tracked in `.lovable/migration-master-plan.md`
- **Architecture decisions:** Documented in `docs/architecture/adr/`
