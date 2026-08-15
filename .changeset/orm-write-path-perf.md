---
"kitcn": patch
---

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
