

# PourStock SaaS Readiness Audit and Reform Plan

## Executive Summary

PourStock is a well-architected multi-tenant hotel operations platform built on React/Supabase with solid foundations: RLS-based tenant isolation, role-based access control, audit logging, and a structured migration program. However, transitioning from a single-pilot deployment (Sonderborg Strand Hotel) to a commercial SaaS startup in Denmark (and later EU) requires reforms across legal compliance, security hardening, billing infrastructure, operational maturity, and branding.

This plan identifies gaps and prescribes concrete reforms organized by priority.

---

## 1. Legal and Regulatory Compliance (Critical)

### Current State
- No Terms of Service or Privacy Policy exist (Auth page references them but links to nothing)
- No GDPR consent mechanism, cookie banner, or data processing documentation
- No Data Processing Agreement (DPA) template for hotel customers
- Audit logs exist but retention/deletion policies are only mentioned in UI text, not enforced
- Guest personal data (names, room numbers, dietary requirements) is processed without documented legal basis

### Reforms Required
- **Create legal pages**: Terms of Service, Privacy Policy, Cookie Policy as routes in the app (`/terms`, `/privacy`, `/cookies`)
- **GDPR Article 13 compliance**: Add data collection notices at signup and hotel onboarding
- **Cookie consent banner**: The sidebar uses a cookie; any analytics will need consent under EU ePrivacy Directive
- **Data Processing Agreement**: Template DPA for B2B hotel customers (you are the data processor, hotels are controllers)
- **Right to erasure**: Implement account deletion flow with cascading data removal
- **Data retention automation**: Database function to anonymize audit logs after retention period
- **Data export**: GDPR Article 20 — user data portability endpoint
- **Sub-processor register**: Document Supabase/Lovable Cloud as sub-processors

---

## 2. Security Hardening (Critical)

### Current State
- Auth uses email/password with email verification — good
- No password reset flow for end users (only admin-initiated reset exists)
- No rate limiting on auth endpoints (Supabase has built-in limits but no app-level protection)
- CORS restricted to `*.lovable.app` — needs updating for custom domains
- Error messages are sanitized via `errorHandler.ts` — good
- No Content Security Policy headers
- `DEFAULT_HOTEL_ID` hardcoded in `src/lib/hotel.ts` — legacy artifact

### Reforms Required
- **Add forgot password flow**: Self-service password reset with `/reset-password` route
- **Strengthen password requirements**: Minimum 8 characters, complexity rules
- **CORS policy update**: Support custom domains when hotels use their own
- **Remove hardcoded hotel ID**: `DEFAULT_HOTEL_ID` should be fully replaced by auth context (currently fallback only)
- **Session timeout**: Add configurable session expiry
- **Security headers**: Add CSP, X-Frame-Options, HSTS via edge function or hosting config
- **Dependency audit**: Automated vulnerability scanning in CI pipeline

---

## 3. Billing and Subscription Infrastructure (High Priority)

### Current State
- Monetization model documented (Starter/Professional/Enterprise tiers)
- No billing infrastructure exists — all features free during pilot
- No Stripe integration
- No subscription management, invoicing, or usage metering

### Reforms Required
- **Integrate Stripe**: Subscription management with per-hotel billing
- **Subscription gating**: Enforce feature access based on plan tier (module-based)
- **Trial period**: 14-day free trial flow for new hotel signups
- **Invoice generation**: Danish CVR-compliant invoices with Stripe Billing
- **Usage metering**: Track AI parsing usage for overage billing on Professional+ plans
- **Subscription management UI**: Self-service plan changes, payment method updates, billing history

---

## 4. Multi-Tenant Maturity (High Priority)

### Current State
- Multi-tenant architecture in place with `hotel_id` scoping and RLS
- Hotel switching works via auth context
- Onboarding creates new hotels via edge function
- `DEFAULT_HOTEL_ID` still referenced as fallback

### Reforms Required
- **Eliminate `DEFAULT_HOTEL_ID`**: Remove from codebase entirely; require hotel membership
- **Hotel deletion/offboarding**: Admin ability to deactivate a hotel and archive data
- **Tenant data export**: Per-hotel data export for customer portability
- **Subdomain or custom domain per hotel**: Optional white-label support
- **Hotel settings expansion**: Timezone, locale, currency already exist — add VAT number, billing address

---

## 5. Application Architecture Improvements (Medium Priority)

### Current State
- React 18 + Vite + Tailwind + shadcn/ui — solid modern stack
- React Query for data fetching — good
- Code splitting with lazy loading on Settings page
- i18n with English/Danish — good foundation
- No E2E tests, minimal unit tests

### Reforms Required
- **Error boundary**: Add React error boundaries to prevent full-app crashes
- **Lazy loading expansion**: Apply `React.lazy()` to all page-level components (currently only Settings sub-pages)
- **Loading/empty states**: Standardize skeleton loaders and empty state patterns
- **E2E test foundation**: Add Playwright or Cypress for critical flows (auth, check-in, table plan)
- **CI hardening**: Add type-checking (`tsc --noEmit`) and test coverage to CI pipeline
- **Performance monitoring**: Add web vitals tracking for SaaS reliability metrics
- **PWA consideration**: Offline-capable mode for tablet use during service (intermittent WiFi in hotels)

---

## 6. Branding and Go-to-Market (Medium Priority)

### Current State
- Auth page says "Bar Inventory Management" — outdated positioning
- Dark theme with amber accents — distinctive but may not suit all hotel aesthetics
- No marketing landing page, pricing page, or public website
- Published at `swift-stock-bar.lovable.app` — not a professional SaaS domain

### Reforms Required
- **Update tagline**: From "Bar Inventory Management" to "Hotel Operations Platform" or similar
- **Custom domain**: Register and configure `pourstock.dk` or `pourstock.io`
- **Landing page**: Public marketing page with features, pricing, testimonials
- **Light theme option**: Hotels may prefer light mode; add theme toggle
- **Email templates**: Branded transactional emails (verification, password reset, invitations)
- **Logo and brand assets**: Professional logo, favicon, OG images for social sharing

---

## 7. Operational Readiness (Medium Priority)

### Current State
- Audit logging exists across edge functions
- Dual-write failure logging implemented
- Runbooks documented for migration scenarios
- No uptime monitoring, alerting, or incident management

### Reforms Required
- **Uptime monitoring**: External health checks (e.g., BetterUptime, Checkly)
- **Error tracking**: Integrate Sentry or similar for frontend and edge function errors
- **Customer support channel**: In-app support widget or help desk integration
- **Status page**: Public status page for SaaS transparency
- **Backup verification**: Regular backup restore tests
- **SLA documentation**: Define and publish uptime SLAs per plan tier

---

## 8. Danish Business Compliance (Medium Priority)

### Reforms Required
- **CVR registration**: Danish business registration for invoicing
- **Bookkeeping Act (Bogforingsloven)**: Digital bookkeeping compliance if handling financial data
- **E-invoicing readiness**: Prepare for Peppol/NemHandel if targeting public-sector hotels
- **VAT handling**: Danish 25% MOMS on SaaS subscriptions; reverse charge for EU B2B

---

## Implementation Priority

| Phase | Focus | Timeline |
|-------|-------|----------|
| **Phase A** | Legal pages, forgot password, remove hardcoded hotel ID, update branding | Weeks 1-2 |
| **Phase B** | GDPR consent, cookie banner, DPA template, error boundaries | Weeks 3-4 |
| **Phase C** | Stripe integration, subscription gating, trial flow | Weeks 5-8 |
| **Phase D** | Custom domain, landing page, email templates | Weeks 9-10 |
| **Phase E** | Monitoring, error tracking, E2E tests, status page | Weeks 11-12 |
| **Phase F** | Data export, account deletion, advanced security headers | Weeks 13-14 |

---

## Deliverable

A comprehensive document `docs/saas-readiness-audit.md` will be committed to the repository containing:
1. This full audit with findings and reform plan
2. A separate editorial opinion section with strategic recommendations

---

## Technical Details

### Files to Create
- `docs/saas-readiness-audit.md` — full audit document with all sections above plus editorial opinion

### No Code Changes
This plan produces a documentation artifact only. Implementation of individual reforms will be separate tasks.

