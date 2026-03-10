# Phase 2 Blueprint — Operational Model Readiness

## Phase 1 Validation Pass (completed)

### Flow-by-Flow Verification

| # | Flow | Status | Evidence |
|---|------|--------|----------|
| 1 | **Login** | ✅ INTACT | `useAuth` reads `profiles`, `user_roles`, `user_departments`, `hotel_members`. No Phase 1 tables are read. |
| 2 | **Approval flow** | ✅ INTACT | `ProtectedRoute` checks `profile.is_approved` + `hotelMemberships.is_approved`. Source: legacy tables only. |
| 3 | **Create user** | ✅ INTACT | `manage-users` edge function writes to `auth.users` → `profiles` → `hotel_members` → `user_roles` → `user_departments` (all PRIMARY). Mirror to `membership_roles` is best-effort, failure-isolated. |
| 4 | **Update user role** | ✅ INTACT | `updateRole` action updates `hotel_members.hotel_role` + `user_roles` (PRIMARY). Mirror to `membership_roles` best-effort. |
| 5 | **Create hotel** | ✅ INTACT | `create-hotel` creates `hotels` → `hotel_members` (PRIMARY). Seeds `departments`, `hotel_modules`, `membership_roles` best-effort via `seedPhase1Tables`. |
| 6 | **Table plan load** | ✅ INTACT | `useTableLayout` reads `table_layouts` via `fetchDefaultTableLayout`. No Phase 1 tables involved. |
| 7 | **Inventory load** | ✅ INTACT | `useInventoryData` reads `products`, `locations`, `stock_levels`, `stock_movements` via `api/queries`. No Phase 1 tables. |
| 8 | **Purchase orders load** | ✅ INTACT | Reads `purchase_orders` + `purchase_order_items` via hotel-scoped queries. No Phase 1 tables. |
| 9 | **Reception load** | ✅ INTACT | `useReception` reads `rooms`, `guests`, `reservations`, `room_charges`. No Phase 1 tables. |
| 10 | **Housekeeping load** | ✅ INTACT | `useHousekeeping` reads `housekeeping_tasks`, `maintenance_requests`. No Phase 1 tables. |
| 11 | **Realtime sync** | ✅ INTACT | `useRealtimeSubscription` subscribes to operational tables only. Phase 1 tables not in `HOTEL_SCOPED_TABLES` set. |
| 12 | **Cross-hotel RLS** | ✅ INTACT | All business tables use `is_hotel_member()` / `has_hotel_role()` / `has_hotel_department()`. These functions read `hotel_members` and `user_departments` — unchanged. Phase 1 tables have their own tenant-isolated RLS. |

### Risks & Manual Checks

- **No automated tests exist for auth flows.** Manual login/logout verification recommended.
- **Realtime channel names are not hotel-scoped** in `useReception` and `useHousekeeping` (they use generic names like `rooms-realtime`). This is a pre-existing concern, not caused by Phase 1.
- **`useUsers` reads `profiles`, `user_roles`, `user_departments`** — all legacy tables. Intact.

### Phase 1 Production Safety Declaration

✅ **Phase 1 is production-safe.** No production code reads from `hotel_modules`, `departments`, or `membership_roles`. All Phase 1 writes are best-effort mirrors that cannot block primary flows.

---

## Phase 2 Blueprint

### A. GUESTS / STAYS / ROOMS

#### Current State
| Current Table | Purpose | hotel_id | Status |
|---------------|---------|----------|--------|
| `guests` | Guest records | ✅ | Keep as-is |
| `rooms` | Room inventory | ✅ | Keep as-is |
| `reservations` | Bookings (check-in/out, billing) | ✅ | Keep as-is (future: split into `stays`) |

#### Target Architecture Mapping
| Target Table | Source | Phase 2 Action |
|--------------|--------|----------------|
| `guests` | `guests` | **Keep as-is** — already well-structured |
| `guest_preferences` | New | **Create now** — additive, no dependencies |
| `stays` | `reservations` (future) | **Defer to Phase 3** — requires read migration |
| `stay_guests` | New | **Defer to Phase 3** — depends on `stays` |
| `room_types` | New | **Create now** — additive reference table |
| `room_assignments` | New | **Defer to Phase 3** — depends on `stays` |

#### Rationale
- `room_types` is a pure reference table that enriches `rooms` without breaking anything
- `guest_preferences` is additive and prepares for personalized service
- `stays`, `stay_guests`, `room_assignments` require migrating reads from `reservations` — too risky for Phase 2

### B. RESTAURANT / SERVICE

#### Current State
| Current Table | Purpose | hotel_id | Status |
|---------------|---------|----------|--------|
| `table_layouts` | Restaurant floor plan | ✅ | Keep as-is |
| `table_plans` | Daily table assignments | ✅ | Keep as-is |
| `table_plan_changes` | Change requests | ✅ | Keep as-is |
| `parser_profiles` | AI PDF parser config | ✅ | Keep as-is |

#### Target Architecture Mapping
| Target Table | Source | Phase 2 Action |
|--------------|--------|----------------|
| `restaurants` | New | **Create now** — foundation for multi-restaurant |
| `service_periods` | New | **Create now** — lunch/dinner/breakfast periods |
| `restaurant_reservations` | `table_plans.assignments_json` (future) | **Defer** — complex migration |
| `table_assignments` | `table_plans.assignments_json` (future) | **Defer** — requires JSON→relational migration |
| `table_service_events` | New | **Defer** — needs `service_periods` + assignments |
| `reservation_imports` | New | **Create now** — tracks PDF upload history |

#### Rationale
- `restaurants` enables multi-restaurant support per hotel
- `service_periods` structures the currently implicit lunch/dinner concept
- `reservation_imports` gives audit trail for PDF uploads (currently fire-and-forget)
- Table assignment migration (JSON→relational) is Phase 3+

### C. INVENTORY / PROCUREMENT

#### Current State
| Current Table | Purpose | hotel_id | Status |
|---------------|---------|----------|--------|
| `products` | Product catalog | ✅ | Keep as-is |
| `locations` | Storage locations | ✅ | Keep as-is |
| `stock_levels` | Current stock per location | ✅ | Keep as-is |
| `stock_movements` | Stock change history | ✅ | Keep as-is |
| `purchase_orders` | Orders | ✅ | Keep as-is |
| `purchase_order_items` | Order line items | ✅ | Keep as-is |

#### Target Architecture Mapping
| Target Table | Source | Phase 2 Action |
|--------------|--------|----------------|
| `product_categories` | New | **Create now** — replaces enum, enables custom categories |
| `vendors` | New | **Create now** — replaces `products.vendor` text field |
| `stock_counts` | New | **Defer** — needs UI workflow |
| `stock_count_items` | New | **Defer** — depends on `stock_counts` |
| `reorder_rules` | New | **Create now** — enriches reorder logic beyond threshold |

#### Rationale
- `product_categories` prepares for hotels with non-beverage products
- `vendors` normalizes the currently denormalized vendor text field
- `reorder_rules` adds flexibility beyond the current threshold-only model
- Stock count workflow needs UI — defer

### D. FRONT OFFICE / HOTEL OPS

#### Current State
- Check-in/out is done via `reservations.status` updates + `rooms.status` updates in `useReservationMutations`
- No explicit event logging for check-in/out actions
- No front office task system exists

#### Target Architecture Mapping
| Target Table | Source | Phase 2 Action |
|--------------|--------|----------------|
| `checkin_events` | New | **Defer** — needs read migration from reservations flow |
| `checkout_events` | New | **Defer** — same as above |
| `front_office_tasks` | New | **Defer** — needs task system design |

#### Rationale
- These require changing the check-in/check-out mutation flow to dual-write
- Too risky without a compatibility layer — defer to Phase 3

---

## Phase 2 Implementation Plan

### Tables to Create Now (safe, additive)

| Priority | Table | Why Safe |
|----------|-------|----------|
| 1 | `restaurants` | Pure reference table, no existing code reads it |
| 2 | `service_periods` | Reference table, no dependencies |
| 3 | `reservation_imports` | Audit trail, no existing code affected |
| 4 | `room_types` | Reference table enriching rooms |
| 5 | `product_categories` | Reference table for future category expansion |
| 6 | `vendors` | Normalized vendor directory |
| 7 | `reorder_rules` | Enriches reorder logic, no breaking changes |
| 8 | `guest_preferences` | Additive guest data |

### Tables to Defer

| Table | Reason | Target Phase |
|-------|--------|--------------|
| `stays` | Requires migrating reads from `reservations` | Phase 3 |
| `stay_guests` | Depends on `stays` | Phase 3 |
| `room_assignments` | Depends on `stays` | Phase 3 |
| `restaurant_reservations` | Requires JSON→relational migration | Phase 3+ |
| `table_assignments` | Same as above | Phase 3+ |
| `table_service_events` | Depends on assignments migration | Phase 4 |
| `stock_counts` / `stock_count_items` | Needs UI workflow | Phase 3 |
| `checkin_events` / `checkout_events` | Needs mutation dual-write | Phase 3 |
| `front_office_tasks` | Needs task system design | Phase 4 |

### Production-Safe Implementation Order

1. Create all 8 tables in a single migration
2. Add RLS policies (hotel member read, admin write)
3. Seed `restaurants` for existing hotels with a default "Main Restaurant"
4. Seed `room_types` with standard types matching the current enum
5. Seed `product_categories` with current beverage categories
6. NO read migrations — current code continues unchanged
7. NO UI changes — tables are foundation-only

### Compatibility Notes

- `rooms.room_type` enum stays as-is; `room_types` table is a parallel reference
- `products.category` enum stays as-is; `product_categories` is a parallel reference
- `products.vendor` text field stays as-is; `vendors` table is a parallel directory
- Future phases will add optional FK columns (e.g., `rooms.room_type_id`, `products.category_id`, `products.vendor_id`) and migrate reads
