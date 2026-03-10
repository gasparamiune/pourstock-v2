# PourStock Architecture

## Platform Overview

PourStock is a multi-tenant SaaS platform for hotel and restaurant operations. It serves the Nordic hospitality market, providing AI-powered dinner service coordination, beverage inventory management, and operational analytics in a single real-time system.

The platform is designed for use on tablets, phones, and desktops during live service. All hotels share one codebase with strict tenant data isolation.

---

## Core Domains

| Domain | Description |
|--------|-------------|
| **Inventory** | Product catalog, multi-location stock tracking, quick counts, reorder rules |
| **Reception / Stays** | Guest check-in/check-out, room assignments, reservation management |
| **Housekeeping** | Task generation, room status tracking, event-driven automation |
| **Restaurant Table Planning** | AI-powered PDF parsing, auto-assignment, drag-and-drop seating, live service coordination |
| **Billing / Folios** | Structured billing mirror, folio items, payments |
| **Integrations** | External system connectors, integration event tracking |
| **AI Automation** | PDF reservation parsing, AI job tracking |
| **Analytics** | Occupancy, revenue, parity, and migration health views |

---

## Architecture Principles

The following principles governed the platform's 12-phase migration program and continue to guide development:

- **Additive schema evolution** — new tables and columns are created before any removals
- **Source-of-truth preservation** — legacy systems remain primary until cutover criteria are met
- **Dual-write mirroring** — normalized tables are populated via fire-and-forget writes alongside legacy operations
- **Idempotent operations** — reconciliation and repair functions are safe to re-run
- **RLS multi-tenant isolation** — every operational table is scoped by `hotel_id` with Row Level Security
- **Observability-first migration** — parity views, failure logging, and health dashboards are built before cutovers

---

## System Components

### Frontend

- React 18 with TypeScript
- Vite build toolchain
- Tailwind CSS with shadcn/ui component library
- Real-time subscriptions via Supabase Realtime

### Backend

- Supabase (PostgreSQL)
- Row Level Security for tenant isolation
- Edge Functions (Deno) for server-side logic
- Structured migration program with 12 completed phases

### Automation

- AI reservation parsing via Gemini models
- Configurable parser profiles per hotel
- Event-driven housekeeping task generation

---

## Documentation Map

| Area | Location |
|------|----------|
| Architecture & ADRs | `docs/architecture/` |
| Operational runbooks | `docs/operations/` |
| Migration history | `.lovable/migration-master-plan.md` |
| Soak readiness | `.lovable/soak-readiness-report.md` |
| Release history | `docs/releases/` |
| Product documentation | `docs/product/` |

---

## Future Evolution

The platform is currently in the **soak validation phase**. Legacy tables remain the primary source of truth while normalized mirrors accumulate parity evidence.

Future architectural evolution may include:

- **Domain-by-domain source-of-truth cutovers** once soak thresholds are met
- **Advanced analytics** powered by the normalized data model
- **AI-driven operations automation** beyond PDF parsing
- **Broader integration ecosystem** connecting PMS, POS, and channel managers
- **Enterprise features** for multi-property hotel groups
