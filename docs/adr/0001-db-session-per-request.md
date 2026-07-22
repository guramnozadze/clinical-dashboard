# 0001: Session-per-request via FastAPI dependency injection

## Status

Accepted

## Context

Every endpoint needs a SQLAlchemy `Session`. Sessions are not thread-safe and
must be scoped tightly: opened per unit of work, always closed, never shared
across requests. We also want handlers and CRUD functions to be testable with
a swapped-out database.

## Decision

A single module-level `engine` and `sessionmaker` live in `app/database.py`.
A `get_db()` generator dependency yields a fresh `Session` per request and
closes it in a `finally` block. Endpoints receive it through a type alias:

```python
DbSession = Annotated[Session, Depends(get_db)]
```

so signatures read `def list_participants(db: DbSession)` with no repeated
`Depends(...)` boilerplate. Commits happen explicitly in CRUD functions, not
implicitly in the dependency, so read-only endpoints never commit and write
endpoints control their own transaction boundaries.

## Alternatives considered

- **`scoped_session` (thread-local registry)**: designed for thread-per-request
  frameworks; redundant and error-prone under FastAPI's dependency system,
  and harder to override in tests.
- **Session middleware**: opens a session for every request including ones
  that never touch the DB (e.g. `/health`), and hides the dependency from
  endpoint signatures.
- **Commit inside `get_db()` after yield**: convenient, but commits even on
  read paths and makes transaction boundaries invisible at the call site.

## Consequences

- Tests override one dependency (`get_db`) to point at a test database.
- Each request gets an isolated session; connection pooling is handled by the
  shared engine.
- CRUD functions must remember to commit; forgetting is a silent no-op. This
  is mitigated by keeping all writes in `app/crud/` where the pattern is
  consistent and covered by tests.
