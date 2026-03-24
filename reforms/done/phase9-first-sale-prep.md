# Phase 9 — First-Sale Preparation

**Status:** Shipped
**Goal:** Close all remaining gaps before onboarding the first paying hotel.

## What Was Done

### Bar Module (new)
- `src/pages/Bar.tsx` — 3-tab page (Active Tabs / Quick Service / Daily Report)
- `src/components/bar/ActiveTabs.tsx` — per-room/table bar tabs; posts to `room_charges` as `charge_type='bar'`
- `src/components/bar/QuickService.tsx` — POS-style product grid with cart
- `src/components/bar/BarReport.tsx` — daily KPIs + top products chart
- Nav item added to AppShell (department: `'bar'`)
- Route `/bar` added to App.tsx with `requireDepartment="bar"`
- `'bar'` added to `Department` union type in `useAuth.tsx` and `ProtectedRoute.tsx`
- `nav.bar` translation added (EN + DA)
- Migration `20260324000007_bar_department.sql` — adds `bar` to `department` enum

### Reports — Real Data
- Occupancy trend: replaced `Math.random()` with real 7-day reservation overlap calculation
- Revenue tab: now fetches real `room_charges` data; wrapped in `SubscriptionGate requiredPlan="professional"`
- KPIs: Total Revenue, Room Revenue, Bar Revenue, RevPAR
- Charts: daily revenue BarChart + payment status PieChart

### SubscriptionGate Component
- `src/components/auth/SubscriptionGate.tsx`
- Plan rank system: trial=0, starter=1, professional=2, enterprise=3
- Trial users always pass through; lower-rank plans see upgrade CTA

### GDPR Data Export
- `supabase/functions/export-guest-data/index.ts` — edge function (Art. 20 portability)
- `CompliancePanel.tsx` — "Export Data" button per guest row (client-side JSON download)

### POS Integration Fix
- Settings POS tab: replaced fake "connected" UI with honest "Coming Soon" card

### Documentation
- `docs/startup/first-sale-checklist.md` — onboarding checklist for first hotel
- `docs/startup/dpa-template.md` — Danish-law DPA template (pending lawyer review)
- `reforms/README.md` — commercial readiness status section added
