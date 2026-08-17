---
"kitcn": patch
---

## Patches

- Fix `in` and `notIn` on any column other than the primary id failing once the list passed roughly 64 values, with `Received invalid json: recursion limit exceeded` and no mention of the column or the operator. Membership lists are now sent as one flat condition, so their size no longer affects whether Convex accepts the query. This covers `findMany`/`findFirst`, `update().where()` and `delete().where()`, on indexed and unindexed columns alike, and repairs the Resend cleanup job, which deleted delivery events 100 ids at a time.
- Fix `where: { OR: [...] }` and `where: { AND: [...] }` failing the same way once the branch list grew past roughly 64 entries.
