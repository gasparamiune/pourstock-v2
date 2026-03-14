

## Plan: One-Click Release Approval Flow

### Problem
The auto-release system currently skips versions starting with `auto-` (which is the default), and even when it works, it publishes immediately without admin review. You want a flow where release notes are auto-generated on deploy, then you just hit one button to approve (or edit first).

### New Flow

```text
Publish → Users load new code → Auto-creates DRAFT release
                                        ↓
              Admin sees approval banner at top of screen
                     ↓                        ↓
              [✅ Approve]              [✏️ Edit first]
                     ↓                        ↓
            Release published          Opens editor, then publish
                     ↓
            All users see popup
```

### Changes

**1. Fix version detection** (`src/lib/version.ts`)
- Remove the `auto-` prefix skip in `useReleaseAnnouncements` so auto-generated versions trigger the edge function.

**2. Edge function: create as draft** (`supabase/functions/create-autonomous-release/index.ts`)
- Change `is_published: true` → `is_published: false` and remove `published_at`
- This makes every auto-created release a draft awaiting admin approval

**3. Hook: stop skipping auto- versions** (`src/hooks/useReleaseAnnouncements.tsx`)
- Remove the `APP_VERSION.startsWith('auto-')` guard so auto-release creation fires on every deploy

**4. New AdminReleaseApproval banner component** (`src/components/system/AdminReleaseApproval.tsx`)
- Queries for unpublished draft releases (source = 'auto', is_published = false)
- Shows a slim banner at top: "New release notes ready — [Approve] [Edit]"
- **Approve** button: one click publishes the draft (sets `is_published = true`, `published_at = now()`)
- **Edit** button: opens the existing ReleaseManager editor pre-filled with the draft, then publish from there
- Only visible to admins

**5. Wire banner into AppShell** (`src/components/layout/AppShell.tsx`)
- Add `<AdminReleaseApproval />` below `<SystemBanner />`, admin-only

**6. Realtime subscription on release_announcements** 
- Already handled — `useReleaseAnnouncements` fetches on load, and the auto-create triggers a refetch after 1.5s. When admin publishes, all users' next load/refetch picks it up. Optionally add realtime channel for instant delivery.

### Result
- You publish → draft auto-created → you see banner → one tap "Approve" → every user sees the update popup immediately.

