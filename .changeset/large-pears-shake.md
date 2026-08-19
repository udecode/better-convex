---
"kitcn": patch
---

## Patches

- Fix large `in` and `notIn` filters across ORM reads, updates, and deletes.
- Fix large `OR` and `AND` filters exceeding Convex's nesting limit.
- Reject malformed empty logical filters before scheduled mutations run.
