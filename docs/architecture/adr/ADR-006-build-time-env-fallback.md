# ADR-006: Build-time environment variable fallback

**Status**: Accepted

**Date**: 2026-03-12

**Authors**: PourStock Engineering

---

## Context

The published/live version of PourStock showed a black screen while the Lovable preview worked correctly. The root cause was that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` were not being injected into the production build by the hosting platform's build pipeline.

Vite performs static replacement of `import.meta.env.*` at build time. If the variables are absent during the build step, they compile to `undefined` in the output bundle. The Supabase client's startup guard then throws, preventing the React app from mounting.

Multiple republish attempts did not resolve the issue because the build pipeline consistently failed to provide the variables.

## Decision

Add build-time fallback values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` directly in `vite.config.ts` using the `define` configuration property.

The fallback is only used when the platform-injected `process.env` values are missing. When they are present, the platform values take priority.

```typescript
define: {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(resolvedSupabaseUrl),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(resolvedSupabasePublishableKey),
}
```

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Manual env var configuration in hosting settings | Clean separation of config | Lovable Cloud doesn't expose a manual env var UI; unreliable injection was the root cause |
| Hardcode values in `client.ts` | Simple | `client.ts` is auto-generated and must not be edited |
| Remove the startup guard in `client.ts` | App would mount | `client.ts` is auto-generated; app would fail later with cryptic errors |

## Consequences

### Positive

- Live site is guaranteed to connect to the correct backend regardless of env var injection
- No changes to auto-generated files (`client.ts`, `types.ts`)
- Fallback values are public/anon keys — safe to commit

### Negative

- If the Supabase project changes, the fallback values in `vite.config.ts` must also be updated
- Slightly unconventional pattern that new contributors need to understand

### Risks

- If a different Supabase project is intended for production, the fallback would connect to the wrong project. Mitigated by the fact that platform-injected vars always take priority.
