---
"kitcn": patch
---

## Patches

- Fix `.withIndex(name, range)` being ignored whenever the `where` object also
  matched another index. The index and its bounds you asked for are now the ones
  scanned, so a range used to scope a query — a tenant id, for instance — can no
  longer be dropped and return rows outside it.
- Fix `orderBy` on a field that is not the first field of a compound index
  returning rows sorted by the wrong column. Ordering now uses an index only
  when that field leads it, and sorts after reading otherwise.
- Fix `where: { field: { in: [...] } }` combined with `orderBy` and `limit`
  returning an arbitrary slice — usually the oldest rows — instead of the
  requested window.
- Fix `like`, `ilike`, `notLike`, and `notIlike` matching nothing when the
  pattern has a wildcard anywhere but the ends. `%` now matches any run of
  characters and `_` matches exactly one, at any position.
- Fix `eq`, `ne`, `in`, and `notIn` never matching array or object columns.
  Values are compared by content, in queries and in `update`/`delete` filters.
- Fix `select()` returning raw rows for a `where: { id }` lookup, which silently
  skipped `map`, `filter`, `flatMap`, and `distinct`. `pageByKey` with the same
  `where` also returns its page shape instead of a bare array.
- Fix `flatMap`'s `limit` counting rows excluded by its `where`, which returned
  fewer children than asked for and often none. The limit now counts matching
  children and stays stable across pages instead of yielding a fresh batch per
  page.
- Fix a relation `limit` combined with a relation `where` returning too few
  children — none when enough non-matching children sorted first. The limit now
  counts matching children.
