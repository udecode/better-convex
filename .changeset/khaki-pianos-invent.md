---
"kitcn": patch
---

## Patches

- Fix soft cascade delete re-reading every child it had already processed. Exact foreign-key indexes resume from their cursor; prefix indexes traverse stable creation order so concurrent updates to trailing index fields cannot strand a child. Scheduled campaigns stay linear instead of failing on Convex's read limit.
