# 0005: Test against real Postgres with transaction-rollback isolation

## Status

Accepted

## Context

Tests need a database. The schema leans on Postgres-specific behavior: native
enum types, a native `uuid` column, and a unique constraint whose
`IntegrityError` is load-bearing for the 409 duplicate response. Tests should
exercise what production runs.

## Decision

Tests run against a dedicated Postgres database (`clinical_trials_test` by
default, overridable via `TEST_DATABASE_URL`). `conftest.py` creates the
database if missing and creates tables once per session, so `pytest` works
with no manual setup beyond a running Postgres, which Docker already
provides for local development.

Isolation is transaction-per-test: each test runs inside an outer
transaction on a single connection, with the session in
`join_transaction_mode="create_savepoint"` so CRUD-level `commit()` calls
become savepoints. The outer transaction is rolled back after every test,
which is faster than truncating tables and leaves no residue.

## Alternatives considered

- **SQLite in-memory**: fastest to start, but downgrades enums to VARCHAR,
  emulates UUIDs, and generally tests a different dialect than production;
  false confidence where it matters most (constraints).
- **testcontainers-postgres**: same fidelity with automatic container
  lifecycle, but adds a dependency and per-run container startup cost;
  Docker + a standing Postgres is already a project prerequisite, so the
  extra machinery buys little here.
- **Mocking the CRUD layer**: would test routing glue only; the interesting
  behavior (constraints, transactions) lives below the mock line.

## Consequences

- `pytest` requires a reachable Postgres (fine locally via Docker; CI would
  use a service container).
- Tests are order-independent and parallelizable by construction, since
  nothing persists between tests.
