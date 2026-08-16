---
"kitcn": minor
---

## Breaking changes

- Register optional ORM subsystems with `createOrm({ capabilities })`. Aggregate and rank indexes ship from `kitcn/orm/aggregate-index`, migrations from `kitcn/orm/migrations`. Convex bundles everything a module statically imports and has no dynamic `import()`, so `kitcn/orm` no longer reaches those runtimes: a minimal `createOrm` + `findMany` consumer drops from 301.7 KB minified, and `kitcn/orm`'s import graph from 113 modules to 59. `kitcn codegen` writes the registration for you — rerun it, or add the lines by hand.

  Codegen registers `aggregateCapability()` only for schemas that declare an `aggregateIndex` or `rankIndex`, and `migrationCapability()` only when `<functionsDir>/migrations/manifest.ts` exists. Every procedure module imports `<functionsDir>/generated/server.ts`, so an app that uses neither subsystem now ships neither runtime in any of its Convex functions. `kitcn dev`, `kitcn deploy`, `kitcn aggregate` and `kitcn migrate` skip the flows those capabilities back when the app does not use them.

```ts
// Before
export const orm = createOrm({ schema, ormFunctions, internalMutation });

// After
import { aggregateCapability } from 'kitcn/orm/aggregate-index';
import { migrationCapability } from 'kitcn/orm/migrations';

export const orm = createOrm({
  schema,
  ormFunctions,
  capabilities: [aggregateCapability(), migrationCapability()],
  internalMutation,
});
```

  Without `aggregateCapability()`, a schema declaring `aggregateIndex`/`rankIndex` throws at `createOrm()`, and filtered `count()`, `count({ select: { field } })`, `aggregate()` over an index, `groupBy()`, `rank()` and relation `_count` throw at call time. Without `migrationCapability()`, the `orm.api()` migration procedures throw when invoked. Unfiltered `count()`, `count({ select: { _all: true } })` and `aggregate({ _count: true })` are served by the native Convex count syscall and need nothing.

- Move the backfill and migration argument types to the entry that owns them.

```ts
// Before
import type { CountBackfillChunkArgs, MigrationRunArgs } from 'kitcn/orm';

// After
import type { CountBackfillChunkArgs } from 'kitcn/orm/aggregate-index';
import type { MigrationRunArgs } from 'kitcn/orm/migrations';
```

- Read the session with `getSession(ctx)` from `kitcn/auth` in cRPC query and mutation middleware, and build authenticated actions in `convex/lib/crpc-action.ts`. `getAuth(ctx)` pulls your whole Better Auth definition and every plugin into the static import closure of every module that imports `convex/lib/crpc.ts`; keep it in the modules that actually call `auth.api.*` — the action builder module, HTTP routes, and organization/admin mutations.

```ts
// Before
const auth = getAuth(ctx);
const session = await auth.api.getSession({ headers: await getHeaders(ctx) });
const user = session?.user ?? null;

// After
const session = await getSession(ctx);
const user = session
  ? await ctx.orm.query.user.findFirst({ where: { id: { eq: session.userId } } })
  : null;
```

## Features

- Add the `kitcn/orm/aggregate-index` and `kitcn/orm/migrations` entries so apps only bundle the subsystems they register.

## Patches

- Drop the unused `svix` dependency. `@kitcn/resend` keeps its own, so the Resend webhook path is unaffected.
