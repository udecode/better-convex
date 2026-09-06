---
"kitcn": patch
---

## Patches

- Halve the document reads a patch costs on a table declaring an
  `aggregateIndex` or `rankIndex`. Such a table used to read its pre-image
  twice per row, so a 5-row `update()` issued 10 `db.get` calls where a table
  with a plain `change` trigger issued 5. It now issues 5. Tables that declare
  their own `update.before` hook still read twice, because that hook may
  rewrite the row before the patch lands.
- Reject a write while an aggregate or rank index is `CLEARING` on every write
  path. Deleting an already-deleted row is the last case that slipped through;
  it now reports the transient index state instead of
  `Delete on non-existent doc`.
