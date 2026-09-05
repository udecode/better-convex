---
"kitcn": patch
---

## Patches

- Improve the read cost of a relation `where` on a relation joined on a column
  other than the primary id. `where: { teamBySlug: { name: 'Nope' } }` now reads
  each distinct target once per query instead of once per scanned row. Over a
  50-row scan with 2 distinct targets that is 2 target reads instead of 50. The
  same applies to `through` relation targets and to `_count` on a `through`
  relation. Results are unchanged: a target written between two awaits is still
  re-read, so an intervening write is observed exactly as before.
