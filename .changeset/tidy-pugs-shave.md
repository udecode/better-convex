---
"kitcn": patch
---

## Patches

- Improve the write cost of bulk statements on a table with an `aggregateIndex`.
  One `insert()` / `update()` / `delete()` now reconciles each aggregate bucket
  once for the whole statement instead of once per row. A 40-row `update()` that
  moves every row between two `orgId` values goes from 80 bucket reads, 80 bucket
  writes, 80 extrema reads and 80 extrema writes to 2 of each — 200 stored
  documents written down to 44. At the `mutationMaxRows` ceiling that is the
  difference between blowing the per-mutation budget and staying inside it, and
  it removes a hot-document contention source that slowed unrelated
  transactions.
- Reading an aggregate mid-statement is unchanged: `count()`, `aggregate()` and
  the `_count` selections still see every row the statement has already written,
  including from a trigger firing between rows.
- Member rows are still one read and one write per document, so a statement's
  cost stays linear in the rows it writes — the per-row multiplier that scaled
  with distinct key tuples is what goes away.
- Fix aggregate reads inside `withoutTriggers()`, and inside an ORM rebuilt on a
  trigger's own context, resolving to a different transaction than the one that
  made the writes. Both now see the same rows as `ctx.orm`.
