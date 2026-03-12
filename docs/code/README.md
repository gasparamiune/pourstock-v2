# Code Documentation

This directory contains plain-language explanations of every major area of the PourStock codebase. Use these documents when onboarding, debugging, or deciding where to make a change.

---

## Contents

| File | What it covers |
|------|----------------|
| [`frontend-overview.md`](frontend-overview.md) | Application entry point, page routing, component hierarchy, state management |
| [`auth-and-routing.md`](auth-and-routing.md) | Authentication flow, session management, protected routes, role model |
| [`hooks-reference.md`](hooks-reference.md) | All 18 custom React hooks — purpose, inputs, outputs, and caveats |
| [`backend-functions.md`](backend-functions.md) | The 6 Supabase Edge Functions — what each one does and how to call it |

---

## Where to look for something

| Question | File |
|----------|------|
| How does login work? | `auth-and-routing.md` |
| How does route protection work? | `auth-and-routing.md` |
| What does this hook do? | `hooks-reference.md` |
| How is the app wired together? | `frontend-overview.md` |
| What does this Edge Function do? | `backend-functions.md` |
| What DB tables exist? | `../../supabase/migrations/` |
| What architectural decisions were made? | `../architecture/adr/` |
| What errors might stop the app from running? | `../known-issues.md` |
