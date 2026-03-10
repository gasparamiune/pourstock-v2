# Phase 4: Extended Read Adoption

## Phase 3.5 Hardening Review — ✅ APPROVED

- `hotel_modules`: Only affects nav visibility. RLS/role enforcement unchanged. Fallback returns `true` (all shown).
- `restaurants`/`service_periods`: Read-only settings display. No writes. No operational dependency.
- `room_types`: Read-only settings. `rooms.room_type` enum remains source of truth.
- `product_categories`: Read-only settings. `products.category` enum remains source of truth.
- **No hardening changes needed.**

---

## Phase 4 Candidate Ranking

| # | Table | Risk | Type | UI Surface | Source of Truth | Fallback | Decision |
|---|-------|------|------|-----------|-----------------|----------|----------|
| 1 | `vendors` | LOW | Admin/settings | Vendor list in Settings | `vendors` table (new, empty) | Empty state | **Now** |
| 2 | `departments` | LOW | Admin/settings | Department list in Settings | Legacy `user_departments` enum + hardcoded list | Read-only display only | **Now** |
| 3 | `reorder_rules` | LOW | Admin/settings | Reorder config in Settings | Legacy `stock_levels.reorder_threshold` | Read-only display only | **Now** |
| 4 | `reservation_imports` | LOW | Admin audit | Import history log | `reservation_imports` (new, empty) | Empty state | **Later** (needs import flow) |
| 5 | `guest_preferences` | MEDIUM | Operational | Guest profile panel | `guest_preferences` (new, empty) | Empty state | **Later** (needs guest UI) |

## Future Higher-Risk Domains (NOT YET)

| Domain | Tables | Risk | Why deferred |
|--------|--------|------|-------------|
| Guests/Stays | `guests`, stays, stay_guests | HIGH | Requires reservation flow rewrite |
| Room Assignments | room_assignments | HIGH | Tied to reservation source of truth |
| Restaurant Reservations | restaurant_reservations, table_assignments | HIGH | Core table plan logic |
| Stock Counts | stock_counts, stock_count_items | HIGH | Core inventory calculations |

---

## Batch 2 Implementation (this phase)

1. **`vendors`** → Read-only vendor list in Settings
2. **`departments`** → Read-only department list in Settings  
3. **`reorder_rules`** → Read-only reorder rules in Settings

All read-only. No write migration. No operational changes. Legacy source of truth unchanged.
