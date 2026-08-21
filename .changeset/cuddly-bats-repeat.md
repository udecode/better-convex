---
"kitcn": patch
---

## Features

- Support a per-source `index: { name, range }` on `select().union([...])`, so each source walks its own index range instead of re-walking one shared range and filtering the misses in JS.

```ts
const page = await db.query.messages
  .select()
  .union([
    {
      index: {
        name: 'by_from_to',
        range: (q) => q.eq('from', me).eq('to', them),
      },
    },
    {
      index: {
        name: 'by_from_to',
        range: (q) => q.eq('from', them).eq('to', me),
      },
    },
  ])
  .interleaveBy(['createdAt', 'id'])
  .paginate({ cursor: null, limit: 20 });
```

- Support union sources anchored on different indexes, as long as each source pins its leading fields with `eq` and ends up ordered by the `interleaveBy` fields.
