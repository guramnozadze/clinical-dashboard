# 0007: JWT stored in an httpOnly cookie set by Next.js route handlers

## Status

Accepted

## Context

After login, the FastAPI JWT must live somewhere in the browser for the
session. The main threat to a token in an SPA is XSS: any script that can
run on the page can read JS-accessible storage. The frontend is an SPA
(ADR 0006), so there is no server render to hide state in, but Next route
handlers can set cookies.

## Decision

`POST /api/auth/login` accepts JSON credentials, forwards them
form-encoded to FastAPI `/auth/login`, and sets the returned JWT as a
cookie named `access_token` with:

- `httpOnly` - invisible to all JavaScript, including injected scripts
- `secure` in production (localhost dev stays http)
- `sameSite=lax` - browser drops the cookie from cross-site POSTs, which
  is the CSRF-relevant case here
- `path=/`, `maxAge` = 30 minutes, matching the JWT's own expiry so the
  cookie and token die together

`POST /api/auth/logout` clears the cookie. The token never appears in a
response body, localStorage, or client state. Consequence: the browser
cannot attach the token itself; how client data calls authenticate is
ADR 0008.

## Alternatives considered

- **localStorage / sessionStorage**: one XSS payload away from silent
  token exfiltration; also needs manual attach on every call.
- **In-memory only (module variable)**: lost on refresh, forcing re-login
  or a refresh-token flow; still exfiltratable while the page runs.
- **Readable (non-httpOnly) cookie**: combines XSS readability with CSRF
  auto-attachment; worst of both.

## Consequences

- Auth state is invisible to JS, so the UI learns "am I logged in" via a
  `/api/auth/me` endpoint (step 4) instead of inspecting a token.
- Logout is cookie deletion; the JWT itself stays valid until expiry
  (accepted on the backend too, ADR 0002).
