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
reforms/
  future/        # Queued reform plans not yet started
  ongoing/       # Active reform work in progress
  done/          # Completed reforms
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
| Kitchen | `/kitchen`, `/kds` | `useDailyMenu`, `useMenuItems` |
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
- `stripe-connect` — Stripe payment integration
- `stripe-terminal` — Stripe terminal integration
- `export-guest-data` — GDPR guest data export

### CORS Policy

All edge functions use a shared CORS pattern. The allowed-origin regex must include:
- `*.lovable.app` (preview)
- `*.lovableproject.com` (preview)
- `*.pourstock.com` (production — including `www.pourstock.com`)
- `localhost:*` (development)

See `docs/security/cors-policy.md` for details.

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

---

## ⚠️ Collaboration Rules for Claude Code + Lovable

This project is developed by **two AI agents** working in parallel:
- **Lovable** — the primary builder (frontend, backend, edge functions, migrations, deployments)
- **Claude Code** — supplementary development (code changes, refactoring, feature work)

### Critical Rules

**1. NEVER create SQL migrations directly.**
Claude Code does NOT have migration privileges. All database schema changes (CREATE TABLE, ALTER TABLE, CREATE POLICY, etc.) must be relayed to Lovable for execution.

When you need a schema change:
- Write the SQL you want executed
- Add it to a message for the user to relay to Lovable
- Lovable will review, correct if needed, and execute via the migration tool

**2. NEVER reference `auth.users` with foreign keys.**
Supabase reserves the `auth` schema. Our convention:
- Store user UUIDs as plain `uuid` columns (no FK to `auth.users`)
- Use the `profiles` table in `public` schema for user metadata lookups
- Example: `published_by uuid` — NOT `published_by uuid REFERENCES auth.users(id)`

**3. Know the valid enums before writing SQL.**
Current database enums:

| Enum | Values |
|------|--------|
| `hotel_role` | `hotel_admin`, `manager`, `staff` |
| `department` | `reception`, `housekeeping`, `restaurant` |
| `hk_status` | `dirty`, `in_progress`, `clean`, `inspected` |
| `hk_priority` | `low`, `normal`, `high`, `urgent` |
| `hk_task_type` | `checkout`, `stay_over`, `deep_clean`, `public_area`, `inspection` |
| `beverage_category` | `beer`, `wine`, `spirits`, `coffee`, `soda`, `syrup` |
| `unit_type` | `count`, `ml`, `cl`, `litre`, `kg`, `gram` |
| `order_status` | `draft`, `sent`, `received`, `cancelled` |
| `maintenance_priority` | `low`, `medium`, `high`, `critical` |
| `maintenance_status` | `open`, `in_progress`, `resolved` |

> **There is no `kitchen` department.** Kitchen functionality uses the `restaurant` department.

**4. NEVER edit these auto-generated files:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

These are managed by Lovable Cloud and will be overwritten.

**5. RLS policies must follow the permission model:**
- Use `is_hotel_member()` for read access
- Use `has_hotel_role()` for role-specific access
- Use `has_hotel_department()` for department-specific access
- Use `is_hotel_dept_manager()` for department manager checks
- Always scope to `hotel_id` — never allow cross-tenant access

**6. Edge Functions use Deno runtime.**
- Do NOT use Node.js imports (`require`, `fs`, `path`, etc.)
- Use `Deno.env.get()` for secrets
- Include CORS headers with the standard pattern (see CORS Policy above)

**7. Type casting for Supabase queries.**
The auto-generated types sometimes lag behind schema changes. Use explicit casting:
```typescript
const { data } = await supabase.from('daily_menus').select('*');
const menus = (data as unknown) as DailyMenu[];
```

**8. Reform workflow.**
- Plans live in `reforms/future/`, `reforms/ongoing/`, `reforms/done/`
- Before starting a reform from `future/`, a pre-flight check must validate no conflicting changes occurred
- See `reforms/PRE-FLIGHT-CHECKLIST.md` for the protocol

**9. Coordinate, don't conflict.**
- If you're unsure whether Lovable has made recent changes to a file, ask the user
- Prefer creating new files over editing files Lovable actively manages
- When adding hooks or components, follow the existing naming conventions

**10. The `products` table has NO `quantity` column.**
Stock quantities are tracked via a separate inventory/stock system, not on the products table itself. Do not assume `products.quantity` exists.

---

## Agent Coordination Protocol

### Handoff Queue — `reforms/handoff.md`
Before starting work, **check `reforms/handoff.md`** for:
- Any `PENDING` requests you need to address
- Any `DONE` items with corrections that affect your current work

When you need Lovable to execute something (migration, secret, deploy):
1. Add an entry to `reforms/handoff.md` under `## Pending Requests`
2. Use the entry format documented in that file
3. Tell the user to relay it to Lovable

### Shared Changelog — `docs/CHANGELOG-AGENTS.md`
After making significant changes (new tables, architectural shifts, cross-cutting refactors):
1. Append an entry to `docs/CHANGELOG-AGENTS.md`
2. Include date, your agent name, what changed, and rationale

**Read this file at the start of each session** to understand recent changes by the other agent.

### Current Table Inventory

These tables exist in `public` schema as of 2026-04-02:

| Table | Key Columns | Notes |
|-------|------------|-------|
| `hotels` | id, name, slug, country, subscription_plan | Root tenant table |
| `hotel_members` | hotel_id, user_id, hotel_role, is_approved | Membership + role |
| `membership_roles` | membership_id, role | Extended role grants |
| `profiles` | user_id, email, full_name, is_approved | User metadata |
| `rooms` | hotel_id, number, floor, room_type, status | Room inventory |
| `room_types` | hotel_id, name, base_rate | Room type config |
| `guests` | hotel_id, first_name, last_name, email, passport_number | Guest registry |
| `guest_preferences` | guest_id, hotel_id, preference_type, preference_value | Guest prefs |
| `reservations` | hotel_id, guest_id, room_id, check_in_date, check_out_date | Room reservations |
| `stays` | hotel_id, reservation_id, guest_id, room_id, status | Active stays |
| `checkin_events` | hotel_id, stay_id, reservation_id, performed_by | Check-in log |
| `checkout_events` | hotel_id, stay_id, reservation_id, balance_status | Check-out log |
| `folios` | hotel_id, stay_id, reservation_id, guest_id, status, total | Billing folios |
| `folio_items` | folio_id, description, amount, charge_type | Line items |
| `payments` | folio_id, amount, method, reference | Payment records |
| `products` | hotel_id, name, category, unit_type, vendor_id | Product catalog (NO quantity column) |
| `product_categories` | hotel_id, name, slug, parent_id | Category tree |
| `vendors` | hotel_id, name, contact info | Supplier registry |
| `locations` | hotel_id, name | Storage locations |
| `reorder_rules` | hotel_id, product_id, min_threshold, reorder_quantity | Auto-reorder config |
| `purchase_orders` | hotel_id, vendor_id, status, total_cost | PO headers |
| `purchase_order_items` | order_id, product_id, quantity, received_quantity | PO line items |
| `daily_menus` | hotel_id, menu_date, starters, mains, desserts (jsonb) | Kitchen daily menus |
| `departments` | hotel_id, slug, display_name, is_active | Department config |
| `hotel_modules` | hotel_id, module, is_enabled, config | Feature flags |
| `hotel_settings` | hotel_id, key, value (jsonb) | Key-value settings |
| `housekeeping_tasks` | hotel_id, room_id, task_type, status, assigned_to | HK task queue |
| `housekeeping_logs` | hotel_id, task_id, action, performed_by | HK audit trail |
| `hk_checklists` | hotel_id, name, items (jsonb), task_type | Cleaning checklists |
| `hk_zones` | hotel_id, name, floors, assigned_staff | Zone assignments |
| `hk_incidents` | hotel_id, room_id, category, severity, status | Incident reports |
| `deep_clean_schedules` | hotel_id, room_id, interval_days, next_due | Deep clean tracking |
| `public_areas` | hotel_id, name, area_type, floor | Public area registry |
| `lost_found_items` | hotel_id, room_id, description, status | Lost & found |
| `maintenance_requests` | hotel_id, room_id, description, priority, status | Maintenance tickets |
| `reservation_imports` | hotel_id, file_name, status, result_summary | PDF import log |
| `parser_profiles` | hotel_id, name, config_json, is_default | AI parser config |
| `restaurants` | hotel_id, name | Restaurant entities |
| `service_periods` | restaurant_id, name | Meal periods |
| `restaurant_reservations` | hotel_id, table assignments, guest info | Table-plan reservations |
| `integrations` | hotel_id, provider, type, status | External integrations |
| `integration_events` | integration_id, event_type, payload | Integration event log |
| `audit_logs` | hotel_id, user_id, action, target_type, target_id | Security audit trail |
| `release_announcements` | version, title, content, is_published | Release notes |
| `release_metrics` | release_id, view_count, acknowledge_count | Release engagement |
| `ai_cache` | hotel_id, content_hash, result, expires_at | AI response cache |
| `ai_jobs` | hotel_id, job_type, status, model, input, output | AI job tracking |
| `dual_write_failures` | hotel_id, domain, operation, error_message | Migration failure log |
| `reconciliation_log` | hotel_id, action, result, triggered_by | Data reconciliation |
