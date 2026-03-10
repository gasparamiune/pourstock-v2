# Release Notes System — Architecture

## Overview

PourStock uses a fully autonomous release notes system that detects new deployments, generates user-friendly release notes, and displays them to users as a one-time popup.

## Lifecycle

```
Deployment → Version Change → App Boot → Version Check → Auto-Create Release → Popup → Dismiss → History
```

### 1. Version Detection

- `src/lib/version.ts` exports `APP_VERSION`
- Set via `VITE_APP_VERSION` build-time env var
- Falls back to `auto-YYYYMMDD` in development
- On app boot, the `useReleaseAnnouncements` hook checks if a release exists for `APP_VERSION`

### 2. Autonomous Release Creation

If no release exists for the current version:

1. Client calls the `create-autonomous-release` edge function
2. Edge function (runs with service role) orchestrates:
   - **GitHub commit fetch**: Gets recent commits from main branch since last release
   - **Commit classification**: Each commit is classified as `user_facing`, `technical`, `mixed`, or `irrelevant`
   - **Theme grouping**: Related commits are grouped (e.g., reception, billing, inventory)
   - **Fingerprint**: SHA-256 hash of version + normalized commit messages prevents duplicates
   - **AI generation** (if meaningful user-facing changes exist): Gemini 2.5 Flash rewrites grouped changes into user-friendly bullet points
   - **Fallback** (if AI fails or only technical changes): Creates generic release, optionally silent

### 3. Smart Pre-Filter & Dedup

#### Commit Classification

Technical keywords (filtered out): `index`, `migration`, `refactor`, `lint`, `config`, `chore`, `test`, `ci`, `build`, `schema`, `dependency`, `internal`

User-facing keywords (kept): `check-in`, `checkout`, `guest`, `room`, `table plan`, `reservation`, `billing`, `folio`, `payment`, `housekeeping`, `inventory`, `dashboard`, `fix`, `bug`

#### AI Call Threshold

- **0 user-facing commits**: Auto-create silent fallback release (no AI call)
- **1-2 user-facing commits, 1 theme**: Use theme-based fallback (no AI call)
- **3+ user-facing commits or 2+ themes**: Call AI for generation

#### Release Fingerprint

- `SHA-256(version + sorted normalized commit messages)` truncated to 16 chars
- Stored in `release_fingerprint` column with unique index
- Prevents duplicate releases from reprocessing

### 4. Popup Behavior

- `ReleaseNotesModal` shows automatically for the newest unread, non-silent release
- Severity drives visual styling:
  - `info` = primary color (default)
  - `important` = amber/orange
  - `critical` = red/destructive
- Mandatory releases block close until acknowledged
- Silent releases appear only in update history, never as popups

### 5. Read State

- `user_release_reads` table tracks per-user read/dismiss/acknowledge state
- `dismissed_at`: user clicked "Got it"
- `acknowledged_at`: user acknowledged mandatory release
- Unique constraint on `(release_id, user_id)` prevents duplicates

### 6. Admin Override

Admins can:
- Create manual releases via Settings → Release Manager
- Edit title, summary, content, severity on any release
- Toggle mandatory/silent flags
- Publish/unpublish releases
- Delete releases

Manual releases use `source = 'manual'` and `generation_status = 'manual'`.

## Database Schema

### release_announcements

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| version | text | Unique |
| title | text | Required |
| summary | text | Optional |
| content | jsonb | Array of bullet point strings |
| severity | text | info / important / critical |
| is_mandatory | boolean | Requires acknowledgement |
| is_silent | boolean | No popup, history only |
| is_published | boolean | Visible to users |
| published_at | timestamptz | When published |
| source | text | auto / fallback / manual |
| commit_messages | jsonb | Raw commit messages |
| filtered_commit_messages | jsonb | After classification filter |
| release_fingerprint | text | Unique dedup hash |
| ai_model | text | e.g. google/gemini-2.5-flash |
| generation_status | text | generated / fallback / manual |
| created_by | uuid | Null for auto |

### user_release_reads

| Column | Type | Notes |
|--------|------|-------|
| release_id | uuid | FK to release_announcements |
| user_id | uuid | Auth user |
| dismissed_at | timestamptz | When dismissed |
| acknowledged_at | timestamptz | When acknowledged (mandatory) |

### release_metrics

| Column | Type | Notes |
|--------|------|-------|
| release_id | uuid | FK, unique |
| view_count | integer | Server-side updated |
| dismiss_count | integer | Server-side updated |
| acknowledge_count | integer | Server-side updated |

## Security

- RLS enforced on all tables
- Auto-creation runs through edge function with service role (privileged)
- Users can only read published releases and their own read states
- Users cannot directly create releases
- GitHub token stored as server-side secret

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| create-autonomous-release | Full orchestration pipeline | JWT verified |
| fetch-deployment-commits | GitHub commit fetching | JWT verified |
| generate-release-notes | AI note generation (admin manual use) | JWT + admin role |

## Failure Safety

- GitHub API failure → fallback generic release
- AI failure → fallback theme-based release
- DB unique constraint violation → silent dedup
- Session-level guard prevents repeated auto-create calls
- Release system never blocks app startup (all async)

## Rollback

1. Remove `<ReleaseAnnouncementDialog />` from `AppShell.tsx` to disable popup
2. Autonomous creation can be disabled by removing the `triggerAutoRelease` call in hook
3. System is fully non-blocking — removal has zero impact on app functionality

## Environment Variables

### Build-time
- `VITE_APP_VERSION`: Set by CI/CD pipeline

### Server-side Secrets
- `GITHUB_TOKEN`: GitHub personal access token (optional)
- `GITHUB_REPO_OWNER`: GitHub repository owner (optional)
- `GITHUB_REPO_NAME`: GitHub repository name (optional)
- `LOVABLE_API_KEY`: For AI generation (pre-configured)

If GitHub secrets are not configured, the system operates in fallback-only mode.
