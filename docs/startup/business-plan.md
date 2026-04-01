# PourStock — Business Plan

**AI-Powered Operations Platform for Hotels & Restaurants**
*Version 1.0 — March 2026*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [Problem & Solution](#3-problem--solution)
4. [Market Analysis](#4-market-analysis)
5. [Product](#5-product)
6. [Business Model](#6-business-model)
7. [Go-to-Market Strategy](#7-go-to-market-strategy)
8. [Operations](#8-operations)
9. [Financial Projections](#9-financial-projections)
10. [Team](#10-team)
11. [Funding Ask](#11-funding-ask)

---

## 1. Executive Summary

PourStock is a multi-tenant SaaS platform that unifies hotel and restaurant operations into a single real-time system. It is purpose-built for the mid-market hospitality segment — independent hotels, boutique chains, and restaurant-hotel combinations — that are too large to manage on spreadsheets but too small or operationally specialised to deploy enterprise PMS solutions like Mews or Oracle Opera.

The platform is in production use at Sønderborg Strand Hotel in Denmark, delivering AI-powered table planning, real-time beverage inventory management, hotel reception workflows, housekeeping task automation, and operational analytics across tablets, phones, and desktops simultaneously.

We are seeking seed investment to commercialise the platform across the Nordic market and begin a phased expansion into the broader European mid-market.

---

## 2. Company Overview

**Legal name**: *[To be incorporated — Danish ApS or equivalent]*
**Operating name**: PourStock
**Headquarters**: Denmark
**Stage**: Pre-seed / Seed
**Founded**: 2025
**Website**: *[TBD]*

### Mission

To eliminate operational fragmentation in hospitality by giving every hotel and restaurant the same real-time operational intelligence that enterprise chains have — at a price and complexity level accessible to independent operators.

### Vision

To become the default operations layer for mid-market hospitality across Europe, connecting departments, automating coordination, and surfacing insights that help owners and managers make better decisions during live service and between them.

### Values

- **Built for the floor** — every feature is designed for use on a tablet during a live dinner service, not on a desktop in a back office.
- **Reliability above all** — the platform must work when it matters most. Hospitality operations do not have maintenance windows.
- **Additive complexity** — new features must not complicate the experience for existing users. PourStock remains simple by default.

---

## 3. Problem & Solution

### The Problem

Hospitality operations are structurally fragmented. A typical mid-size hotel with a restaurant relies on:

- A property management system (PMS) for room reservations and billing
- A point-of-sale (POS) system for F&B revenue tracking
- Printed or emailed PDFs for dinner reservation coordination
- Spreadsheets for beverage inventory management
- Paper or whiteboard systems for housekeeping
- No real-time link between any of these systems

This fragmentation creates several compounding operational problems:

**Service coordination failures**: The restaurant does not know which room guests are arriving until paper lists are passed at shift handover. Course types, dietary requirements, and party sizes are hand-written. Errors during live dinner service are expensive and embarrassing.

**Inventory blind spots**: Without real-time stock visibility, bars over-order expensive stock, under-order fast-moving lines, and write off breakage without tracking. The average hotel F&B operation wastes 8–12% of beverage revenue to untracked losses.

**Housekeeping inefficiency**: Checkout events do not automatically trigger housekeeping tasks. Staff are assigned rooms verbally or by paper lists. Priority management is informal and error-prone.

**Management visibility gaps**: Owners and managers have no real-time view across departments. Occupancy, F&B consumption, and operational KPIs live in separate systems that are rarely reconciled.

### Why Existing Solutions Fail

**Enterprise PMS platforms** (Mews, Oracle Opera, Protel) address some of these problems but at a price and implementation complexity that excludes the mid-market. Typical enterprise PMS implementations cost €5,000–€20,000+ to deploy and €500–€2,000+/month to operate. They are also generic: they do not provide the granular dinner service coordination or bar inventory workflows that restaurant-hotels need.

**Niche tools** address individual problems — reservation management, inventory counting, housekeeping apps — but create yet more fragmentation. Data does not flow between tools. Staff switch between multiple apps during service. There is no unified operational picture.

**Spreadsheets and paper** remain the dominant tool for F&B operations at independent hotels. They fail silently, do not sync across devices, and provide no real-time visibility.

### The PourStock Solution

PourStock solves the integration problem at source by providing a single unified platform that covers all operational workflows. Key differentiators:

**AI-powered table planning**: Upload a dinner reservation PDF — including the Danish Køkkenliste format used widely in Scandinavian hotel restaurants — and the AI extracts all guest data automatically: names, room numbers, party sizes, course types, dietary requirements. The system generates an interactive floor plan with drag-and-drop seating, live arrival countdown timers, and cutlery/glassware preparation summaries. What took 30–45 minutes of manual transcription and floor planning now takes under two minutes.

**Real-time multi-device sync**: Every operational view synchronizes across all devices simultaneously using WebSocket-based subscriptions. When a guest checks in at reception, the housekeeping board updates. When a table is assigned in the restaurant, every device shows the change. There are no stale printed lists.

**Mobile-first design**: The entire platform is designed for tablets and phones. Inventory counts, task management, and service coordination are performed by staff moving through the property, not at desk terminals.

**Configurable per-hotel**: Parser profiles, room types, service periods, product categories, reorder thresholds, and vendor lists are all configured per hotel. The platform adapts to each property's specific workflows.

---

## 4. Market Analysis

### Total Addressable Market (TAM)

The European hospitality management software market was valued at approximately **€4.2 billion** in 2025 and is projected to grow at a CAGR of 9.3% through 2030, driven by cloud PMS adoption, AI integration, and post-pandemic operational digitalisation. This encompasses PMS, POS, revenue management, housekeeping, F&B management, and analytics software sold to hotels, resorts, and restaurant groups.

Sources: Statista, Grand View Research, Allied Market Research — European Hotel Management Software Market.

### Serviceable Addressable Market (SAM)

PourStock's immediate target is mid-market hotels with restaurant operations in the Nordic and DACH regions (Denmark, Sweden, Norway, Finland, Germany, Austria, Switzerland). This segment is characterised by:

- Hotel size: 20–200 rooms
- Restaurant operations on-site (the core workflow differentiator)
- Independent ownership or small regional chains
- Willingness to adopt cloud SaaS tools

Estimated property count: ~38,000 qualifying properties across these regions.

At an average contract value of €350/month (blended across Starter and Professional tiers), the SAM is approximately **€159M ARR**, or **€380M** accounting for the full software wallet (multi-product displacement of existing tools).

### Serviceable Obtainable Market (SOM) — 3-Year Target

With a focused go-to-market in Denmark and Sweden in Year 1, expanding to Norway and the DACH region in Years 2–3:

- **Year 1**: 30 paying hotels — €126K ARR
- **Year 2**: 120 paying hotels — €576K ARR
- **Year 3**: 300 paying hotels — €1.56M ARR

This represents less than 1% market penetration in the SAM, making the target highly achievable against the backdrop of a large, underpenetrated market.

### Market Trends Supporting PourStock

**Cloud PMS adoption acceleration**: The COVID-19 period accelerated SaaS adoption in hospitality. Independent hotels that previously resisted cloud tools are now actively evaluating replacements for legacy on-premise systems. IDC estimates 68% of European mid-market hotels will use a cloud PMS by 2027, up from 41% in 2023.

**AI in hospitality operations**: AI is moving from a niche curiosity to a practical operations tool. Specific applications — document understanding, demand forecasting, automated scheduling — are proving ROI-positive in early deployments. PourStock's AI PDF parsing is an early-market example of this category.

**Labour cost pressures**: Rising minimum wages across the Nordic region (Denmark's effective minimum wage exceeds €17/hour) make labour efficiency tools compelling. Any software that reduces manual coordination time has a clear and calculable ROI.

**F&B cost management**: Inflationary pressure on food and beverage costs (average 14% increase across Europe 2021–2024) has made inventory accuracy and waste reduction a board-level concern for hotel operators.

### Target Customer Profile (ICP)

**Primary ICP: Restaurant-Hotel Operator**
- 30–80 room hotel with on-site restaurant serving dinner service
- 15–40 dinner covers per service period
- Current stack: Branded PMS + printed PDFs + spreadsheets
- Pain point: Dinner service coordination and beverage waste
- Decision maker: Hotel owner or general manager
- Budget authority: Approves software purchases under €500/month without group-level sign-off
- Geography: Denmark, Sweden — Year 1

**Secondary ICP: Regional Hotel Group**
- 3–8 properties, 50–150 rooms each
- Seeks standardised operations tooling across properties
- Decision maker: Operations director or group IT manager
- Enterprise tier target; custom pricing and dedicated onboarding

---

## 5. Product

### Current Feature Set (Production, March 2026)

#### AI-Powered Table Planning
The flagship feature and primary acquisition driver. Dinner reservation PDFs are uploaded and processed by a Gemini-based AI model configured with per-hotel parser profiles. The system extracts:
- Guest names and room numbers
- Party size per table
- Course type (starters, mains, desserts)
- Dietary requirements and allergies
- Special notes

Results feed an interactive floor plan with drag-and-drop seating, table merging, arrival countdown timers (sourced from check-in timestamps), and auto-generated preparation summaries listing cutlery, glassware, and service item requirements. AI results are cached using SHA-256 content hashing to eliminate redundant API costs for repeated document uploads.

#### Beverage Inventory Management
Full product catalog with beverage categorisation, multi-location stock tracking (bar, cellar, service stations), and mobile quick-count workflows optimised for speed — staff can complete a 50+ item count in under five minutes using a tablet. Partial bottle tracking, stock movement history, configurable reorder thresholds, and automatic purchase order suggestions complete the module.

#### Hotel Reception & Front Office
Guest check-in and check-out workflows with real-time room status board. Multi-device coordination means reception, restaurant, and housekeeping all see the same live state. Guest directory, reservation tracking, and room assignment management.

#### Housekeeping
Event-driven task generation triggered by checkout events. Room status tracking with priority-based task queues. Staff assignment management, inspection workflows, and real-time status board.

#### Purchase Orders & Vendor Management
Order creation workflow from draft through sent to received. Vendor management with contact information and order history. Automatic reorder suggestions based on configured thresholds. Full order history and receiving workflow.

#### Operational Reports & Analytics
- Occupancy analytics and RevPAR tracking
- Beverage consumption trends and cost-of-goods analysis
- Stock variance reports and waste tracking
- Revenue summaries

#### User Management & Security
Role-based access control with three roles: hotel admin, manager, and staff. Approval workflow for new user registrations. Server-side permission enforcement. Full multi-tenant isolation — no data crosses hotel boundaries.

### Technical Architecture

PourStock is built on a modern, production-grade technology stack:

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL) with Row Level Security |
| Server Logic | Edge Functions (Deno runtime) |
| Real-Time | WebSocket subscriptions via Supabase Realtime |
| AI | Gemini models with configurable parser profiles |
| Auth | JWT with role enforcement at the RLS layer |
| Hosting | Lovable platform |

The backend has completed a 12-phase migration program, evolving from a single-hotel flat schema to a fully normalised multi-tenant data model. This included introducing domain models for stays, billing (folios/payments), restaurant reservations, integrations, and AI job tracking — all without a single production outage. The migration program demonstrates engineering rigour that directly de-risks the platform's scaling path.

### Product Roadmap (18-Month)

**Q2–Q3 2026: Commercial Activation**
- Stripe billing integration and subscription management
- Multi-hotel onboarding workflows
- Improved onboarding experience and setup wizards
- Domain-by-domain cutovers from legacy to normalised data models

**Q3–Q4 2026: Analytics & Intelligence**
- Cross-hotel benchmarking dashboard
- Advanced RevPAR and ADR tracking
- Predictive occupancy modelling
- Natural language operational queries

**Q1–Q2 2027: Integration Marketplace**
- Mews PMS integration (bidirectional)
- Opera PMS connector
- POS synchronisation for stock tracking
- Channel manager connections
- Accounting system exports (e.g. Dinero, e-conomic)

**Q2 2027: Enterprise Features**
- Multi-property management dashboards
- Centralized group configuration
- Corporate reporting module
- White-label option for hotel group chains

---

## 6. Business Model

### Revenue Streams

**1. Monthly SaaS Subscription (Primary)**

Per-hotel pricing, tiered by property size and feature access:

| Plan | Target Hotel | Monthly Price (DKK) | Monthly Price (EUR) | Included |
|------|-------------|---------------------|---------------------|----------|
| Starter | ≤30 rooms | ~1,100 DKK | ~€149 | Inventory, Table Planning, Purchase Orders, Reception |
| Professional | 31–100 rooms | ~2,950 DKK | ~€399 | All modules + Advanced Reports + AI Parsing (included) |
| Enterprise | Groups / chains | Custom | Custom | Multi-property + Priority Support + Custom Integrations |

Annual prepay discount: 15% off monthly equivalent (improves cash conversion and reduces churn risk).

**2. AI Usage Overages**
AI parsing is included within Professional tier up to 500 parsed documents per month. High-volume hotels (banquet facilities, conference hotels) are billed per additional 100 documents parsed above threshold.

**3. Premium Integration Add-ons**
PMS and POS connectors (Mews, Opera, specific POS systems) offered as optional add-on modules at €50–€150/month per integration. Positioned as Year 2 revenue once integrations are built.

**4. Professional Services — Onboarding**
Optional paid onboarding: floor plan setup, menu configuration, staff training, and parser profile tuning. Priced at €500–€1,500 per property depending on complexity. Margins are modest but it accelerates activation and reduces churn.

### Pricing Philosophy

- **No per-user fees**: Hospitality teams rotate staff frequently. Per-user pricing creates friction and does not reflect value delivery.
- **Per-hotel pricing**: Aligns with how hotel groups budget (per property). Simple to invoice and understand.
- **Value-based positioning**: Pricing is set against the cost of the waste and labour inefficiency PourStock eliminates, not against commodity software benchmarks.

### Unit Economics (Professional Tier, Illustrative)

| Metric | Value |
|--------|-------|
| Monthly subscription | €399 |
| Annual contract value (ACV) | €4,788 |
| Estimated gross margin | ~82% |
| CAC (initial estimate) | €1,200 |
| Payback period | ~3 months |
| LTV (3-year retention at 85% annual) | ~€11,900 |
| LTV:CAC | ~10:1 |

### Current Status

The platform operates on a pilot basis at Sønderborg Strand Hotel with all features available. Billing infrastructure (Stripe) is not yet active; commercial activation is a near-term milestone. This means there is zero current ARR and zero churn data — both honest limitations that seed-stage capital will address.

---

## 7. Go-to-Market Strategy

### Phase 1: Proof of Concept Expansion — Denmark (Months 1–6)

**Goal**: Sign 5–10 paying hotels in Denmark. Establish repeatable sales motion. Generate first €50K ARR.

**Channel**: Direct outreach by founders.
- Target: Independent hotels in Jutland and Copenhagen with on-site restaurant (100–300 qualifying properties in range).
- Tactic: Personal outreach via LinkedIn, Danish hospitality association events (HORESTA), and local hotel owner networks.
- Proof point: Live reference from Sønderborg Strand Hotel — offer site visits and peer introductions.

**Pricing strategy**: Offer early adopter pricing (20–30% discount with 12-month commitment) to the first 10 customers. This builds ARR, generates testimonials, and establishes reference cases for the next phase.

**Success metrics**: 8 paying hotels, 2 testimonials on record, <5% monthly churn.

### Phase 2: Nordic Expansion — Sweden & Norway (Months 7–15)

**Goal**: 50 total paying hotels. €240K ARR. Hire first customer success hire.

**Channel**: Inbound + partner referrals.
- Build out SEO content in Danish, Swedish, and English targeting "hotel inventory management software", "restaurant table planning AI", and equivalent Scandinavian-language terms.
- Partner with hotel management consultants and fit-out companies that advise independent hotels on technology.
- Attend Nordic hospitality trade shows: Salon Culinaire (Copenhagen), Gastronomi & Hotel (Sweden).

**Product additions enabling expansion**:
- Stripe billing activated (self-service subscription management)
- Swedish and Norwegian language localisation (UI labels and support materials)
- Onboarding documentation and video walkthroughs

### Phase 3: DACH Beachhead & Enterprise (Months 16–30)

**Goal**: 200 total hotels. €960K ARR. First enterprise group contract.

**Channel**: Reseller partnerships + enterprise direct sales.
- Identify 2–3 hotel management software resellers / VAR partners in Germany and Austria with existing hotel client bases.
- Direct enterprise sales to regional hotel groups (3–10 properties) where a single contract delivers €10K–€30K ARR.

**PMS integration** (Mews, Opera): Critical unlock for enterprise sales. Hotels that already use Mews will require bidirectional sync; building this integration opens access to Mews' existing customer base via their marketplace.

### Competitive Positioning

PourStock wins on three dimensions:

1. **Unified workflow**: No competitor combines AI dinner service coordination, beverage inventory, and front-office operations in one tool at this price point.
2. **Designed for the floor**: Competitors are desktop-first; PourStock is tablet-first. Staff adoption is faster because the tool works the way staff work.
3. **AI-native**: The AI table planning feature has no direct equivalent in the competitive landscape. It is a genuine differentiator that reduces a 30–45-minute manual task to under 2 minutes.

---

## 8. Operations

### Current Team & Structure

*[To be defined at incorporation — indicate founder roles: CEO/commercial lead, CTO/product lead.]*

The platform was built and is maintained by a small founding team with deep expertise in both hospitality operations and full-stack web development.

### Development Operations

The product is built on Supabase (managed PostgreSQL), Deno Edge Functions, and a React frontend deployed via Lovable hosting. Infrastructure overhead is minimal — there are no servers to manage, no Kubernetes clusters to maintain, no DevOps headcount required at the current scale.

The codebase has completed a rigorous 12-phase migration program with full observability infrastructure: parity validation views, dual-write failure logging, reconciliation tooling, and a health dashboard. This engineering foundation de-risks scaling from one hotel to hundreds.

**CI/CD**: GitHub Actions CI pipeline with automated tests. Every commit is validated before deployment.

### Customer Success & Support

In the early phase (first 10 customers), support is founder-led. Response commitments:
- Critical (service down): < 2-hour response, < 4-hour resolution
- Operational (feature broken): < 8-hour response, next-day resolution
- General (how-to, configuration): < 24-hour response

As the customer base grows past 30 hotels, a dedicated customer success hire is planned. This person will own onboarding, training, and renewal management, with a target NPS of >50 and annual churn <15%.

### Legal & Compliance

- Danish ApS company formation (or equivalent in operating jurisdiction)
- GDPR compliance: Data Processing Agreements in place with all hotel customers, privacy policy and terms of service on website, Supabase Data Processing Agreement active
- EU AI Act readiness: AI features (PDF parsing) classified as minimal-risk use cases; no specific obligations triggered
- PCI DSS: Stripe handles all card data; PourStock never touches raw payment card data

See `docs/startup/legal-checklist.md` for the full compliance framework.

### Hiring Plan

| Role | Timing | Rationale |
|------|--------|-----------|
| Customer Success Manager | Month 8 | Post-PMF, handle 20+ hotel onboardings |
| Full-Stack Engineer | Month 10 | PMS integration development |
| Sales / Account Executive | Month 12 | Scale beyond founder-led sales in Sweden/Germany |
| Second Engineer | Month 18 | Enterprise features & integration marketplace |

---

## 9. Financial Projections

*Note: These projections are illustrative and based on the market sizing, pricing model, and go-to-market strategy described in this document. Actual results will vary.*

### Key Assumptions

- Average revenue per hotel (blended): €320/month (mix of Starter at €149, Professional at €399)
- Annual churn rate: 20% (Year 1), 15% (Year 2), 12% (Year 3) — improving as product matures
- Average onboarding time: 2 weeks from signed contract to live
- CAC: €1,200 (Year 1), €900 (Year 2), €700 (Year 3) — improving with referrals and inbound
- Gross margin: 80% (infrastructure and AI costs ~20% of revenue)
- Headcount-driven OPEX growth (see hiring plan)

### Revenue Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Hotels at start of year | 1 | 30 | 120 |
| New hotels signed | 30 | 100 | 200 |
| Churn (hotels) | 1 | 8 | 18 |
| Hotels at end of year | 30 | 122 | 302 |
| Average hotels (year) | 15 | 76 | 212 |
| Average MRR/hotel | €320 | €340 | €370 |
| Total ARR (year-end) | €115K | €497K | €1.34M |
| Revenue (annual) | €58K | €310K | €940K |

*Year 1 revenue is low because commercial activation starts at Month 3 and ramp is slow during pilot expansion.*

### Cost Structure

| Cost Category | Year 1 | Year 2 | Year 3 |
|--------------|--------|--------|--------|
| Infrastructure (Supabase, AI, hosting) | €8K | €32K | €95K |
| Personnel (salaries + employer costs) | €120K | €280K | €520K |
| Sales & Marketing | €25K | €65K | €110K |
| Legal & Compliance | €15K | €12K | €12K |
| General & Admin | €10K | €15K | €20K |
| **Total OPEX** | **€178K** | **€404K** | **€757K** |

### P&L Summary

| | Year 1 | Year 2 | Year 3 |
|--|--------|--------|--------|
| Revenue | €58K | €310K | €940K |
| Gross Profit (80%) | €46K | €248K | €752K |
| OPEX | €178K | €404K | €757K |
| **EBITDA** | **-€132K** | **-€156K** | **-€5K** |
| Cumulative Burn | -€132K | -€288K | -€293K |

The company approaches EBITDA break-even by the end of Year 3 with seed capital deployed efficiently. Profitability is achievable in Year 4 without additional fundraising, but a Series A is contemplated in Year 3 to accelerate the integration marketplace and enterprise expansion.

### Cash Requirements

Total cash required through Year 3 break-even: approximately **€350K–€450K**, accounting for timing mismatches and working capital buffer. The seed round funds through this horizon.

---

## 10. Team

*[This section to be completed with actual founding team bios.]*

**Co-Founder & CEO** — *[Name]*
Background: [Hospitality industry experience / commercial leadership]. Responsible for sales, customer success, and go-to-market execution.

**Co-Founder & CTO** — *[Name]*
Background: [Full-stack engineering / product development]. Built PourStock from the ground up. Deep expertise in React, TypeScript, PostgreSQL, and AI integration. Responsible for product, engineering, and technical operations.

### Advisory Board

*[To be recruited — target: 1 hospitality industry veteran, 1 SaaS GTM advisor, 1 Nordic tech investor.]*

---

## 11. Funding Ask

### The Ask

We are raising **€[X] in a seed round** structured as a convertible note or SAFE, targeting close in Q2 2026.

### Use of Funds

| Allocation | % | Amount (at €400K) |
|-----------|---|-------------------|
| Personnel (CSM hire + engineers) | 52% | €208K |
| Sales & Marketing | 20% | €80K |
| Legal, GDPR & compliance | 8% | €32K |
| Infrastructure & tooling | 10% | €40K |
| Working capital reserve | 10% | €40K |

### Milestones This Capital Achieves

By Month 18 post-close:
- 50 paying hotels across Denmark and Sweden
- €200K+ ARR
- Stripe billing active, fully automated
- Mews PMS integration shipped and validated
- Customer success hire on-boarded and managing renewals
- Series A preparation underway

### Why Now

- The platform is production-proven at a live hotel. This is not a prototype.
- The Nordic market is beginning a rapid SaaS adoption cycle for hospitality tooling.
- AI document understanding (the core differentiator) has only become commercially viable in the past 18–24 months. The window to establish category leadership is open but will not remain open indefinitely.
- Early reference customers generate compounding referral loops in the tight-knit Nordic hospitality community.

---

*PourStock — Built for real hospitality operations. Designed for the Nordic market.*

*This document contains forward-looking statements and financial projections that are inherently uncertain. They represent the founding team's best estimates based on currently available market data and operational assumptions.*
