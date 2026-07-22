# 0009: Hand-rolled pure-function form validation for the participant form

## Status

Accepted

## Context

The add-participant form must enforce the backend's constraints client-side
for immediate feedback: subject_id format/length, age 0-120, enrollment
date not in the future, enum membership. This is the app's only form: six
fields, three of which are enum selects.

## Decision

A pure validator module (`lib/participant-form.ts`) that mirrors the
Pydantic rules exactly - same regex, same bounds, with comments naming
`app/schemas/participant.py` as the source of truth. Controlled inputs;
validation runs on submit, field errors clear on change. Enum fields are
`<select>`s populated from the shared `as const` arrays in `types/`, so
invalid enum values are unrepresentable rather than validated. The server
stays the authority: 409 (duplicate subject_id) and any 422 are surfaced
in the form's error banner.

## Alternatives considered

- **react-hook-form + zod**: the right call at scale (many forms,
  cross-field rules, schema reuse), but two dependencies plus resolver
  indirection for one six-field form; revisit when a second complex form
  appears.
- **HTML5 validation only** (`required`, `pattern`, `max`): cannot express
  "not in the future" portably, error UI is inconsistent across browsers,
  and messages are unstylable.
- **Server-side validation only**: a full round-trip for every typo and a
  single-error-at-a-time experience.

## Consequences

- The validator is a dependency-free pure function, unit-tested directly
  in step 10 without rendering anything.
- Rule drift between mirror and backend is possible; the naming-the-source
  comments and tests are the mitigation.
- More forms later should trigger the RHF+zod revisit, not more copies of
  this pattern.
