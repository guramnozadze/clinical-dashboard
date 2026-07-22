# 0006: Next.js used as a client-rendered SPA, not an SSR data layer

## Status

Accepted

## Context

The frontend needs routing, a production build pipeline, and somewhere safe
to keep a JWT. FastAPI is already the single API-centric backend, and the
assignment explicitly evaluates clean frontend/backend separation over a
REST boundary. The team wants the React code to look like a plain SPA:
TanStack Query for server state, Context for auth status.

## Decision

Use Next.js (App Router) strictly as an SPA shell:

- Every data-bearing page is a Client Component; all participant data flows
  through TanStack Query hooks in the browser, never through Server
  Components or Server Actions.
- The only server-side code is a small set of `/api/auth/*` route handlers
  that exchange credentials with FastAPI and manage an httpOnly JWT cookie,
  plus edge route protection. How authenticated client requests reach
  FastAPI is decided in ADR 0007.

## Alternatives considered

- **Vite + React SPA**: matches the mental model exactly, but has no server
  at all, so the JWT would live in localStorage (XSS-readable) or require a
  separate cookie-setting service; Next's route handlers solve this within
  one deployable.
- **Full Next.js SSR/RSC data fetching**: turns Next into a second backend
  (BFF), splits the data path across two runtimes, hides the REST usage the
  architecture is supposed to showcase, and couples components to the Next
  server runtime.
- **Server Actions for mutations**: same coupling problem, plus mutations
  would bypass the documented FastAPI contract.

## Consequences

- React/data code is portable to any SPA host; Next is replaceable tooling.
- We give up SSR benefits (SEO, first-paint with data), which an
  authenticated internal dashboard does not need.
- One constraint to police in review: no `fetch` to FastAPI outside the
  client data layer and the auth handlers.
