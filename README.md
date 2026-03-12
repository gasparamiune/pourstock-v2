[![CI](https://github.com/gasparamiune/pourstock/actions/workflows/ci.yml/badge.svg)](https://github.com/gasparamiune/pourstock/actions)

# Pour Stock

**AI-Powered Operations Platform for Hotels & Restaurants**

PourStock is a modern SaaS platform that unifies hotel and restaurant operations into a single real-time system. It replaces fragmented workflows — scattered across POS terminals, printed reservation lists, and manual spreadsheets — with an integrated operational layer built for live hospitality environments.

The platform is in **production use** at Sønderborg Strand Hotel in Denmark.

---

## Problem Formulation

Hospitality operations are fragmented. A typical hotel with restaurant service relies on:

- A POS system for sales tracking
- Printed or emailed reservation lists for dinner coordination
- Spreadsheets for beverage inventory
- Manual processes for purchase ordering and stock counts
- No real-time coordination between reception, kitchen, bar, and management

This fragmentation creates blind spots, slows decision-making, and makes service coordination error-prone — especially during live dinner service when timing matters most.

---

## What PourStock Does

PourStock consolidates these workflows into one platform, purpose-built for hospitality teams operating on tablets and phones during service.

### AI-Powered Table Planning
Upload a reservation PDF and AI automatically extracts guest names, room numbers, party sizes, course types, and dietary requirements. The system generates an interactive floor plan with drag-and-drop seating, live arrival timers, and preparation summaries for cutlery, glassware, and service items.

### Beverage Inventory Management
Full product catalog with multi-location stock tracking, fast mobile counting workflows, partial bottle tracking, stock movement logging, and configurable reorder thresholds. Staff can count 50+ items in minutes using a tablet.

### Hotel Reception & Housekeeping
Guest check-in/check-out workflows, real-time room status board, and event-driven housekeeping task generation with priority queues and inspection workflows.

### Purchasing & Orders
Integrated ordering from draft through sent to received, with automatic reorder suggestions based on configurable thresholds and vendor management.

### Operational Reports
Variance reports, consumption trends, cost-of-goods analysis, occupancy analytics, and revenue summaries.

### Real-Time Multi-Device Sync
All operational pages synchronize instantly across tablets, phones, and desktops using real-time data subscriptions with tenant-filtered events.

---

## Key Features

| Area | Capabilities |
|------|-------------|
| **Table Planning** | AI PDF parsing, auto table assignment, drag-and-drop seating, arrival timers, preparation summaries |
| **Inventory** | Product catalog, multi-location stock, quick counts, partial bottles, reorder thresholds |
| **Reception** | Room board, check-in/out workflows, guest directory, reservation tracking |
| **Housekeeping** | Event-driven task generation, status board, staff assignments, inspection workflows |
| **Purchasing** | Order creation, vendor management, receiving workflows, order history |
| **Reports** | Occupancy, revenue, inventory usage, variance tracking |
| **User Management** | Role-based access control (admin / manager / staff), approval workflows |
| **Multi-Tenant** | Full tenant isolation — every hotel's data is completely separated |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | PostgreSQL with Row Level Security |
| Server Logic | Edge Functions (Deno runtime) |
| Real-Time | WebSocket-based live subscriptions |
| AI | Gemini models for reservation PDF parsing |
| Auth | JWT-based authentication with role enforcement |

For architecture details, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Screenshots

> Screenshots will be added here showing the key operational views.

| View | Description |
|------|-------------|
| Dashboard | Department-aware operational overview |
| Table Plan | AI-parsed reservations on interactive floor plan |
| Inventory | Quick count workflow on tablet |
| Reception | Room board with real-time status |
| Housekeeping | Task board with priority queue |
| Reports | Occupancy and revenue charts |

---

## Getting Started

See [`docs/development.md`](docs/development.md) for local setup, environment variables, and build instructions.

---

## Documentation

| Area | Location |
|------|----------|
| Architecture overview | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Development guide | [`docs/development.md`](docs/development.md) |
| Architecture decisions | [`docs/architecture/adr/`](docs/architecture/adr/) |
| UI architecture | [`docs/ui-architecture.md`](docs/ui-architecture.md) |
| Operational runbooks | [`docs/operations/`](docs/operations/) |
| Product features | [`docs/product/features.md`](docs/product/features.md) |
| Release history | [`docs/releases/`](docs/releases/) |

---

## Roadmap

Planned development areas:

- **Domain cutovers** — migrate read paths from legacy tables to normalized models after soak validation
- **Advanced analytics** — cross-hotel benchmarking, RevPAR tracking, predictive occupancy
- **Integration marketplace** — PMS connectors (Mews, Opera), POS synchronization, channel managers
- **AI automation** — multi-format document support, inventory forecasting, service flow optimization
- **Enterprise features** — multi-property dashboards, centralized configuration, corporate reporting

See [`docs/product/roadmap.md`](docs/product/roadmap.md) for details.

---

## Repository Status

This repository is **publicly visible for demonstration and portfolio purposes**. It showcases a production-grade, multi-tenant hospitality SaaS platform built with modern web technologies.

This project is **not open source**. See [`NOTICE.md`](NOTICE.md) for usage terms.

---

*Built for real hospitality operations. Designed for the Nordic market.*
