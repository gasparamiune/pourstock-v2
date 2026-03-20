# PourStock Reform Tracker

## Active Structure

```
reforms/
├── future/          ← Queued plans awaiting pre-flight check
├── ongoing/         ← Active work in progress
├── done/            ← Completed reforms
└── PRE-FLIGHT-CHECKLIST.md  ← Mandatory protocol before activating a reform
```

## Current Ongoing Reform

- **[Verification Mode](../reforms/ongoing/verification-mode.md)** — PDF highlight-on-hover for Table Plan tab

## Future Reforms Queue

- **[SaaS Readiness Audit](../reforms/future/saas-readiness-audit.md)** — Legal, billing, security, branding reforms for commercial launch

## Completed Reforms

_(none yet)_

## Workflow

1. New plans go to `reforms/future/`
2. Before starting: run `reforms/PRE-FLIGHT-CHECKLIST.md` checks
3. Move to `reforms/ongoing/` with pre-flight status note appended
4. On completion: move to `reforms/done/` with completion summary

## Previous Completed Work (Pre-Reform-Tracker)

- [x] Security hardening: CORS, RLS, Edge Function auth
- [x] AI cost optimization: caching, token tracking
- [x] Test coverage: assignment algorithm, cutlery utils, auth hook
- [x] Mobile UX: responsive fixes across all pages
- [x] Documentation: monetization model, roadmap
