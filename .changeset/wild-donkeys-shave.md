---
"kitcn": patch
---

## Patches

- Fix `aggregateBackfill` cutting an in-progress clear short when the same run
  also sees a changed metric definition. A `CLEARING` index now finishes draining
  before it moves to `BUILDING`, which is what `resume` already documented, and
  it applies to `aggregateIndex` and `rankIndex` alike. Previously a metric or
  sum change landing while `kitcn aggregate rebuild` was still draining could
  abandon the rebuild halfway and still report `READY`, leaving `count()`,
  `aggregate()` and `rank()` answering from state no document backs.
- Refuse to advance an index out of `CLEARING` while any of its stored state
  survives. The backfill now fails loudly instead of rebuilding on top of a
  half-drained index and serving numbers that are quietly wrong.
