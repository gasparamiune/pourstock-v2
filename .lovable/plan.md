

## Plan: Remove conflicting lockfiles and republish

### Confirmed Problem
`bun.lock` **still exists** in the Lovable filesystem alongside `package-lock.json`. Additionally, `deno.lock` is also present at the root (used only by Edge Functions in `supabase/functions/`, not by the Vite build, but worth noting).

### Steps

**Step 1: Delete `bun.lock`**
Write an empty/minimal replacement to effectively remove the file, or overwrite it. This eliminates the lockfile conflict so the build system uses only `package-lock.json`.

**Step 2: Republish**
Click Publish → Update to trigger a clean production build.

**Step 3: Verify**
After publishing, check that `pourstock.lovable.app` serves proper HTML with `<head>`, `<script>`, and CSS tags, and the app renders.

---

One file operation. No application code changes.

