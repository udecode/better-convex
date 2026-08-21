---
"kitcn": minor
---

## Breaking changes

- Nested `with:` now loads every level it is given, up to 10, instead of quietly dropping everything past the third. A config that nests deeper throws `RELATION_DEPTH_EXCEEDED` rather than returning a shorter tree. Deep `with:` configs that used to come back truncated now come back complete — and read the rows that completeness costs.

```ts
// Before: the fourth level was dropped, with no error
const rows = await ctx.orm.query.comments.findMany({
  limit: 20,
  with: {
    replies: { limit: 10, with: { replies: { limit: 10, with: { author: true } } } },
  },
});
rows[0].replies[0].replies[0].author; // undefined

// After: loaded, because it was asked for
rows[0].replies[0].replies[0].author; // { id, name }
```

## Patches

- Resolve `with: { _count }` at every level of a nested `with:`, including the deepest one returned. A tree can now report how many children it withheld without a second pass that re-reads every node the caller already holds.
