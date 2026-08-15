---
"kitcn": patch
---

## Patches

- Fix `kitcn codegen` emitting both the `api` and `internal` type imports into
  generated runtime files that only reference one of them. A module whose
  procedures are all internal, or all public, no longer carries an unused import
  that editors grey out and that `tsc` rejects with `TS6196` when
  `noUnusedLocals` is enabled. Each generated runtime now imports only the api
  roots its procedures reference.
