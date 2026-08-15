---
"kitcn": minor
---

## Breaking changes

- `defaults.mutationMaxRows` is now a row budget for the whole `update()` /
  `delete()` transaction instead of a cap on each individual query. The matched
  rows and every row read by foreign-key cascade fan-out draw on the same
  budget, so a fan-out can no longer multiply past Convex's transaction limits
  while each per-query check passes. Over-budget mutations throw a kitcn error
  naming the cascade table instead of failing later with an opaque Convex
  transaction error.

```ts
// Before — each hop got a fresh 10,000-row allowance, so this read 30,000 rows
// and issued 30,000 writes before Convex rejected the transaction.
await db.delete(orgs).where(eq(orgs.id, orgId)).execute({ mode: 'sync' });

// After — the transaction is bounded, and over-budget cascades fail fast.
// Raise the budget or split the work:
defineSchema(tables, { defaults: { mutationMaxRows: 30_000 } });
// or
await db.delete(orgs).where(eq(orgs.id, orgId)).paginate({ cursor, limit: 500 });
```

## Patches

- Fix soft cascade deletes stalling partway through. A high fan-out soft
  cascade rescanned every already-processed child on each background batch,
  which grew quadratically and eventually tripped Convex's documents-scanned
  limit, leaving the parent deleted and the remaining children still pointing
  at it. Soft cascade now advances through its children once.
- Improve mutation latency on tables with triggers, `aggregateIndex()` or
  `rankIndex()`. Writes no longer re-read the document after patching or
  replacing it, and no longer read it at all when no hook consumes it.
- Improve `update()` and `delete()` cascade latency: `set null`, `set default`
  and cascade-update fan-out now apply their patches concurrently with a
  bounded pool instead of one round trip at a time. Tables with hooks keep
  their strict write order.
- Improve read throughput on row-level-security tables. Policy `using` /
  `withCheck` callbacks now run once per query or mutation statement instead of
  once per row, so an `async` policy that reads the database no longer issues
  one read per returned row.
- Improve CPU cost of every ORM read and every `returning()` row by reshaping
  documents in a single pass.
- Improve `returning({ _count })` on multi-row mutations: the aggregate-index
  readiness check now runs once per index instead of once per row.
- Improve cascade delete throughput on schemas with many triggered or
  aggregate-indexed tables by removing per-row table-name probing.
- Improve mutations that issue concurrent writes to a hooked table: the
  internal write lock now hands off to one waiter instead of waking all of
  them.
