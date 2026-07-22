# Clinical Trial Data Dashboard API

FastAPI service for managing clinical trial participant data, protected by
JWT auth, backed by PostgreSQL.

## Run it (Docker)

```bash
docker compose up --build
```

That is the whole setup: Postgres starts first (healthcheck-gated), the API
waits for it, creates tables, and seeds a login (`admin` /
`admin-password-123` by default, override via `SEED_USERNAME` /
`SEED_PASSWORD`). The API listens on http://localhost:8000 and interactive
docs live at http://localhost:8000/docs.

To run locally without Docker: copy `.env.example` to `.env`, point
`DATABASE_URL` at a running Postgres, then:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Auth and calling a protected route

All `/participants` endpoints require a bearer token. Get one from
`/auth/login` (OAuth2 password form), then pass it in the `Authorization`
header:

```bash
# 1. Log in (form-encoded, not JSON)
TOKEN=$(curl -s -X POST localhost:8000/auth/login \
  -d 'username=admin&password=admin-password-123' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

# 2. Create a participant
curl -X POST localhost:8000/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "subject_id": "SUBJ-001",
    "study_group": "treatment",
    "enrollment_date": "2026-01-15",
    "status": "active",
    "age": 42,
    "gender": "F"
  }'

# 3. List participants
curl -H "Authorization: Bearer $TOKEN" localhost:8000/participants

# 4. Fetch one by id (use a participant_id from the list response)
curl -H "Authorization: Bearer $TOKEN" localhost:8000/participants/<participant_id>
```

Without a token these return `401`. A duplicate `subject_id` returns `409`.
Validation failures (negative age, future enrollment date, unknown enum
values, malformed UUIDs) return `422`.

## Run the tests

Tests run against a real Postgres in a dedicated `clinical_trials_test`
database that the suite creates automatically. With the compose stack (or
any Postgres on localhost:5432) running:

```bash
source .venv/bin/activate
pytest
```

Each test runs in a rolled-back transaction, so tests are order-independent
and leave no residue. Point `TEST_DATABASE_URL` elsewhere if your Postgres
is not on localhost:5432.

## Tech choices and why

- **FastAPI + Pydantic v2**: request/response validation and OpenAPI docs
  come from the type system; the 422 handling for bad enums/dates/UUIDs in
  this API is entirely declarative.
- **SQLAlchemy 2.0 (typed ORM)**: `Mapped[...]` declarations keep the DB
  shape (`app/models`) explicit and separate from the API shape
  (`app/schemas`).
- **PostgreSQL**: native enum types for `study_group`/`status`/`gender`,
  native UUID column, and the unique constraint on `subject_id` is the
  source of truth for duplicate detection (race-free 409s).
- **JWT bearer auth** (python-jose + passlib/bcrypt): stateless, right fit
  for a programmatic API; see `docs/adr/0002-jwt-auth.md`.
- **Layering**: routers own HTTP (status codes, error translation), CRUD
  owns transactions, models own the schema. Auth is a router-level
  dependency, applied once, not per endpoint.

Architecture decision records live in `docs/adr/`; request flow diagram in
`docs/architecture.md`.

## Done vs skipped

Done:

- Participant model/schemas/CRUD/routes (create, list with pagination, get
  by id) with exact field spec
- JWT login, protected participants router, startup seed user
- Consistent error responses (401/404/409/422, opaque 500s with full
  server-side tracebacks), stdout logging
- Validation hardening (age bounds, subject_id format, no future
  enrollment dates, bcrypt-safe password length)
- 14 integration tests against real Postgres
- Dockerfile (non-root) + compose with healthchecks
- 5 ADRs documenting the non-trivial decisions

Skipped intentionally:

- **Update/delete endpoints**: the challenge asked for create/list/get; the
  layering makes adding them mechanical.
- **Alembic migrations**: `create_all` at startup is enough for a single
  fresh-start service; any real deployment gets Alembic first.
- **User management API**: accounts are seeded, not self-registered; a
  clinical data API should not have open registration (see ADR 0003).
- **Refresh tokens / revocation**: 30-minute access tokens only.

## What I would add with more time

1. Alembic migrations (first thing, before any schema change).
2. Filtering and sorting on the list endpoint (`status=active`,
   `study_group=treatment` are obvious dashboard needs).
3. Roles (investigator vs admin) and per-role authorization.
4. Refresh tokens with rotation, and rate limiting on `/auth/login`.
5. CI pipeline: lint (ruff), tests with a Postgres service container.
6. Aggregate endpoints for the dashboard (enrollment over time, counts by
   group/status).

## Trade-offs made

- **python-jose over PyJWT**: per the agreed stack; it is effectively
  unmaintained, so the swap (one file, `app/security.py`) is noted as
  future work.
- **passlib pins bcrypt to 4.0.1**: passlib 1.7.4 breaks with bcrypt >= 4.1;
  the pin is documented in `requirements.txt`.
- **DB lookup on every authenticated request**: `get_current_user` hits the
  DB so deleted users are locked out instantly; costs one indexed query per
  request.
- **`create_all` instead of migrations**: zero-friction startup now, a
  schema-evolution cliff later; acceptable only because this is greenfield.
- **Seeded credentials in compose defaults**: convenient for reviewers,
  never acceptable in production; unsetting the variables disables seeding.
