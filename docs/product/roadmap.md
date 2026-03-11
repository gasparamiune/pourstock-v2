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

---

## Enterprise Features

- Multi-property management dashboards
- Centralized configuration management
- Cross-property analytics
- Corporate reporting
