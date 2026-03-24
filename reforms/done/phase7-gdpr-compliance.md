# Phase 7 — GDPR & Compliance

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `db9105c`

---

## Summary

Implemented the legal and data governance layer required for commercial operation in
Denmark / EU. Covers database schema, public legal pages, cookie consent, and a
reusable consent checkbox component for sign-up flows.

---

## What Was Built

### Database

`supabase/migrations/20260324000005_gdpr_compliance.sql`

| Table | Purpose |
|-------|---------|
| `gdpr_consents` | Per-user consent records (type, version, ip, consented_at, withdrawn_at) |
| `data_retention_policies` | Per-hotel, per-data-type retention config (days + auto-action) |

Both with `is_hotel_member` RLS policies.

### Legal Pages

| Route | File | Content |
|-------|------|---------|
| `/terms` | `Terms.tsx` | Terms of Service (10 sections, Danish law governing) |
| `/privacy` | `Privacy.tsx` | GDPR-compliant Privacy Policy (data categories, legal basis, your rights, sub-processors) |
| `/cookies` | `Cookies.tsx` | Cookie Policy with cookie inventory table (essential only) |

All three are **public routes** (no auth required), linked from CookieBanner and sign-up.

### Cookie Consent Banner (`CookieBanner.tsx`)

- Appears on first visit (localStorage key `cookie-consent` not set)
- Two actions: **Accept all** / **Essential only** — both store choice and dismiss banner
- Links to `/cookies` and `/privacy` without navigating away from current page
- EU ePrivacy Directive compliant (no tracking cookies set before consent)

### GDPR Consent Checkboxes (`GdprConsentCheckboxes.tsx`)

- Reusable component: two controlled checkboxes (Terms of Service + Privacy Policy)
- Opens legal pages in new tab so user can read without losing form state
- Ready to integrate into Create Hotel and Join flows

---

## Compliance Coverage

| GDPR Article | Implementation |
|---|---|
| Art. 13 — Transparency | Privacy Policy route + consent at signup |
| Art. 17 — Right to erasure | `CompliancePanel.tsx` anonymisation (Phase 2) |
| Art. 20 — Data portability | Noted for future edge function implementation |
| ePrivacy — Cookies | CookieBanner + Cookie Policy |
| Data retention | `data_retention_policies` table; manual config in Settings |

---

## Outstanding (deferred to later phase)

- Data export edge function (Art. 20 portability) — not yet implemented
- Automated retention enforcement DB function (currently manual via CompliancePanel)
- DPA template document for B2B hotel customers
