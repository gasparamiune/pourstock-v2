# Phase 8 — SaaS Readiness

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `dcb677a`

---

## Summary

Implemented the commercial infrastructure needed to run PourStock as a paid SaaS:
subscription model with trial flow, billing UI, global error containment, health
monitoring endpoint, and an E2E test foundation.

---

## What Was Built

### Database

`supabase/migrations/20260324000006_saas_readiness.sql`

| Table | Purpose |
|-------|---------|
| `subscriptions` | Per-hotel plan (trial/starter/professional/enterprise), status, trial dates, Stripe fields, seats |
| `audit_logs` | Structured event log: action, entity_type, entity_id, metadata, ip, user_agent |

**Auto-seed trigger**: `on_hotel_created_seed_trial` — every new hotel automatically gets a
14-day trial subscription row created at hotel creation time.

### Subscription Layer

| File | Purpose |
|------|---------|
| `src/hooks/useSubscription.tsx` | Fetches subscription; computes `trialDaysRemaining`, `trialExpired`, `planLabel`, `seats` |
| `src/components/layout/TrialBanner.tsx` | Adaptive global banner in AppShell |

**TrialBanner behaviour**:
- `> 3 days remaining` — subtle neutral strip, dismissible
- `≤ 3 days remaining` — amber warning strip, non-dismissible
- `Expired` — destructive red bar, links to upgrade
- Hidden for active/non-trial subscriptions

### Billing Settings

`src/components/settings/BillingSettings.tsx` — lazy-loaded in Settings → Billing & Plan:
- Current plan card with live status badge, trial countdown, next billing date
- 3-tier plan comparison grid: Starter (DKK 799/mo) / Professional (DKK 1,499/mo) / Enterprise (custom)
- Feature lists per tier; current plan highlighted; upgrade buttons (Stripe portal placeholder)

### Reliability

| Item | Detail |
|------|--------|
| `ErrorBoundary.tsx` | Class component wrapping all protected routes; graceful fallback with "Try again" reset + expandable error details |
| `/health` route | `Health.tsx` — unauthenticated JSON `{ status: "ok", app: "pourstock", time: "..." }` for uptime monitors |

### E2E Tests

| File | Coverage |
|------|---------|
| `playwright.config.ts` | Chromium + Pixel 7; `webServer` auto-start for local; 2 retries in CI |
| `e2e/smoke.spec.ts` | Health endpoint JSON, auth redirect, legal pages render, cookie banner accept/dismiss |
| `e2e/auth.spec.ts` | Sign-in form, empty validation, Create Hotel tab, join route, legal link navigation |

**npm scripts added**: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`

---

## What Remains for Full Commercial Launch

| Item | Priority | Notes |
|------|----------|-------|
| Stripe Checkout integration | High | Use hosted Stripe Checkout initially to avoid PCI scope |
| Subscription gating (feature flags by plan) | High | Gate Kitchen/Bar modules behind Professional+ |
| Data export edge function (GDPR Art. 20) | Medium | ZIP of guest data + reservation history |
| Automated data retention enforcement | Medium | DB function to anonymise after `retention_days` |
| Sentry / error tracking | Medium | Wire into ErrorBoundary `componentDidCatch` |
| Custom domain (`pourstock.dk`) | Medium | DNS + Lovable/Vercel custom domain config |
| Email templates (invite, reset, welcome) | Medium | Supabase Auth email templates + branding |
| Status page | Low | Wait until 3+ paying customers |
