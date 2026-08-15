---
"kitcn": minor
---

## Breaking changes

- Range-filtered `count()` and `aggregate()` now stop at `aggregateWorkBudget`
  aggregate buckets and throw `COUNT_FILTER_UNSUPPORTED` /
  `AGGREGATE_FILTER_UNSUPPORTED` naming the index, instead of reading the whole
  equality prefix and failing on Convex's transaction read limit. Raise the
  budget if a wide range scan is intentional.

```ts
// Before
export default defineSchema({ runs });

// After
export default defineSchema(
  { runs },
  { defaults: { aggregateWorkBudget: 32_768 } }
);
```

## Features

- `kitcn aggregate rebuild` and index pruning clear stored aggregate state in
  scheduled batches, so rebuilding or dropping an `aggregateIndex` / `rankIndex`
  on a large table no longer has to fit in a single Convex mutation. Indexes
  report a `CLEARING` status while draining, and `kitcn aggregate prune` reports
  how many removed indexes are still being cleared in the background.

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
