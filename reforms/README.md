# PourStock — Reform Tracker

This directory tracks all planned and executed reforms to the PourStock platform.

## Reform Lifecycle

```
future/   →  (pre-flight check)  →  ongoing/  →  done/
```

- **`future/`** — approved plans queued for implementation; must pass `PRE-FLIGHT-CHECKLIST.md` before activation
- **`ongoing/`** — actively in progress
- **`done/`** — shipped and committed

---

## Done ✅

| Reform | Summary | Commit |
|--------|---------|--------|
| [Verification Mode](done/verification-mode.md) | PDF hover highlight on table plan for AI extraction QA | `07abbfd` |
| [Phase 1 — Auth Reform](done/phase1-auth-reform.md) | Hotel creation vs staff invite split; `DEFAULT_HOTEL_ID` removed | `8d00011` |
| [Phase 2 — Reception Back-Office](done/phase2-reception-backoffice.md) | Billing, analytics, documents, problem solver, compliance tabs | `ca925f5` |
| [Phase 3 — Kitchen Module](done/phase3-kitchen-module.md) | KDS real-time board + daily menu editor | `6df1946` |
| [Phase 4 — Live Ordering](done/phase4-live-ordering.md) | Table plan → OrderSheet → kitchen tickets end-to-end | `cf152bc` |
| [Phase 6 — Housekeeping NextGen](done/phase6-housekeeping-nextgen.md) | Floor map + staff performance dashboard | `4fff599` |
| [Phase 7 — GDPR & Compliance](done/phase7-gdpr-compliance.md) | Legal pages, cookie consent, data retention schema | `db9105c` |
| [Phase 8 — SaaS Readiness](done/phase8-saas-readiness.md) | Subscriptions, trial banner, billing UI, ErrorBoundary, E2E tests | `dcb677a` |

---

## Ongoing 🟡

*Nothing currently in progress.*

---

## Future ⏳

| Plan | Summary |
|------|---------|
| [SaaS Readiness Audit](future/saas-readiness-audit.md) | Living reference doc — tracks remaining commercial launch items |

---

## What's Still Pending (from the SaaS audit)

High priority for commercial launch:
- **Stripe Checkout** integration + subscription feature gating
- **Data export** edge function (GDPR Art. 20 portability)
- **Automated retention enforcement** (DB cron / edge function)
- **Sentry** error tracking wired into `ErrorBoundary`
- **Custom domain** (`pourstock.dk` / `pourstock.io`)
- **Branded email templates** (invite, reset, welcome)

Medium priority:
- `DEFAULT_HOTEL_ID` audit for any edge-case survivors
- Hotel offboarding / archival flow
- CSP / security headers via hosting config
- PWA / service worker for offline table plan
- Uptime monitoring + status page
