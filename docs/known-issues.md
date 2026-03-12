# Known Issues & Potential Errors

This document lists known issues and potential errors in the PourStock codebase that could prevent the platform from working correctly, along with their severity, root cause, and recommended mitigation.

Issues are grouped by category and marked with a severity level:
- 🔴 **Critical** — Can stop the app from loading or cause data loss
- 🟠 **High** — Can break a major feature or cause silent failures
- 🟡 **Medium** — Causes degraded experience but app remains functional
- 🟢 **Low** — Minor issue, cosmetic, or edge case

---

## Environment & Configuration

### 🔴 Missing Supabase environment variables

**File:** `.env` / `src/integrations/supabase/client.ts`

**Problem:** If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are not set (e.g. missing `.env` file in development, or missing CI/deploy secrets), every Supabase call will fail immediately. The app will load but show no data and all queries will throw errors.

**When it happens:** Fresh developer checkout without `.env`, or a deploy pipeline that doesn't inject the env vars.

**Mitigation:**
- Copy `.env.example` to `.env` and fill in the values before running `npm run dev`.
- Ensure the deploy pipeline provides these variables at build time.
- A startup validation guard in `src/main.tsx` could catch this early and show a clear error — see open improvement below.

---

### 🟠 `VITE_APP_VERSION` not set at build time

**File:** `src/lib/version.ts`, `src/hooks/useReleaseAnnouncements.tsx`

**Problem:** `APP_VERSION` falls back to a date-based string (e.g. `auto-20260312`) when `VITE_APP_VERSION` is not injected at build time. The `useReleaseAnnouncements` hook explicitly checks for this prefix and skips the auto-release pipeline, meaning:
1. No release announcement is created for the deployment.
2. The in-app Updates page will not reflect the new version.
3. Version tracking is broken.

**When it happens:** Any deployment that does not set `VITE_APP_VERSION` in the build environment.

**Mitigation:** Add `VITE_APP_VERSION` to the build command or CI pipeline:
```bash
VITE_APP_VERSION=1.1.0 npm run build
```
Or set it in the deploy environment variables. Keep it in sync with `package.json` version.

---

## Application Startup

### 🟡 Silent failure when `#root` element is missing

**File:** `src/main.tsx`

**Problem:** The app only mounts if `document.getElementById('root')` returns a non-null element. If `index.html` is corrupted or a CDN serves a broken HTML response, the app silently fails to render with no error message.

**Current code:**
```ts
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
```

**Mitigation:** Add an `else` branch that renders a minimal fallback:
```ts
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  document.body.innerHTML = '<p style="padding:2rem">App failed to load. Please refresh.</p>';
}
```

---

### 🟡 No global React Error Boundary

**File:** `src/App.tsx`

**Problem:** There is no `ErrorBoundary` component wrapping the application. If any React component throws an unhandled error during rendering, the entire app unmounts and shows a blank white screen. Users receive no feedback and cannot recover without a full page reload.

**Mitigation:** Add a simple error boundary at the top of the component tree in `App.tsx`:
```tsx
<ErrorBoundary fallback={<ErrorFallbackPage />}>
  <QueryClientProvider client={queryClient}>
    ...
  </QueryClientProvider>
</ErrorBoundary>
```
React 18 supports `react-error-boundary` (available via npm) for a simple implementation.

---

## Authentication

### 🟠 Brief auth state gap on sign-in

**File:** `src/hooks/useAuth.tsx` (line 74)

**Problem:** The `onAuthStateChange` callback defers `fetchUserData` via `setTimeout(..., 0)` to avoid a Supabase internal deadlock. This creates a small window where `user` is set but `profile`, `roles`, and `hotelMemberships` are still `null`/empty. Components that don't check `loading` carefully may render incorrectly for a brief moment.

**When it happens:** Every sign-in. Typically invisible due to the loading spinner, but could appear on very fast machines or in tests.

**Mitigation:** Always check `loading` before using profile/role data. The `ProtectedRoute` component already does this correctly.

---

### 🟡 `DEFAULT_HOTEL_ID` hardcoded fallback

**File:** `src/lib/hotel.ts`

**Problem:** The file contains a hardcoded UUID (`a0000000-0000-0000-0000-000000000001`) as the default hotel ID for Sønderborg Strand Hotel. The comment states it is temporary. If any new code path relies on this instead of `activeHotelId` from `useAuth()`, it will silently use the wrong hotel ID for a different tenant.

**Current code:**
```ts
// Temporary: Default hotel ID for Sonderborg Strand Hotel
// This will be replaced by the active hotel from AuthContext in Phase 3
export const DEFAULT_HOTEL_ID = 'a0000000-0000-0000-0000-000000000001';
```

**Mitigation:** Do not use `DEFAULT_HOTEL_ID` in new code. Always use `const { activeHotelId } = useAuth()`. Existing usages should be audited and migrated.

---

## TypeScript Configuration

### 🟡 `strictNullChecks` disabled

**File:** `tsconfig.json`

**Problem:** `strictNullChecks: false` means TypeScript does not check for `null` or `undefined` where a value is expected. This allows a whole class of runtime errors to go undetected during development:
```ts
// TypeScript won't warn about this:
const name = profile.full_name.toUpperCase(); // crashes if full_name is null
```

**When it happens:** When accessing optional or nullable fields without a null check.

**Mitigation:** Developers must manually add null checks (`?.`, `??`, explicit `if` guards) on all nullable fields. A future improvement would be to enable `strict: true` in `tsconfig.json` incrementally (start with a subset of files).

---

## Data & Database

### 🟠 React Query default retry on failure

**File:** `src/App.tsx`

**Problem:** `new QueryClient()` is created with default settings, which includes **3 automatic retries** on failed queries. If Supabase is down or a query fails due to a network error, React Query will silently retry 3 times before showing an error. This delays the user seeing an error by several seconds and can cause cascading network requests.

**Mitigation:** Configure the `QueryClient` with explicit retry settings:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
```

---

### 🟡 `dual_write_failures` table required for logging

**File:** `src/lib/dualWriteLogger.ts`

**Problem:** `logDualWriteFailure()` writes to the `dual_write_failures` table. If this migration has not been run (e.g. on a new environment), the logging call will silently fail (the catch block swallows the error). This is intentional by design ("best-effort") but means migration failures will go unrecorded in incomplete environments.

**Mitigation:** Ensure all Supabase migrations are applied before running in production (`supabase db push`).

---

## Third-Party Dependencies

### 🟡 `xlsx` package security concern

**File:** `package.json`

**Problem:** The `xlsx` package (`^0.18.5`) is included as a dependency for Excel/CSV import functionality. This package was abandoned by its original maintainer and has known security vulnerabilities in older versions. As of 2024, the package was forked as `xlsx-js-style` or replaced by alternatives like `exceljs`.

**When it matters:** If the Import page processes untrusted Excel files from external sources, a malicious file could potentially exploit parsing vulnerabilities.

**Mitigation:** Assess whether the Import feature processes files from untrusted sources. If so, consider migrating to a maintained alternative. For internal-use-only imports, the risk is lower.

---

## Release System

### 🟢 Auto-release loop edge case

**File:** `src/hooks/useReleaseAnnouncements.tsx`

**Problem:** After `triggerAutoRelease()` runs, the hook calls `setTimeout(() => fetchData(), 1500)` to refetch after the Edge Function writes to the database. If the Edge Function is slow (>1.5 seconds), the refetch may run before the release row is committed and show stale data.

**Mitigation:** The user can manually navigate to `/updates` to see the latest releases. This is a cosmetic timing issue with no data-loss risk.

---

## Edge Functions

### 🟠 Missing `GEMINI_API_KEY` secret

**File:** `supabase/functions/parse-table-plan/`, `supabase/functions/generate-release-notes/`

**Problem:** If the `GEMINI_API_KEY` secret is not configured in Supabase, PDF reservation parsing will fail entirely. Users will see an error when uploading reservation PDFs. Release notes generation will also fail, resulting in empty release content.

**Mitigation:** Set `GEMINI_API_KEY` in Supabase → Project Settings → Edge Functions → Secrets.

### 🟡 Missing `GITHUB_TOKEN` secret

**File:** `supabase/functions/fetch-deployment-commits/`

**Problem:** If `GITHUB_TOKEN` is missing, `fetch-deployment-commits` will fail. The `create-autonomous-release` function will proceed but release notes will be generated from an empty commit list, resulting in minimal content.

**Mitigation:** Set `GITHUB_TOKEN` in Supabase → Project Settings → Edge Functions → Secrets.

---

## How to Report New Issues

When you discover a new potential error:
1. Add an entry to this file in the appropriate category.
2. Assign a severity level.
3. Include the file path, a description of the problem, when it occurs, and a mitigation.
4. If the issue is fixed, mark it with ✅ **Fixed in vX.Y.Z** at the top of the entry rather than deleting it — historical context is valuable.
