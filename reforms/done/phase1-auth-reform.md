# Phase 1 — Auth Reform: Hotel Creation vs Staff Signup

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `8d00011`

---

## Summary

Split the single Auth page into two distinct flows: hotel creation (admin registers a new
property) and staff signup (invited via a unique token link). Removed all traces of the
hardcoded `DEFAULT_HOTEL_ID` pilot artifact.

---

## What Was Built

| Item | Detail |
|------|--------|
| Auth page tab split | "Sign In" + "Create Hotel" tabs; no longer shows generic signup |
| `/join?token=` route | `Join.tsx` — staff accept invitation via signed token, auto-assigned department |
| Invite system | Admin generates invite tokens stored in DB; Join page validates + consumes |
| `DEFAULT_HOTEL_ID` removal | All code paths now resolve hotel from `useAuth().hotelId` via auth context |
| Password reset flow | `/reset-password` route with email link + new password form |
| `GdprConsentCheckboxes` | Reusable component with ToS + Privacy Policy links wired into Create Hotel form |

---

## Files Changed

- `src/pages/Auth.tsx` — rewritten with tab UI
- `src/pages/Join.tsx` — new invite-acceptance page
- `src/lib/hotel.ts` — `DEFAULT_HOTEL_ID` removed
- `src/hooks/useAuth.tsx` — `hotelId` always resolved from membership, never hardcoded
- `src/components/auth/GdprConsentCheckboxes.tsx` — new component (also used in Phase 7)

---

## Pre-Flight Notes

This reform was gated on removing `DEFAULT_HOTEL_ID`, which required auditing every
`supabase.from(...)` call that omitted an explicit `hotel_id` filter. All were found
and corrected. No RLS bypass risk remains from the legacy constant.
