# 0010: Query invalidation after mutations, not optimistic updates

## Status

Accepted

## Context

After creating a participant, the list view must reflect it. TanStack
Query offers two idioms: optimistically insert into the cache and roll
back on failure, or invalidate the query and refetch.

## Decision

The create mutation invalidates `["participants"]` on success; the form
awaits the mutation, then navigates to the list, which refetches fresh
server state.

Optimistic updates buy perceived speed at the cost of simulating the
server client-side, and every simulated detail is wrong here:

- `participant_id` is server-generated (a temp id must be swapped later);
- list ordering is server-defined (enrollment_date, then subject_id), so
  a correct insert duplicates backend sort logic;
- duplicate `subject_id` (409) is a *realistic* failure, so rollback UX
  would actually run, showing a row that then vanishes.

Creating a participant is an infrequent, deliberate admin action where
"save, then see the saved list" is the expected experience; there is no
snappiness problem to solve.

## Alternatives considered

- **Optimistic insert + rollback**: ~30 lines of cache surgery to save
  ~200 ms on a rare action, with visible lies on 409.
- **`setQueryData` from the POST response**: no refetch, real id, but the
  client must replicate server ordering and misses concurrent writers.

## Consequences

- One extra GET after each create; acceptable at this scale.
- The pattern extends unchanged to update/delete mutations later.
- If a future UI needs instant feedback (e.g. inline status toggles),
  optimistic updates can be adopted per-mutation without touching this.
