

# PourStock Platform — Architecture Audit Report

## Executive Summary

The codebase is **reasonably well-structured** for its current stage — it has a centralized API layer, hotel-scoped queries, role-based access, and good use of lazy loading. However, several structural issues are holding back maintainability and introducing risk. Below are the findings, ordered from most critical to optional.

---

## Findings & Recommendations

### 1. CRITICAL — Duplicate Type Systems

**Problem**: Types are defined in three separate places that diverge:
- `src/types/inventory.ts` — hand-written `Product`, `Location`, `User` interfaces (camelCase: `costPerUnit`, `isActive`)
- `src/hooks/useInventoryData.tsx` — re-exports `Tables<'products'>` from Supabase types (snake_case: `cost_per_unit`, `is_active`)
- `src/hooks/useReception.tsx` — hand-written `Room`, `Guest`, `Reservation` interfaces
- `src/data/mockData.ts` — uses the `types/inventory.ts` shapes

The hand-written types in `types/inventory.ts` do **not** match the actual database schema. Any component importing from `types/inventory.ts` is working with a phantom type system. The `mockData.ts` file uses these phantom types.

**Fix**: Delete `src/types/inventory.ts` hand-written interfaces. Derive all types from `Tables<'...'>` in one central `src/types/` barrel file. Remove `mockData.ts` entirely (all data now comes from Supabase).

---

### 2. CRITICAL — Mock Data Still Wired Into Production

**Problem**: `src/data/mockData.ts` (390 lines of hardcoded mock products, locations, stock levels) is imported by `src/pages/Settings.tsx` (`mockLocations`, `mockUser`). The Settings page renders fake locations and a fake user from this file instead of real database data.

**Fix**: Replace `mockLocations` usage in Settings with the real `useLocations()` hook. Replace `mockUser` with data from `useAuth()`. Then delete `mockData.ts`.

---

### 3. HIGH — Hooks Contain Non-Hook Business Logic

**Problem**: Several files in `src/hooks/` are not React hooks at all:
- `useStays.tsx` — exports plain async functions (`mirrorWriteStayOnCheckIn`, `mirrorWriteStayOnCheckOut`), no hooks
- `useBilling.tsx` — exports `mirrorChargeToFolio`, a plain async function
- `useFrontOfficeEvents.tsx` — exports `emitCheckInEvent`, `emitCheckOutEvent`, plain async functions

These are domain service functions masquerading as hooks. They belong in the API/service layer.

**Fix**: Move these to `src/api/` or `src/services/` (e.g., `src/api/stays.ts`, `src/api/billing.ts`, `src/api/frontOfficeEvents.ts`). Reserve `src/hooks/` for actual React hooks.

---

### 4. HIGH — useReception.tsx is a God File (374 lines)

**Problem**: `useReception.tsx` contains:
- 4 type definitions (`Room`, `Guest`, `Reservation`, `RoomCharge`)
- 4 query hooks (`useRooms`, `useGuests`, `useReservations`, `useRoomCharges`)
- 4 mutation hooks with complex side effects (dual-writes, event emissions, housekeeping task creation)

The `checkIn` and `checkOut` mutations orchestrate cross-domain writes (rooms, housekeeping, stays, events, billing) — this is transaction-level business logic embedded inside a hook.

**Fix**: Split into:
- `src/types/reception.ts` — types
- `src/hooks/useRooms.ts`, `src/hooks/useGuests.ts`, `src/hooks/useReservations.ts` — query hooks
- `src/api/receptionMutations.ts` — mutation logic (check-in orchestration)

---

### 5. HIGH — useInventoryData.tsx is Also a God File (330 lines)

**Problem**: Contains 7+ hooks (`useProducts`, `useLocations`, `useStockLevels`, `useStockMovements`, `useDashboardData`, `useProductSearch`, `usePopularProducts`) plus type re-exports. Manual `useState`/`useEffect` pattern is used instead of `useQuery` (unlike the reception hooks which use React Query correctly).

**Fix**: Migrate inventory hooks to React Query for consistency with the rest of the app. Split into per-concern files.

---

### 6. MEDIUM — Inconsistent Data Fetching Patterns

**Problem**: Two competing patterns exist:
- **Pattern A** (inventory): Manual `useState` + `useEffect` + `useCallback` + custom realtime subscription
- **Pattern B** (reception/housekeeping): `useQuery` from React Query + `useEffect` for realtime channel

This creates confusion about caching, refetching, and error handling. Pattern B is the correct one.

**Fix**: Standardize all data hooks on React Query (Pattern B).

---

### 7. MEDIUM — `useRoomCharges` Bypasses API Layer

**Problem**: In `useReception.tsx`, `useRoomCharges` makes a direct `supabase.from('room_charges')` call instead of using `fetchRoomCharges()` from `src/api/queries.ts` (which already exists).

Similarly, all mutation functions in `useReception.tsx` call `supabase.from(...)` directly, bypassing the API layer.

**Fix**: Route all database access through `src/api/queries.ts` for consistency and hotel-id enforcement.

---

### 8. MEDIUM — Index.tsx is a Pointless Wrapper

**Problem**: `src/pages/Index.tsx` is a 7-line file that just renders `<Dashboard />`. Meanwhile, both `Index` and `Dashboard` exist as separate page files, and `App.tsx` routes `/` to `Index`.

**Fix**: Remove `Index.tsx`. Route `/` directly to `Dashboard` in `App.tsx`.

---

### 9. MEDIUM — Settings.tsx is a Monolith (406 lines)

**Problem**: The Settings page contains inline rendering for locations, users, POS, notifications, and data protection sections (170+ lines of JSX), while other sections are properly lazy-loaded as separate components. The inline sections use mock data.

**Fix**: Extract each inline section into its own component under `src/components/settings/` (e.g., `LocationSettings.tsx`, `NotificationSettings.tsx`, `DataProtectionSettings.tsx`). Lazy-load them like the existing ones.

---

### 10. LOW — Root-Level Components Without a Home

**Problem**: Four components sit directly in `src/components/` without a subdirectory:
- `LanguageSwitcher.tsx`
- `NavLink.tsx`
- `ReleaseAnnouncementDialog.tsx`
- `SystemBanner.tsx`

**Fix**: Move to `src/components/layout/` (LanguageSwitcher, NavLink, SystemBanner) and `src/components/system/` (ReleaseAnnouncementDialog).

---

### 11. LOW — `as any` Type Casts Throughout Mutations

**Problem**: Nearly every `.insert()` and `.update()` call in hooks uses `as any` to bypass TypeScript. This defeats type safety entirely.

**Fix**: Use proper Supabase insert/update types from the generated types file. The `as any` pattern hides real bugs.

---

### 12. OPTIONAL — No Feature-Based Module Boundaries

**Problem**: The `.lovable/` docs reference a target architecture with `src/features/` domain modules, but no such directory exists. All code lives in the flat `hooks/`, `components/`, `pages/` structure.

**Fix** (future): When complexity warrants it, migrate to `src/features/{reception,housekeeping,inventory,restaurant}/` with co-located hooks, components, and types per domain.

---

## Recommended Execution Order

| Step | Priority | Effort | Description |
|------|----------|--------|-------------|
| 1 | Critical | Small | Delete `mockData.ts`, replace Settings usage with real hooks |
| 2 | Critical | Medium | Consolidate types — single source from Supabase generated types |
| 3 | High | Small | Move non-hook service functions out of `src/hooks/` |
| 4 | High | Medium | Split `useReception.tsx` god file |
| 5 | High | Medium | Migrate inventory hooks to React Query |
| 6 | Medium | Small | Fix `useRoomCharges` and mutations to use API layer |
| 7 | Medium | Small | Remove `Index.tsx` wrapper |
| 8 | Medium | Medium | Extract inline Settings sections into components |
| 9 | Low | Small | Reorganize root-level components |
| 10 | Low | Medium | Remove `as any` casts |
| 11 | Optional | Large | Feature-based module structure |

