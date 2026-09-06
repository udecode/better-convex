---
"kitcn": patch
---

## Patches

- Improve the read cost of a relation `where` on a relation joined on a column
  other than the primary id, including `through` targets and `_count` on a
  `through` relation.
- Fix relation targets sharing one loaded document, which could add fields to a
  relation that only another relation in the same query requested.
