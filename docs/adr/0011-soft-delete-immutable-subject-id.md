# 0011: Soft-delete participants; subject_id immutable after creation

## Status

Accepted

## Context

The brief called out update/delete as optional and previously skipped
(see README). Adding them raises two questions a plain CRUD
implementation glosses over: what "delete" means for clinical trial
data, and whether the study identifier can be edited after enrollment.

## Decision

**Delete is soft.** `DELETE /participants/{id}` sets `deleted_at`
instead of removing the row. `list`/`get` filter on
`deleted_at IS NULL`, so deleted participants disappear from the API
exactly as a hard delete would from the caller's point of view, but the
row - and the audit trail it represents - is never destroyed. Clinical
trial data is regulated and often must be reconstructable; a `DROP`-like
action on enrollment records is not a reversible mistake a UI button
should be able to cause.

**`subject_id` is immutable after creation.** `ParticipantCreate` keeps
it; `ParticipantUpdate` (used by `PUT /participants/{id}`) does not
have the field at all, and sets `extra="forbid"` so a client attempting
to send it gets a 422 instead of a silently-ignored write. The frontend
form mirrors this: the field renders `disabled` in edit mode. A subject
identifier is the join key trials use to correlate external records
(lab results, consent forms); changing it after the fact is a data
integrity hazard, not a normal edit.

The unique constraint on `subject_id` is untouched and still applies to
soft-deleted rows - a subject identifier is never reused within a study,
enrolled or not.

## Alternatives considered

- **Hard delete**: simpler, matches the original brief's minimal
  reading. Rejected: irreversible, and clinical data retention practices
  generally favor keeping the record over erasing it.
- **Allow `subject_id` edits with re-validation**: mechanically easy
  (just drop it from `ParticipantBase` exclusions), but there is no
  legitimate workflow for changing a subject's identifier after
  enrollment; a locked field prevents the accidental case without
  losing anything real.

## Consequences

- Every future participant query must remember the `deleted_at IS NULL`
  filter; `crud.get_participant`/`list_participants` are the only two
  read paths today, so this is centralized, not scattered.
- `subject_id` typos made at creation time cannot be fixed in place -
  the affected record must be deleted (soft) and re-created. Acceptable:
  this is rare, and the alternative (silent identifier drift) is worse.
- No admin "restore" or "view deleted" endpoint exists yet; if audit
  review of withdrawn/deleted participants becomes a real need, it is a
  small additive endpoint over the same rows.
