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
| [Phase 9 — First-Sale Prep](done/phase9-first-sale-prep.md) | Bar module, real Reports data, SubscriptionGate, GDPR export, POS stub fix | pending push |

---

## Ongoing 🟡

*Nothing currently in progress.*

---

## Future ⏳

| Plan | Summary |
|------|---------|
| [SaaS Readiness Audit](future/saas-readiness-audit.md) | Living reference doc — tracks remaining commercial launch items |

---

## Commercial Readiness Status

### Done ✅ (code shipped)
- Bar department module (tabs, quick service, daily report)
- Real occupancy trend in Reports (no more `Math.random()`)
- Revenue analytics tab (real room_charges data)
- SubscriptionGate component (Professional plan gate)
- GDPR data export (client-side + edge function)
- CompliancePanel "Export Data" per guest
- POS Integration → honest "Coming Soon" card
- Cookie banner, legal pages (terms/privacy/cookies)
- Trial banner, billing settings, ErrorBoundary
- DB migrations 0002–0007 (pending `npx supabase db push`)

### Needs User Action ⚠️
- **Apply DB migrations**: `npx supabase login && npx supabase link --project-ref wxxaeupbfvlvtofflqke && npx supabase db push`
- **Deploy edge function**: `npx supabase functions deploy export-guest-data --project-ref wxxaeupbfvlvtofflqke`
- **Custom domain**: Configure `app.pourstock.dk` in hosting + Supabase Auth URLs
- **Branded email templates**: Supabase Dashboard → Auth → Email Templates

### Week 2–3
- Stripe Checkout + webhook integration
- Sentry error tracking
- DPA signed by lawyer (see `docs/startup/dpa-template.md`)
