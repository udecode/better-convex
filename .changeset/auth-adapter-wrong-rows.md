---
"kitcn": patch
---

## Patches

- Fix auth queries that filter by `id` resolving records from the wrong model,
  which let a lookup, update, or delete for one model read, patch, or destroy a
  record belonging to another. IDs are now checked against the model being
  queried, and IDs that belong elsewhere or are malformed resolve to "not
  found" instead of a foreign record or an error.
- Fix `findMany` and `count` returning duplicated records past the first page,
  which also inflated counts used for membership, role, and API key limits.
- Fix mixed `AND`/`OR` filters in `findMany` and `count` returning records the
  filter excluded, such as rows outside the requested organization. Mixed
  filters are now rejected, matching `updateMany` and `deleteMany`.
- Fix `not_in` filters returning no match when the matching record was not
  among the first records scanned, which made those updates fail and those
  deletes silently do nothing.
- Fix `auth.jwtCache: false` in the Next.js integration disabling
  authentication instead of just the JWT cookie cache, which made every server
  request anonymous.
