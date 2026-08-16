---
"kitcn": patch
---

## Patches

- Improve mutation latency on tables with triggers, `aggregateIndex()` or
  `rankIndex()`. Writes no longer re-read the document after patching or
  replacing it, and no longer read it at all when no hook consumes it.
- Improve `update()` and `delete()` cascade latency: `set null`, `set default`
  and cascade-update fan-out now apply their patches concurrently with a
  bounded pool instead of one round trip at a time. Tables with hooks keep
  their strict write order.
- Improve read throughput on row-level-security tables. Policy `using` /
  `withCheck` callbacks run once per query execution or write-free mutation
  decision batch instead of once per returned row. Multi-row insert and delete
  re-resolve stateful policies after each write.
- Fix row-level-security visibility when one query object is awaited more than
  once. Every await re-resolves the table's policies, so a policy that reads
  the database sees writes made between the two awaits.
- Improve CPU cost of every ORM read and every `returning()` row by reshaping
  documents in a single pass.
- Improve `returning({ _count })` on multi-row mutations: the aggregate-index
  readiness check now runs once per index instead of once per row.
- Improve cascade delete throughput on schemas with many triggered or
  aggregate-indexed tables by removing per-row table-name probing.
- Improve mutations that issue concurrent writes to a hooked table: the
  internal write lock now hands off to one waiter instead of waking all of
  them.
- Fix `kitcn codegen` dropping nested cRPC HTTP routes when parsing projects
  through generated server placeholders.
