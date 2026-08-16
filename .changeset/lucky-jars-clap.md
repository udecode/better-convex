---
"kitcn": patch
---

## Patches

- Start the CLI faster. esbuild, Babel, jiti, dotenv and the interactive prompt
  stack are loaded the first time a command needs them instead of on every
  invocation, so `kitcn --version`, `kitcn --help` and `--json` calls no longer
  pay for tooling they never use.
- Run `kitcn codegen` with less repeated work: one module loader per run instead
  of two, and the parse shim resolved once instead of once per Convex module.
- Speed up `kitcn add`, `kitcn view` and `kitcn info` on large schemas by
  parsing each schema revision once instead of once per managed table.
- Speed up `kitcn init` and `kitcn add` file comparison, which no longer copies
  and serializes both syntax trees before comparing them.
- Fix `kitcn dev` ignoring edits to shared routers, builders and contracts that
  sit next to the functions directory. Changing one regenerates the api like
  changing a function file does, for any functions path configured in
  `convex.json`.
- Generate api and procedure metadata in a stable order regardless of the
  filesystem's directory listing order.
- Shrink the `kitcn dev` file watcher, which no longer loads the rest of the CLI
  into the background process it keeps alive for the session.
