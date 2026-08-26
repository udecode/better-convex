---
"kitcn": minor
---

## Patches

- Fix soft cascade delete re-reading every child it had already processed. New scheduled campaigns require and resume through an exact foreign-key index, keeping reads linear without allowing mutable trailing index fields to strand a child. Queued jobs reselect a newly available exact index or drain through the legacy replay path.
