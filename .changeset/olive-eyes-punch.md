---
"kitcn": patch
---

## Patches

- Fix `like`, `ilike`, `contains`, `endsWith`, and the array operators returning
  too few rows — often none — when combined with `limit`. These operators are
  matched after the rows are read, so `limit` now counts matches instead of
  scanned rows. `offset` counts matches too.
- Fix `NOT` around one of those operators matching nothing instead of negating.
- Fix `isNull` skipping rows whose column was never written once that column is
  indexed. Absent and explicitly-null columns now both match, with or without an
  index.
- Fix `flatMap` pagination dropping and duplicating children after the first
  page. Walking every page now returns the same rows as reading them at once.
- Fix soft cascade deletes rescheduling themselves forever and never reaching
  the children past the first batch.
