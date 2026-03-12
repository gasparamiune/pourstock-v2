# Backend Edge Functions

PourStock uses Supabase Edge Functions (Deno runtime) for server-side logic that cannot run in the browser. There are 6 functions, each with a dedicated directory under `supabase/functions/`.

---

## Deployment

Edge Functions are deployed via the Supabase CLI:

```bash
supabase functions deploy <function-name>
```

All functions use the Deno runtime. Dependencies are imported via URL or from the `deno.lock` file.

---

## Function Reference

### 1. `create-hotel`
**Directory:** `supabase/functions/create-hotel/`

Creates a new hotel tenant in the database. Called during the onboarding flow when a new hotel signs up.

**What it does:**
- Validates the incoming hotel name and slug
- Inserts a row into the `hotels` table
- Seeds default hotel settings, modules, room types, departments, and product categories
- Assigns the calling user as `hotel_admin` in `hotel_members`

**Called by:** `Onboarding.tsx` via `supabase.functions.invoke('create-hotel', { body: {...} })`

**Authentication:** Requires a valid JWT. Uses `supabase.auth.getUser()` to get the calling user.

---

### 2. `manage-users`
**Directory:** `supabase/functions/manage-users/`

Performs privileged user management operations that require service-role access (bypassing RLS).

**What it does:**
- `approve` — Sets `is_approved = true` on a user's `profiles` row and `hotel_members` row
- `assign_role` — Updates a user's role in `hotel_members`
- `remove` — Removes a user's hotel membership

**Called by:** `useUsers()` hook via `supabase.functions.invoke('manage-users', { body: { action, userId, ... } })`

**Authentication:** Requires a valid JWT. Caller must have `hotel_admin` or `manager` role.

---

### 3. `parse-table-plan`
**Directory:** `supabase/functions/parse-table-plan/`

AI-powered PDF reservation parser. Takes a PDF file (as base64) and extracts a structured list of reservations using a Gemini model.

**What it does:**
1. Receives the PDF and optional parser profile configuration
2. Sends the PDF to the Gemini API with a structured extraction prompt
3. Returns a JSON array of reservations: `[{ name, guests, time, date, notes }]`

**Called by:** `TablePlan.tsx` when a user uploads a reservation PDF

**Authentication:** Requires a valid JWT.

**External dependencies:** Google Gemini API (requires `GEMINI_API_KEY` secret set in Supabase).

**Error behavior:** If parsing fails (malformed PDF, API error), the function returns a `400` status with an error message. The UI shows a user-friendly error and allows re-upload.

---

### 4. `generate-release-notes`
**Directory:** `supabase/functions/generate-release-notes/`

Generates human-readable release notes from a list of raw git commit messages using a Gemini model.

**What it does:**
1. Receives an array of commit messages
2. Sends them to Gemini with a prompt that formats them as a user-facing changelog
3. Returns structured release notes as a JSON object

**Called by:** `create-autonomous-release` (not called directly from the frontend)

**External dependencies:** Google Gemini API.

---

### 5. `fetch-deployment-commits`
**Directory:** `supabase/functions/fetch-deployment-commits/`

Fetches the list of git commits between the previous deployed version and the current one from the GitHub API.

**What it does:**
1. Calls the GitHub Commits API for the repository
2. Filters commits that are newer than the previous release
3. Returns commit messages and metadata

**Called by:** `create-autonomous-release`

**External dependencies:** GitHub API (requires `GITHUB_TOKEN` secret set in Supabase).

---

### 6. `create-autonomous-release`
**Directory:** `supabase/functions/create-autonomous-release/`

Orchestrates the full autonomous release pipeline. This is the main release automation function.

**What it does:**
1. Receives the new version string (e.g. `1.1.0`)
2. Calls `fetch-deployment-commits` to get commits since last release
3. Calls `generate-release-notes` to create human-readable notes from the commits
4. Inserts a new row into `release_announcements` with `is_published = true`

**Called by:** `useReleaseAnnouncements()` hook automatically on first load when a new `VITE_APP_VERSION` is detected.

**Authentication:** Requires a valid JWT.

---

## Required Secrets

Set these in the Supabase dashboard under **Project Settings → Edge Functions → Secrets**:

| Secret | Required by | Purpose |
|--------|-------------|---------|
| `GEMINI_API_KEY` | `parse-table-plan`, `generate-release-notes` | Gemini AI model access |
| `GITHUB_TOKEN` | `fetch-deployment-commits` | Read commits from the GitHub repo |

If these secrets are missing, the respective functions will fail silently or return errors. The app will continue to work but:
- PDF parsing will fail
- Autonomous release notes will not be generated (releases will be created with empty content)

---

## Error Handling Pattern

All Edge Functions follow this pattern:

```ts
try {
  // ... logic
  return new Response(JSON.stringify(result), { status: 200 });
} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), { status: 500 });
}
```

Frontend code calling `supabase.functions.invoke()` should check for `error` in the response and display a user-friendly message via `getUserFriendlyError()` from `src/lib/errorHandler.ts`.
