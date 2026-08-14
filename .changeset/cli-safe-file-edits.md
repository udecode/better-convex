---
"kitcn": minor
---

## Breaking changes

- `kitcn add` no longer replaces scaffold files you have edited. Files that still
  match the scaffold are upgraded as before; edited files are kept, listed under
  `Refused files`, and the command exits `1` because the plugin is only partially
  installed. Pass `--overwrite` for the previous behavior.

```bash
# Before — edits to crpc.ts were replaced, exit 0
kitcn add auth --yes

# After — edits are kept and the run fails until you choose
kitcn add auth --yes --overwrite
```

- `kitcn add --json` splits the old `skipped` list in two. `skipped` now means
  "already up to date", refused files move to `refused`, and `complete` reports
  whether everything was applied.

```jsonc
// Before
{ "skipped": ["convex/lib/crpc.ts"] }

// After
{ "skipped": [], "refused": ["convex/lib/crpc.ts"], "complete": false }
```

## Patches

- Fix `kitcn codegen` leaving a hidden parse snapshot behind when a Convex module
  fails to load, which kept reporting the old error after the real file was
  fixed. Codegen evaluates modules in memory instead of mirroring them to a
  sibling file, so it no longer writes to — or deletes from — your Convex
  directory, and import-time stack traces now point at the real module rather
  than a temporary path. A file of your own ending in `.kitcn-parse.ts` is left
  untouched.
- Fix plugin registration landing inside a comment or string that happens to
  mention `defineSchema(`, which recorded the plugin as installed while its
  tables and relations never reached the schema.
- Fix `kitcn add auth` deleting a table's index callback when it was written as a
  block-bodied arrow or a named function. The callback is now preserved while
  managed fields are merged.
- Fix schema patching merging value imports into a type-only `kitcn/orm` import,
  which produced duplicate identifiers, and skipping the import entirely when
  only `import * as orm from 'kitcn/orm'` was present.
