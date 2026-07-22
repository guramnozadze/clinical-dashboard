# 0003: Seed user at startup instead of an open /auth/register endpoint

## Status

Accepted

## Context

Protected endpoints need at least one valid user for reviewers, local
development, and tests. The two candidates were a public `POST /auth/register`
endpoint or an idempotent seed user created at startup from environment
variables.

## Decision

Seed at startup: when `SEED_USERNAME` and `SEED_PASSWORD` are set, the
lifespan hook creates that user if it does not already exist. docker-compose
and `.env.example` ship working values, so `docker compose up` yields a
usable login with zero extra steps.

## Alternatives considered

- **Open `/auth/register`**: anyone who can reach the API can mint an account
  and read clinical trial data; self-registration is the wrong provisioning
  model for a PHI-adjacent system where accounts are granted, not claimed.
- **Admin-only `/auth/register`**: the right long-term answer, but it drags
  in roles/permissions, which is out of scope here; noted as future work.
- **Manual seeding script/README instructions**: works, but adds a manual
  step reviewers can miss, and CI/test setups would each reimplement it.

## Consequences

- Reviewer experience is deterministic: compose up, log in, call the API.
- Credentials live in environment configuration, not code; unset variables
  disable seeding entirely (sane production default).
- No way to create additional users via the API; that is deliberate and
  becomes an admin-scoped endpoint if user management ever lands.
