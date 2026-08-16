---
"kitcn": minor
---

## Breaking changes

- Fix `orderBy` returning the wrong rows when the `where` pins only part of a
  compound index. Ordering by `createdAt` under `where: { type: 'a' }` on an
  index of `(type, numLikes)` used to hand back the rows sorted by `numLikes`.
  It now returns creation order. Queries in that shape return different rows
  than before, and under `cursor` pagination with `strict` they now report that
  the field has no usable index instead of paginating in the wrong order.

```ts
// Schema: index('numLikesAndType').on(t.type, t.numLikes)

// Before — returned the two most-liked posts
// After  — returns the two newest posts, as asked
await ctx.orm.query.posts.findMany({
  where: { type: 'a' },
  orderBy: { createdAt: 'desc' },
  limit: 2,
});

// Pinning the narrower index leaves creation time as the implicit next key
index('by_type').on(t.type);
```

- Change which rows a `.through()` relation returns for a given `limit`. Each
  parent now gets its own first `limit` links instead of a window over the
  order in which targets happened to be discovered across the whole page.
  `orderBy` on a through relation is unaffected.

## Patches

- Push `limit` and `orderBy` on a `many()` relation into the relation index.
  `with: { posts: { limit: 5, orderBy: { createdAt: 'desc' } } }` reads five
  posts per parent instead of every post of every parent.
- Bound `.through()` relation reads by the requested `limit` instead of reading
  every junction row of every parent. Links whose target is missing or is
  dropped by RLS or the relation `where` do not consume a slot, so the page
  still comes back full.
- Fill `limit` with rows that survive RLS and relation `where` instead of
  filtering after the read. `findMany({ where: { ownerId }, limit: 3 })` on a
  table with a select policy used to return only whichever of the first three
  stored rows happened to be visible — often none.
- Push `limit` into `in`, `notIn`, `ne` and `isNotNull` reads, which previously
  read every matching row and sliced afterwards.
- Use an index for `in` combined with another filter — `where: { status: { in:
  [...] }, name: { contains: 'x' } }` scanned the whole table.
- Order by a field the `where` does not pin without reading the whole bucket,
  as long as the index sorts by it next.
- Prefer an index that also supplies the requested order, so a compound
  `(tenantId, createdAt)` is chosen over a narrow `(tenantId)` for a
  tenant-scoped feed.
- Serve `orderBy` on the leading field of a pinned `.withIndex()` from the
  index instead of scanning the table.
- Stop loading nested `with:` data, extras and column selection for relation
  rows that the per-parent `limit` or `offset` then discards. Deeply nested
  reads that previously failed the relation fan-out guard now succeed.
- Read each shared target once when counting a `.through()` relation with a
  `where`, instead of once per parent row.
- Reuse aggregate bucket reads across rows of a `with._count`.
- Build the ORM once per request instead of twice; the RLS bypass client is
  now created only when it is used.
- Reduce per-row work on filtered reads, relation counts, and query planning.
