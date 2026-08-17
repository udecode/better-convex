---
"kitcn": minor
---

## Breaking changes

- Range-filtered `count()` and `aggregate()` now stop at `aggregateWorkBudget`
  work units and throw `COUNT_FILTER_UNSUPPORTED` /
  `AGGREGATE_FILTER_UNSUPPORTED` naming the index, instead of reading the whole
  equality prefix and failing on Convex's transaction read limit. Bucket scans
  cost one unit; `_min` and `_max` also reserve one extrema read per matching
  bucket. One budget covers every `IN` prefix and extrema metric sharing the
  range plan. Raise it cautiously if a wide range scan is intentional.

```ts
// Before
export default defineSchema({ runs });

// After
export default defineSchema(
  { runs },
  // Keep headroom below Convex's 32,000-document transaction ceiling.
  { defaults: { aggregateWorkBudget: 20_000 } }
);
```

## Features

- `kitcn aggregate rebuild` and index pruning clear stored aggregate state in
  scheduled batches, so rebuilding or dropping an `aggregateIndex` / `rankIndex`
  on a large table no longer has to fit in a single Convex mutation. Indexes
  report a `CLEARING` status while draining, and `kitcn aggregate prune` reports
  how many removed indexes are still being cleared in the background.
- Automatic pruning follows canonical aggregate lifecycle state instead of
  reverse-scanning every distinct backing-table index. Exact `tableName` and
  `indexName` handler arguments retain bounded recovery for state-less storage.

## Patches

- Reduce database reads per rank-index write: the btree descent no longer
  re-queries the tree document at every node, re-reads nodes it just wrote, or
  re-reads the child it descends into.
- Reduce database reads for `rank().min()`, `rank().max()` and `rank().random()`
  by dropping a redundant count scan per call.
- Reduce document writes during aggregate backfill: a page of rows sharing a key
  tuple now writes its bucket once instead of once per row.
- Stop writing `aggregate_member` rows when a mutation changes no aggregated
  field.
- Improve `count()` and `aggregate()` latency for multi-value `IN` filters and
  for `_min` / `_max` by issuing independent bucket reads through a bounded pool.
- Keep a partially cleared index in `CLEARING` when an error interrupts a
  rebuild, so a retry resumes clearing instead of building over stale buckets.
