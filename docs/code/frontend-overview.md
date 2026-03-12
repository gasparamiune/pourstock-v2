# Frontend Overview

This document explains how the PourStock frontend is structured — from the browser entry point down to individual pages and component groups.

---

## 1. Entry Points

### `index.html`
The single HTML file served by Vite. Contains the `<div id="root">` mount point that React attaches to.

### `src/main.tsx`
The JavaScript entry point. It:
1. Finds the `#root` DOM node.
2. Creates a React root and renders `<App />`.
3. Imports `index.css` for global Tailwind styles.

> **Note:** If `#root` is missing from the DOM (e.g., due to a broken `index.html`), the app will silently fail to render. See [`../known-issues.md`](../known-issues.md) for details.

### `src/index.css`
Global CSS. Sets Tailwind base/components/utilities layers and CSS custom properties for the design token system (colors, radii, shadows, sidebar dimensions).

---

## 2. Application Shell (`src/App.tsx`)

`App.tsx` sets up the entire provider tree and route map. Every piece of global state or infrastructure lives here:

```
QueryClientProvider          ← React Query cache
  └─ LanguageProvider        ← i18n (English / Danish)
       └─ TooltipProvider    ← Radix tooltip context
            └─ Toaster/Sonner ← Global toast notifications
                 └─ BrowserRouter
                      └─ AuthProvider        ← Session, user, roles
                           └─ SidebarProvider ← Sidebar open/close state
                                └─ Routes
```

### Route Structure

| Path | Component | Access |
|------|-----------|--------|
| `/auth` | `Auth` | Public |
| `/onboarding` | `Onboarding` | Authenticated only |
| `/` | `Dashboard` | Authenticated |
| `/inventory` | `Inventory` | Authenticated |
| `/products` | `Products` | Authenticated |
| `/import` | `Import` | Authenticated |
| `/table-plan` | `TablePlan` | Authenticated |
| `/orders` | `Orders` | Authenticated |
| `/reports` | `Reports` | Authenticated |
| `/reception` | `Reception` | Department: reception |
| `/housekeeping` | `Housekeeping` | Department: housekeeping |
| `/user-management` | `UserManagement` | Manager+ |
| `/settings` | `Settings` | Admin only |
| `/updates` | `Updates` | Authenticated |

All routes except `/auth` and `/onboarding` are wrapped in `ProtectedRoute` and rendered inside `AppShell` (navigation sidebar + header).

---

## 3. Pages (`src/pages/`)

Each file in `src/pages/` is a full-screen view rendered by the router.

| Page | Purpose |
|------|---------|
| `Auth.tsx` | Login and sign-up forms. Handles email/password authentication via Supabase. |
| `Dashboard.tsx` | Operational overview. Shows quick-access stats cards and recent activity. |
| `TablePlan.tsx` | AI-powered dinner service coordination. PDF upload, drag-and-drop seating, floor plan editor. Largest page at ~1,300 lines. |
| `Inventory.tsx` | Stock tracking. Displays product stock levels, triggers quick-count workflows. |
| `Products.tsx` | Product catalog management. Create, edit, delete products with vendor/category assignment. |
| `Import.tsx` | Bulk data import. CSV/Excel upload for products, inventory, and reservation data. |
| `Orders.tsx` | Purchase orders. Create orders to vendors; track receiving. |
| `Reports.tsx` | Analytics. Occupancy rates, revenue summaries, parity dashboards. |
| `Settings.tsx` | Hotel configuration. Admin-only: rooms, restaurants, departments, service periods, vendors, categories, user management. |
| `Reception.tsx` | Guest check-in/check-out. Room assignment board for front-office staff. |
| `Housekeeping.tsx` | Housekeeping task board. Assign and track room cleaning/inspection tasks. |
| `UserManagement.tsx` | User approval and role assignment. Lists pending and active users. |
| `Onboarding.tsx` | New hotel setup wizard. Creates hotel profile, first admin account. |
| `Updates.tsx` | Release history. Reads published `release_announcements` from the database. |
| `NotFound.tsx` | 404 fallback for unknown routes. |

---

## 4. Components (`src/components/`)

Components are grouped by domain under `src/components/`. Each group contains the UI pieces used by the corresponding page.

```
components/
├── ui/           ← shadcn/ui primitives (Button, Card, Dialog, etc.)
├── auth/         ← ProtectedRoute, login form parts
├── dashboard/    ← Stats cards, activity feed
├── inventory/    ← Quick-count panel, stock indicators
├── tableplan/    ← Floor plan canvas, table cards, PDF upload, assignment algorithm
├── reception/    ← Room board, guest management dialogs
├── housekeeping/ ← Task board, inspection dialogs
├── settings/     ← Config forms for each settings section
├── users/        ← User list, role assignment dialogs
├── layout/       ← AppShell, sidebar nav, top header
├── search/       ← Global search bar
├── flags/        ← Feature flag display/toggle
└── system/       ← Error display, system-level toasts
```

### `ui/` components
These come from the [shadcn/ui](https://ui.shadcn.com/) library. They are copied into the project (not installed as a package) and may be customized. Never edit the shadcn primitives unless you understand the component thoroughly — changes affect every use site.

### `layout/AppShell`
The main application chrome. Renders the sidebar navigation and top header around every authenticated page. Navigation items are gated by hotel modules (feature flags) and user roles.

---

## 5. State Management

PourStock uses two primary state mechanisms:

### React Query (`@tanstack/react-query`)
All server data (from Supabase) is fetched and cached via React Query. Each domain has a custom hook (see [`hooks-reference.md`](hooks-reference.md)) that calls `useQuery` or `useMutation`. This provides:
- Automatic background refresh
- Cache deduplication
- Loading/error states

The `QueryClient` is instantiated in `App.tsx` with default settings (3 retries, 5-minute stale time).

### React Context
| Context | Purpose |
|---------|---------|
| `AuthContext` | Current user, session, roles, active hotel, hotel memberships |
| `LanguageContext` | Current language, `t()` translation function, locale strings |
| `SidebarContext` | Sidebar open/closed state |

---

## 6. Styling

- **Tailwind CSS** for utility classes. Config in `tailwind.config.ts`.
- **shadcn/ui** for pre-built accessible components.
- **CSS custom properties** (design tokens) defined in `src/index.css`. These drive the light/dark theme.
- **Dark mode** toggled via the `class` strategy (add `dark` class to `<html>`).
- Custom color palette: `wine`, `beer`, `spirits`, `coffee`, `soda`, `syrup` — used in the inventory UI.

---

## 7. Build & Tooling

| Tool | Purpose | Config file |
|------|---------|-------------|
| **Vite** | Dev server and production bundler | `vite.config.ts` |
| **TypeScript** | Static typing | `tsconfig.json`, `tsconfig.app.json` |
| **ESLint** | Code quality linting | `eslint.config.js` |
| **Vitest** | Unit test runner | `vitest.config.ts` |
| **PostCSS + Autoprefixer** | CSS processing | `postcss.config.js` |

### Build commands

```bash
npm run dev        # Start dev server on http://localhost:8080
npm run build      # Production build → dist/
npm run lint       # Run ESLint
npm run test       # Run all tests once
npm run test:watch # Run tests in watch mode
```

### Environment variables

Defined in `.env` (copy from `.env.example`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Used by some tooling |
| `VITE_APP_ENV` | Optional | `development` or `production` |
| `VITE_APP_VERSION` | At build time | Semantic version (e.g. `1.1.0`). If unset, falls back to a date string and auto-release creation is skipped. |

> **Critical:** If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are missing, every Supabase call will fail and the app will not load data.
