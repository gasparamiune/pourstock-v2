# PourStock SaaS Reform Plan

## Status: Audit COMPLETE ✅ | Phase A PENDING

### Audit — DONE
- [x] Full platform audit: architecture, security, legal, billing, operations
- [x] Created `docs/saas-readiness-audit.md` with findings, reform plan, and editorial opinion

### Phase A: Legal & Security Foundations (Weeks 1–2)
- [ ] Create Terms of Service page (`/terms`)
- [ ] Create Privacy Policy page (`/privacy`)
- [ ] Create Cookie Policy page (`/cookies`)
- [ ] Add forgot password / self-service reset flow
- [ ] Remove `DEFAULT_HOTEL_ID` from codebase
- [ ] Update branding from "Bar Inventory Management" to "Hotel Operations Platform"

### Phase B: GDPR & Resilience (Weeks 3–4)
- [ ] Cookie consent banner
- [ ] GDPR consent at signup
- [ ] DPA template document
- [ ] React error boundaries on all routes

### Phase C: Billing & Revenue (Weeks 5–8)
- [ ] Stripe integration (subscriptions, per-hotel billing)
- [ ] Subscription gating (module-based feature access)
- [ ] Trial period / freemium tier
- [ ] Danish MOMS / CVR-compliant invoicing

### Phase D: Branding & Distribution (Weeks 9–10)
- [ ] Custom domain (`pourstock.dk` or `pourstock.io`)
- [ ] Public landing page with pricing
- [ ] Branded email templates

### Phase E: Operational Maturity (Weeks 11–12)
- [ ] Error tracking (Sentry or equivalent)
- [ ] Uptime monitoring
- [ ] E2E tests (Playwright)
- [ ] Public status page

### Phase F: Data Rights & Hardening (Weeks 13–14)
- [ ] GDPR data export endpoint
- [ ] Account deletion with cascading data removal
- [ ] Security headers (CSP, HSTS)
- [ ] Audit log retention automation

### Previous Completed Work
- [x] Security hardening: CORS, RLS, Edge Function auth (Phase 1)
- [x] AI cost optimization: caching, token tracking (Phase 2)
- [x] Test coverage: assignment algorithm, cutlery utils, auth hook (Phase 3)
- [x] Mobile UX: responsive fixes across all pages (Phase 4)
- [x] Documentation: monetization model, roadmap (Phase 5)
