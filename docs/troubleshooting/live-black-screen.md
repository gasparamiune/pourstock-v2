# Troubleshooting: Live site shows a black screen

## Symptom
- Lovable preview works perfectly.
- Published/live domain (`swift-stock-bar.lovable.app`) loads a dark/black screen.
- No visible app UI appears.
- Browser console shows: `Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY`.

## Root Cause

The Supabase client (`src/integrations/supabase/client.ts`) validates that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` exist at runtime. If either is falsy, the client **throws an error before the React app mounts**, resulting in a blank/black screen.

### Why it only affected the live/published site

Lovable Cloud automatically injects environment variables into the **preview** build. However, the **production/published** build did not reliably receive these variables during the Vite build step. Since Vite replaces `import.meta.env.*` references at compile time (not runtime), any missing variable becomes `undefined` in the final JS bundle — causing the guard in `client.ts` to throw.

The preview worked because Lovable's dev server always had access to the `.env` file and injected variables. The production build pipeline did not guarantee the same injection.

### Why republishing alone did not fix it

The production build pipeline consistently failed to inject the env vars. Republishing simply repeated the same broken build process, producing the same bundle with `undefined` values.

## Resolution (March 2026)

A **build-time fallback** was added to `vite.config.ts`:

```typescript
const FALLBACK_SUPABASE_URL = "https://wxxaeupbfvlvtofflqke.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "eyJ...";

export default defineConfig(({ mode }) => {
  const resolvedSupabaseUrl = process.env.VITE_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const resolvedSupabasePublishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  return {
    // ...
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(resolvedSupabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(resolvedSupabasePublishableKey),
    },
  };
});
```

The `define` property hard-inlines the values into the compiled JavaScript at build time, bypassing the env var injection pipeline entirely. If the platform does inject the vars, they take priority; if not, the fallback values ensure connectivity.

### Security note

The values used are the **publishable/anon key** (safe to expose client-side) and the project URL (public). No secret keys are embedded.

## How to verify

1. Open the live site in an incognito window.
2. Check browser DevTools → Console for any Supabase-related errors.
3. Confirm the login page renders correctly.
4. Verify network requests go to the correct Supabase URL.

## Timeline

| Date | Event |
|------|-------|
| March 2026 | Black screen reported on live site |
| March 2026 | Multiple republish attempts — no effect |
| March 12, 2026 | Build-time fallback added to `vite.config.ts` — **resolved** |

## Lessons Learned

1. **Never rely solely on runtime env var injection** for critical configuration in Vite apps. Vite performs static replacement at build time — if the var is missing during build, it's missing forever in that bundle.
2. **Preview ≠ Production**: The Lovable preview environment has different env var injection than the published build pipeline. Always verify the live site after publishing.
3. **Build-time `define`** is a robust pattern for ensuring critical config is always present in the output bundle.

## Related

- [ADR-006: Build-time environment variable fallback](../architecture/adr/ADR-006-build-time-env-fallback.md)
- [Development Guide — Environment Variables](../development.md#environment-variables)
