---
"kitcn": minor
---

## Breaking changes

- Register optional ORM subsystems with `createOrm({ capabilities })`. Aggregate and rank indexes ship from `kitcn/orm/aggregate-index`, migrations from `kitcn/orm/migrations`. Convex bundles everything a module statically imports and has no dynamic `import()`, so `kitcn/orm` no longer reaches those runtimes: a minimal `createOrm` + `findMany` consumer drops from 301.7 KB minified, and `kitcn/orm`'s import graph from 113 modules to 59. `kitcn codegen` writes the registration for you — rerun it, or add the two lines by hand.

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

  Without `aggregateCapability()`, a schema declaring `aggregateIndex`/`rankIndex` throws at `createOrm()`, and filtered `count()`, `count({ select })`, `aggregate()`, `groupBy()`, `rank()` and relation `_count` throw at call time. Without `migrationCapability()`, `orm.api()` throws. Unfiltered `count()` is served by the native Convex count syscall and needs nothing.

- Move the backfill and migration argument types to the entry that owns them.

```ts
// Before
import type { CountBackfillChunkArgs, MigrationRunArgs } from 'kitcn/orm';

// After
import type { CountBackfillChunkArgs } from 'kitcn/orm/aggregate-index';
import type { MigrationRunArgs } from 'kitcn/orm/migrations';
```

- Read the session with `getSession(ctx)` from `kitcn/auth` in cRPC query and mutation middleware. `getAuth(ctx)` pulls your whole Better Auth definition and every plugin into the static import closure of every module that imports `convex/lib/crpc.ts`; keep it in the modules that actually call `auth.api.*`, such as actions and HTTP routes.

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
