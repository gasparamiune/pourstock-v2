

# Fix: CORS blocking edge functions on pourstock.com

## Problem

The `getCorsHeaders()` function in `parse-table-plan/index.ts` (and all other edge functions) only allows origins matching `*.lovable.app` or `*.lovableproject.com`. Your live domain `www.pourstock.com` doesn't match either pattern, so CORS blocks the response in the browser.

## Fix

Update the CORS regex in all 6 edge functions to also allow `pourstock.com`:

```
/^https:\/\/(.*\.(lovable\.app|lovableproject\.com)|www\.pourstock\.com)$/
```

And update the fallback origin from `https://swift-stock-bar.lovable.app` to `https://www.pourstock.com`.

## Affected Files

1. `supabase/functions/parse-table-plan/index.ts`
2. `supabase/functions/create-autonomous-release/index.ts`
3. `supabase/functions/create-hotel/index.ts`
4. `supabase/functions/fetch-deployment-commits/index.ts`
5. `supabase/functions/generate-release-notes/index.ts`
6. `supabase/functions/manage-users/index.ts`

Also update `docs/security/cors-policy.md` to document the addition.

## Scope

One-line regex change per file, plus redeploy. No database or frontend changes needed. Edge functions deploy immediately.

