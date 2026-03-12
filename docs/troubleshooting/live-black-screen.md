# Troubleshooting: Live site shows a black screen

## Symptom
- Lovable preview works.
- Published/live domain loads a dark/black screen.
- No visible app UI appears.

## Most likely cause
Missing production environment variables for Supabase.

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The app reads these at startup from Vite env (`import.meta.env`). If they are not defined in the published environment, startup fails before rendering the app UI.

## How to verify quickly
1. Open browser DevTools on the live site.
2. Check Console for startup/runtime errors related to Supabase URL/key.
3. Compare Lovable Preview env vars vs Production env vars.

## Fix in Lovable
1. Open **Project Settings → Environment Variables**.
2. Add both variables for **Production** (not only preview/development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Re-publish.
4. Hard refresh the live site (`Ctrl+F5`).

## Copy/paste prompt for Lovable
```text
Please fix production env config for my app.

1) In Project Settings → Environment Variables, set these in Production:
- VITE_SUPABASE_URL = <my supabase project URL>
- VITE_SUPABASE_PUBLISHABLE_KEY = <my supabase anon/publishable key>

2) Ensure the same values exist in Preview.

3) Rebuild and republish.

4) Verify the live domain loads the login page and no black screen appears.
```

## Notes
- If env vars are correct and issue persists, clear site data/cache and test in an incognito window.
- Also verify the exact Supabase project URL/key pair matches the intended project and environment.
