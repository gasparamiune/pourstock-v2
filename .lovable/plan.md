

# Enhance Agent Coordination System

## What we'll build

Two new files plus an update to CLAUDE.md to enable structured coordination between Lovable and Claude Code.

## Changes

### 1. Create `reforms/handoff.md` — Structured request template
A file where Claude Code writes requests (SQL migrations, secret needs, deployment asks) in a structured format. Lovable reads this on each session to pick up pending work.

Format:
- Status markers: `PENDING`, `IN PROGRESS`, `DONE`, `REJECTED`
- Each entry has: date, requestor, type (migration/secret/deploy/question), the actual request, and a response field

### 2. Create `docs/CHANGELOG-AGENTS.md` — Shared decisions log
Chronological log of significant changes made by either agent. Includes:
- Date, agent name, what changed (tables, files, policies)
- Brief rationale

Pre-populated with recent history (daily_menus table creation, CORS fix, reception permissions change).

### 3. Update `CLAUDE.md` — Add coordination protocol section
Append a section after rule 10 documenting:
- The handoff file location and format
- The changelog location
- Instructions for Claude Code to check both files before starting work
- Current table inventory (all 30+ tables listed) so Claude Code always knows what exists

## Scope
Three file changes, no database or frontend modifications. Documentation only.

