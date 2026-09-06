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
- Fix a `limit` on that same shape reading every row carrying a probed value before applying the other condition. On 400 rows sharing one status where the first row already matched, `limit: 1` read 400 documents; it reads 1.
- Keep an indexed `in`, `notIn`, `ne`, or same-field `OR` read index-bounded however long its value list is.
- Require `maxScan` past 64 values only when the sort has to interleave them, such as `orderBy: { createdAt: 'desc' }`.
