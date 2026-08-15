---
"kitcn": patch
---

## Patches

- Fix `useInfiniteQuery` from `kitcn/solid` crashing with `state.map is not a function` on every mount.
- Update Solid infinite query results field by field, so a component reading `status` is not re-run when only `data` changes.
