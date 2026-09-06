---
"kitcn": patch
---

## Patches

- Improve the read cost of maintaining an `aggregateIndex` from a bulk
  statement. A statement now reads each aggregate bucket once per distinct key
  tuple, and each document's aggregate membership once per document, instead of
  once per written row. A 12-row update moving rows between two orgs issues 2
  bucket reads instead of 24, and re-writing a document already touched by the
  same transaction issues none. Counts, sums, averages and min/max are
  unchanged, and a `count()` later in the same mutation still sees the writes
  that preceded it.
- Note that writes made by a nested `ctx.runMutation` are not visible to the
  calling mutation's aggregate reads. Compose modules with
  `create<Module>Handler(ctx)`, which shares the caller's context.
