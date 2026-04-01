# PourStock Pricing Strategy

**Version**: 1.0
**Date**: 2026-03-18
**Status**: Draft — pre-billing-activation
**Scope**: Nordic market primary, European market secondary

---

## Executive Summary

PourStock is a multi-module operations platform that replaces 3–5 separate tools (POS-adjacent stock management, printed reservation lists, housekeeping boards, purchase order spreadsheets, and manual folios). The pricing strategy is built on **value-based principles**: charge a fraction of the demonstrable cost savings, not the marginal cost of running the software. A hotel paying EUR 199/month for PourStock Professional that eliminates one hour of manager time per day, reduces stock variance by 5%, and never miscounts a dinner reservation is receiving many multiples of that in recovered value.

The current pilot at Sønderborg Strand Hotel operates at zero cost. The first commercial contracts should be signed within 60 days of billing activation, targeting EUR 149–299/month per property for the bulk of the initial customer base.

---

## 1. Pricing Philosophy

### 1.1 Value-Based Pricing as the Foundation

Cost-plus pricing (infrastructure cost + margin) would produce prices far too low to sustain a SaaS business and would signal low quality to buyers. A conservative estimate of Supabase, Lovable hosting, and Gemini API costs for a single active hotel is EUR 15–40/month depending on AI usage volume. Building a viable business on 3× cost-plus would mean pricing at EUR 45–120/month — too low to fund sales, support, and continued development.

Competitive pricing anchored to incumbent systems (Mews, SevenRooms, Lightspeed) risks undervaluing the product relative to a narrower point solution. Mews PMS starts at approximately EUR 9–14 per room per month, meaning a 50-room hotel pays EUR 450–700/month for the PMS alone, without any beverage management, AI table planning, or real-time operations layer.

PourStock's correct positioning is as an **operational layer that sits alongside or below a PMS** — not a full PMS replacement at this stage. Pricing should reflect:

- Tangible operational savings (staff time, stock variance, service errors)
- The all-in-one nature that eliminates 3–5 point tools
- Willingness-to-pay benchmarks from Nordic hospitality operators (typically conservative but value-conscious)
- The early-market reality: the first 10 customers are reference accounts and pricing should leave room to negotiate without going below sustainability thresholds

### 1.2 Key Pricing Principles

- **No per-user fees.** Hospitality teams have high staff rotation, seasonal workers, and shared logins on tablet devices. Per-user fees create friction at onboarding and incentivize customers to share credentials. Per-property pricing aligns with hotel group budgets.
- **Per-property pricing.** Each hotel is a billing unit. Groups of hotels are additive, with volume discounts.
- **Module-based upsell path.** Hotels start with what they need today and expand as they see value. This lowers initial purchase objections and creates a natural expansion revenue path.
- **Simplicity over micro-optimization.** Fewer tiers and add-ons are better than a complex matrix. Buyers in hospitality — often the hotel manager or owner — will not read a 12-line pricing comparison table.

### 1.3 Competitive Landscape Reference Pricing

| Competitor | Product | Approximate Pricing |
|---|---|---|
| Mews PMS | Full PMS (reservations, channel mgr, billing) | EUR 9–14/room/month; ~EUR 450–700/month for 50-room hotel |
| SevenRooms | Restaurant reservations + CRM | USD 99–499+/month depending on covers volume |
| Apaleo | Open PMS API platform | EUR 5–8/room/month |
| Lightspeed Restaurant | Restaurant POS + inventory | EUR 69–399/month depending on tier |
| Fourth (HotSchedules) | Inventory + scheduling for hospitality | USD 200–500+/month; primarily large venues |
| RotaCloud / Deputy | Staff scheduling (Nordic market) | EUR 2–4/user/month |
| Simple inventory SaaS (e.g. Marketman, Crafted) | Beverage/F&B inventory only | USD 149–499/month |

PourStock's value proposition is delivering inventory management + table planning + housekeeping + reception coordination + purchase ordering in one platform. The bundled equivalent from point solutions is EUR 350–900+/month for a mid-size hotel. Pricing at EUR 149–349/month Professional represents a genuine 50–70% savings against the fragmented alternative.

---

## 2. Tier Design

### Overview

| Tier | Name | Target Customer | Monthly (EUR) | Annual/Month (EUR) |
|---|---|---|---|---|
| 1 | **Starter** | Small hotels, hostels, B&Bs (≤25 rooms) | 89 | 75 |
| 2 | **Professional** | Mid-size hotels with restaurant (26–100 rooms) | 229 | 189 |
| 3 | **Growth** | Larger hotels or multi-outlet F&B (101–200 rooms) | 449 | 379 |
| 4 | **Enterprise** | Hotel groups / chains (2+ properties or >200 rooms) | Custom | Custom |

Annual pricing reflects approximately 17% discount, paid upfront.

---

### Tier 1 — Starter (EUR 89/month, EUR 75/month billed annually)

**Target**: Independent small hotels, guesthouses, B&Bs, hostels with ≤25 rooms. Likely owner-operated. Priority pain point is typically one of: stock counting, purchase orders, or table planning.

**Included features**:
- Inventory management: product catalog, up to 2 stock locations, quick count workflows, reorder thresholds
- Purchase orders: full ordering workflow, up to 3 vendors
- Restaurant table planning: AI PDF parsing (up to 20 PDF parses/month included), interactive floor plan, arrival timers
- Basic reports: stock movement, consumption summary
- User management: up to 5 user accounts, role-based access (admin, manager, staff)
- Real-time multi-device sync
- Email support (72-hour response SLA)

**Excluded from Starter**:
- Hotel reception and housekeeping modules
- Advanced analytics (variance trends, cross-period benchmarking)
- Unlimited AI parses (overage billing applies above 20/month)
- PMS/POS integrations
- Priority support

**Rationale for EUR 89/month**: Below the psychological EUR 100 threshold for owner-operators making a first SaaS purchase. Comparable to what a small hotel might pay for a scheduling tool or accounting add-on. Enough to cover infrastructure costs and leave margin for support.

---

### Tier 2 — Professional (EUR 229/month, EUR 189/month billed annually)

**Target**: Mid-size hotels with restaurant service, 26–100 rooms. Likely has a dedicated restaurant/F&B manager and front desk staff. This is the primary target segment and should represent the majority of initial revenue.

**Included features — everything in Starter, plus**:
- Hotel reception module: room board, check-in/check-out workflows, guest directory
- Housekeeping module: event-driven task generation, status board, staff assignments, inspection workflows
- AI PDF parsing: 100 parses/month included (covers daily dinner service for typical mid-size hotel)
- Billing and folios: structured folio model, payment tracking, charge history
- Advanced reports: variance tracking, cost-of-goods analysis, occupancy analytics, revenue summaries
- Multi-location inventory: up to 5 stock locations
- Purchase orders: unlimited vendors
- User accounts: unlimited users
- Priority email support (24-hour response SLA)
- Onboarding call (1-hour setup session included)

**Excluded from Professional**:
- Custom PMS/POS integrations (add-on)
- Cross-hotel benchmarking
- Dedicated account manager
- Custom SLA / uptime guarantee
- AI parse overage above 100/month (billed at EUR 0.15/parse)

**Rationale for EUR 229/month**: Positions below the cost of a single full-time hospitality software subscription from incumbents. The mental accounting for a hotel operator is "less than one shift of a part-time employee, and it replaces three tools."

---

### Tier 3 — Growth (EUR 449/month, EUR 379/month billed annually)

**Target**: Larger independent hotels (101–200 rooms), resort properties with multiple outlets, or hotels with complex F&B operations (multiple bars, restaurant + events). Early adopters scaling up from Professional.

**Included features — everything in Professional, plus**:
- Multi-outlet support: up to 3 distinct restaurant/bar outlets under one property
- AI PDF parsing: 300 parses/month included
- Advanced analytics: cross-period benchmarking, service efficiency metrics
- API access (read): export data to BI tools or accounting systems
- Dedicated Slack/Teams channel support
- Monthly account review call
- Custom parser profiles: up to 3 document format configurations

**Excluded from Growth**:
- Multi-property management dashboards (Enterprise only)
- PMS connectors (Mews, Opera) — available as add-on
- Custom SLA

**Rationale for EUR 449/month**: Reflects the higher operational complexity and value delivered at this scale. Still materially below what Mews or a comparable PMS would cost for a 150-room hotel.

---

### Tier 4 — Enterprise (Custom pricing)

**Target**: Hotel groups with 2+ properties, management companies, resort chains. Requires dedicated onboarding, custom SLA, and potentially custom integrations.

**Included**:
- All Growth features, multi-property
- Multi-property dashboards and centralized configuration (roadmap item)
- Cross-property analytics and corporate reporting
- Custom PMS/POS integration development (scoped separately)
- Dedicated account manager
- Custom SLA (99.9% uptime guarantee with credit mechanism)
- Custom contract terms (DPA, GDPR data processing agreements, security questionnaire)
- Unlimited AI parsing or negotiated volume
- Implementation and onboarding (scoped as professional services)

**Pricing guidance**:
- Minimum EUR 899/month for 2-property group
- Typical range EUR 1,200–3,500/month depending on properties and scope
- Custom PMS integration development: EUR 3,000–8,000 one-time fee (scoped per project)

---

## 3. Price Points — Detailed Rationale

### 3.1 EUR Price Points and Nordic Market Context

Nordic hospitality operators are accustomed to paying for quality tools but are price-conscious about recurring SaaS costs. The Danish/Scandinavian SME market has high digital adoption but also high skepticism of opaque pricing. Recommendations:

- **All pricing published publicly** on the website. Hospitality operators dislike "contact sales for pricing" for anything below Enterprise.
- **EUR pricing** for pan-European positioning; DKK pricing can be offered as an option for Danish customers (EUR 1 ≈ DKK 7.46 at current rates, round to DKK 669/1,699/3,349 for Starter/Professional/Growth).
- Include Danish VAT (25% Moms) clearly in invoices but advertise ex-VAT prices in B2B contexts.

### 3.2 Annual Discount Strategy

A **17% discount** for annual prepayment (12 months paid upfront) is the recommended approach:

| Tier | Monthly | Annual (per month) | Annual total | Savings |
|---|---|---|---|---|
| Starter | EUR 89 | EUR 75 | EUR 900 | EUR 168/year |
| Professional | EUR 229 | EUR 189 | EUR 2,268 | EUR 480/year |
| Growth | EUR 449 | EUR 379 | EUR 4,548 | EUR 840/year |

Annual contracts are strongly preferred for cash flow and churn reduction. Incentivize via:
- One-month free equivalent (surfaced as "2 months free" in marketing — equivalent to 17% discount framed positively)
- Priority feature access / roadmap input for annual customers
- Waived onboarding fee for annual plan sign-up (see add-ons below)

### 3.3 Multi-Year Contracts

For Enterprise and Growth customers willing to commit to 2–3 year terms:
- 2-year: additional 5% off annual price (effectively ~21% off monthly)
- 3-year: additional 8% off annual price (effectively ~24% off monthly)
- Lock-in provides predictability; protect with CPI-linked price adjustment clauses on multi-year deals

---

## 4. Add-On Strategy

### 4.1 AI Credits / Usage Overage

**Gemini API cost basis**: Based on Gemini 1.5 Flash pricing, a typical reservation PDF parse (2–4 pages, moderate complexity) consumes approximately 2,000–5,000 input tokens plus 500–1,500 output tokens. At Gemini 1.5 Flash pricing (~USD 0.075/million input tokens, USD 0.30/million output tokens as of Q1 2026), a single parse costs approximately USD 0.0005–0.002 in raw API cost.

With the SHA-256 content-hashing cache already implemented (noted as Phase 2 complete in roadmap), repeated identical PDFs are free. Real-world cost with caching is likely USD 0.001–0.003 per unique parse.

**Recommended overage pricing**: EUR 0.15 per parse above plan limit. This represents a ~50–100× markup over raw API cost — standard for AI-mediated SaaS features. The markup funds the gateway infrastructure, prompt engineering maintenance, error handling, and support costs.

**Rationale**: Most hotels will stay well within included limits. A hotel doing dinner service 365 nights with one PDF upload per night uses 365 parses/year — within Professional's 100/month (1,200/year) allocation. Overage is a backstop, not a primary revenue driver.

**AI credits bundle add-on**: For customers who know they need more (large resorts, banquet facilities):
- +500 parses/month: EUR 29/month
- +2,000 parses/month: EUR 89/month

### 4.2 Additional Properties (for non-Enterprise customers)

Hotels that grow from 1 to 2 properties before formal Enterprise negotiation:
- Additional property on Starter plan: EUR 69/month per additional property (25% discount on base Starter price)
- Additional property on Professional plan: EUR 179/month per additional property (22% discount)
- Triggers a conversation toward Enterprise when a customer adds a 3rd property

### 4.3 Premium Integrations

These are deferred on the technical roadmap (requiring partnership agreements) but should be pre-priced to set expectations:

| Integration | One-Time Setup Fee | Monthly Add-On |
|---|---|---|
| Mews PMS connector | EUR 500 | EUR 79/month |
| Opera PMS connector | EUR 750 | EUR 99/month |
| Protel PMS connector | EUR 500 | EUR 79/month |
| POS synchronization (generic API) | EUR 350 | EUR 49/month |
| Channel manager read integration | EUR 350 | EUR 49/month |
| Accounting export (e-conomic, Dinero) | EUR 150 | EUR 29/month |

Setup fees reflect custom development and testing effort. Monthly fees reflect ongoing maintenance and support.

### 4.4 Onboarding and Implementation

| Service | Price | Included in |
|---|---|---|
| Self-guided onboarding (documentation + video) | Free | All plans |
| Onboarding call (1 hour, remote) | EUR 149 one-time | Free with Professional annual |
| Full onboarding (half-day remote, 4 hours) | EUR 399 one-time | Included in Growth |
| On-site implementation (full day, travel extra) | EUR 899 + travel | Custom/Enterprise |
| Data migration from spreadsheets (stock catalog) | EUR 249 | None — always paid |

The onboarding call waiver for Professional annual is an important conversion lever: it removes the "but I need help setting it up" objection and ties the benefit to annual commitment.

### 4.5 Support Tiers

| Support Level | Response SLA | Channels | Price |
|---|---|---|---|
| Standard (included in all plans) | 72 hours | Email | Included |
| Priority (included in Professional+) | 24 hours | Email | Included |
| Business (add-on for Starter) | 8 hours business | Email + Chat | EUR 29/month |
| Premium (add-on for any plan) | 4 hours, 7 days | Email + Chat + Phone | EUR 79/month |
| Enterprise SLA | Custom | Dedicated channel | Included in Enterprise |

---

## 5. Free Trial and Freemium Strategy

### 5.1 Recommendation: 14-Day Free Trial (No Credit Card Required)

**Trial length**: 14 days. This is the Nordic market standard for B2B SaaS and matches the decision timeline for a hotel manager evaluating a new tool. Shorter trials (7 days) do not allow enough time for a hotel to run a full week of dinner services and form an opinion. Longer trials (30 days) extend the sales cycle and reduce urgency.

**No credit card required** at trial start. This removes friction for the primary buyer (hotel manager/owner who may not have immediate access to a company card) and increases trial starts. Card is collected at conversion.

### 5.2 What Is Included in the Trial

The trial should be **full-featured at the Professional tier level** with the following limits:
- All modules active: inventory, table planning, reception, housekeeping, purchasing, reports, folios
- AI PDF parsing: up to 10 parses during trial
- User accounts: up to 10 users
- Real-time sync: fully active
- Sample data: offer to pre-load a demo dataset (10 rooms, sample stock catalog, 3 sample dinner reservations) to accelerate time-to-value

**Why full-featured**: A crippled trial where the most valuable features (AI table planning, reception module) are locked creates a poor first impression. The product's differentiation should be visible in the first 48 hours.

### 5.3 Conversion Strategy

**Day 0 (Trial start)**:
- Automated welcome email with 3 quick-start videos (table planning, inventory count, purchase order)
- Offer an optional 20-minute onboarding call
- Set up a simple Typeform or in-app checklist: "Have you uploaded your first reservation PDF? Have you set up your stock catalog?"

**Day 3**:
- Automated email: "How's your first week going?" — link to documentation, invite to book a call
- Highlight: "You have 11 days left. Here's what Professional customers typically do in their first week."

**Day 7**:
- Automated email: milestone highlights — "You've counted X items, uploaded Y reservations" (requires basic analytics tracking in app)
- First soft conversion prompt: "Ready to continue? Annual plan saves you 2 months."

**Day 12**:
- Urgency email: "Your trial ends in 2 days"
- Clear comparison: Starter vs Professional vs Growth
- Direct link to Stripe checkout (when billing is active)

**Day 14 (Trial end)**:
- Account is not deleted; data is preserved for 30 days
- Platform moves to a read-only/limited mode (can view data, cannot create new operations)
- Automated email: "Your trial has ended — your data is safe for 30 days" with upgrade CTA

**Day 21 (Post-trial)**:
- Final email: "Last chance to continue — your data will be removed in 9 days"
- Consider a one-time 20% discount offer as a conversion incentive for price-sensitive prospects

### 5.4 Why Not Freemium

A permanent free tier is not recommended at this stage:
- Support cost of free users is not justified by current team size (single founder/small team)
- Hospitality buyers do not expect free SaaS for operational tools — they expect to pay
- A free tier would cannibalise Starter plan conversions
- Freemium works when there are thousands of potential users driving viral growth; hospitality is a relationship-driven, concentrated market
- Revisit if/when a marketplace or partner-channel strategy is in place

---

## 6. Revenue Projections

### 6.1 Assumptions

**Market**: Nordic hospitality (Denmark, Sweden, Norway, Finland) primary; Germany, Netherlands, UK secondary from Year 2.

**Customer Acquisition Channels (Year 1)**:
- Direct outreach to Danish hotels (founder network, trade shows, LinkedIn)
- Referrals from Sønderborg Strand Hotel
- Content marketing / SEO (longer payoff, but plant seeds now)
- No paid acquisition budget assumed in Year 1

**Churn assumptions**: 5%/month for the first cohort (new product, some fit mismatches), improving to 2.5%/month by Year 2 as product-market fit tightens. Annual contracts have near-zero mid-contract churn by design.

**Average Revenue Per Customer (ARPC)**: Blended assuming 70% Professional, 20% Starter, 10% Growth/Enterprise. Monthly ARPC ≈ EUR 210 on monthly billing, EUR 185 on annual. Blended ARPC (assuming 40% annual, 60% monthly): EUR ~195/month.

**Sales velocity**: Realistic for a founder-led sales motion in Year 1 is 1–2 new customers per month with direct effort.

### 6.2 Year 1 Projection

| Month | New Customers | Cumulative Active | MRR (EUR) |
|---|---|---|---|
| 1 | 1 (pilot converts) | 1 | 229 |
| 2 | 1 | 2 | 458 |
| 3 | 2 | 4 | 916 |
| 4 | 2 | 6 | 1,374 |
| 5 | 2 | 8 | 1,832 |
| 6 | 3 | 11 | 2,519 |
| 7 | 2 | 13 | 2,977 |
| 8 | 3 | 16 | 3,664 |
| 9 | 3 | 19 | 4,351 |
| 10 | 3 | 22 | 5,038 |
| 11 | 4 | 26 | 5,954 |
| 12 | 4 | 30 | 6,870 |

**Year 1 Total ARR at end of year**: ~EUR 82,000
**Year 1 total revenue collected** (accounting for ramp): ~EUR 35,000–40,000

Note: These projections assume no paid marketing spend and founder-led sales. They are conservative. 30 active hotels by month 12 requires converting approximately 2–3 hotels/month consistently — achievable with disciplined outreach but not automatic.

### 6.3 Year 2 Projection

| Scenario | Active Hotels (end Y2) | Monthly ARPC | ARR |
|---|---|---|---|
| Conservative | 55 | EUR 195 | EUR 128,700 |
| Base | 80 | EUR 210 | EUR 201,600 |
| Optimistic | 120 | EUR 225 | EUR 324,000 |

Year 2 base case assumes:
- Hiring of first part-time sales/customer success resource (or founder hiring a co-founder)
- One or two hotel group / Enterprise contracts (adds EUR 1,000–2,000/month)
- Expansion of Starter customers into Professional (net revenue expansion)
- International outreach beginning (Sweden, Norway)

### 6.4 Year 3 Projection

| Scenario | Active Hotels (end Y3) | Monthly ARPC | ARR |
|---|---|---|---|
| Conservative | 100 | EUR 215 | EUR 258,000 |
| Base | 200 | EUR 230 | EUR 552,000 |
| Optimistic | 350 | EUR 250 | EUR 1,050,000 |

Year 3 base case represents a meaningful SaaS business with EUR 500K+ ARR and potential to raise a seed round or achieve profitability. At EUR 552K ARR with ~40% gross margin (after infrastructure, AI costs, support), operating costs need to be below EUR 330K/year to break even — feasible with a team of 3–4.

### 6.5 Break-Even Analysis

**Estimated monthly operating costs** (Year 1, lean solo-founder or 2-person operation):

| Cost | Monthly (EUR) |
|---|---|
| Supabase (Pro plan, scaling) | 50–200 |
| Lovable hosting / build minutes | 50–150 |
| Gemini API (pass-through, covered by customer revenue) | Variable |
| Domain, email, tooling | 50 |
| Stripe fees (~2.9% + EUR 0.25/transaction) | ~2.9% of MRR |
| Accounting / legal (amortized) | 100–200 |
| **Total fixed baseline** | **~EUR 450–800/month** |

**Break-even MRR**: approximately EUR 800–1,200/month (accounting for Stripe fees), meaning **5–7 active Professional customers** covers costs completely.

This is reachable by Month 3–4 on the conservative projection above. From Month 5 onward, every additional customer is margin-positive cash flow.

### 6.6 LTV / CAC Targets

**Customer Lifetime Value (LTV)**:
- Average customer lifetime target: 36 months (3 years)
- Average ARPC: EUR 210/month
- LTV = EUR 210 × 36 = EUR 7,560
- At 60% gross margin: LTV (gross profit) ≈ EUR 4,536

**Customer Acquisition Cost (CAC)**:
- Year 1 (founder-led, no paid acquisition): effective CAC is primarily founder time. If 20 hours/customer at EUR 50/hour opportunity cost = EUR 1,000 CAC.
- Year 2 (with sales/marketing spend): target CAC ≤ EUR 1,500 (maintaining LTV:CAC > 3:1)
- Year 3 (with inbound + outbound): target CAC ≤ EUR 800 as referrals and SEO reduce acquisition cost

**LTV:CAC Ratio**:
- Year 1: ~4.5:1 (healthy)
- Year 2 target: >3:1 (minimum healthy SaaS benchmark)
- Year 3 target: >5:1 (as CAC falls with inbound flywheel)

**Payback period**: At EUR 210 ARPC and EUR 1,000–1,500 CAC, payback period is 5–7 months. Excellent for a B2B SaaS product.

---

## 7. Discount and Contract Policy

### 7.1 Volume Discounts (Hotel Groups)

For customers managing multiple properties (pre-Enterprise formal agreement):

| Properties | Discount on Per-Property Price |
|---|---|
| 2 properties | 10% |
| 3–4 properties | 15% |
| 5–9 properties | 20% |
| 10+ properties | Enterprise custom pricing |

Volume discounts are applied to the per-property line item, not to add-ons. They require a single invoice for all properties (consolidated billing).

### 7.2 Introductory / Reference Customer Discount

For the first 5–10 commercial customers (post-pilot):
- Offer a 25–30% discount in exchange for:
  - A named case study / reference call
  - Permission to use hotel name and logo in marketing
  - Participation in a 30-minute quarterly product feedback call

This is not a formal "early adopter" pricing tier — it is a negotiating tool for relationship-based sales. Do not publish it.

### 7.3 Non-Profit / Charity Pricing

Hospitality with a social mission (youth hostels run by foundations, hotels run by rehabilitation programs):
- 40% discount on any plan, upon written confirmation of non-profit status
- No SLA guarantees at the discounted price
- Annual contract required

### 7.4 Contract Lengths and Commitments

| Contract | Billing | Cancellation | Notes |
|---|---|---|---|
| Monthly | Charged monthly | Cancel anytime, effective end of period | No commitment |
| Annual | Charged upfront | Cancel with 30 days notice for renewal | No mid-term refund (pro-rata credit only) |
| 2-Year | Charged upfront or quarterly | 90-day notice for renewal | Additional 5% off annual price |
| 3-Year | Invoiced annually | 90-day notice for renewal | Additional 8% off annual price; CPI clause |

**Refund policy**:
- Monthly plans: no refunds for current period; cancel before renewal date
- Annual plans: pro-rata refund within first 30 days if not satisfied (satisfaction guarantee); no refund after 30 days
- This 30-day satisfaction guarantee on annual plans reduces purchase risk and is a conversion tool

### 7.5 Price Lock Policy

Annual and multi-year customers receive **price lock** for the duration of their contracted term. Price increases apply only at renewal. Renewal notices must be sent 60 days in advance of renewal date (required by EU consumer/business contract norms in many Nordic jurisdictions).

**Recommended annual price increase**: CPI + 3–5%, capped at 10% per year. Communicate increases clearly with notice of improvements delivered.

### 7.6 Discounting Authority

| Discount Level | Who Can Approve |
|---|---|
| Up to 15% | Automatic (annual plan) |
| 16–25% | Founder approval only |
| 26–40% | Founder approval + documented justification |
| >40% | Board/investor approval required (once applicable) |

Do not allow salespeople (once hired) to discount ad hoc without approval — this trains customers to negotiate and devalues the product.

---

## 8. Billing Implementation

### 8.1 Recommended Billing Provider: Stripe

**Recommendation: Stripe Billing** (stripe.com/billing)

Rationale:
- Industry standard for SaaS billing; deep documentation and ecosystem
- Supports subscription billing, usage-based metering, invoice generation, dunning, and tax handling
- EU-compliant invoicing with VAT handling (critical for Nordic/EU B2B)
- Stripe Tax can automatically apply Danish Moms (25%), Swedish Moms (25%), etc.
- Stripe Radar for fraud prevention
- Well-supported in Denmark and all Nordic markets

**Alternative considered: Paddle**
Paddle acts as Merchant of Record, handling EU VAT registration on your behalf. This significantly reduces compliance burden for VAT in multiple EU countries. Recommended if international expansion is a Year 1 priority. Drawback: higher fees (~5% + payment processing) and less control. Revisit Paddle when expanding beyond Denmark/Nordics.

**Alternative considered: Chargebee or Recurly**
Both are excellent for complex subscription management. Overkill at <100 customers; revisit when the subscription model becomes complex (many tiers, many add-ons, volume pricing rules). Start with Stripe Billing and migrate if needed.

**Decision**: Start with Stripe Billing. It is sufficient for the first 200 customers, has the lowest setup complexity, and integrates natively with the React/TypeScript frontend.

### 8.2 Implementing Metered Billing for AI Features

Stripe Billing supports **usage-based (metered) billing** natively via the Metered Subscription model.

**Implementation approach for AI parse overage**:

1. Create a Stripe product: "AI Parse Credits" with unit price EUR 0.15
2. Attach it as a **metered component** to Professional and Growth subscription items
3. Each time a PDF parse is executed in the Supabase Edge Function:
   - Check if the current month's parse count exceeds the plan limit (tracked in a `tenant_usage` table already possible given token tracking in Phase 2)
   - If over limit, call `stripe.subscriptionItems.createUsageRecord()` with quantity=1
   - This increments the metered usage for the billing period
4. Stripe auto-calculates overage at period end and includes it on the next invoice

**Database schema for usage tracking** (to be added alongside Stripe integration):
```
tenant_usage (
  tenant_id uuid,
  period_start date,
  period_end date,
  ai_parses_count integer,
  ai_parses_limit integer,
  stripe_subscription_item_id text
)
```

The existing `ai_result_cache` (SHA-256 content hashing, Phase 2 complete) already prevents double-billing for repeated identical PDFs — cache hits should NOT increment the usage counter.

**Important**: Track Gemini API token costs internally (already implemented in Phase 2 per roadmap) to validate that AI revenue from customers is covering AI costs. If Gemini API costs for a specific hotel exceed EUR 10/month, review their usage pattern.

### 8.3 Stripe Integration Architecture

```
Frontend (React/TypeScript)
  └─ Stripe.js + Stripe Elements (payment form)
  └─ Checkout Session redirect (for new subscriptions)

Backend (Supabase Edge Functions)
  └─ /create-checkout-session    → Stripe Checkout Session
  └─ /stripe-webhook             → handle subscription events
  └─ /create-usage-record        → metered billing events
  └─ /customer-portal            → Stripe Customer Portal redirect

Stripe Webhooks → Supabase Edge Function
  Events to handle:
  - checkout.session.completed   → activate tenant subscription
  - invoice.payment_succeeded    → update billing status
  - invoice.payment_failed       → dunning trigger
  - customer.subscription.deleted → deactivate tenant
  - customer.subscription.updated → tier change handling
```

Tenant subscription state should be stored in a `tenant_subscriptions` table in Supabase:
```
tenant_subscriptions (
  tenant_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text,           -- 'starter' | 'professional' | 'growth' | 'enterprise'
  status text,              -- 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
```

### 8.4 Invoice and Dunning Strategy for EU B2B

**Invoice requirements for EU B2B** (critical for Danish Moms compliance):

Every invoice must include:
- Seller's full legal name, address, and CVR number (Danish company registration)
- Buyer's company name, address, and CVR/VAT number
- Invoice date and unique invoice number
- Description of services
- Net amount (ex-VAT)
- VAT amount (25% Danish Moms, or 0% for EU B2B reverse charge if customer is in another EU country and provides their VAT number)
- Total amount payable
- Payment terms (typically Net 14 for B2B in Denmark)

**Stripe Tax** handles most of this automatically when configured correctly with:
- Your company's Danish CVR number
- Customer VAT number collection at checkout (for EU reverse charge)

**Dunning strategy**:

| Day | Action |
|---|---|
| Invoice issued (day 1 of new period) | Email invoice automatically via Stripe |
| Day 3 (if unpaid, card declined) | Automatic retry + email notification |
| Day 7 | Second retry + email: "Your payment failed" |
| Day 14 | Third retry + email with urgency: "Service may be interrupted" |
| Day 21 | Account flagged as `past_due`, access restricted to read-only |
| Day 28 | Final notice: "Your account will be suspended in 3 days" |
| Day 31 | Account suspended; data preserved for 90 days |
| Day 120 | Data deletion warning email |
| Day 150 | Data deleted per GDPR retention policy |

Configure Stripe Smart Retries (Stripe's ML-based retry scheduler) — it outperforms fixed-schedule retries for card payment recovery.

**For annual invoice customers** (large hotels who want to pay by bank transfer):
- Issue invoice via Stripe with `payment_method_types: ['customer_balance']` or via SEPA Direct Debit
- SEPA Direct Debit is the preferred method for Nordic B2B annual contracts — lower fees than card, standard for Danish business payments
- Bank transfer (manual reconciliation): acceptable for Enterprise and multi-year contracts, requires manual Stripe invoice marking as paid

### 8.5 GDPR and Data Processing Compliance

When billing is activated:
- Publish a Data Processing Agreement (DPA) template on the website
- Include GDPR data processing terms in the subscription Terms of Service
- Stripe is an approved sub-processor; ensure it is listed in your DPA sub-processor list
- Retain billing records for 5 years (Danish accounting law requirement)
- Do not retain card details — Stripe handles this as a PCI-compliant vault

---

## 9. Implementation Roadmap for Pricing Activation

### Phase 1 — Pre-Billing (Current state → 4 weeks)
- [ ] Create Stripe account and configure products/prices for all tiers
- [ ] Add `tenant_subscriptions` table to Supabase
- [ ] Implement `/create-checkout-session` edge function
- [ ] Implement `/stripe-webhook` edge function (handle core events)
- [ ] Add pricing page to marketing site
- [ ] Configure Stripe Tax for Danish Moms
- [ ] Draft Terms of Service and Privacy Policy

### Phase 2 — Trial Activation (Weeks 5–8)
- [ ] Implement trial logic (14-day trial state in `tenant_subscriptions`)
- [ ] Build onboarding email sequence (Day 0, 3, 7, 12, 14)
- [ ] Build read-only mode for expired trials / `past_due` accounts
- [ ] Add in-app billing status indicator and upgrade prompts
- [ ] Stripe Customer Portal for self-service plan changes

### Phase 3 — Metered AI Billing (Weeks 9–12)
- [ ] Add `tenant_usage` table and usage tracking in Edge Functions
- [ ] Integrate `stripe.subscriptionItems.createUsageRecord()` for overages
- [ ] Build usage dashboard for hotel admins (parses used / limit)
- [ ] Internal cost monitoring: Gemini API cost per tenant

### Phase 4 — Dunning and Compliance (Weeks 13–16)
- [ ] Configure Stripe Smart Retries and dunning email sequences
- [ ] Implement account suspension logic on `past_due` webhook
- [ ] SEPA Direct Debit support for annual invoices
- [ ] DPA template published; sub-processor list documented
- [ ] Test full billing lifecycle end-to-end

---

## Appendix A — Competitive Pricing Research Notes

Research conducted March 2026 via public pricing pages and industry reports:

- **Mews**: EUR 9–14/room/month for PMS. A 40-room hotel pays ~EUR 360–560/month for Mews PMS alone. PourStock Professional at EUR 229/month adds operational modules Mews does not include.
- **SevenRooms**: USD 149–499+/month depending on covers and features. Focused on reservations and CRM, not inventory or housekeeping. Primarily US market.
- **Apaleo**: EUR 5–8/room/month open PMS. Very API-first, requires developer resources. Not a direct competitor but informs room-based pricing benchmarks.
- **Lightspeed Restaurant**: EUR 69 (Lean) to EUR 399+ (Enterprise)/month. Covers POS and inventory but not hotel-specific operations.
- **Marketman** (F&B inventory): USD 149–449/month. Inventory only; no table planning, no reception/housekeeping.
- **Fourth (HotSchedules Engage)**: USD 200–500+/month. Labour scheduling + inventory. Enterprise-focused, poor fit for Nordic SME.
- **iiko / r_keeper**: Used in Eastern Europe, not relevant for Nordics.

**Summary**: PourStock Professional at EUR 229/month is well below the combined cost of comparable point solutions and priced attractively relative to mid-market PMS systems. There is no direct all-in-one competitor in the Nordic hospitality SME segment at this price point.

---

## Appendix B — Price Sensitivity Considerations

**Hotel size correlation**:
- Hotels ≤25 rooms: often owner-operated, price-sensitive, EUR 89 Starter is the right threshold
- Hotels 26–100 rooms: professional operations teams, value-conscious but will pay for ROI; EUR 229 Professional is the sweet spot
- Hotels 100+ rooms: have IT/procurement processes; EUR 449 Growth or Enterprise custom pricing

**Seasonal business impact**: Many Nordic hotels have strong seasonal patterns (summer tourism). Consider:
- Offering a "pause" feature (reduce to 50% price for 1–3 months/year) — reduces churn from seasonal operators who would otherwise cancel entirely
- Annual plan pricing already partially mitigates this by spreading cost

**Decision maker profile**: In small to mid-size Nordic hotels, the buyer is typically the hotel manager or owner, not a dedicated IT buyer. They respond to:
- Clear ROI narrative ("replace 3 tools for less than the cost of one")
- Social proof (reference from Sønderborg Strand Hotel)
- Simple pricing (no per-user complexity)
- Risk reduction (14-day trial, 30-day money-back guarantee on annual)
