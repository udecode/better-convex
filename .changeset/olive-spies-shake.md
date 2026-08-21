---
"kitcn": patch
---

## Patches

- Speed up `kitcn codegen`. Each Convex module is now read once per run instead
  of up to four times, and the functions directory is listed once instead of
  twice. On an 82-module app that is 57 fewer file reads and 10 fewer directory
  listings per run, with identical generated output.
