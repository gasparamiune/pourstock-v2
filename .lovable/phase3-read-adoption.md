# Phase 3: Controlled Read Adoption

## Read Migration Rules

### A. Every read migration must state:
- **New read source**: which Phase 2 table
- **Legacy source**: what was used before (if any)
- **Fallback behavior**: what happens if new table is empty / query fails
- **Write path**: stays legacy-only, dual-write, or moves later

### B. No read migration may change:
- Login/auth behavior
- Role enforcement
- Realtime sync behavior
- Core stock calculations
- Core reservation behavior

### C. Priority order:
Settings/admin pages → configuration UIs → operational pages (later phases)

---

## Candidate Risk Ranking

| # | Table | Risk | Type | Current UI reads from | Source of truth | Fallback needed | Recommended order |
|---|-------|------|------|----------------------|-----------------|-----------------|-------------------|
| 1 | `hotel_modules` | LOW | Admin config | Hardcoded nav items in AppShell | `hotel_modules` (new, seeded) | Yes — if query fails, show all nav items | 1 |
| 2 | `departments` | LOW | Admin config | Hardcoded list in AppShell | `departments` (new, seeded) | Yes — fall back to hardcoded 3-dept list | 5 (later) |
| 3 | `restaurants` | LOW | Settings/admin | Nothing yet | `restaurants` (new, seeded) | Empty state is fine | 2 |
| 4 | `room_types` | LOW | Settings/admin | Hardcoded enum `room_type` on `rooms` | Legacy enum stays source of truth | Show read-only reference list | 3 |
| 5 | `product_categories` | LOW | Settings/admin | Hardcoded `beverage_category` enum | Legacy enum stays source of truth | Show read-only reference list | 4 |
| 6 | `vendors` | LOW | Settings/admin | `products.vendor` text field | `vendors` table (new) | Empty state is fine | 6 |
| 7 | `service_periods` | LOW | Settings/admin | Nothing yet | `service_periods` (new, seeded) | Empty state is fine | 2 (with restaurants) |
| 8 | `reorder_rules` | MEDIUM | Operational config | Nothing yet — threshold on `stock_levels` | Legacy `stock_levels.reorder_threshold` stays | Empty state; future reads only | 7 |
| 9 | `guest_preferences` | MEDIUM | Operational | Nothing yet | `guest_preferences` (new) | Empty state is fine | 8 |
| 10 | `reservation_imports` | MEDIUM | Operational audit | Nothing yet | `reservation_imports` (new) | Empty state is fine | 9 |

---

## Backfill Quality Report

| Table | How backfilled | Values quality | Manual cleanup needed | Data drift risk |
|-------|---------------|----------------|----------------------|-----------------|
| `hotel_modules` | Migration + create-hotel seed | All 7 modules enabled=true for existing hotel | None — admins can toggle later | LOW — no other system writes here yet |
| `departments` | Migration + create-hotel seed | 3 default depts (reception, housekeeping, restaurant) | None — matches hardcoded list | LOW |
| `restaurants` | Migration + create-hotel seed | "Main Restaurant" with slug, no capacity set | May need capacity/description update | LOW |
| `service_periods` | Migration + create-hotel seed | "Dinner" 18:00–22:00 | May need time adjustment per hotel | LOW |
| `room_types` | Migration + create-hotel seed | 5 standard types (single/double/twin/suite/family) | Base rates not set (null) | LOW |
| `product_categories` | Migration + create-hotel seed | 6 categories matching beverage_category enum | None — 1:1 with enum | NONE |
| `vendors` | Empty — no backfill | No data yet | Hotels need to add vendors manually | NONE |
| `reorder_rules` | Empty — no backfill | No data yet | Future feature | NONE |
| `guest_preferences` | Empty — no backfill | No data yet | Future feature | NONE |
| `reservation_imports` | Empty — no backfill | No data yet | Will populate from PDF imports | NONE |

---

## Phase 3 Implementation: First Safe Reads

### Batch 1 (implemented now):
1. **`hotel_modules`** → `useHotelModules` hook for nav visibility with fallback
2. **`restaurants` + `service_periods`** → Read-only display in Settings page
3. **`room_types`** → Read-only display in Settings page
4. **`product_categories`** → Read-only display in Settings page

### What is NOT changing:
- Auth/login — unchanged
- Role enforcement — unchanged
- Realtime — unchanged
- Stock calculations — unchanged
- Reservation flow — unchanged
- Table plan — unchanged
- All writes — unchanged (legacy tables remain source of truth)

### Fallback rules:
- `useHotelModules`: if query fails or returns empty, all modules shown (current behavior)
- Settings displays: if query returns empty, show empty state with "no data" message
- No operational flow depends on these reads

---

## Phase 3 Status: ✅ SAFE TO IMPLEMENT
All candidates in Batch 1 are admin/settings reads only.
No production-critical flow is affected.
