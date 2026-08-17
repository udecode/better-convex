---
"kitcn": patch
---

## Patches

- Cut ~256 KB (−22%) from the bundle Convex deploys for apps without Better Auth. `import { z } from 'zod'` binds zod's namespace object, which pins all 50 translation files; scaffolds and internals now use `import * as z from 'zod'`, which tree-shakes them. Apps using Better Auth are unchanged — it pins the barrel itself.
- Improve `update().returning()`: it reuses the row it just wrote instead of reading it back, so a matched-row update costs one fewer read per row. Tables with lifecycle hooks or a self-referencing cascade still read back, since either can rewrite the row.
- Improve `update()` foreign-key checks: a single-column reference supplied by `set()` is validated once per statement instead of once per matched row. Unique-index checks still run per row, as they must.
- Speed up `kitcn analyze` by bundling entry points concurrently: 2.9 s → 2.1 s on a 20-entry app, with byte-identical output.
- Reduce `kitcn add <plugin>` from three package-manager installs to two. Saves ~2 s on npm; bun is already fast enough that the difference is noise.
