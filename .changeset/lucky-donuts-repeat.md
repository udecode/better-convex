---
"kitcn": minor
---

## Breaking changes

- Read `where: { id: { in: [...] } }` in the order the ids are given instead of
  creation order, so a page costs one document read per row it returns rather
  than one per id in the list. Add `orderBy` to keep creation order. Cursors
  issued by the previous behavior are not portable.

```ts
// Before — creation order, and every page read the whole id list
await ctx.orm.query.posts
  .select()
  .where({ id: { in: ids } })
  .map((row) => row)
  .paginate({ cursor, limit: 10 });

// After — same call, rows come back in the order `ids` lists them
await ctx.orm.query.posts
  .select()
  .where({ id: { in: ids } })
  .map((row) => row)
  .paginate({ cursor, limit: 10 });

// After — creation order, which still reads every id in the list
await ctx.orm.query.posts
  .select()
  .where({ id: { in: ids } })
  .orderBy({ createdAt: 'asc' })
  .map((row) => row)
  .paginate({ cursor, limit: 10 });
```

## Patches

- Fix `.distinct({ fields })` on more than one field growing exponentially more
  expensive with each row returned, which made pages of about twenty rows fail
  to return at all.
- Fix `.distinct({ fields })` over `.union(...).interleaveBy(...)` slowing down
  sharply as the number of returned rows grows.
- Support `maxScan` on paginated `where: { id: { in: [...] } }` reads.
- Improve paginated reads to register fewer Convex queries per page, and to
  release the ones they opened when a page stops early.
- Improve the per-row cost of every stream-backed read.
