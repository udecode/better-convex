---
"kitcn": patch
---

## Patches

- Fix a crash when writing an object key that cannot be converted to a string,
  such as one created with `Object.create(null)`, into an `aggregateIndex` or
  `rankIndex`. Once enough keys accumulated to rebalance the index, the write
  failed with `TypeError: Cannot convert object to primitive value` instead of
  succeeding.
