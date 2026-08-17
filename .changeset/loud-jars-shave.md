---
"kitcn": patch
---

## Patches

- Fix `count()`, `aggregate()`, `groupBy()`, and relation `_count` so `isNull: true` matches rows whose column is absent from the document, not just rows holding an explicit `null` — matching `findMany()` under the same filter.
- Emit a single group keyed `null` for an `isNull`-constrained `groupBy()` field, combining every metric over both explicitly-`null` and absent rows.
