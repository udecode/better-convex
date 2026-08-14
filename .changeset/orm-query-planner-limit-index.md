---
"kitcn": minor
---

## Breaking changes

- `orderBy` on a field that no index *leads* now sorts after reading, and under
  cursor pagination it raises instead of returning a page ordered by the wrong
  column. An index merely containing the field no longer counts: Convex walks an
  index in full key order, so `on(type, numLikes)` orders by `type` first. Add an
  index led by the sort field, or read without a cursor.

```ts
// Before: paged, silently ordered by `type`
index('numLikesAndType').on(t.type, t.numLikes);

await db.query.posts.findMany({
  orderBy: { numLikes: 'desc' },
  cursor: null,
  limit: 20,
});

// After: add an index the sort field leads
index('numLikesAndType').on(t.type, t.numLikes);
index('by_num_likes').on(t.numLikes);

await db.query.posts.findMany({
  orderBy: { numLikes: 'desc' },
  cursor: null,
  limit: 20,
});
```

- `.withIndex(name, range)` now wins over the index a `where` object would have
  selected, so a `where` the pinned index cannot serve becomes a scan the caller
  has to bound. Under cursor pagination that combination now asks for `maxScan`
  instead of quietly reading through a different index.

```ts
// Before: scanned `by_status` and returned rows from every city
await db.query.users
  .withIndex('by_city', (q) => q.eq('cityId', cityId))
  .findMany({ where: { status: 'active' }, cursor: null, limit: 20 });

// After: bound the scan
await db.query.users
  .withIndex('by_city', (q) => q.eq('cityId', cityId))
  .findMany({
    where: { status: 'active' },
    cursor: null,
    limit: 20,
    maxScan: 500,
  });
```

## Patches

- Fix `.withIndex(name, range)` being ignored whenever the `where` object also
  matched another index. The index and its bounds you asked for are now the ones
  scanned — including under cursor pagination — so a range used to scope a query,
  a tenant id for instance, can no longer be dropped and return rows outside it.
- Fix `where: { field: { in: [...] } }` combined with `orderBy` and `limit`
  returning an arbitrary slice — usually the oldest rows — instead of the
  requested window.
- Fix `like`, `ilike`, `notLike`, and `notIlike` matching nothing when the
  pattern has a wildcard anywhere but the ends. `%` now matches any run of
  characters and `_` matches exactly one Unicode character, at any position.
- Fix `eq`, `ne`, `in`, and `notIn` never matching array or object columns.
  Values are compared by content, in queries and in `update`/`delete` filters.
- Fix `select()` returning raw rows for a `where: { id }` lookup, which silently
  skipped `map`, `filter`, `flatMap`, and `distinct`. `pageByKey` with the same
  `where` also returns its page shape instead of a bare array. A `where` on `id`
  or `id: { in: [...] }` reads those rows by key rather than scanning the table
  for them, so `select()` costs one read per id however large the table is.
  Cursor pagination rejects `id: { in: [...] }` with `maxScan`, because sorting
  arbitrary IDs by creation time requires reading the complete list first.
- Apply RLS to source rows before any `select()` pipeline callback runs, so a
  mapper or flat-map stage cannot inspect or project a forbidden document.
- Fix `flatMap`'s `limit` counting rows excluded by its `where`, which returned
  fewer children than asked for and often none. The limit now counts matching
  children, stays stable across pages instead of yielding a fresh batch per page,
  and reads each child once within the `maxScan` budget. It also stops on the
  last child it can return instead of reading one past it, so a small `limit`
  across many parents no longer spends reads no page can show. Exhausted and
  missing optional relations advance cursors without duplicates or loops.
- Fix a relation `limit` combined with a relation `where` returning too few
  children — none when enough non-matching children sorted first. The limit now
  counts matching children. Without an explicit relation `orderBy`, the scan
  also stops after the requested visible rows, including rows filtered by RLS.
