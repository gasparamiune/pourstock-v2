

## Insights on the Phase 5 Split Recommendation

The split is sound. Here's my analysis:

### Why I agree with the split

**Phase 5A (vendors, departments, product_categories, room_types)** — these are pure reference data tables. They have no behavioral coupling to any operational flow. CRUD on these tables is completely isolated. A bug in room_types CRUD cannot affect check-in. A bug in vendors CRUD cannot affect purchase orders. Zero blast radius.

**Phase 5B (restaurants, service_periods, reorder_rules, hotel_modules)** — each of these has a subtle coupling:

- **hotel_modules**: Already drives navigation visibility via `useHotelModules`. Adding write (toggle enable/disable) means an admin could accidentally hide a module from all staff. Needs confirmation dialogs and possibly undo.
- **restaurants / service_periods**: These will become FK targets in Phase 7 (restaurant_reservations, table_assignments). CRUD mistakes here (e.g., deleting the "Main Restaurant") could cascade once FKs are live. Better to add CRUD with awareness of that future dependency.
- **reorder_rules**: Conceptually adjacent to stock_levels.reorder_threshold. Once Phase 6 links them, a bad rule could trigger incorrect reorder alerts. Isolated now, but the proximity to inventory logic warrants grouping it with the "slightly more careful" batch.

### One refinement I'd suggest

Within 5B, **hotel_modules** is the most sensitive because it's the only one with an existing live read path (navigation gating). Consider implementing it last within 5B, with:
- A confirmation dialog: "Disabling this module will hide it from all staff"
- An "undo" toast (5-second window before commit)
- Never allowing the last admin-visible module to be disabled

### Implementation order

```text
Phase 5A: vendors → departments → product_categories → room_types
  (pure reference CRUD, zero coupling, fast)

Phase 5B: restaurants → service_periods → reorder_rules → hotel_modules
  (config with future coupling, hotel_modules last with safety UX)
```

### What stays unchanged

- All legacy source-of-truth tables remain primary
- No operational reads migrate
- No FK links activated yet (that's Phase 6+)
- Hardening pass after each sub-phase before proceeding

### Recommended next step

Implement Phase 5A. It's the lowest-risk CRUD work in the entire migration program — four isolated reference tables getting add/edit/delete dialogs.

