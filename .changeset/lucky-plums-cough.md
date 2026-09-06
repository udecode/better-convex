---
"kitcn": patch
---

## Patches

- Keep the read bound on a non-paginated index-union `findMany` when the table
  has RLS enabled, or when the `where` carries a filter Convex cannot evaluate
  such as `contains`. Both used to cancel the bound entirely and read every row
  in each probed range, so
  `findMany({ where: { ownerId: { in: [a, b] } }, limit: 3 })` read 500 rows on a
  500-row table and 200 on a 200-row table. It now reads 6 at either size.
  Turning on RLS no longer costs a read bound.
- Size the bound by rows the page actually keeps rather than rows the scan
  touched, so a page still fills past hidden or non-matching rows: with 80 rows
  the policy hides in front of every probe, `limit: 3` returns three rows instead
  of none.
- The bound also holds for unions wider than the 64-probe merge cap, and for
  sorts assembled across probes such as `[asc(ownerId), desc(score)]`, which read
  each probe in the requested order and combine them before slicing.
- Rows and their order are unchanged. Two shapes are deliberately unaffected: a
  `where` that filters through a relation, and `ne`/`notIn`/`isNotNull` combined
  with an `orderBy` no index can serve. Both still read their whole probed range.
