# Custom Hooks Reference

PourStock uses 18 custom React hooks to encapsulate business logic, data fetching, and shared state. This document describes each hook's purpose, what it returns, and any important caveats.

> All data-fetching hooks require `AuthProvider` to be present in the component tree (they call `useAuth()` internally).

---

## Authentication & Session

### `useAuth()`
**File:** `src/hooks/useAuth.tsx`

The central authentication hook. Returns the full auth context.

```ts
const {
  user,           // Supabase User | null
  session,        // JWT Session | null
  profile,        // Profile row | null
  roles,          // AppRole[]
  departments,    // UserDepartment[]
  loading,        // boolean — true during initial session check
  signIn,         // (email, password) => Promise<{ error }>
  signUp,         // (email, password, fullName) => Promise<{ error }>
  signOut,        // () => Promise<void>
  isAdmin,        // boolean
  isManager,      // boolean
  isStaff,        // boolean
  hasDepartment,  // (dept) => boolean
  isDepartmentManager, // (dept) => boolean
  activeHotelId,  // string (UUID)
  activeHotelRole, // HotelRole | null
  hotelMemberships, // HotelMembership[]
  switchHotel,    // (hotelId) => void
} = useAuth();
```

**Caveat:** Must be called inside `AuthProvider`. Throws if used outside.

---

## Hotel Configuration

### `useHotelSettings()`
**File:** `src/hooks/useHotelSettings.tsx`

Fetches hotel-level key-value configuration from the `hotel_settings` table.

```ts
const { settings, isLoading, updateSetting } = useHotelSettings();
```

Used in `Settings.tsx` and anywhere the hotel name, logo, or configuration values are needed.

---

### `useHotelModules()`
**File:** `src/hooks/useHotelModules.tsx`

Reads the feature flag state for the active hotel from `hotel_modules`. Used to show/hide navigation items and feature areas.

```ts
const { isModuleEnabled, modules, isLoading } = useHotelModules();
// Example: isModuleEnabled('restaurant') → true/false
```

Navigation items in `AppShell` use this to hide sections the hotel hasn't activated.

---

## Inventory

### `useInventoryData()`
**File:** `src/hooks/useInventoryData.tsx`

Fetches all inventory data: products, stock levels, categories, vendors, and locations. The largest data hook — drives both `Inventory.tsx` and `Products.tsx`.

```ts
const {
  products,        // Product[]
  stockLevels,     // StockLevel[]
  categories,      // Category[]
  vendors,         // Vendor[]
  locations,       // Location[]
  isLoading,
  refetch,
} = useInventoryData();
```

---

## Hospitality Operations

### `useReception()`
**File:** `src/hooks/useReception.tsx`

Manages guest stays, room assignments, and check-in/check-out operations. Interfaces with both legacy `reservations` table and new `stays`/`stay_guests`/`room_assignments` mirror tables.

```ts
const {
  stays,
  rooms,
  checkIn,
  checkOut,
  isLoading,
} = useReception();
```

### `useStays()`
**File:** `src/hooks/useStays.tsx`

Lower-level hook for querying the normalized `stays` table directly. Used by analytics and reporting components.

### `useHousekeeping()`
**File:** `src/hooks/useHousekeeping.tsx`

Manages housekeeping tasks, room statuses, and inspection workflows. Tasks are generated automatically by a database trigger when check-out events are logged.

```ts
const {
  tasks,
  rooms,
  updateTaskStatus,
  assignTask,
  isLoading,
} = useHousekeeping();
```

### `useRestaurantReservations()`
**File:** `src/hooks/useRestaurantReservations.tsx`

Fetches and manages table plan data — reservations, table assignments, service periods, and restaurants. Used exclusively by `TablePlan.tsx`.

```ts
const {
  reservations,
  tableAssignments,
  servicePeriods,
  restaurants,
  saveAssignments,
  isLoading,
} = useRestaurantReservations();
```

### `useBilling()`
**File:** `src/hooks/useBilling.tsx`

Reads folio and billing data from the normalized `folios`, `folio_items`, and `payments` tables.

### `useFrontOfficeEvents()`
**File:** `src/hooks/useFrontOfficeEvents.tsx`

Subscribes to front-office events via Supabase Realtime. Used in `Reception.tsx` to get live updates without manual refreshes.

---

## Settings & Configuration (CRUD)

### `useSettingsCrud()`
**File:** `src/hooks/useSettingsCrud.tsx`

Generic CRUD hook used by all settings sections. Takes a table name and returns create/update/delete/list operations with consistent error handling via `getUserFriendlyError`.

```ts
const {
  items,
  create,
  update,
  remove,
  isLoading,
} = useSettingsCrud('room_types');
```

Used by the Settings page for: room types, restaurants, service periods, product categories, vendors, departments, reorder rules.

---

## Users

### `useUsers()`
**File:** `src/hooks/useUsers.tsx`

Fetches the user list for the active hotel and provides role assignment and approval operations. Calls the `manage-users` Edge Function for privileged operations.

```ts
const {
  users,
  pendingUsers,
  approveUser,
  assignRole,
  isLoading,
} = useUsers();
```

---

## Release Management

### `useReleaseAnnouncements()`
**File:** `src/hooks/useReleaseAnnouncements.tsx`

Fetches published release announcements from the `release_announcements` table and manages per-user read/acknowledge state in `user_release_reads`.

```ts
const {
  releases,           // All relevant published releases
  activeRelease,      // The newest unread release (to show in a banner)
  mandatoryUnacknowledged, // A mandatory release the user hasn't acknowledged
  unreadCount,        // Number of unread releases
  loading,
  markAsRead,         // (releaseId) => Promise<void>
  acknowledge,        // (releaseId) => Promise<void>  — for mandatory releases
  refetch,
} = useReleaseAnnouncements();
```

**Behavior:**
- On mount, checks if a release exists for the current `VITE_APP_VERSION`. If not, calls the `create-autonomous-release` Edge Function to generate one automatically.
- The auto-creation is skipped if `APP_VERSION` starts with `auto-` (meaning `VITE_APP_VERSION` was not set at build time).
- Uses a module-level `Set` to prevent duplicate auto-creation calls within the same browser session.

---

## Table Layout

### `useTableLayout()`
**File:** `src/hooks/useTableLayout.tsx`

Manages the floor plan grid state (table positions, sizes, orientations) used by the drag-and-drop editor in `TablePlan.tsx`.

---

## Real-Time

### `useRealtimeSubscription()`
**File:** `src/hooks/useRealtimeSubscription.tsx`

A generic hook that wraps Supabase Realtime channel subscriptions. Takes a table name, a filter, and a callback. Handles subscription setup and cleanup automatically.

```ts
useRealtimeSubscription({
  table: 'stays',
  filter: `hotel_id=eq.${activeHotelId}`,
  onUpdate: (payload) => { /* handle change */ },
});
```

---

## Offline Support

### `usePendingChanges()`
**File:** `src/hooks/usePendingChanges.tsx`

Tracks mutations that were made while offline or that have not yet synced to the server. Used to show a pending-changes indicator in the UI.

---

## UI Utilities

### `use-toast.ts`
**File:** `src/hooks/use-toast.ts`

Provides the `toast()` function for triggering Radix toast notifications. Use `sonner` (`import { toast } from 'sonner'`) for new code — both are available but `sonner` is preferred for its simpler API.

### `use-mobile.tsx`
**File:** `src/hooks/use-mobile.tsx`

Returns `isMobile: boolean` based on a `768px` breakpoint media query. Use this to adjust layouts for phone vs tablet/desktop views.
