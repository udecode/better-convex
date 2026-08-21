---
"kitcn": patch
---

## Patches

- Match every args variant from `crpc.<path>.queryFilter()` when `args` is
  omitted, `null`, or `{}`, in both the React and Solid bindings. The filter
  built a key with an empty args slot, which TanStack's partial matching never
  matched, so `invalidateQueries` silently refreshed nothing and stale data
  stayed on screen. Pass args to narrow the filter; omit them to reach every
  variant. `crpc.http.*.queryFilter()` follows the same rule.

```ts
// Before
crpc.analytics.getReport.queryFilter(); // ['convexQuery', 'analytics:getReport', undefined] — matched nothing
queryClient.invalidateQueries(crpc.analytics.getReport.queryFilter()); // no-op

// After
crpc.analytics.getReport.queryFilter(); // ['convexQuery', 'analytics:getReport']
queryClient.invalidateQueries(crpc.analytics.getReport.queryFilter()); // every args variant
```
