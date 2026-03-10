# PourStock Platform Migration Blueprint
## From Restaurant Tool → Full Hotel Operations SaaS

---

## STEP 1 — CURRENT STATE AUDIT

### 1.1 Existing Tables (20 tables)

| Table | hotel_id | RLS | Realtime | Status |
|-------|----------|-----|----------|--------|
| hotels | IS tenant | ✅ | ❌ | ✅ Keep |
| hotel_settings | ✅ | ✅ | ✅ | ✅ Keep |
| hotel_members | ✅ | ✅ | ✅ | ✅ Keep → rename to hotel_memberships |
| profiles | ❌ (user_id) | ✅ | ✅ | ✅ Keep |
| user_roles | ❌ (user_id) | ✅ | ✅ | ⚠️ Deprecate → membership_roles |
| user_departments | ✅ | ✅ | ✅ | ⚠️ Refactor → departments + membership link |
| audit_logs | ✅ | ✅ | ❌ | ✅ Keep |
| products | ✅ | ✅ | ✅ | ✅ Keep (add product_categories later) |
| locations | ✅ | ✅ | ✅ | ✅ Keep |
| stock_levels | ✅ | ✅ | ✅ | ✅ Keep |
| stock_movements | ✅ | ✅ | ✅ | ✅ Keep |
| purchase_orders | ✅ | ✅ | ✅ | ✅ Keep |
| purchase_order_items | ✅ | ✅ | ❌ | ✅ Keep |
| rooms | ✅ | ✅ | ✅ | ✅ Keep |
| guests | ✅ | ✅ | ✅ | ✅ Keep |
| reservations | ✅ | ✅ | ✅ | ⚠️ Keep → evolve to stays |
| room_charges | ✅ | ✅ | ❌ | ⚠️ Keep → evolve to charges |
| housekeeping_tasks | ✅ | ✅ | ✅ | ✅ Keep |
| housekeeping_logs | ✅ | ✅ | ❌ | ✅ Keep |
| maintenance_requests | ✅ | ✅ | ✅ | ✅ Keep |
| table_plans | ✅ | ✅ | ✅ | ✅ Keep (restaurant module) |
| table_plan_changes | ✅ | ✅ | ✅ | ✅ Keep |
| table_layouts | ✅ | ✅ | ❌ | ✅ Keep |
| parser_profiles | ✅ | ✅ | ❌ | ✅ Keep |
| system_notices | ❌ (global) | ✅ | ✅ | ✅ Keep |

### 1.2 Current Module Structure

```
Pages:          Dashboard, Inventory, Products, Import, TablePlan, Orders,
                Reports, Reception, Housekeeping, UserManagement, Settings,
                Onboarding, Auth

Hooks:          useAuth, useHotelSettings, useHousekeeping, useInventoryData,
                usePendingChanges, useReception, useTableLayout, useUsers,
                useRealtimeSubscription

Edge Functions: create-hotel, manage-users, parse-table-plan

API:            src/api/queries.ts (hotel-scoped query helpers)
```

### 1.3 Single-Hotel Assumptions Found

1. `src/lib/hotel.ts` — hardcoded `DEFAULT_HOTEL_ID` for Sønderborg Strand
2. `useAuth` — falls back to `DEFAULT_HOTEL_ID` on init
3. Navigation — sidebar uses flat department list, no hotel context switcher
4. `user_roles` — global app-level roles, not hotel-scoped
5. `user_departments` — recently fixed to include hotel_id ✅
6. No `hotel_modules` table — all features enabled for all hotels
7. No feature flags system

### 1.4 Existing Security Model

- ✅ RLS on all 20+ tables using security-definer helpers
- ✅ `is_hotel_member()`, `has_hotel_role()`, `has_hotel_department()`
- ✅ Edge functions validate JWT + membership server-side
- ✅ Audit logging on sensitive operations
- ✅ Tenant isolation via hotel_id filters
- ⚠️ Legacy `user_roles` still used in parallel with `hotel_members`
- ⚠️ `is_admin()` / `is_manager_or_admin()` use legacy global roles

### 1.5 Production-Critical Flows (MUST NOT BREAK)

1. **AI PDF Reservation Parsing** — parse-table-plan edge function → table_plans
2. **Table Planning** — drag-drop, merge, auto-assign, realtime sync
3. **Beverage Inventory** — quick counts, stock movements, par levels
4. **Purchase Orders** — create, send, receive workflow
5. **User Management** — create, approve, role assign, department assign
6. **Reception** — check-in/out, room board, guest directory
7. **Housekeeping** — task board, status updates, inspection flow
8. **Realtime Sync** — all operational pages auto-update across devices
9. **Onboarding** — hotel creation flow for new tenants

---

## STEP 2 — MIGRATION BLUEPRINT

### 2A. Current → Target Table Mapping

#### FOUNDATION (Phase 1 — implement first)

| Current | Target | Action |
|---------|--------|--------|
| `hotels` | `hotels` | ✅ Keep as-is |
| `hotel_settings` | `hotel_settings` | ✅ Keep as-is |
| — | `hotel_modules` | 🆕 Create (feature flags per hotel) |
| — | `departments` | 🆕 Create (replaces hardcoded enum) |
| `profiles` | `profiles` | ✅ Keep as-is |
| `hotel_members` | `hotel_memberships` | 🔄 Rename |
| `user_roles` | — | ⛔ Deprecate (replaced by membership_roles) |
| — | `membership_roles` | 🆕 Create (hotel-scoped roles) |
| `user_departments` | — | ⛔ Deprecate (replaced by membership + departments) |
| — | `membership_departments` | 🆕 Create (links membership to departments) |
| — | `user_approvals` | 🆕 Create (approval history/workflow) |
| `audit_logs` | `audit_logs` | ✅ Keep, add `event_type` column |

#### GUESTS / STAYS (Phase 2)

| Current | Target | Action |
|---------|--------|--------|
| `guests` | `guests` | ✅ Keep, add fields |
| — | `guest_preferences` | 🆕 Create |
| `reservations` | `stays` | 🔄 Rename + expand |
| — | `stay_guests` | 🆕 Create (multi-guest per stay) |
| `rooms` | `rooms` | ✅ Keep |
| — | `room_types` | 🆕 Create (replaces enum) |
| — | `room_assignments` | 🆕 Create (history of room changes) |

#### FRONT OFFICE (Phase 3)

| Current | Target | Action |
|---------|--------|--------|
| — | `checkin_events` | 🆕 Create |
| — | `checkout_events` | 🆕 Create |
| — | `front_office_tasks` | 🆕 Create |

#### HOUSEKEEPING (Phase 3)

| Current | Target | Action |
|---------|--------|--------|
| `housekeeping_tasks` | `housekeeping_tasks` | ✅ Keep |
| `housekeeping_logs` | `housekeeping_logs` | ✅ Keep |
| — | `room_status_history` | 🆕 Create |
| — | `lost_and_found_items` | 🆕 Create |

#### MAINTENANCE (Phase 3)

| Current | Target | Action |
|---------|--------|--------|
| `maintenance_requests` | `maintenance_requests` | ✅ Keep |
| — | `assets` | 🆕 Create |
| — | `maintenance_work_logs` | 🆕 Create |
| — | `maintenance_vendors` | 🆕 Create |

#### RESTAURANT / SERVICE (Phase 4)

| Current | Target | Action |
|---------|--------|--------|
| `table_plans` | `table_plans` | ✅ Keep (compatibility) |
| `table_plan_changes` | `table_plan_changes` | ✅ Keep |
| `table_layouts` | `table_layouts` | ✅ Keep |
| `parser_profiles` | `parser_profiles` | ✅ Keep |
| — | `restaurants` | 🆕 Create (multi-restaurant per hotel) |
| — | `service_periods` | 🆕 Create |
| — | `restaurant_reservations` | 🆕 Create |
| — | `table_assignments` | 🆕 Create |
| — | `table_service_events` | 🆕 Create |
| — | `reservation_imports` | 🆕 Create |

#### INVENTORY / PROCUREMENT (Phase 4)

| Current | Target | Action |
|---------|--------|--------|
| `products` | `products` | ✅ Keep |
| `locations` | `locations` | ✅ Keep |
| `stock_levels` | `stock_levels` | ✅ Keep |
| `stock_movements` | `stock_movements` | ✅ Keep |
| `purchase_orders` | `purchase_orders` | ✅ Keep |
| `purchase_order_items` | `purchase_order_items` | ✅ Keep |
| — | `product_categories` | 🆕 Create (replaces enum) |
| — | `vendors` | 🆕 Create |
| — | `stock_counts` | 🆕 Create |
| — | `stock_count_items` | 🆕 Create |
| — | `reorder_rules` | 🆕 Create |

#### BILLING (Phase 5)

| Current | Target | Action |
|---------|--------|--------|
| `room_charges` | `charges` | 🔄 Rename + generalize |
| — | `charge_types` | 🆕 Create (replaces enum) |
| — | `payments` | 🆕 Create |
| — | `folios` | 🆕 Create |

#### TASKS / NOTIFICATIONS (Phase 5)

| Current | Target | Action |
|---------|--------|--------|
| — | `tasks` | 🆕 Create (cross-department task system) |
| — | `notifications` | 🆕 Create |
| — | `notification_preferences` | 🆕 Create |

#### INTEGRATIONS (Phase 6)

| Current | Target | Action |
|---------|--------|--------|
| — | `integration_providers` | 🆕 Create |
| — | `hotel_integrations` | 🆕 Create |
| — | `integration_mappings` | 🆕 Create |
| — | `integration_sync_logs` | 🆕 Create |

#### AI / AUTOMATION (Phase 6)

| Current | Target | Action |
|---------|--------|--------|
| — | `ai_jobs` | 🆕 Create |
| — | `ai_prompts` | 🆕 Create |
| — | `ai_job_logs` | 🆕 Create |
| — | `automation_rules` | 🆕 Create |

#### AUDIT / EVENTS (Phase 6)

| Current | Target | Action |
|---------|--------|--------|
| `audit_logs` | `audit_logs` | ✅ Keep |
| — | `domain_events` | 🆕 Create |
| — | `webhook_events` | 🆕 Create |

#### ANALYTICS (Phase 7)

| Current | Target | Action |
|---------|--------|--------|
| — | `daily_operational_snapshots` | 🆕 Create |
| — | `kpi_definitions` | 🆕 Create |
| — | `hotel_kpi_values` | 🆕 Create |

### 2B. Tables to Keep (no changes needed)

- hotels, hotel_settings, profiles, products, locations, stock_levels,
  stock_movements, purchase_orders, purchase_order_items, rooms, guests,
  housekeeping_tasks, housekeeping_logs, maintenance_requests,
  table_plans, table_plan_changes, table_layouts, parser_profiles,
  system_notices, audit_logs

### 2C. Tables to Rename

- `hotel_members` → `hotel_memberships` (clarity)
- `room_charges` → `charges` (generalize beyond rooms)

### 2D. Tables to Split

- `user_departments` → `departments` (config) + `membership_departments` (assignment)
- `reservations` → `stays` (core) + `stay_guests` (multi-guest) + `room_assignments` (history)

### 2E. Tables to Deprecate

- `user_roles` — replaced by `membership_roles` (hotel-scoped)
- `user_departments` — replaced by `membership_departments`

### 2F. Data Migration Notes

1. **hotel_members → hotel_memberships**: Simple rename, all data preserved
2. **user_roles → membership_roles**: Map admin→hotel_admin, copy hotel_id from hotel_members
3. **user_departments → membership_departments**: Already has hotel_id, just needs membership_id link
4. **reservations → stays**: Add `stay_type`, `folio_id`; existing data maps 1:1
5. **room_charges → charges**: Add `charge_category`, `folio_id`; existing data preserved

### 2G. Compatibility Notes

| Flow | Risk | Mitigation |
|------|------|------------|
| AI PDF parsing | None | table_plans unchanged |
| Table planning | None | All table_* tables unchanged |
| Inventory | None | All stock/product tables unchanged |
| Purchase orders | None | Tables unchanged |
| User management | Medium | Keep user_roles compat layer during migration |
| Reception | Medium | reservations kept, stays added alongside |
| Housekeeping | None | Tables unchanged |
| Auth/roles | High | Dual-write to both old and new role tables |
| Realtime | None | Channel names stay the same |

### 2H. Priority Order

```
Phase 1: Foundation (hotel_modules, departments, membership refactor)
         ↓ enables feature flags, proper role model
Phase 2: Guests & Stays (stay model, room types, guest prefs)
         ↓ enables proper front office
Phase 3: Front Office + HK + Maintenance expansions
         ↓ new operational features
Phase 4: Restaurant + Inventory expansions
         ↓ multi-restaurant, vendors, stock counts
Phase 5: Billing + Tasks + Notifications
         ↓ folio system, cross-dept tasks
Phase 6: Integrations + AI + Events
         ↓ POS connectors, automation
Phase 7: Analytics
         ↓ KPIs, operational snapshots
```

---

## STEP 3 — FOUNDATIONAL REFORM (Phase 1 Implementation)

### 3.1 New Tables to Create

#### hotel_modules
```sql
CREATE TABLE public.hotel_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  module text NOT NULL, -- 'reception', 'housekeeping', 'restaurant', 'inventory', 'billing', etc.
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, module)
);
```

#### departments (config table — replaces hardcoded enum)
```sql
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL, -- 'reception', 'housekeeping', 'restaurant', 'maintenance'
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, name)
);
```

#### membership_roles (replaces user_roles — hotel-scoped)
```sql
CREATE TABLE public.membership_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES hotel_members(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'hotel_admin', 'manager', 'staff'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(membership_id, role)
);
```

### 3.2 Compatibility Layer Strategy

During migration, we maintain DUAL-WRITE:
- When a role is assigned via manage-users, write to BOTH `user_roles` AND `membership_roles`
- When checking permissions, check `hotel_members.hotel_role` (already the primary source)
- `user_roles` becomes read-only legacy — no new code should depend on it
- After all code migrated, drop `user_roles` (Phase 5+)

### 3.3 Security-Definer Helpers to Add

```sql
-- Check if hotel has a module enabled
CREATE FUNCTION has_hotel_module(_hotel_id uuid, _module text) RETURNS boolean;

-- Check membership role (new model)
CREATE FUNCTION has_membership_role(_membership_id uuid, _role text) RETURNS boolean;
```

### 3.4 RLS Strategy for New Tables

All new tables follow the pattern:
- SELECT: `is_hotel_member(auth.uid(), hotel_id)`
- INSERT/UPDATE: `is_hotel_admin_or_manager(auth.uid(), hotel_id)`
- DELETE: `has_hotel_role(auth.uid(), hotel_id, 'hotel_admin')`

---

## STEP 4 — CODE STRUCTURE REFACTOR PLAN

### 4.1 Current → Target Directory Structure

```
src/
├── api/
│   └── queries.ts          → split into domain modules
├── features/               → NEW: domain-organized modules
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── useAuth.ts
│   │   └── AuthPage.tsx
│   ├── hotels/
│   │   ├── useHotelSettings.ts
│   │   ├── useHotelModules.ts
│   │   └── HotelSwitcher.tsx
│   ├── reception/
│   │   ├── queries.ts
│   │   ├── useReception.ts
│   │   └── components/
│   ├── housekeeping/
│   ├── restaurant/
│   │   ├── table-plan/
│   │   ├── service/
│   │   └── components/
│   ├── inventory/
│   │   ├── queries.ts
│   │   ├── useInventory.ts
│   │   └── components/
│   ├── procurement/
│   ├── users/
│   └── settings/
├── components/
│   ├── ui/                 → keep shadcn components
│   └── layout/             → AppShell, navigation
├── hooks/                  → shared hooks only
├── lib/                    → utilities
└── types/                  → shared types
```

### 4.2 Migration Order for Code

1. Create `src/features/` directory structure
2. Move auth code: `useAuth` → `features/auth/`
3. Move hotel code: `useHotelSettings` → `features/hotels/`
4. Move user management → `features/users/`
5. Move inventory → `features/inventory/`
6. Move restaurant/table-plan → `features/restaurant/`
7. Move reception → `features/reception/`
8. Move housekeeping → `features/housekeeping/`
9. Update imports throughout
10. Split `api/queries.ts` into per-feature query files

### 4.3 What Stays the Same

- All shadcn/ui components untouched
- AppShell structure (sidebar + main content)
- React Router setup
- TanStack Query patterns
- Realtime subscription patterns
- Tailwind design tokens
- Edge function patterns

---

## STEP 5 — BACKWARD COMPATIBILITY GUARANTEES

### Compatibility Layers

1. **Role Compat**: `hotel_members.hotel_role` is already the primary role source.
   `user_roles` kept read-only. `is_admin()` and `is_manager_or_admin()` continue working.

2. **Department Compat**: `user_departments` kept functioning.
   New `departments` table is additive. Old enum still works in RLS policies.

3. **Reservation Compat**: `reservations` table stays. `stays` created alongside.
   View/alias can map `reservations` → `stays` when ready.

4. **Charge Compat**: `room_charges` stays. `charges` created alongside.

5. **Module Compat**: Without `hotel_modules` rows, all modules default to enabled
   (backward compatible — existing hotels see no change).

### What Will NOT Change in Phase 1

- table_plans, table_plan_changes, table_layouts ✅
- products, stock_levels, stock_movements ✅
- purchase_orders, purchase_order_items ✅
- housekeeping_tasks, housekeeping_logs ✅
- maintenance_requests ✅
- parse-table-plan edge function ✅
- All UI components and pages ✅
- Realtime subscriptions ✅

---

## IMPLEMENTATION STATUS

- [x] Current-state audit
- [x] Target architecture summary
- [x] Migration blueprint
- [ ] Phase 1 schema changes (hotel_modules, departments)
- [ ] Phase 1 RLS/security
- [ ] Phase 1 code structure refactor
- [ ] Phase 2–7 (future)
