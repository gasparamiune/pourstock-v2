# Phase 2 — Reception Back-Office Expansion

**Status**: ✅ Done
**Completed**: 2026-03-24
**Commit**: `ca925f5`

---

## Summary

Expanded the Reception page from 3 basic tabs (rooms, today, guests) to a full
back-office suite with 5 new tabs covering billing, analytics, document production,
emergency contact management, and GDPR compliance tooling.

---

## What Was Built

| Tab | Component | Detail |
|-----|-----------|--------|
| Billing | `FolioSheet.tsx` | Per-guest charge ledger, expandable rows, `AddChargeDialog` |
| Analytics | `ReceptionAnalytics.tsx` | KPI strip (occupancy, RevPAR, arrivals/departures), 14-day forecast BarChart |
| Documents | `DocumentCentre.tsx` | Arrivals manifest, departure checklist, EOD revenue, occupancy report — `window.print()` based |
| Problem Solver | `ProblemSolver.tsx` | 11-category emergency contact directory with CRUD, quick-dial `tel:` links |
| Compliance | `CompliancePanel.tsx` | GDPR summary, GDPR right-to-erasure anonymisation dialog |

---

## Migration

`supabase/migrations/20260324000002_emergency_contacts.sql`
- `emergency_contacts` table with hotel_id FK, category, name, phone, email, sla_notes, is_active, RLS

---

## Technical Decisions

- **No PDF library**: Documents are built as HTML strings and opened in a new tab with
  `window.onload = () => window.print()`. Zero dependency overhead.
- **Co-located hooks**: `useEmergencyContacts` / `useContactMutations` live inside
  `ProblemSolver.tsx` rather than separate hook files — all emergency contact logic
  is self-contained.
- **`as any` cast**: `supabase.from('emergency_contacts' as any)` used for tables not
  yet in the generated Supabase types.
