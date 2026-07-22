# Clinical Trial Data Dashboard

Full stack application for managing and visualizing clinical trial
participant data: a Next.js dashboard (client-rendered SPA) on top of a
FastAPI + PostgreSQL backend, with JWT auth held in an httpOnly cookie.

- Backend: FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL, python-jose + passlib
- Frontend: Next.js (App Router) used client-side-only, TypeScript, TanStack
  Query, Context API for auth state, Tailwind CSS
- Tests: pytest (backend, against real Postgres), Vitest + React Testing
  Library (frontend)
- Runs as three containers via docker compose

## Run it (Docker)

```bash
docker compose up --build
```

Startup is healthcheck-gated (postgres, then API, then frontend). When all
three are healthy:

- Dashboard: http://localhost:3000 (login: `admin` / `admin123`,
  seeded at startup; override via `SEED_USERNAME` / `SEED_PASSWORD`)
- API docs (OpenAPI): http://localhost:8000/docs

The login cookie is `Secure` in the production build; browsers accept it on
http://localhost because localhost is a trustworthy origin. Any non-localhost
deployment needs HTTPS.

## Run it (local development)

Backend (needs a Postgres on localhost:5432, e.g. `docker compose up db`):

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload            # http://localhost:8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev                              # http://localhost:3000
```

`frontend/.env.example` documents the only variable (`API_BASE_URL`,
defaults to http://localhost:8000). Backend variables are in `.env.example`.

## Tests

Backend - 14 integration tests against a real Postgres (the suite creates
its own `clinical_trials_test` database; each test runs in a rolled-back
transaction):

```bash
source .venv/bin/activate
pytest
```

Frontend - 28 Vitest + React Testing Library tests (login flow, route
protection, participants list states, form validation rules, metrics
aggregation):

```bash
cd frontend
npm test
```

## Auth and calling a protected route (API directly)

```bash
# 1. Log in (form-encoded, not JSON)
TOKEN=$(curl -s -X POST localhost:8000/auth/login \
  -d 'username=admin&password=admin123' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

# 2. Create a participant
curl -X POST localhost:8000/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"subject_id":"SUBJ-100","study_group":"treatment","enrollment_date":"2026-01-15","status":"active","age":42,"gender":"F"}'

# 3. List participants
curl -H "Authorization: Bearer $TOKEN" localhost:8000/participants
```

Without a token these return `401`; duplicate `subject_id` returns `409`;
validation failures return `422`. In the browser the same API is reached
through the Next.js token-attaching proxy (see architecture below) - the
browser never holds the JWT.

## Tech choices and why

**FastAPI + Pydantic v2 + SQLAlchemy 2.0 + PostgreSQL.** Declarative
validation and OpenAPI for free; typed ORM models; native Postgres enums and
UUIDs, with the unique constraint on `subject_id` as the race-free source of
truth for duplicate detection (409).

**Next.js used strictly as a client-side SPA (the deliberate one).** Every
data-bearing page is a Client Component fetching through TanStack Query,
exactly as a Vite SPA would - no Server Components fetching from FastAPI, no
Server Actions. FastAPI stays the single, API-centric backend; Next.js earns
its place for two things only: routing/build tooling, and a handful of tiny
server-side route handlers that hold the JWT in an **httpOnly cookie**
(something a pure SPA cannot do without exposing the token to JS). Because
browser JS cannot read that cookie, client data calls go through a ~50-line
catch-all route handler that forwards requests to FastAPI verbatim and
attaches the Bearer header server-side. It adds one same-host hop and zero
business logic; in exchange the token never exists in browser-readable
space and there is no CORS configuration anywhere. Full reasoning: ADRs
0006, 0007, 0008.

**TanStack Query for server state, Context for auth state.** Queries own
caching/retry/invalidation (the list page and metrics dashboard share one
cache entry); the auth context holds only "who am I" - never the token.

**Testing against real infrastructure.** Backend tests hit real Postgres
because the schema leans on Postgres behavior (enums, UUIDs, constraint
errors); SQLite would test a different dialect. Frontend tests mock only the
network edge (`fetch`), not the app's own modules.

Architecture diagrams: `docs/architecture.md`. Decision records (10):
`docs/adr/`.

## Done vs skipped

Done:

- Participant CRUD API (create, list with pagination, get by id) with
  validation hardening (age bounds, subject_id format, no future enrollment
  dates, duplicate -> 409)
- JWT auth: login endpoint, protected routers, startup-seeded user
- Frontend: login page, edge route protection with return-to, participants
  table (loading/error/empty/success states), add-participant form with
  client-side validation mirroring the backend, metrics dashboard (counts by
  study group and status) derived client-side from the shared query cache
- Error handling on both sides: consistent `{"detail": ...}` envelope,
  opaque 500s with server-side tracebacks, user-facing error states with
  retry
- 42 tests total; Docker images for both apps (non-root, multi-stage on the
  frontend); compose orchestration with healthchecks
- 10 ADRs documenting every non-trivial decision

Skipped intentionally:

- **Update/delete participant** (optional in the brief): the layering makes
  them mechanical to add.
- **Alembic migrations**: `create_all` at startup fits a greenfield demo;
  any real deployment gets Alembic first.
- **User registration/management**: accounts are seeded, not self-claimed;
  open registration is the wrong provisioning model for clinical data
  (ADR 0003).
- **Refresh tokens / revocation**: 30-minute access tokens; cookie and JWT
  expire together.

## What I would add with more time

1. Alembic migrations, before any schema change.
2. CI pipeline: ruff + pytest with a Postgres service container; eslint +
   tsc + vitest; docker build as the artifact.
3. List filtering/sorting (status, study group) and server-side pagination
   metadata; server-side aggregates once the roster outgrows client-side
   computation.
4. Roles (investigator vs admin) and per-role authorization.
5. Refresh-token rotation and rate limiting on `/auth/login`.
6. Participant detail/edit views; OpenAPI-generated TS client to eliminate
   hand-maintained type mirroring.
7. Observability: structured logging, request IDs across the proxy hop,
   health/metrics endpoints wired to something like Prometheus.

## Trade-offs made

- **python-jose over PyJWT**: works, but effectively unmaintained; isolated
  to `app/security.py` so the swap is one file.
- **passlib pins bcrypt to 4.0.1**: passlib 1.7.4 breaks with bcrypt >= 4.1;
  documented in `requirements.txt`.
- **One extra hop for browser data calls** (the token-attaching proxy):
  milliseconds of latency purchased the token never being JS-readable.
- **`/api/auth/me` decodes the JWT without verifying**: it only informs the
  UI; FastAPI verifies every real data request. Verification in Next would
  require sharing the signing secret across services.
- **Client-side metrics aggregation**: right at this scale, wrong at 10k+
  rows; the swap to a server aggregate endpoint is contained in one hook.
- **`create_all` instead of migrations**: zero-friction startup now, a
  schema-evolution cliff later; acceptable only because this is greenfield.
- **Seeded demo credentials in compose defaults**: reviewer convenience,
  never production practice; unsetting the variables disables seeding.

## AI tools used

Built with Claude Code (Anthropic), used heavily and deliberately. The
workflow: I specified the architecture up front (stack, folder layout,
client-side-only Next.js constraint, the step plan) and the agent executed
one reviewable step at a time - each step E2E-verified (real Postgres, real
browser via Playwright, containerized runs) before its commit, with my
review gate between steps. The ADRs in `docs/adr/` record the decisions and
the alternatives weighed at each fork. I can walk through and defend any
part of the codebase.
