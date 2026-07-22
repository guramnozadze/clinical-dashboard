# 0002: Stateless JWT bearer auth with python-jose and passlib

## Status

Accepted

## Context

The API needs authentication on participant endpoints. It is a stateless
JSON API consumed programmatically (dashboards, scripts), not a browser app
with server-rendered pages. We want standard tooling, minimal moving parts,
and easy testing.

## Decision

- **JWT bearer tokens** (HS256, signed with `SECRET_KEY`, 30 min expiry,
  `sub` = username) issued by `POST /auth/login` using the OAuth2 password
  flow, so FastAPI's OpenAPI docs get a working "Authorize" button for free.
- **python-jose** for signing/verification and **passlib[bcrypt]** for
  password hashing, per the agreed stack.
- `get_current_user` decodes the token and loads the user from the DB, so
  deleted users are rejected immediately even with a valid token.

## Alternatives considered

- **Server-side sessions (cookies)**: needs session storage and CSRF
  protection; adds state for no benefit to a non-browser API client.
- **PyJWT instead of python-jose**: python-jose is effectively unmaintained
  and PyJWT would be the greenfield choice today; python-jose was specified
  for this project and the API surface is nearly identical, so swapping later
  is a one-file change (`app/security.py`).
- **Opaque tokens in the DB**: enables instant revocation but reintroduces a
  DB lookup per request by design and token-table housekeeping; overkill here.

## Consequences

- No token revocation before expiry; mitigated by the short 30 min lifetime.
- The DB lookup in `get_current_user` costs one query per request but keeps
  authorization decisions based on current user state.
- passlib 1.7.4 requires `bcrypt==4.0.1` (pinned in requirements.txt);
  dropping passlib for the `bcrypt` library directly is a contained future
  change in `app/security.py`.
