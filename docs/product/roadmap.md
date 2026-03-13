# PourStock Roadmap

High-level future development direction for the platform.

---

## Domain Cutovers

After soak validation thresholds are met, the platform will progressively cut over from legacy tables to normalized models:

- **Stays domain** — read from `stays`/`stay_guests`/`room_assignments` instead of `reservations`
- **Billing domain** — read from `folios`/`folio_items`/`payments` instead of `room_charges`
- **Table planning** — read from `restaurant_reservations`/`table_assignments` instead of `assignments_json`

Each cutover requires documented parity evidence and explicit approval.

---

## Advanced Analytics

Leverage the normalized data model for deeper operational insights:

- Cross-hotel benchmarking
- Revenue per available room (RevPAR) tracking
- Service efficiency metrics
- Predictive occupancy modeling

---

## Integration Marketplace

Expand connectivity with external hospitality systems:

- PMS integrations (Mews, Opera, Protel)
- POS system synchronization (vital for stock tracking)
- Channel manager connections
- Accounting system exports

---

## AI Automation Improvements

- Multi-format reservation document support
- Automated inventory forecasting
- Service flow optimization suggestions
- Natural language operational queries
- ✅ AI result caching (SHA-256 content hashing) — implemented Phase 2
- ✅ Token usage and cost tracking — implemented Phase 2

---

## Enterprise Features

- Multi-property management dashboards
- Centralized configuration management
- Cross-property analytics
- Corporate reporting

---

## Deferred Items (from Technical Audit, March 2026)

The following were evaluated and explicitly deferred:

| Item | Reason |
|------|--------|
| E2E tests (Cypress/Playwright) | Focus on unit tests first; large effort |
| PMS/POS integrations (Mews, Opera) | Requires partnership agreements |
| Multi-property dashboards | No second hotel yet |
| Predictive occupancy / ML forecasting | Insufficient historical data |
| Redis/Pub-Sub for realtime at scale | Supabase Realtime sufficient for current load |

### Discarded Recommendations

| Item | Reason |
|------|--------|
| Direct LLM API calls (bypass gateway) | Lovable gateway handles key management |
| Local open-source models (Llama-3) | Not feasible in serverless architecture |
| Deploy frontend on Vercel/Netlify | Already deployed via Lovable hosting |
