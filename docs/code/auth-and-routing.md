# Authentication & Routing

This document explains how PourStock handles user authentication, session management, access control, and client-side routing.

---

## 1. Authentication Provider (`src/hooks/useAuth.tsx`)

All authentication state lives in a React Context provided by `AuthProvider`. Wrap the component tree with `<AuthProvider>` before any component that calls `useAuth()`.

### What it stores

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Supabase auth user object |
| `session` | `Session \| null` | JWT session |
| `profile` | `Profile \| null` | Row from `profiles` table (name, avatar, approval status) |
| `roles` | `AppRole[]` | Legacy app-level roles (`admin`, `manager`, `staff`) |
| `departments` | `UserDepartment[]` | Department memberships (`reception`, `housekeeping`, `restaurant`) |
| `loading` | `boolean` | True while initial auth check is in progress |
| `activeHotelId` | `string` | UUID of the currently selected hotel |
| `activeHotelRole` | `HotelRole \| null` | Role in the active hotel (`hotel_admin`, `manager`, `staff`) |
| `hotelMemberships` | `HotelMembership[]` | All approved and pending hotel memberships |

### Derived booleans

| Property | Logic |
|----------|-------|
| `isAdmin` | `roles.includes('admin')` OR `activeHotelRole === 'hotel_admin'` |
| `isManager` | `roles.includes('manager')` OR `activeHotelRole === 'manager'` OR `isAdmin` |
| `isStaff` | Any role OR `isManager` |

These are computed on every render from the raw state — there is no separate "permission check" function.

### Startup sequence

1. `supabase.auth.getSession()` is called immediately to restore a persisted session.
2. `supabase.auth.onAuthStateChange()` listens for future sign-in/sign-out events.
3. When a user is detected, `fetchUserData(userId)` fires four parallel Supabase queries:
   - `profiles` — display name, avatar, approval flag
   - `user_roles` — legacy role assignments
   - `user_departments` — department memberships
   - `hotel_members` — hotel memberships and roles
4. The first approved hotel membership is auto-selected as `activeHotelId`.
5. `loading` is set to `false` once data is fetched (or on error).

> **Important:** The `fetchUserData` call inside `onAuthStateChange` is wrapped in `setTimeout(..., 0)` to avoid a known Supabase callback deadlock. This means there is a brief moment between the auth event firing and user data being available — components should always check `loading` before assuming profile data is present.

### Methods

| Method | Description |
|--------|-------------|
| `signIn(email, password)` | Calls `supabase.auth.signInWithPassword`. Returns `{ error }`. |
| `signUp(email, password, fullName)` | Calls `supabase.auth.signUp` with `emailRedirectTo` set to the app origin. |
| `signOut()` | Calls `supabase.auth.signOut` and clears all local state. |
| `switchHotel(hotelId)` | Changes the active hotel (only works for approved memberships). |

---

## 2. Protected Route (`src/components/auth/ProtectedRoute.tsx`)

`ProtectedRoute` is a wrapper component that enforces authentication and authorization before rendering its children.

### Decision tree

```
Is loading?
  └─ Yes → Show spinner (Loader2)

Is user null?
  └─ Yes → Redirect to /auth

Has no approved hotel memberships AND not on /onboarding?
  └─ Yes → Redirect to /onboarding

requireAdmin AND NOT isAdmin?
  └─ Yes → Show "Access Denied" screen

requireManager AND NOT isManager?
  └─ Yes → Show "Access Denied" screen

requireDepartment AND NOT hasDepartment(dept)?
  └─ Yes → Show "Access Denied" screen

profile exists AND NOT profile.is_approved AND NOT isAdmin?
  └─ Yes → Show "Account Pending Approval" screen

Otherwise → Render children
```

### Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | `ReactNode` | — | Content to render if authorized |
| `requireAdmin` | `boolean` | `false` | Require admin or hotel_admin role |
| `requireManager` | `boolean` | `false` | Require manager role or above |
| `requireDepartment` | `'reception' \| 'housekeeping' \| 'restaurant'` | — | Require department membership |

### Usage in App.tsx

```tsx
// Admin-only route
<Route path="/settings" element={
  <ProtectedRoute requireAdmin={true}><Settings /></ProtectedRoute>
} />

// Department-restricted route
<Route path="/reception" element={
  <ProtectedRoute requireDepartment="reception"><Reception /></ProtectedRoute>
} />
```

---

## 3. Client-Side Routing (`react-router-dom` v6)

PourStock uses React Router v6 with `BrowserRouter`.

### Nested route pattern

The app uses a nested route pattern:
- The outer `<Routes>` contains `/auth`, `/onboarding`, and `/*` (catch-all).
- The catch-all `/*` renders `AppShell` (sidebar + header) and contains an inner `<Routes>` with all authenticated pages.
- This means `AppShell` only renders when the user is on an authenticated route.

### Redirect behavior

| Scenario | Redirects to |
|----------|-------------|
| Unauthenticated user visits any route | `/auth` (with `state.from` preserved) |
| Authenticated user without hotel membership | `/onboarding` |
| Authenticated user with membership visits `/auth` | `/` (handled by Auth page) |

---

## 4. Role Model

PourStock has two overlapping role systems that exist for historical compatibility:

### Legacy app roles (`user_roles` table)
- `admin` — full access
- `manager` — most access, can manage staff
- `staff` — read/write within assigned departments

### Hotel membership roles (`hotel_members` table)
- `hotel_admin` — equivalent to `admin` within a hotel
- `manager` — equivalent to manager within a hotel
- `staff` — standard staff within a hotel

Both are checked in `useAuth`. The new hotel membership system is preferred; the legacy system is preserved for backward compatibility.

### Department access (`user_departments` table)

Departments are independent of roles. A user can be `staff` globally but only have `reception` department access. Admins bypass all department checks.

---

## 5. Multi-Tenant Isolation

Every authenticated user belongs to one or more hotels via `hotel_members`. All Supabase data queries are scoped to the `activeHotelId`:

- Database tables have `hotel_id` columns with **Row Level Security (RLS)** policies that enforce tenant isolation at the database level — the frontend cannot accidentally read another hotel's data even if it tries.
- The `activeHotelId` in `AuthContext` is the UUID passed to all data queries.
- The hardcoded fallback `DEFAULT_HOTEL_ID` in `src/lib/hotel.ts` is a placeholder for Sønderborg Strand Hotel (`a0000000-0000-0000-0000-000000000001`) and should not be relied on in new code — use `activeHotelId` from `useAuth()` instead.
