# PourStock SaaS Readiness Audit & Reform Plan

**Date**: 2026-03-19
**Last updated**: 2026-03-24
**Status**: Partially implemented — see completion tracker below
**Scope**: Full platform audit for commercial SaaS launch in Denmark (EU expansion planned)
**Reform Lifecycle**: `future/` — kept as living reference; individual phases tracked in `reforms/done/`

---

## Implementation Completion Tracker (updated 2026-03-24)

| Area | Reform | Status |
|------|--------|--------|
| **Legal** | Terms of Service page | ✅ Done — Phase 7 |
| **Legal** | Privacy Policy page | ✅ Done — Phase 7 |
| **Legal** | Cookie Policy page | ✅ Done — Phase 7 |
| **Legal** | Cookie consent banner | ✅ Done — Phase 7 |
| **Legal** | GDPR consent at signup | ✅ Done — Phase 7 (`GdprConsentCheckboxes`) |
| **Legal** | Right to erasure (anonymisation) | ✅ Done — Phase 2 (`CompliancePanel`) |
| **Legal** | `gdpr_consents` table | ✅ Done — Phase 7 migration |
| **Legal** | `data_retention_policies` table | ✅ Done — Phase 7 migration |
| **Legal** | Data export edge function (Art. 20) | ⏳ Pending |
| **Legal** | DPA template document | ⏳ Pending |
| **Legal** | Automated retention enforcement | ⏳ Pending |
| **Security** | Remove `DEFAULT_HOTEL_ID` | ✅ Done — Phase 1 |
| **Security** | Forgot password flow | ✅ Done — Phase 1 |
| **Security** | Error boundaries | ✅ Done — Phase 8 |
| **Security** | CORS / security headers | ⏳ Pending |
| **Security** | Dependency vulnerability scanning in CI | ⏳ Pending |
| **Billing** | `subscriptions` table | ✅ Done — Phase 8 |
| **Billing** | 14-day trial auto-seed | ✅ Done — Phase 8 trigger |
| **Billing** | Trial banner (UI) | ✅ Done — Phase 8 `TrialBanner` |
| **Billing** | Billing settings page | ✅ Done — Phase 8 `BillingSettings` |
| **Billing** | Stripe Checkout integration | ⏳ Pending |
| **Billing** | Subscription feature gating | ⏳ Pending |
| **Billing** | Invoice generation | ⏳ Pending |
| **Multi-tenant** | `DEFAULT_HOTEL_ID` eliminated | ✅ Done — Phase 1 |
| **Multi-tenant** | Hotel offboarding / archival | ⏳ Pending |
| **Multi-tenant** | Tenant data export | ⏳ Pending |
| **Architecture** | E2E tests (Playwright) | ✅ Done — Phase 8 |
| **Architecture** | `audit_logs` table | ✅ Done — Phase 8 |
| **Architecture** | `/health` endpoint | ✅ Done — Phase 8 |
| **Architecture** | Lazy loading expansion | ⏳ Pending (Settings done; other pages pending) |
| **Architecture** | Error tracking (Sentry) | ⏳ Pending |
| **Architecture** | PWA / offline mode | ⏳ Pending |
| **Operations** | Uptime monitoring | ⏳ Pending |
| **Operations** | Status page | ⏳ Pending |
| **Branding** | Auth page tagline updated | ⏳ Pending |
| **Branding** | Custom domain (`pourstock.dk`) | ⏳ Pending |
| **Branding** | Email templates (branded) | ⏳ Pending |

---

---

## Executive Summary

PourStock is a well-architected multi-tenant hotel operations platform built on React/Supabase with solid foundations: RLS-based tenant isolation, role-based access control, audit logging, and a structured migration program. However, transitioning from a single-pilot deployment (Sønderborg Strand Hotel) to a commercial SaaS startup in Denmark (and later EU) requires reforms across legal compliance, security hardening, billing infrastructure, operational maturity, and branding.

This document identifies gaps and prescribes concrete reforms organized by priority.

---

## 1. Legal and Regulatory Compliance (Critical)

### Current State
- No Terms of Service or Privacy Policy exist (Auth page references them but links to nothing)
- No GDPR consent mechanism, cookie banner, or data processing documentation
- No Data Processing Agreement (DPA) template for hotel customers
- Audit logs exist but retention/deletion policies are only mentioned in UI text, not enforced
- Guest personal data (names, room numbers, dietary requirements) is processed without documented legal basis

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Legal pages** | Terms of Service, Privacy Policy, Cookie Policy as routes (`/terms`, `/privacy`, `/cookies`) |
| **GDPR Article 13** | Data collection notices at signup and hotel onboarding |
| **Cookie consent banner** | EU ePrivacy Directive compliance for sidebar cookie and future analytics |
| **Data Processing Agreement** | Template DPA for B2B hotel customers (PourStock = processor, hotel = controller) |
| **Right to erasure** | Account deletion flow with cascading data removal |
| **Data retention automation** | Database function to anonymize audit logs after retention period |
| **Data export** | GDPR Article 20 — user data portability endpoint |
| **Sub-processor register** | Document Lovable Cloud infrastructure as sub-processor |

---

## 2. Security Hardening (Critical)

### Current State
- Auth uses email/password with email verification ✅
- No self-service password reset flow (only admin-initiated)
- No rate limiting on auth endpoints (backend has built-in limits but no app-level protection)
- CORS restricted to `*.lovable.app` — needs updating for custom domains
- Error messages sanitized via `errorHandler.ts` ✅
- No Content Security Policy headers
- `DEFAULT_HOTEL_ID` hardcoded in `src/lib/hotel.ts` — legacy artifact from pilot

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Forgot password flow** | Self-service password reset with `/reset-password` route |
| **Password requirements** | Minimum 8 characters, complexity rules |
| **CORS policy update** | Support custom domains when hotels use their own |
| **Remove hardcoded hotel ID** | Eliminate `DEFAULT_HOTEL_ID`; require hotel membership via auth context |
| **Session timeout** | Add configurable session expiry |
| **Security headers** | CSP, X-Frame-Options, HSTS via edge function or hosting config |
| **Dependency audit** | Automated vulnerability scanning in CI pipeline |

---

## 3. Billing and Subscription Infrastructure (High Priority)

### Current State
- Monetization model documented (Starter/Professional/Enterprise tiers)
- No billing infrastructure — all features free during pilot
- No Stripe integration, subscription management, invoicing, or usage metering

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Stripe integration** | Subscription management with per-hotel billing |
| **Subscription gating** | Enforce feature access based on plan tier (module-based) |
| **Trial period** | 14-day free trial flow for new hotel signups |
| **Invoice generation** | Danish CVR-compliant invoices with Stripe Billing |
| **Usage metering** | Track AI parsing usage for overage billing on Professional+ plans |
| **Subscription management UI** | Self-service plan changes, payment methods, billing history |

---

## 4. Multi-Tenant Maturity (High Priority)

### Current State
- Multi-tenant architecture in place with `hotel_id` scoping and RLS ✅
- Hotel switching works via auth context ✅
- Onboarding creates new hotels via edge function ✅
- `DEFAULT_HOTEL_ID` still referenced as fallback

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Eliminate `DEFAULT_HOTEL_ID`** | Remove from codebase; require hotel membership |
| **Hotel offboarding** | Admin ability to deactivate a hotel and archive data |
| **Tenant data export** | Per-hotel data export for customer portability |
| **Custom domains** | Optional white-label subdomain or custom domain per hotel |
| **Hotel settings expansion** | Add VAT number (CVR), billing address fields |

---

## 5. Application Architecture Improvements (Medium Priority)

### Current State
- React 18 + Vite + Tailwind + shadcn/ui ✅
- React Query for data fetching ✅
- Code splitting with lazy loading on Settings page ✅
- i18n with English/Danish ✅
- Minimal unit tests (24 tests), no E2E tests

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Error boundaries** | React error boundaries to prevent full-app crashes |
| **Lazy loading expansion** | `React.lazy()` on all page-level components |
| **Loading/empty states** | Standardize skeleton loaders and empty state patterns |
| **E2E test foundation** | Playwright for critical flows (auth, check-in, table plan) |
| **CI hardening** | Add `tsc --noEmit` and test coverage to CI pipeline |
| **Performance monitoring** | Web vitals tracking for SaaS reliability metrics |
| **PWA consideration** | Offline-capable mode for tablet use during service |

---

## 6. Branding and Go-to-Market (Medium Priority)

### Current State
- Auth page says "Bar Inventory Management" — outdated positioning
- Dark theme with amber accents — distinctive but may not suit all hotel aesthetics
- No marketing landing page, pricing page, or public website
- Published at `swift-stock-bar.lovable.app` — not a professional SaaS domain

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Update tagline** | "Hotel Operations Platform" or "AI-Powered Hotel Operations" |
| **Custom domain** | Register `pourstock.dk` or `pourstock.io` |
| **Landing page** | Public marketing page with features, pricing, testimonials |
| **Light theme** | Theme toggle for hotels that prefer light mode |
| **Email templates** | Branded transactional emails (verification, reset, invitations) |
| **Logo and brand assets** | Professional logo, favicon, OG images for social sharing |

---

## 7. Operational Readiness (Medium Priority)

### Current State
- Audit logging exists across edge functions ✅
- Dual-write failure logging implemented ✅
- Runbooks documented for migration scenarios ✅
- No uptime monitoring, alerting, or incident management

### Reforms Required

| Reform | Detail |
|--------|--------|
| **Uptime monitoring** | External health checks (BetterUptime, Checkly) |
| **Error tracking** | Sentry or similar for frontend and edge function errors |
| **Customer support** | In-app support widget or help desk integration |
| **Status page** | Public status page for SaaS transparency |
| **Backup verification** | Regular backup restore tests |
| **SLA documentation** | Define and publish uptime SLAs per plan tier |

---

## 8. Danish Business Compliance (Medium Priority)

| Reform | Detail |
|--------|--------|
| **CVR registration** | Danish business registration for invoicing |
| **Bogføringsloven** | Digital bookkeeping compliance if handling financial data |
| **E-invoicing readiness** | Prepare for Peppol/NemHandel if targeting public-sector hotels |
| **VAT handling** | Danish 25% MOMS on SaaS subscriptions; reverse charge for EU B2B |

---

## Implementation Roadmap

| Phase | Focus | Timeline |
|-------|-------|----------|
| **Phase A** | Legal pages, forgot password, remove hardcoded hotel ID, update branding | Weeks 1–2 |
| **Phase B** | GDPR consent, cookie banner, DPA template, error boundaries | Weeks 3–4 |
| **Phase C** | Stripe integration, subscription gating, trial flow | Weeks 5–8 |
| **Phase D** | Custom domain, landing page, email templates | Weeks 9–10 |
| **Phase E** | Monitoring, error tracking, E2E tests, status page | Weeks 11–12 |
| **Phase F** | Data export, account deletion, advanced security headers | Weeks 13–14 |

---

## Editorial Opinion

### What PourStock Gets Right

PourStock has an unusually strong foundation for an early-stage SaaS. The multi-tenant architecture with RLS-based isolation, structured role system, and audit logging are things most startups bolt on later — having them from day one is a genuine advantage. The AI-powered table plan parsing is a distinctive differentiator that's hard to replicate. The dual-write migration framework shows engineering maturity well beyond what's typical at this stage.

The choice to avoid per-user pricing is strategically sound for hospitality. Hotels rotate staff constantly; per-seat models create friction that kills adoption in this sector. Per-hotel pricing aligns with how hotel groups actually budget.

### Where Attention Is Most Needed

**Legal compliance is the single biggest blocker.** Operating a SaaS in Denmark/EU without Terms of Service, a Privacy Policy, and GDPR documentation is not just a risk — it's a legal violation from day one of commercial operation. This must be resolved before accepting paying customers. The good news: it's mostly documentation and page creation, not deep technical work.

**The billing gap is the second priority.** A SaaS without billing is a hobby project. Stripe integration with Danish MOMS handling is well-trodden territory, but it needs to be done properly with CVR-compliant invoicing.

**The `DEFAULT_HOTEL_ID` is a time bomb.** It's a small thing, but it represents the gap between "pilot software for one hotel" and "production SaaS for many." Removing it forces every code path to properly resolve the hotel from auth context, which is exactly the discipline needed.

### Strategic Recommendations

1. **Don't over-build before finding product-market fit.** The Phase A–B reforms (legal, security, branding) are essential. Phase C (billing) enables revenue. Phases D–F can wait until you have 3–5 paying hotels. Don't build a status page for zero customers.

2. **Target 3 hotels in Sønderjylland first.** Your pilot is in Sønderborg. Win the neighboring hotels. Face-to-face onboarding in a small geography will teach you more than any amount of remote sales. Nordic hotel networks are tight — one good reference travels far.

3. **The AI table plan parser is your moat.** Every competitor has inventory management. Very few have AI-powered service coordination. Lead with the table plan in your pitch, not with inventory. Inventory is the retention feature; table plan is the acquisition feature.

4. **Consider a "Freemium Lite" tier.** Instead of a 14-day trial that expires, consider a permanently free tier with limited parsing (e.g., 5 AI parses/month). Hotels are slow to decide — a 14-day trial may not align with their decision cycle, which can be 2–3 months.

5. **PWA is more important than you think.** Hotel WiFi is notoriously unreliable. A service worker that caches the current table plan and allows offline quick-counts would be a genuine competitive advantage during live dinner service. This should be Phase C priority, not Phase F.

6. **Euro Inc is premature.** Focus on Danish ApS or IVS first. The overhead of EU-level incorporation adds complexity without proportional benefit until you have customers in 3+ EU countries. Cross-border B2B SaaS sales work fine under Danish VAT with reverse charge.

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GDPR complaint before legal pages exist | High | Critical | Phase A — immediate |
| Single-hotel architecture assumptions leak into multi-tenant | Medium | High | Remove `DEFAULT_HOTEL_ID`, audit all queries |
| Stripe integration complexity delays revenue | Medium | High | Use Stripe Checkout (hosted) initially, build custom later |
| Hotel sales cycle longer than runway | High | Medium | Freemium tier, extend pilot partnerships |
| AI parsing costs exceed revenue at scale | Low | Medium | Caching already implemented; monitor cost-per-parse |

### Final Thought

PourStock is in a strong position. The technical foundation is solid, the domain knowledge is genuine, and the product solves a real problem that hotel staff actually face during service. The gap between "working pilot" and "commercial SaaS" is mostly legal, commercial, and operational — not technical. That's the best kind of gap to have.

---

*This audit was produced on 2026-03-19 as part of the PourStock SaaS commercialization program.*
