# 0004: HTTPException for expected errors, one catch-all handler for the rest

## Status

Accepted

## Context

Error responses should be consistent in shape, never leak stack traces or SQL
to clients, and always leave enough information in the logs to debug. FastAPI
already returns `{"detail": ...}` for `HTTPException` and 422 validation
errors.

## Decision

- **Expected failures** (404 unknown participant, 401 bad credentials, 409
  conflicts) are raised as `HTTPException` at the router layer, with
  `status` constants and a human-readable `detail`. CRUD stays HTTP-agnostic:
  it returns `None` / raises DB errors, and routers translate.
- **Unexpected failures** hit a single `@app.exception_handler(Exception)`
  that logs the full traceback (method + path for correlation) and returns an
  opaque `{"detail": "Internal server error"}` with status 500.
- **Logging** is stdlib `logging.basicConfig` configured once at import in
  `app/logging_conf.py` (level from `LOG_LEVEL`), writing to stdout, which is
  the container-friendly default: Docker collects stdout, no file handling.

We keep FastAPI's native `{"detail": ...}` envelope for all error responses
rather than inventing a custom one, so every error - ours, FastAPI's 422s,
and the catch-all - has the same shape.

## Alternatives considered

- **Custom domain exception hierarchy + per-exception handlers**: cleaner at
  scale, but with two resources it adds indirection without new behavior.
- **RFC 7807 `application/problem+json`**: nice standard, but clashes with
  FastAPI's built-in 422 shape, so consistency would require overriding the
  validation handler too.
- **try/except in every endpoint**: repetitive, and one missed handler leaks
  a traceback.

## Consequences

- Clients can always parse `detail`; internals never leak.
- New expected error cases must remember to raise `HTTPException` in the
  router; anything forgotten degrades safely to a logged 500.
