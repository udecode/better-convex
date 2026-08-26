---
"kitcn": patch
---

## Patches

- Fix soft cascade delete re-reading every child it had already processed. Scheduled campaigns resume through an exact foreign-key index, keeping reads linear without allowing mutable trailing index fields to strand a child. Async soft cascades reject prefix-only indexes with setup guidance.
