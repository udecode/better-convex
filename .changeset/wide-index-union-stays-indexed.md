---
"kitcn": minor
---

## Breaking changes

- A long `in`, `notIn`, `ne`, or same-field equality `OR` filter — past 64 values — now pages from its index ranges instead of scanning the table. Those pages are in the order of the index the union walks, grouped by the probed value, rather than in creation order, and they no longer need `maxScan`. Add `orderBy` to keep newest-first paging.

```ts
// Before
const page = await db.query.users.withIndex("by_status").findMany({
  where: { status: { in: manyStatuses } },
  cursor: null,
  limit: 20,
  maxScan: 500,
});

// After
const page = await db.query.users.withIndex("by_status").findMany({
  where: { status: { in: manyStatuses } },
  orderBy: { createdAt: "desc" },
  cursor: null,
  limit: 20,
  maxScan: 500,
});
```

## Patches

- Fix `select()` reading the whole table when its `where` compiled to an index union of more than 64 values. On a 120-row table with a single match, `select().where({ status: { in: [...65 values] } }).limit(1)` read 120 documents where the equivalent `findMany` read 1. Both read 1.
- Fix an `in` next to another condition — `where: { status: { in: [...] }, name: { contains: 'x' } }` — falling back to a table scan once the list passed 64 values.
- Lengthening an `in` list no longer changes which plan it gets. Up to 64 values the ranges are read as one merged stream, and past that they are read one after another, so the read stays index-bounded at any length. An `orderBy` that sorts across values, such as `createdAt`, still needs a merge and so still asks for `maxScan` past 64 values.
