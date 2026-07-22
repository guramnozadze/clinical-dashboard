# 0008: Client data calls reach FastAPI via a thin token-attaching proxy

## Status

Accepted

## Context

Participant data is fetched by TanStack Query in client components
(ADR 0006), and FastAPI wants `Authorization: Bearer <jwt>`. But the JWT
lives in an httpOnly cookie (ADR 0007) that browser JS cannot read, so the
client cannot set that header itself. Something server-side must attach
it, without turning Next.js into a real backend.

## Decision

One catch-all route handler, `app/api/backend/[...path]/route.ts`
(implemented in step 7 with its first consumer): it forwards method, path,
query string, and body verbatim to `API_BASE_URL/<path>`, adds
`Authorization` from the cookie, and streams the FastAPI response back
untouched - status codes, error bodies and all. No per-resource routes, no
response reshaping, no business logic: FastAPI's contract stays the only
API contract, and the proxy stays ~40 lines that never grow with the API.

Client code calls `/api/backend/participants` exactly as a plain SPA would
call FastAPI directly; only the base URL differs.

## Alternatives considered

- **Hand the token to JS** (return it from login, or a `/api/auth/token`
  endpoint): restores direct FastAPI calls but any XSS can now pull the
  token; defeats the entire point of ADR 0007.
- **FastAPI accepts the cookie directly + CORS with credentials**: changes
  a finished, tested backend, makes it browser-aware (cookie parsing, CSRF
  defense, per-origin config), and breaks the "backend serves any client"
  neutrality.
- **Per-resource BFF handlers in Next**: duplicates the API surface route
  by route; the second backend ADR 0006 exists to prevent.

## Consequences

- One extra same-host hop per data request (negligible; measured in ms).
- The token never exists in browser-readable space at any point.
- Same-origin requests mean no CORS configuration anywhere.
