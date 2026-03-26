# CORS Policy

## Decision

All Edge Functions restrict `Access-Control-Allow-Origin` to `*.lovable.app` subdomains, `*.lovableproject.com` subdomains, and `www.pourstock.com` (the production custom domain).

Requests from non-authorized origins receive `https://www.pourstock.com` as the CORS origin, which effectively blocks them since browsers enforce origin matching.

## Implementation

Each Edge Function uses a dynamic `getCorsHeaders(req)` function that:

1. Reads the `Origin` header from the incoming request
2. Validates it against the pattern `/^https:\/\/.*\.lovable\.app$/`
3. If valid, reflects the origin back (allowing Lovable preview URLs like `id-preview--*.lovable.app`)
4. If invalid, returns the production domain (blocking the request)

## Rationale

- `Access-Control-Allow-Origin: *` was the previous default — this allows any website to call our Edge Functions from browser JavaScript
- While all functions verify JWT tokens (so unauthorized data access isn't possible), open CORS still exposes the API surface to CSRF-style probing
- Restricting to `*.lovable.app` limits the attack surface to only our hosting platform

## Affected Functions

- `create-autonomous-release`
- `create-hotel`
- `fetch-deployment-commits`
- `generate-release-notes`
- `manage-users`
- `parse-table-plan`

## Date

2026-03-13
