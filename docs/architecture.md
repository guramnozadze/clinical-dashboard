# Architecture

## Request flow

```mermaid
flowchart TD
    C[Client] -->|"Bearer token (except /auth/login, /health)"| R

    subgraph FastAPI app
        R[Router layer<br/>app/routers/participants.py, auth.py]
        A[get_current_user<br/>app/security.py]
        S[Pydantic schemas<br/>app/schemas/*]
        CR[CRUD layer<br/>app/crud/*]
        D[get_db dependency<br/>app/database.py]
        E[Global exception handler<br/>app/main.py]
    end

    R --> A
    A -->|decode JWT, load user| CR
    R -->|validate request body| S
    R --> CR
    D -->|Session per request| CR
    CR -->|SQLAlchemy ORM| P[(PostgreSQL<br/>participants, users)]
    CR -->|ORM objects| R
    R -->|response_model serialization| S
    S --> C

    R -.->|"expected errors: HTTPException (401/404/409)"| C
    E -.->|"unexpected errors: logged traceback, opaque 500"| C
```

## Layer responsibilities

| Layer | Location | Owns |
|---|---|---|
| Routers | `app/routers/` | HTTP: status codes, auth wiring, error translation |
| Schemas | `app/schemas/` | API shape: validation, serialization (Pydantic v2) |
| CRUD | `app/crud/` | Persistence: queries, transaction boundaries |
| Models | `app/models/` | DB shape: tables, constraints, enums (SQLAlchemy) |
| Security | `app/security.py` | Hashing, JWT issue/verify, `get_current_user` |
| Config | `app/config.py` | Environment-driven settings (pydantic-settings) |

Key mechanics:

- **Auth** is a router-level dependency on the participants router; every
  route under it requires a valid JWT, and `/auth/login` + `/health` stay
  public.
- **Sessions** are per-request via `get_db`, exposed to endpoints as the
  `DbSession` annotated type. CRUD functions commit explicitly.
- **Startup** (lifespan): `create_all` for tables, then idempotent seed of
  the configured bootstrap user.
- **Errors**: routers raise `HTTPException` for expected cases; anything
  else hits the catch-all handler, which logs the traceback and returns
  `{"detail": "Internal server error"}`.

Decision records: see `docs/adr/`.
