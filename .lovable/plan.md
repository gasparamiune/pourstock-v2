

## Plan: Clean Database + Fix Edge Function

### Current State
- **Hotel `be0d96b7`** ("Hotel Sønderborg Strand") — the ORIGINAL, keep this one
  - 7 modules: reception, housekeeping, restaurant, inventory, procurement, table_plan, reports
  - 3 departments: Reception, Housekeeping, Restaurant
  - 1 membership: Gaspar as hotel_admin
- **Hotel `6f0ee97e`** ("Sønderborg Strand Hotel") — the DUPLICATE from failed onboarding
  - Identical 7 modules, 3 departments, 1 membership — all duplicates of the above

Both sets are identical. Deleting the duplicate loses zero functionality.

### Changes

**1. Data cleanup (insert tool — 4 statements)**
- DELETE hotel_members WHERE hotel_id = `6f0ee97e`
- DELETE hotel_modules WHERE hotel_id = `6f0ee97e`
- DELETE departments WHERE hotel_id = `6f0ee97e`
- DELETE hotels WHERE id = `6f0ee97e`
- UPDATE hotels SET name = 'Sønderborg Strand Hotel' WHERE id = `be0d96b7`

**2. Fix `create-hotel` edge function** (`supabase/functions/create-hotel/index.ts`)
- Lines 153-164: Replace `callerClient.auth.getClaims(token)` with `callerClient.auth.getUser()` and extract `callerId` from `data.user.id`
- This is the only breaking call — `getClaims` does not exist in supabase-js v2

**3. Redeploy and test the edge function**
- Deploy the fixed function
- Invoke it to verify it boots and responds correctly

### What is NOT touched
- All 7 modules on the original hotel — kept as-is
- All 3 departments on the original hotel — kept as-is
- Gaspar's membership, profile, user_roles — all untouched
- No schema changes, no migrations
- No code changes beyond the single edge function fix

