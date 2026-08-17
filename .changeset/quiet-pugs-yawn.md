---
"kitcn": patch
---

## Patches

- Fix `kitcn codegen` and `kitcn dev` aborting on a `generated/server.ts` written
  by an older kitcn, or one that no longer matches the schema. That file is now
  rewritten from the schema before codegen reads any app module, so it repairs
  itself instead of failing every module with the error it is supposed to fix.
- Keep the procedure names recorded by the last full run when running
  `kitcn codegen --scope auth` or `--scope orm`. Scoped runs no longer blank the
  lookup that middleware reads `procedure.name` from.
- Fail `kitcn codegen` with the underlying error when `schema.ts` cannot be
  loaded, instead of silently regenerating the app as if it had no ORM schema
  and deleting the generated aggregate entry.
- Point the aggregate and migration capability setup errors at a step that
  works. They previously advised rerunning the command that had just failed.
