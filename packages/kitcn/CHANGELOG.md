# kitcn

## 0.17.2

### Patch Changes

- [#329](https://github.com/udecode/kitcn/pull/329) [`c853115`](https://github.com/udecode/kitcn/commit/c853115311cc6b2645c47736db529731af3fc2c6) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix `useInfiniteQuery` from `kitcn/solid` crashing with `state.map is not a function` on every mount.
  - Update Solid infinite query results field by field, so a component reading `status` is not re-run when only `data` changes.

## 0.17.1

### Patch Changes

- [#324](https://github.com/udecode/kitcn/pull/324) [`0536f17`](https://github.com/udecode/kitcn/commit/0536f17bbd22f11d325c26c5e64bed160825a908) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix `kitcn codegen` emitting both the `api` and `internal` type imports into
    generated runtime files that only reference one of them. A module whose
    procedures are all internal, or all public, no longer carries an unused import
    that editors grey out and that `tsc` rejects with `TS6196` when
    `noUnusedLocals` is enabled. Each generated runtime now imports only the api
    roots its procedures reference.

- [#326](https://github.com/udecode/kitcn/pull/326) [`6196625`](https://github.com/udecode/kitcn/commit/6196625d8ce3e9bd08f25373a7e536a43718b167) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix `CRPCError` reaching the client as a bare `Error` with the message
    redacted to `Server Error` and `error.data` undefined. Errors converted by
    cRPC — a procedure calling another procedure through a caller, an ORM
    not-found, a Better Auth `APIError`, or any error wrapped by
    `getCRPCErrorFromUnknown` — now arrive as a `ConvexError` carrying the
    original `code`, `message`, and custom `data`.

    ```ts
    // convex/functions/payment.ts — internal procedure
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Declined: INSUFFICIENT_FUNDS",
      data: { processorCode },
    });

    // Before — the public procedure delegating to it lost the reason
    onError: (error) => {
      error.data; // undefined
    };

    // After
    onError: (error) => {
      error.data; // { code: 'BAD_REQUEST', message: 'Declined: …', processorCode }
    };
    ```

  - Fix converted errors losing every source-mapped frame in Convex dashboard
    logs. Traces carry frames again; the original throw site stays on
    `error.cause`.

## 0.17.0

### Minor Changes

- [#322](https://github.com/udecode/kitcn/pull/322) [`b80d734`](https://github.com/udecode/kitcn/commit/b80d73402165543c91c7f83bba3eae59a6a82184) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Breaking changes

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

- [#320](https://github.com/udecode/kitcn/pull/320) [`799dc4f`](https://github.com/udecode/kitcn/commit/799dc4f80ab998646fd1960fbf82d6f536e5317a) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Breaking changes

  - Improve Convex and HTTP middleware to wrap the whole procedure: `next()`
    resolves after the handler runs, so timing, error reporting, and cleanup
    around it observe the handler, and handler errors propagate through every
    wrapping `catch`. A `ctx` changed on the return path no longer reaches the
    handler — pass it to `next()` instead.

    ```ts
    // Before — logged 0ms, never saw handler errors, and this ctx was ignored
    .use(async ({ ctx, next }) => {
      const start = Date.now();
      const result = await next({ ctx });
      console.log(`${Date.now() - start}ms`);
      return { ...result, ctx: { ...ctx, tenant } };
    })

    // After — times the handler, sees its errors, and passes ctx forward
    .use(async ({ ctx, next }) => {
      const start = Date.now();
      try {
        return await next({ ctx: { ...ctx, tenant } });
      } finally {
        console.log(`${Date.now() - start}ms`);
      }
    })
    ```

  - Improve chained `.input()` to apply each schema on its own instead of
    flattening them into one shape, so object-level rules run. A key declared by
    more than one schema is validated only by the last schema to declare it, even
    when an earlier schema carries object-level rules.

    ```ts
    // Before — the object-level rule was dropped and both fields reached the handler
    .input(z.object({ password: z.string(), confirm: z.string() }))

    // After — mismatched values are rejected before the handler runs
    .input(
      z
        .object({ password: z.string(), confirm: z.string() })
        .refine((v) => v.password === v.confirm)
    )
    ```

  ## Patches

  - Fix `.input()` schemas running twice per request, which made field transforms
    apply to their own output — `z.string().transform(s => s.length)` threw on
    valid input and `z.number().transform(n => n * 2)` doubled twice. Transforms
    and refinements now run exactly once.
  - Fix `next({ input })` being dropped for every middleware after the first, so
    input enrichment placed after an auth middleware no longer silently no-ops.
  - Fix HTTP routes returning a retryable `500` for errors raised by a procedure
    they called through a caller. `NOT_FOUND`, `FORBIDDEN`, and other codes now
    keep their status and message.
  - Fix HTTP routes returning `500` for the twelve error codes missing from the
    route status map, including `PAYLOAD_TOO_LARGE` (`413`),
    `UNSUPPORTED_MEDIA_TYPE` (`415`), and `PRECONDITION_FAILED` (`412`).
  - Fix a malformed or empty JSON body returning `500` instead of `400`,
    including when HTTP middleware reads it through `getRawInput()`.

- [#317](https://github.com/udecode/kitcn/pull/317) [`b765f01`](https://github.com/udecode/kitcn/commit/b765f016cc82aabaad9d5f4d218955163f1a73a5) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Breaking changes

  - `orderBy` on a field that no index _leads_ now sorts after reading, and under
    cursor pagination it raises instead of returning a page ordered by the wrong
    column. An index merely containing the field no longer counts: Convex walks an
    index in full key order, so `on(type, numLikes)` orders by `type` first. Add an
    index led by the sort field, or read without a cursor.

  ```ts
  // Before: paged, silently ordered by `type`
  index("numLikesAndType").on(t.type, t.numLikes);

  await db.query.posts.findMany({
    orderBy: { numLikes: "desc" },
    cursor: null,
    limit: 20,
  });

  // After: add an index the sort field leads
  index("numLikesAndType").on(t.type, t.numLikes);
  index("by_num_likes").on(t.numLikes);

  await db.query.posts.findMany({
    orderBy: { numLikes: "desc" },
    cursor: null,
    limit: 20,
  });
  ```

  - `.withIndex(name, range)` now wins over the index a `where` object would have
    selected, so a `where` the pinned index cannot serve becomes a scan the caller
    has to bound. Under cursor pagination that combination now asks for `maxScan`
    instead of quietly reading through a different index.

  ```ts
  // Before: scanned `by_status` and returned rows from every city
  await db.query.users
    .withIndex("by_city", (q) => q.eq("cityId", cityId))
    .findMany({ where: { status: "active" }, cursor: null, limit: 20 });

  // After: bound the scan
  await db.query.users
    .withIndex("by_city", (q) => q.eq("cityId", cityId))
    .findMany({
      where: { status: "active" },
      cursor: null,
      limit: 20,
      maxScan: 500,
    });
  ```

  ## Patches

  - Fix `.withIndex(name, range)` being ignored whenever the `where` object also
    matched another index. The index and its bounds you asked for are now the ones
    scanned — including under cursor pagination — so a range used to scope a query,
    a tenant id for instance, can no longer be dropped and return rows outside it.
  - Fix `where: { field: { in: [...] } }` combined with `orderBy` and `limit`
    returning an arbitrary slice — usually the oldest rows — instead of the
    requested window.
  - Fix `like`, `ilike`, `notLike`, and `notIlike` matching nothing when the
    pattern has a wildcard anywhere but the ends. `%` now matches any run of
    characters and `_` matches exactly one Unicode character, at any position.
  - Fix `eq`, `ne`, `in`, and `notIn` never matching array or object columns.
    Values are compared by content, in queries and in `update`/`delete` filters.
  - Fix `select()` returning raw rows for a `where: { id }` lookup, which silently
    skipped `map`, `filter`, `flatMap`, and `distinct`. `pageByKey` with the same
    `where` also returns its page shape instead of a bare array. A `where` on `id`
    or `id: { in: [...] }` reads those rows by key rather than scanning the table
    for them, so `select()` costs one read per id however large the table is.
    Cursor pagination rejects `id: { in: [...] }` with `maxScan`, because sorting
    arbitrary IDs by creation time requires reading the complete list first.
  - Apply RLS to source rows before any `select()` pipeline callback runs, so a
    mapper or flat-map stage cannot inspect or project a forbidden document.
  - Fix `flatMap`'s `limit` counting rows excluded by its `where`, which returned
    fewer children than asked for and often none. The limit now counts matching
    children, stays stable across pages instead of yielding a fresh batch per page,
    and reads each child once within the `maxScan` budget. It also stops on the
    last child it can return instead of reading one past it, so a small `limit`
    across many parents no longer spends reads no page can show. Exhausted and
    missing optional relations advance cursors without duplicates or loops.
  - Fix a relation `limit` combined with a relation `where` returning too few
    children — none when enough non-matching children sorted first. The limit now
    counts matching children. Without an explicit relation `orderBy`, the scan
    also stops after the requested visible rows, including rows filtered by RLS.

- [#316](https://github.com/udecode/kitcn/pull/316) [`59b80d0`](https://github.com/udecode/kitcn/commit/59b80d0f7c8c9aea78a15b427449907ef8976750) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Breaking changes

  - Require `rls.roleResolver` for policies scoped with `to`. A role-scoped policy
    previously applied to every caller when no resolver was configured; it now
    throws `RLS_ROLE_RESOLVER_REQUIRED`. Queries and mutations check this for
    every table they touch before reading rows, so the error depends only on
    configuration and not on whether the table holds rows. SQL pseudo-roles
    (`public`, `current_user`, `current_role`, `session_user`) apply to everyone
    and still need no resolver.

  ```ts
  // Before
  const ormDb = orm.db(ctx, { rls: { ctx } });

  // After
  const ormDb = orm.db(ctx, {
    rls: { ctx, roleResolver: (ctx) => ctx.roles ?? [] },
  });
  ```

  - Deny RLS policy comparisons against a missing value, following SQL null
    semantics. A policy written as `eq(column, null)` now denies instead of
    matching explicitly-null columns, and an unauthenticated caller no longer
    matches rows whose owner column was never set. Use `isNull` to match absent
    or null columns.

  ```ts
  // Before
  rlsPolicy("read_unassigned", {
    for: "select",
    using: (ctx, t) => eq(t.ownerId, null),
  });

  // After
  rlsPolicy("read_unassigned", {
    for: "select",
    using: (ctx, t) => isNull(t.ownerId),
  });
  ```

  ## Patches

  - Fix many-to-many relations ignoring the junction table's RLS policies, which
    revealed which rows other users were linked to. Loading a relation with `with`
    now enforces the junction table's policies alongside the related table's.

- [#319](https://github.com/udecode/kitcn/pull/319) [`2aee478`](https://github.com/udecode/kitcn/commit/2aee478fcc750d06bd914bf5cd701045d1c79736) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Breaking changes

  - Enforce the configured total budget across all `shards`.

    ```ts
    // 20 per minute in total, spread over 4 shards
    Ratelimit.fixedWindow(20, "1 m", { shards: 4 });
    ```

  - Preserve configured `maxReserved` headroom across sharded limiters.
  - Reject limiter budgets that leave any shard with less than one usable token.
  - Reject non-positive, non-finite, or unservable dynamic limit overrides.

  - Evaluate the requested `count` / `rate` in `check()` against the tokens already
    spent. It previously evaluated nothing and returned `success: true` for every
    caller, so a pre-flight gate now reports `success: false` where it always said
    "allowed".

    ```ts
    // Before: always true, even for an exhausted identifier
    const gate = await limiter.check(userId, { count: 5 });

    // After: matches what limit() would decide, without consuming tokens
    const gate = await limiter.check(userId, { count: 5 });
    if (!gate.success) return { retryAt: gate.reset };
    ```

  ## Features

  - Add `snapshotToState` to convert a `getValue()` snapshot into the state shape
    `calculateRatelimit()` expects. Snapshots retain the full projected state,
    including sliding-window current and previous counts, so later projections
    preserve boundary decay.
  - Add `remainingRaw` to `calculateRatelimit()` results for the exact token
    balance, including the negative value when a request overdraws.

  ## Patches

  - Fix `getRemaining()` inverting sliding-window quotas. An identifier with no
    traffic reported `remaining: 0`, and quota banners or `X-RateLimit-Remaining`
    headers showed the opposite of the truth.
  - Fix `resetUsedTokens()` leaving an identifier blocked by the ephemeral cache,
    so an admin quota reset silently failed for the rest of the window.
  - Key the ephemeral block cache per shard. One exhausted shard used to block the
    identifier outright, stranding every other shard's tokens until the window
    reset and enforcing well under the configured limit.
  - Sum every shard in `getRemaining()` rather than extrapolating the fullest one.
    A half-drained sharded limiter reported its full budget as still available.
  - Improve shard selection to compare exact token balances, so sharded limiters
    spread load onto the emptier shard instead of tying on rounded counts.
  - Retry the remaining shards when the preferred candidates are exhausted, so
    routing cannot deny a request while another shard can still serve it.
  - Preserve whole-request capacity for fractional budgets by dealing the whole
    portion and keeping the fractional remainder on one shard.
  - Scale fixed-window snapshots and response balances by `capacity` rather than
    the refill `limit`, so burst configurations report valid remaining tokens.
  - Scope ephemeral blocks by shard, requested count, and reservation mode, so a
    failed large or ordinary request does not hide tokens from a smaller or
    reserved request, and include cached shards when reporting the earliest
    global retry time.
  - Prune expired ephemeral block variants when recording a new block.
  - Allocate token-bucket refill rates in proportion to shard capacity, preserving
    the full configured refill when capacity shares are uneven.
  - Compute reserved-request retry times against `maxReserved` headroom rather
    than the non-reserved zero-debt threshold.
  - Evaluate sampled shard states at one common read timestamp, avoid refilling
    their aggregate again, and sum each shard's independently usable whole tokens
    in `getRemaining()` without netting debt or fractions across isolated shards.
  - Preserve sampled per-shard state in snapshots so all-shard projections retain
    independent capacity saturation and sliding-window decay.
  - Read each candidate shard set concurrently, including exhaustion fallbacks.
  - Reject requests that exceed every shard's capacity and reservation headroom
    with `reason: "requestTooLarge"` and no retry deadline or shard reads.
  - Exclude permanently undersized shards from retry deadlines and invalidate
    local snapshot and block-decision caches when dynamic limits change.
  - Preserve permanent oversized denials through all-shard snapshots and React
    projections without scheduling an infinite retry timer.
  - Apply per-shard capacity guards to partial snapshots while retaining uncapped
    reservation headroom when `maxReserved` is omitted.
  - Reject negative, non-finite `maxReserved` values before sharding or retry
    calculation.
  - Normalize shard-local algorithms, enforce per-shard capacity for fresh
    projections, and generation-guard cache writes across dynamic updates.
  - Skip infinite block-cache entries and retain at most 32 finite variants per
    identifier.

### Patch Changes

- [#318](https://github.com/udecode/kitcn/pull/318) [`eddfc08`](https://github.com/udecode/kitcn/commit/eddfc083de4e1656237f1b871919c9c382eeb67e) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix auth queries that filter by `id` resolving records from the wrong model,
    which let a lookup, update, or delete for one model read, patch, or destroy a
    record belonging to another. IDs are now checked against the model being
    queried, and IDs that belong elsewhere or are malformed resolve to "not
    found" instead of a foreign record or an error.
  - Fix `findMany` and `count` returning duplicated records past the first page,
    which also inflated counts used for membership, role, and API key limits.
  - Fix mixed `AND`/`OR` filters in `findMany` and `count` returning records the
    filter excluded, such as rows outside the requested organization. Mixed
    filters are now rejected, matching `updateMany` and `deleteMany`.
  - Fix `not_in` filters returning no match when the matching record was not
    among the first records scanned, which made those updates fail and those
    deletes silently do nothing.
  - Fix `auth.jwtCache: false` in the Next.js integration disabling
    authentication instead of just the JWT cookie cache, which made every server
    request anonymous.

- [#321](https://github.com/udecode/kitcn/pull/321) [`9a7feab`](https://github.com/udecode/kitcn/commit/9a7feab2f99ee383a02225c293137416a0438fbd) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix signed-in users being signed out when their name or email contains
    non-ASCII characters.
  - Fix server callers re-running a failed mutation or action after a
    non-authorization error, which could charge a card or write a row twice.
  - Fix results of auth-scoped actions surviving sign-out and being served to the
    next user in the same tab.
  - Fix `skipUnauth` being ignored on queries and action queries, so backend
    authorization errors resolve to `null` as documented instead of surfacing as
    query errors.
  - Fix `Date` values in query args crashing the render.
  - Fix a function-form `enabled` being ignored on queries, action queries, and
    infinite queries, which ran queries the caller had disabled.
  - Fix mutating a query args object in place returning another component's args
    for a previously used key, which subscribed to the wrong Convex query.
  - Fix RSC prefetch of `crpc.http.*` building a different URL than the browser
    client for `params` and `searchParams`, so prefetched data now hydrates
    instead of being refetched.

## 0.16.1

### Patch Changes

- [#314](https://github.com/udecode/kitcn/pull/314) [`e01e3f5`](https://github.com/udecode/kitcn/commit/e01e3f58ae33e118f1bf844e7d5a98694ce10ab0) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix `like`, `ilike`, `contains`, `endsWith`, and the array operators returning
    too few rows — often none — when combined with `limit`. These operators are
    matched after the rows are read, so `limit` now counts matches instead of
    scanned rows. `offset` counts matches too.
  - Fix those same operators being ignored entirely under cursor pagination, which
    returned pages containing rows that did not match. Pages now hold only
    matching rows.
  - Fix `NOT` around one of those operators matching nothing instead of negating,
    with or without a cursor.
  - Fix `isNull` skipping rows whose column was never written once that column is
    indexed. Absent and explicitly-null columns now both match, with or without an
    index.
  - Fix `flatMap` pagination dropping and duplicating children after the first
    page. Walking every page now returns the same rows as reading them at once.
  - Fix soft cascade deletes rescheduling themselves forever and never reaching
    the children past the first batch.

## 0.16.0

### Minor Changes

- [#310](https://github.com/udecode/kitcn/pull/310) [`a229128`](https://github.com/udecode/kitcn/commit/a229128a94605c229d0ba9a5e9e7f2f98ee76e7e) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Require Convex 1.42 or newer.

    ```bash
    # Before
    bun add convex@1.38.0

    # After
    bun add convex@1.42.3
    ```

### Patch Changes

- [#311](https://github.com/udecode/kitcn/pull/311) [`644ed41`](https://github.com/udecode/kitcn/commit/644ed41f38db3796790a947019ea089c224bf83d) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix unbounded auth queries hanging after 200 rows.
  - Prevent action contexts from exposing mutation-only transaction options.

## 0.15.18

### Patch Changes

- [#308](https://github.com/udecode/kitcn/pull/308) [`65a331b`](https://github.com/udecode/kitcn/commit/65a331b7b9cb541b46c031e9afabdadd4d9d0c91) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix ORM ID queries and relation loading to treat malformed IDs as missing
    records.

## 0.15.17

### Patch Changes

- [#305](https://github.com/udecode/kitcn/pull/305) [`b7ccc0b`](https://github.com/udecode/kitcn/commit/b7ccc0b19fb79017a9116bebc548b63b6081b822) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix cRPC infinite queries backed by native Convex pagination loading pages
    before `fetchNextPage()` is called.

## 0.15.16

### Patch Changes

- [#301](https://github.com/udecode/kitcn/pull/301) [`3248105`](https://github.com/udecode/kitcn/commit/32481058f1043a4f9a0a897ee966d9048dc79739) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Add provider-owned Convex authentication recovery after transient token failures.

## 0.15.15

### Patch Changes

- [#297](https://github.com/udecode/kitcn/pull/297) [`4fba1b8`](https://github.com/udecode/kitcn/commit/4fba1b8dcef38e3433984553063306aafd87a453) Thanks [@MikeyZhang75](https://github.com/MikeyZhang75)! - ## Patches

  - Fix `kitcn deploy` and `kitcn aggregate backfill|rebuild|prune` failing with `Too many documents read in a single function execution (limit: 32000)` once a table with an `aggregateIndex()` grows past ~32k rows. Backfill kickoff now discovers removed aggregate indexes with bounded distinct-key index scans instead of reading every aggregate row. Clearing a removed index whose aggregate rows already exceed platform limits still requires a chunked prune.
  - Fix `backend=concave` failing to locate the Concave CLI with `@concavejs/cli` releases that do not export `./package.json`.
  - Pin `@concavejs/cli` in concave scaffolds to the supported version instead of `latest`.

## 0.15.14

### Patch Changes

- [#293](https://github.com/udecode/kitcn/pull/293) [`0fcbae0`](https://github.com/udecode/kitcn/commit/0fcbae099b0658c2d921a42a189e713a71ebeb71) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix Better Auth client type compatibility for auth providers and organization-heavy auth clients.
  - Support Better Auth 1.6.18 across generated auth apps.

## 0.15.13

### Patch Changes

- [#289](https://github.com/udecode/kitcn/pull/289) [`4aae1ee`](https://github.com/udecode/kitcn/commit/4aae1ee1dfac8ae85fe0999fba8a78e523fec975) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix auth adapter updates with no `where` clauses to return `null`.
  - Fix Next.js and TanStack Start auth proxies to strip hop-by-hop headers.
  - Update supported Better Auth installs to `1.6.15` with a `>=1.6.11 <1.7.0` peer range.

## 0.15.12

### Patch Changes

- [#285](https://github.com/udecode/kitcn/pull/285) [`0ca9202`](https://github.com/udecode/kitcn/commit/0ca9202b83ccaa692507242aee99e086c1994cb1) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix auth providers to accept plugin-rich Better Auth clients without casts.

## 0.15.11

### Patch Changes

- [#283](https://github.com/udecode/kitcn/pull/283) [`2e09a29`](https://github.com/udecode/kitcn/commit/2e09a297e27ea714fe73d0a388d3ed11359630c3) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn init -t start` to preserve the shadcn Start template while safely staging existing empty target directories.
  - Fix `rankIndex().orderBy()` so documented direction objects typecheck and normalize correctly.

## 0.15.10

### Patch Changes

- [#280](https://github.com/udecode/kitcn/pull/280) [`a684485`](https://github.com/udecode/kitcn/commit/a6844855d69725321ddfbd4b50e8a1f517e70e96) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn init -t start` to preserve the shadcn Start template while safely staging existing empty target directories.

## 0.15.9

### Patch Changes

- [`386b54e`](https://github.com/udecode/kitcn/commit/386b54e2d5a9c1b48e9a8db5604d29d8e9013f9f) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn init -t start` for TanStack Start scaffolds that use Vite
    `resolve.tsconfigPaths`.
  - Improve the packaged kitcn agent skill prompt and reference footprint.

## 0.15.8

### Patch Changes

- [#275](https://github.com/udecode/kitcn/pull/275) [`4dd56d0`](https://github.com/udecode/kitcn/commit/4dd56d062dbd268e7768f0a0e854572a840d7de6) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Support Better Auth plugin sign-in methods in `useSignInMutationOptions`.

## 0.15.7

### Patch Changes

- [#272](https://github.com/udecode/kitcn/pull/272) [`d286077`](https://github.com/udecode/kitcn/commit/d286077bf388956d8f423eaaa1afed18b0b4b7b9) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix ORM update and delete filters on primary id arrays so bounded mutations do not require `allowFullScan`.
  - Bound sync primary-id mutation fanout by `mutationBatchSize` and keep legacy scheduled cursors on the query-pagination path.

## 0.15.6

### Patch Changes

- [#270](https://github.com/udecode/kitcn/pull/270) [`2703bf0`](https://github.com/udecode/kitcn/commit/2703bf056b129c783ec772280b4e1648bffdf171) Thanks [@zbeyens](https://github.com/zbeyens)! - Support `OPTIONS` preflight forwarding in `kitcn/auth/nextjs` route handlers and generated Next auth routes.

## 0.15.5

### Patch Changes

- [#268](https://github.com/udecode/kitcn/pull/268) [`da34316`](https://github.com/udecode/kitcn/commit/da34316d76a64ebd6d0ac683ded2472246bb9439) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Support syncing shared Convex query clients directly from `ConvexAuthProvider`.

  ## Patches

  - Keep the existing auth store attached when reusing a Convex query client before `ConvexAuthProvider` resyncs it.
  - Fix `kitcn/auth/start/server` so Nitro production builds can trace and include the TanStack Start server dependency without making `kitcn/auth/start` unsafe for browser loaders.

## 0.15.4

### Patch Changes

- [#266](https://github.com/udecode/kitcn/pull/266) [`5de6e94`](https://github.com/udecode/kitcn/commit/5de6e9466bf066180b76062cbbb5632e27fc6bd1) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Support syncing shared Convex query clients directly from `ConvexAuthProvider`.

## 0.15.3

### Patch Changes

- [#264](https://github.com/udecode/kitcn/pull/264) [`21760cb`](https://github.com/udecode/kitcn/commit/21760cb994a8f3e093795c342cdbda11ae8e8819) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix Convex query cache updates when a subscription returns `null`.

## 0.15.2

### Patch Changes

- [#262](https://github.com/udecode/kitcn/pull/262) [`a33d263`](https://github.com/udecode/kitcn/commit/a33d2633e0b2c2e016f4d951b3bea8a2852b7a03) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix Resend scaffolds to resolve optional Resend env values from Convex runtime env proxies.
  - Fix Resend env helper reruns to update noncanonical `createEnv` formatting instead of silently skipping `readOptionalRuntimeEnv`.
  - Fix env helper reruns to fail loudly instead of duplicating or rewriting non-literal `readOptionalRuntimeEnv` options.
  - Fix Resend scaffold table names to match the camelCase schema extension keys.

## 0.15.1

### Patch Changes

- [#260](https://github.com/udecode/kitcn/pull/260) [`b9ae68b`](https://github.com/udecode/kitcn/commit/b9ae68bc6c3c26b783f6ae491555026f05510d80) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Add a TanStack Start loader auth helper for priming Convex query clients before protected route loaders run.

## 0.15.0

### Minor Changes

- [#257](https://github.com/udecode/kitcn/pull/257) [`d476288`](https://github.com/udecode/kitcn/commit/d476288e617db8d5d44821a70af3ec787280ea5c) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Require Convex 1.38.0 or newer for generated apps and peer dependency checks.

  ```sh
  # Before
  bun add convex@1.36.1 kitcn

  # After
  bun add convex@1.38.0 kitcn
  ```

  ## Features

  - Support IP-aware rate-limit scaffolds with Convex request metadata.

  ## Patches

  - Support Expo app adoption and avoid Bun-only Expo scaffolding in npm-launched init flows.
  - Document Convex request metadata for IP-aware rate-limit protection.

## 0.14.3

### Patch Changes

- [#255](https://github.com/udecode/kitcn/pull/255) [`0bf1fc2`](https://github.com/udecode/kitcn/commit/0bf1fc2136bf9a2dd1f2ac218d614dcb58a5888b) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix plugin dependency installs to use the project's package manager.

## 0.14.2

### Patch Changes

- [`21acedd`](https://github.com/udecode/kitcn/commit/21acedd829df53c9207c75cee4fe7f68c6a0bd24) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix raw Convex auth adoption for TanStack Start apps that do not keep a kitcn provider at the default path.
  - Clarify organization auth guidance for Stripe-style plugin side effects in Convex actions.

## 0.14.1

### Patch Changes

- [#251](https://github.com/udecode/kitcn/pull/251) [`8ac174c`](https://github.com/udecode/kitcn/commit/8ac174cde9642dd61d5e9420b6cbc53ef7a7c124) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix ORM updates so timestamp `$onUpdateFn` hooks can return `Date` values.

## 0.14.0

### Minor Changes

- [#248](https://github.com/udecode/kitcn/pull/248) [`26023d2`](https://github.com/udecode/kitcn/commit/26023d2ae1b359174658aa4e9dabaeb3683d2142) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Require Convex 1.36 or newer.

  ```bash
  # Before
  bun add convex@1.35.1

  # After
  bun add convex@1.36.1
  ```

  ## Features

  - Add `kitcn env default` passthrough for Convex default environment variables.

  ## Patches

  - Align Better Auth scaffolds and auth runtime helpers with Better Auth 1.6.9.
  - Document Convex inline query, branch deployment, deploy message, and preview deployment passthroughs.

## 0.13.10

### Patch Changes

- [#245](https://github.com/udecode/kitcn/pull/245) [`547ccfd`](https://github.com/udecode/kitcn/commit/547ccfd2673c0099c63b55137b201476da13a56e) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `createAuthMutations` support for Better Auth clients that use the Convex client plugin.

## 0.13.9

### Patch Changes

- [#240](https://github.com/udecode/kitcn/pull/240) [`042a568`](https://github.com/udecode/kitcn/commit/042a5684066e6a6691f858afc22de68c71b58136) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix raw Convex auth reruns so added Better Auth plugins refresh the generated schema without `--overwrite`.

## 0.13.8

### Patch Changes

- [#238](https://github.com/udecode/kitcn/pull/238) [`f43fc36`](https://github.com/udecode/kitcn/commit/f43fc3623b7f05fb8d55d9be1144d192c3e9235f) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn add auth --preset convex` so schema registration reuses existing `authSchema` imports.

## 0.13.7

### Patch Changes

- [#236](https://github.com/udecode/kitcn/pull/236) [`508f6df`](https://github.com/udecode/kitcn/commit/508f6df2cfb0e7177fefcdc48767473560b4b69b) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix auth Stripe subscription writes so `createdAt` and `updatedAt` are only written when the target table defines them.

## 0.13.6

### Patch Changes

- [#234](https://github.com/udecode/kitcn/pull/234) [`f137874`](https://github.com/udecode/kitcn/commit/f13787454ca5cf9a7ea37ca48d021b19de38a2db) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix React query options to stay stable for equal Convex query args.

## 0.13.5

### Patch Changes

- [#232](https://github.com/udecode/kitcn/pull/232) [`24ca124`](https://github.com/udecode/kitcn/commit/24ca124401b22f0ce370709675f796260bebb74e) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix noisy `oidc-provider` deprecation warnings from the internal Convex auth plugin.

## 0.13.4

### Patch Changes

- [#229](https://github.com/udecode/kitcn/pull/229) [`a93f264`](https://github.com/udecode/kitcn/commit/a93f264c522f2818a0166b85770ffe88d1a1eb6d) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn migrate` and `kitcn aggregate` so Convex prod-target runs keep
    ambient deployment auth env in CI.

## 0.13.3

### Patch Changes

- [#227](https://github.com/udecode/kitcn/pull/227) [`2446f3e`](https://github.com/udecode/kitcn/commit/2446f3e53fd74153a1e5ffffc7773553086f899b) Thanks [@zbeyens](https://github.com/zbeyens)! - Add `kitcn init -t expo` for a fresh Expo scaffold built on the official
  `create-expo-app` shell, including the Convex baseline, starter messages
  screen, and first-class `kitcn add auth` parity on the Expo scaffold.

  Expo local env now also owns `EXPO_PUBLIC_SITE_URL`, so Concave dev and Expo
  auth keep one local app-origin contract instead of drifting back to
  `http://localhost:3000`.

## 0.13.2

### Patch Changes

- [`0f1bed4`](https://github.com/udecode/kitcn/commit/0f1bed493208211e3f452420b2756456ed16f5de) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn add auth` in fresh apps so the CLI does not require `better-auth` to be installed before the auth scaffold planner runs.

## 0.13.1

### Patch Changes

- [#219](https://github.com/udecode/kitcn/pull/219) [`3ec2d3b`](https://github.com/udecode/kitcn/commit/3ec2d3b4d4049817124dc4fff12162d1fed2b1a5) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix auth env sync and local auth bootstrap so `kitcn add auth`, `kitcn env push`, and `kitcn dev --bootstrap` use the real Convex CLI entrypoint more reliably across runtimes and platforms.
  - Fix `kitcn init -t <next|start|vite>` custom shadcn preset exits so they stop with a clear rerun instruction instead of crashing while patching scaffold files.
  - Improve `kitcn init -t <next|start|vite>` fresh scaffolds by syncing the shadcn wrapper to `shadcn@4.3.0` and regenerating the starter outputs against the latest upstream template contract.

## 0.13.0

### Minor Changes

- [#213](https://github.com/udecode/kitcn/pull/213) [`71dbc28`](https://github.com/udecode/kitcn/commit/71dbc28f9a59716f8ecd41fda8ee61709ad9c9da) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Require explicit `basePath` when `registerRoutes` is used with non-default auth routes.

  ```ts
  // Before
  import { registerRoutes } from "kitcn/auth/http";

  // auth config uses basePath: "/custom-auth"
  registerRoutes(http, getAuth, {
    cors: {
      allowedOrigins: [process.env.SITE_URL!],
    },
  });

  // After
  import { registerRoutes } from "kitcn/auth/http";

  registerRoutes(http, getAuth, {
    basePath: "/custom-auth",
    cors: {
      allowedOrigins: [process.env.SITE_URL!],
    },
  });
  ```

  - Require `better-auth@1.6.5`.

  ```bash
  # Before
  bun add better-auth@1.5.3

  # After
  bun add better-auth@1.6.5
  ```

  ## Patches

  - Let Convex handle anonymous non-interactive local setup without forcing `CONVEX_AGENT_MODE`.
  - Warn when an app pins an older Convex dependency family than kitcn expects.
  - Support Convex `dev --start` as a pre-run conflict flag.
  - Improve auth route registration so default Convex auth routes avoid eager Better Auth initialization during startup.
  - Preserve forwarded host and protocol headers through Next.js, TanStack Start, and Convex auth route proxies.
  - Fix auth helper token refresh, custom auth `basePath` support, and async custom JWT payload resolution.
  - Fix Better Auth adapter index matching and static filtering for composite and case-insensitive queries.
  - Support Better Auth `1.6.5` auth clients without user-code casts.

## 0.12.28

### Patch Changes

- [#210](https://github.com/udecode/kitcn/pull/210) [`1b3468a`](https://github.com/udecode/kitcn/commit/1b3468a867d62a9b55679170628d5a78c747f156) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix raw Convex auth adoption so `kitcn add auth --preset convex --yes`
    installs `kitcn` before codegen and local bootstrap.
  - Fix `kitcn deploy` so CI deployment env vars reach Convex deploy, migrations,
    and aggregate backfill.

## 0.12.27

### Patch Changes

- [#206](https://github.com/udecode/kitcn/pull/206) [`7edbb5e`](https://github.com/udecode/kitcn/commit/7edbb5e3e445ed7331a4cc19ec795900ccb9ca52) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `bunx --bun kitcn init -t start --yes` so Bun-native parse-time imports
    no longer bypass project aliases and crash first-run codegen on scaffolded
    Start files.
  - Fix raw auth reruns so `http.ts` import detection respects both quote styles,
    `registerRoutes(http, getAuth, ...)` accepts Better Auth route contracts
    without a type cast, and raw auth clients keep the app `SITE_URL` while
    preserving user-edited raw `auth-client.ts` files on reruns.

## 0.12.26

### Patch Changes

- [`897a06b`](https://github.com/udecode/kitcn/commit/897a06b9e6ee5289ccf507d6c878d377ecfb1475) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix raw auth reruns so `http.ts` import detection respects both quote styles,
    and `registerRoutes(http, getAuth, ...)` accepts Better Auth route contracts
    without a type cast.

## 0.12.25

### Patch Changes

- [`c1bc1a0`](https://github.com/udecode/kitcn/commit/c1bc1a046e71af2b311a3568fa397b57093138b1) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix raw TanStack Start auth adoption reruns so `http.ts` import detection
    respects both quote styles and `registerRoutes(http, getAuth, ...)`
    typechecks without casts.

## 0.12.24

### Patch Changes

- [#202](https://github.com/udecode/kitcn/pull/202) [`10c2dc4`](https://github.com/udecode/kitcn/commit/10c2dc4f6de34fd7aaf1ac7bb6c964d7e63fcd3d) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Support `kitcn add auth --preset convex --yes` on TanStack Start apps
    without falling through the Vite `main.tsx` patch path.

## 0.12.23

### Patch Changes

- [#200](https://github.com/udecode/kitcn/pull/200) [`7531fc9`](https://github.com/udecode/kitcn/commit/7531fc90d77b12b2e0815b8775ccecab3134784e) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix React auth hooks so `useAuth()` and `useSafeConvexAuth()` stay loading
    while a cached session token is still syncing to Convex, which prevents a
    brief signed-out flash before the signed-in state settles.

## 0.12.22

### Patch Changes

- [`998ee69`](https://github.com/udecode/kitcn/commit/998ee69335c3e8f4b86333b15c14d0965a3aaae9) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn dev` so local Convex preflight uses `convex init` by default, and only falls back to the upgrade-capable local dev lane when older local backends require it.
  - Improve auth and backend docs so Convex and Concave env/JWKS flows are split into explicit backend lanes.

## 0.12.21

### Patch Changes

- [`96d5572`](https://github.com/udecode/kitcn/commit/96d55722434c09f7acbfbc8b89efc22f9e24768f) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Improve TanStack Start auth migration docs and clarify the `kitcn add auth --schema --yes` schema refresh flow.
  - Fix the Next.js auth proxy so POST auth errors return the upstream response instead of crashing with a 500.
  - Fix `kitcn dev` local bootstrap so older local Convex backends auto-upgrade without hanging on a non-interactive prompt, and preserve local component targeting during preflight.

## 0.12.20

### Patch Changes

- [#193](https://github.com/udecode/kitcn/pull/193) [`db4b2a9`](https://github.com/udecode/kitcn/commit/db4b2a9c0e7ba4bf2fe52eba2f6d00c6c82bf605) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Improve mutation-driven action-caller guidance so `requireActionCtx()` points
    scheduler-capable flows to `requireSchedulerCtx()` and `caller.schedule.*`.
  - Fix server-side call docs so mutation-or-action callbacks schedule actions
    instead of showing an invalid direct action call path.
  - Improve React error-handling docs to recommend `error.data?.message` and a
    global mutation toast pattern with `meta.errorMessage`.

## 0.12.19

### Patch Changes

- [#187](https://github.com/udecode/kitcn/pull/187) [`269966e`](https://github.com/udecode/kitcn/commit/269966eddf9c2a3407e284c86ef3becca9ff441a) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn dev` watcher codegen so Convex parse-time imports read local env
    values from `.env` and `convex/.env`, matching the initial codegen path.
  - Ignore watcher-owned `*.kitcn-parse.ts` temp files during `kitcn dev` so
    parse-time source rewrites do not retrigger codegen in a save loop.
  - Fix `kitcn codegen` so parse-time imports skip helper `.ts` files that do not
    define procedures, and support transitive `.tsx` imports like React Email
    templates.
  - Add server-only middleware procedure info for logging and tracing. Standard
    `export const` queries, mutations, and actions infer `module:function`
    automatically through app `generated/server`; `.name("module:function")`
    overrides when needed, and HTTP routes expose route method and path
    automatically.
  - Add `requireSchedulerCtx()` for mutation-or-action scheduling flows so auth
    callbacks and other generic ctx paths can enqueue work without lying about
    action context.

## 0.12.18

### Patch Changes

- [#183](https://github.com/udecode/kitcn/pull/183) [`40db401`](https://github.com/udecode/kitcn/commit/40db401bc93a9eb1ed7f2398445ba0cebc0a5b28) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn codegen` parse-time cRPC builder stubs so `.paginated()` chains
    after `.input()` keep working and preserve pagination metadata.
  - Fix TanStack Start auth reloads so `createAuthMutations()` persists the
    returned Better Auth session token/data and `ConvexAuthProvider` restores the
    signed-in state after a page refresh.

- [#183](https://github.com/udecode/kitcn/pull/183) [`1218930`](https://github.com/udecode/kitcn/commit/1218930db83b112a43dca074d457ed76c9d4f4c7) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Support custom structured `data` payloads on `CRPCError` so conflict and
    validation handlers can return client-readable metadata alongside the built-in
    error code and message.

## 0.12.17

### Patch Changes

- [#179](https://github.com/udecode/kitcn/pull/179) [`4d2158b`](https://github.com/udecode/kitcn/commit/4d2158b09b4a316df96b4597e9c999517d7a44f8) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn codegen` module parsing so project `tsconfig.json` path aliases
    like `@/lib/crpc` resolve during codegen.
  - Fix `kitcn dev` and `kitcn codegen` parse-time env loading so Concave apps
    can read required values from the project root `.env`.

## 0.12.16

### Patch Changes

- [#177](https://github.com/udecode/kitcn/pull/177) [`2c7ff80`](https://github.com/udecode/kitcn/commit/2c7ff80b571147183316115e86df53f2dc1269d6) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix shared `c.middleware()` auth chains so mutation procedures keep mutation
    writer types like `ctx.db.insert`.
  - Improve shared middleware docs so mutation-only middleware uses
    `c.middleware<MutationCtx>(...)` instead of a query-only workaround.

## 0.12.15

### Patch Changes

- [`a0037ff`](https://github.com/udecode/kitcn/commit/a0037ff26d46749f60788548cb73bf81404fbbc8) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix the remaining `bunx --bun kitcn@latest init -t start --yes` bootstrap
    codegen failure when scaffolded files import `kitcn/server`.

## 0.12.14

### Patch Changes

- [`a5974eb`](https://github.com/udecode/kitcn/commit/a5974ebf70ce984aab6098ffad397c9b116fa7b9) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix the remaining `bunx --bun kitcn@latest init -t start --yes` bootstrap
    parse failure by inlining a bootstrap-safe generated server stub for the real
    nested scaffold chain.

## 0.12.13

### Patch Changes

- [#170](https://github.com/udecode/kitcn/pull/170) [`437eff4`](https://github.com/udecode/kitcn/commit/437eff4f19222867dafc278f8f39aef9a81d4647) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `bunx --bun kitcn init -t start --yes` bootstrap parsing so scaffolded
    backend files resolve against the project install instead of the Bun cache,
    and preserve anonymous local Convex mode for follow-up `kitcn dev` runs.

## 0.12.12

### Patch Changes

- [#163](https://github.com/udecode/kitcn/pull/163) [`38ffd3c`](https://github.com/udecode/kitcn/commit/38ffd3c3843cc4549fd6366190b43977e23d34c0) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Add `kitcn auth jwks` for manual static JWKS export and key rotation when a
    deployment cannot use the Convex-only `env push` flow.

## 0.12.11

### Patch Changes

- [#166](https://github.com/udecode/kitcn/pull/166) [`3a95ffb`](https://github.com/udecode/kitcn/commit/3a95ffbf86872dbd29dbe806c1a48a10189ce611) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn init -t next` monorepo scaffolds so the Next overlay targets the real app root under `apps/*` and uses the workspace package manager instead of assuming a single-app root layout.

- [#163](https://github.com/udecode/kitcn/pull/163) [`38ffd3c`](https://github.com/udecode/kitcn/commit/38ffd3c3843cc4549fd6366190b43977e23d34c0) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix Concave local `kitcn dev` schema watches so `schema.ts` edits rerun fresh codegen and refresh generated schema outputs without a manual `kitcn codegen`.
  - Fix `count()` and aggregate range filters on `timestamp({ mode: "string" })`
    aggregateIndex suffix fields so stored millis buckets match ISO-string
    filters instead of silently returning zero.

## 0.12.10

### Patch Changes

- [#157](https://github.com/udecode/kitcn/pull/157) [`bb038d8`](https://github.com/udecode/kitcn/commit/bb038d880902ef3c2b7388161945dd067073c08f) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix auth-bound React Query data so guest, sign-in, and account-switch transitions do not keep stale cached user data.

## 0.12.9

### Patch Changes

- [#154](https://github.com/udecode/kitcn/pull/154) [`4681298`](https://github.com/udecode/kitcn/commit/46812983553da242a7ee478fc2ec7d024ca018cc) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn dev` so projects with a remote Convex deployment in `.env.local` keep using that remote target instead of falling back to local Convex.

## 0.12.8

### Patch Changes

- [#152](https://github.com/udecode/kitcn/pull/152) [`92dd2bc`](https://github.com/udecode/kitcn/commit/92dd2bcf1ce35c1eb34315b88f025c7ee360a9a1) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix interactive scaffold selection so duplicate file paths are shown once and the active preset stays selected.
  - Fix generated auth demo pages so sign-in and sign-up stay on the signed-in view instead of bouncing back to the auth route.

## 0.12.7

### Patch Changes

- [#150](https://github.com/udecode/kitcn/pull/150) [`9fb1adf`](https://github.com/udecode/kitcn/commit/9fb1adf3a8f9bb7b54ba4dd42c809c9b54ba7e31) Thanks [@zbeyens](https://github.com/zbeyens)! - - Pin the scaffolded Zod install to the supported Zod 4 line so npm
  `kitcn init -t start` resolves without the peer conflict hit during release
  validation.

## 0.12.6

### Patch Changes

- [#148](https://github.com/udecode/kitcn/pull/148) [`8c59d89`](https://github.com/udecode/kitcn/commit/8c59d892f5fdfc12448aee35d86f286378e61aa6) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Add `kitcn init -t start` for fresh TanStack Start apps.
  - Add `kitcn/auth/start` and Start-specific auth scaffolding for `kitcn add auth`.

  ## Patches

  - Fix generated file rewrites so unchanged codegen output does not trigger
    repeated TanStack Start reloads during local development.

## 0.12.5

## 0.12.4

### Patch Changes

- [`d264542`](https://github.com/udecode/kitcn/commit/d264542e0e6818693cad2ad9520da145c0a72694) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix `kitcn add auth` in fresh apps so auth planning installs its required dependencies before the scaffold loads Better Auth internals.

## 0.12.3

### Patch Changes

- [`ec0aaaa`](https://github.com/udecode/kitcn/commit/ec0aaaa525a95788db5b2ec76626ae445e68eae2) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix scenario packaging for `@kitcn/resend` after the plugin moved `kitcn` to peer dependencies.

## 0.12.2

### Patch Changes

- [`4f9907e`](https://github.com/udecode/kitcn/commit/4f9907e95ceae9f30499b2bad0d1fb20d1fa5fc1) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix fresh `bunx kitcn` installs so the CLI keeps TypeScript off the cold
    startup path and still boots when Bun omits `typescript` from the transient
    install tree.

## 0.12.1

### Patch Changes

- [`93726d3`](https://github.com/udecode/kitcn/commit/93726d3d337a7469f98efbf5d932beb370d09d5d) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches

  - Fix fresh `bunx kitcn init` installs so the published CLI ships its runtime
    TypeScript dependency instead of failing before scaffold setup starts.
  - Fix `kitcn init -t next --yes` so non-interactive local bootstrap provisions
    an anonymous Convex deployment instead of stopping on a login prompt.

## 0.12.0

### Minor Changes

- [#139](https://github.com/udecode/kitcn/pull/139) [`11aa0ee`](https://github.com/udecode/kitcn/commit/11aa0ee2091827e6d52b30c261004f4ed64cac07) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Use `kitcn` and `@kitcn/resend` as the published package names, CLI
    commands, import paths, generated comments, and scaffold output.

  ```ts
  // Before
  import { defineSchema } from "<previous package name>/orm";
  import { sendEmail } from "<previous scoped plugin>/resend";

  // After
  import { defineSchema } from "kitcn/orm";
  import { sendEmail } from "@kitcn/resend";
  ```

  - Use `kitcn.json` as the default discovered kitcn config file.

  ```ts
  // Before
  export default {
    outputDir: "convex/shared",
  };

  // After
  {
    "paths": {
      "shared": "convex/shared"
    }
  }
  ```

  - Use app-owned schema composition from the default export. Package schema
    plugin entrypoints are gone, and relations/triggers chain on
    `defineSchema(...)`.

  ```ts
  // Before
  import { defineRelations, defineSchema } from "kitcn/orm";
  import { ratelimitPlugin } from "kitcn/plugins/ratelimit";

  export const schema = defineSchema(tables, {
    plugins: [ratelimitPlugin()],
  });

  export const relations = defineRelations(tables, (r) => ({
    users: {
      posts: r.many.posts(),
    },
  }));

  // After
  import { defineSchema } from "kitcn/orm";
  import { ratelimitExtension } from "../lib/plugins/ratelimit/schema";

  export default defineSchema(tables)
    .extend(ratelimitExtension())
    .relations((r) => ({
      users: {
        posts: r.many.posts(),
      },
    }));
  ```

  - Use `kitcn env push` and `kitcn env pull` for env sync.
    `env sync` is gone.

  ```bash
  # Before
  npx kitcn env sync --auth

  # After
  npx kitcn env push
  ```

  - Use `kitcn/ratelimit` and `kitcn/ratelimit/react`. The old
    `kitcn/plugins/ratelimit*` surface is gone.

  ```ts
  // Before
  import { calculateRateLimit } from "kitcn/plugins/ratelimit";
  import { useRateLimit } from "kitcn/plugins/ratelimit/react";

  // After
  import { calculateRatelimit } from "kitcn/ratelimit";
  import { useRatelimit } from "kitcn/ratelimit/react";
  ```

  ## Features

  - Add a registry-driven CLI with `init`, `add`, `view`, `info`, and `docs`,
    plus `--json`, dry-run, and diff output for scaffold changes.
  - Add backend-aware CLI support for both Convex and Concave, including
    `kitcn.json`, local bootstrap wrappers, and `kitcn verify`.
  - Add project-owned ORM migrations with generated `defineMigration(...)`
    helpers, migration manifests, docs, and `kitcn migrate`.
  - Add starter scaffolds for Next.js and Vite, plus adoption flows for raw
    Convex and create-convex-style apps.
  - Add packaged Convex skills and TanStack Intent metadata so installed apps
    carry their own agent guidance.
  - Add auth scaffolding and schema sync that picks up plugin changes from
    `auth.ts`, keeps `jwks` wired on first install, and supports raw Convex
    auth adoption.
  - Add `kitcn/auth/generated` and typed auth runtime helpers for
    generated auth files.
  - Add `@kitcn/resend` with scaffolded schema, plugin, webhook, cron,
    and email helpers.
  - Add app-owned schema extensions, typed plugin middleware helpers, and
    project-owned ratelimit scaffolding.
  - Add `codegen.trimSegments`, `unionOf(...)`, and broader `objectOf(...)`
    support for generated runtimes and schema builders.

  ## Patches

  - Improve local dev and codegen so env bootstrap, JWKS sync, watcher reruns,
    and supported-Node re-exec behave consistently in real apps.
  - Improve `dev` and `verify` output so one-shot bootstrap stays readable while
    long-running dev still preserves raw Convex logs.
  - Improve codegen failure handling so fatal parse errors keep the last good
    generated files instead of clobbering them with partial output.
  - Fix relation pairing for aliased auth organization edges so generated
    runtimes recover cleanly in apps with multiple relations between the same
    tables.
  - Fix TanStack Query/provider drift and generated runtime typing so local apps
    avoid duplicate React Query context failures and self-import cycles.
  - Improve auth runtime behavior so local auth metadata routes stay quiet, state
    updates land immediately, and optional env values do not break auth analysis.
  - Improve schema-only auth refresh so app-owned `schema.ts` files merge missing
    compatible auth fields, indexes, and relations, then stop on real conflicts
    with manual-action guidance.
  - Keep internal example and scenario typechecks pointed at workspace source so
    fresh CI runs do not depend on stale built package output after package
    renames.
  - Fix ratelimit storage and generated scaffolds so apps use the real
    ratelimit tables instead of failing with bogus missing-table guidance.
  - Keep scaffolded apps on the tested Hono and TanStack Query baselines across
    the example app, generated fixtures, and prepared scenarios.

## 0.11.0

### Minor Changes

- [#135](https://github.com/udecode/kitcn/pull/135) [`2977aa6`](https://github.com/udecode/kitcn/commit/2977aa68204f239bce5214582f111901affdc2ee) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking changes

  - Drop Better Auth `1.4` support and align auth integrations with Better Auth `1.5.3` and `@convex-dev/better-auth@0.11.1`.
  - Remove bundled passkey schema assumptions and follow the upstream `oauthApplication.redirectUrls` rename during `0.11` migrations.

  ```ts
  // Before
  "better-auth": "1.4.9";
  "@convex-dev/better-auth": "0.10.11";

  oauthApplication: {
    redirectURLs: ["https://example.com/callback"];
  }

  // After
  "better-auth": "1.5.3";
  "@convex-dev/better-auth": "0.11.1";

  oauthApplication: {
    redirectUrls: ["https://example.com/callback"];
  }
  ```

  ## Patches

  - Improve Next.js server-side token forwarding by forcing `accept-encoding: identity` for internal auth fetches behind proxy compression.
  - Fix auth adapter selection and OR-query handling so `id` selects preserve `_id`, nullish filters behave correctly, unsupported `experimental.joins` are rejected, and OR updates/deletes/counts dedupe by document id.
  - Improve auth route origin handling by filtering nullish `trustedOrigins` values before CORS matching.
  - Reduce generated runtime boilerplate by moving lazy registry/factory caching and caller/handler context typing into shared server helpers without changing generated caller or handler types.

## 0.10.3

### Patch Changes

- [#132](https://github.com/udecode/kitcn/pull/132) [`7182e18`](https://github.com/udecode/kitcn/commit/7182e18a00ee038d64d14c0078a456678fa9e79f) Thanks [@thuillart](https://github.com/thuillart)! - Support loading ORM triggers from `triggers.ts` during codegen, with fallback to `schema.ts` for backward compatibility. This keeps `schema.ts` schema-safe when triggers need generated runtime helpers like `createXCaller(...)`.

## 0.10.2

### Patch Changes

- [#129](https://github.com/udecode/kitcn/pull/129) [`9262e6f`](https://github.com/udecode/kitcn/commit/9262e6fe823bf8ededc84c1ee2ba9087efa96aa9) Thanks [@thuillart](https://github.com/thuillart)! - Fix trigger-generated callers in `schema.ts` so they stay schema-safe during Convex pushes, and preserve mutation scheduling APIs when triggers are parameterized with `MutationCtx`.

## 0.10.1

### Patch Changes

- [#128](https://github.com/udecode/kitcn/pull/128) [`24e1e60`](https://github.com/udecode/kitcn/commit/24e1e60877b1a0c46631abc6d4118058d42acd4e) Thanks [@thuillart](https://github.com/thuillart)! - ## Patches
  - Fix `kitcn dev` codegen watch mode so added, changed, and removed procedure files regenerate runtime artifacts more reliably during local development.

## 0.10.0

### Minor Changes

- [#121](https://github.com/udecode/kitcn/pull/121) [`7aa4f16`](https://github.com/udecode/kitcn/commit/7aa4f1643b2538627d3c6e51a6e5ab34bec0b500) Thanks [@carere](https://github.com/carere)! - ## Features
  - Add SolidJS flavor with full feature parity to React integration
  - Add `ConvexProvider`, `ConvexProviderWithAuth`, `useConvex`, and `useConvexAuth` for SolidJS
  - Add `createConvexQueryClient` and `useConvexQuery` bridging Convex subscriptions to TanStack Solid Query
  - Add cRPC layer for SolidJS with typed query/mutation/action proxies
  - Add `useConvexInfiniteQuery` for paginated queries in SolidJS
  - Add `createConvexHTTPProxy` for SSR-compatible HTTP client in SolidJS
  - Add auth mutation helpers (`useSignIn`, `useSignUp`, `useSignOut`) for SolidJS
  - Add `useRateLimit` hook for SolidJS using `client.onUpdate()` subscriptions
  - Add `./solid` and `./plugins/ratelimit/solid` package exports

### Patch Changes

- [#126](https://github.com/udecode/kitcn/pull/126) [`0c88268`](https://github.com/udecode/kitcn/commit/0c88268d8efe4160a734ff119aba859d8b4b3fb3) Thanks [@thuillart](https://github.com/thuillart)! - Preserve real `createdAt` columns during ORM writes so auth records keep schema-defaulted timestamps when created through the generated auth runtime.

## 0.9.2

### Patch Changes

- [#123](https://github.com/udecode/kitcn/pull/123) [`ba8ce1a`](https://github.com/udecode/kitcn/commit/ba8ce1aaf23c7a152047115763d5e4b7a3e84a64) Thanks [@thuillart](https://github.com/thuillart)! - Pass the Convex deployment URL through the SSR server caller instead of falling back to `NEXT_PUBLIC_CONVEX_URL`.

  `createCallerFactory` now derives the `.convex.cloud` URL from `convexSiteUrl` by default and also accepts an explicit `convexUrl` override for frameworks that do not use Next.js env naming.

- [#124](https://github.com/udecode/kitcn/pull/124) [`e19de1d`](https://github.com/udecode/kitcn/commit/e19de1d431857851012f9e5e4a1dfa276700c2cd) Thanks [@thuillart](https://github.com/thuillart)! - fix(auth): persist createdAt for auth records

## 0.9.1

### Patch Changes

- [#116](https://github.com/udecode/kitcn/pull/116) [`2c98958`](https://github.com/udecode/kitcn/commit/2c98958f35953dfb4514ee038d2363e3ac92df88) Thanks [@thuillart](https://github.com/thuillart)! - Fix `createEnv` throwing "Invalid environment variables" during `kitcn dev`. The CLI now sets a `globalThis.__KITCN_CODEGEN__` sentinel before importing Convex files via jiti, and `createEnv` reads that sentinel (instead of `process.env`) to activate a safe fallback — using `options[0]` for `z.enum` fields instead of `""` to avoid false validation failures.

- [#120](https://github.com/udecode/kitcn/pull/120) [`c50c99b`](https://github.com/udecode/kitcn/commit/c50c99b5585721e9e6dccc371c3007def1abd09c) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix SSR auth token refresh when Convex requests `forceRefreshToken` during pending Better Auth session hydration.

  `ConvexAuthProvider` now fetches a fresh JWT instead of reusing the cached SSR token in that forced-refresh path, so Convex can schedule preemptive refresh instead of waiting for an auth failure.

## 0.9.0

### Minor Changes

- [#112](https://github.com/udecode/kitcn/pull/112) [`5bd956c`](https://github.com/udecode/kitcn/commit/5bd956c7d6602d14f3a8f9062638b31879fa1160) Thanks [@zbeyens](https://github.com/zbeyens)! - ORM Discriminator (polymorphic):

  - Drop the experimental query-level `polymorphic` config from `findMany`, `findFirst`, and `findFirstOrThrow`.

  ```ts
  // Before
  await db.query.auditLogs.findMany({
    polymorphic: {
      discriminator: "actionType",
      schema: targetSchema,
      cases: { role_change: "roleChange", document_update: "documentUpdate" },
    },
    limit: 20,
  });

  // After
  const rows = await db.query.auditLogs.findMany({ limit: 20 });
  // Polymorphic data is synthesized from table schema at row.details
  ```

  - Add schema-first polymorphic discriminator columns via `discriminator({ variants, as? })` directly in `convexTable(...)`.
  - Add typed nested read unions at `details` by default (or custom alias via `as`).
  - Add `withVariants: true` as a query shortcut to auto-load one() relations on discriminator tables.
  - Reject invalid branch writes when required variant fields are missing.
  - Reject cross-branch write combinations that set fields outside the active discriminator variant.

### Patch Changes

- [#115](https://github.com/udecode/kitcn/pull/115) [`dab1447`](https://github.com/udecode/kitcn/commit/dab14473a9d2285459add2781fa5fbf9c8bd8569) Thanks [@zbeyens](https://github.com/zbeyens)! - - Improve `kitcn analyze` to respect `convex.json` `functions` paths so non-default layouts are discovered.

## 0.8.4

### Patch Changes

- [#110](https://github.com/udecode/kitcn/pull/110) [`589e2bc`](https://github.com/udecode/kitcn/commit/589e2bc932b78c552233babe37441deae7ebdcb9) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches
  - Fix nested `arrayOf(objectOf(...))` field nullability so `text()` and `text().notNull()` produce distinct schema/data-model types and avoid deploy mismatches.

## 0.8.3

### Patch Changes

- [`7f23a8e`](https://github.com/udecode/kitcn/commit/7f23a8eb512b626b952313b31ed0c2a74b1bee46) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix generated caller support for non-cRPC Convex procedure exports (like `orm.api()` internals such as `migrationStatus`).

- [`02e40e8`](https://github.com/udecode/kitcn/commit/02e40e8610b6f51962326abce95c51277c3d0177) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features

  - Add `polymorphic` query config support for `findMany()`, `findFirst()`, and `findFirstOrThrow()` to synthesize discriminated-union targets from `one()` relations.
  - Support custom target aliases with `polymorphic.as` (default alias is `target`) while preserving discriminated-union narrowing by discriminator value.

  ## Patches

  - Validate polymorphic configs at runtime and throw on discriminator/case mismatches or schema parse failures.
  - Auto-load required polymorphic case relations during synthesis and strip them from results unless explicitly requested via `with`.
  - Reject `pipeline` + `polymorphic` combinations with explicit query-builder errors.

## 0.8.2

### Patch Changes

- [`fb0064b`](https://github.com/udecode/kitcn/commit/fb0064bba994ba0ea9db7d7862a6632f53c9cede) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features
  - Add `getSessionNetworkSignals(ctx, session?)` in `kitcn/auth` to expose session-derived `ip` and `userAgent` for query/mutation middleware and rate-limit guards without per-endpoint HTTP wrappers.

## 0.8.1

### Patch Changes

- [`fc9e17c`](https://github.com/udecode/kitcn/commit/fc9e17c7cf220435451e45eeb2cc08c8d34c7d46) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Fixes
  - Fix `kitcn/plugins/ratelimit` so `limit()` and `check()` no longer call timer APIs (`setTimeout`/`clearTimeout`) during normal execution.
  - Remove `blockUntilReady()`

## 0.8.0

### Minor Changes

- [#105](https://github.com/udecode/kitcn/pull/105) [`9ea3902`](https://github.com/udecode/kitcn/commit/9ea3902a9b37bf1206c99c46d3121b95b10af8e7) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Breaking Changes

  - Moved imports from `kitcn/migration` to `kitcn/orm`.

  ## Features

  - Add `arrayOf(...)` and `objectOf(...)` ORM helpers to reduce `custom(...)` boilerplate for nested array/object schemas.
  - Add schema plugin pipeline to `defineSchema(...)` with builtin/default `aggregatePlugin()` and `migrationPlugin()`.
  - Add optional `plugins` option on `defineSchema` so feature tables can be opt-in.
  - Expose `aggregatePlugin` and `migrationPlugin` from `kitcn/plugins`.
  - Add new `kitcn/plugins/ratelimit` module with Upstash-style APIs (`limit`, `check`, `getRemaining`, `blockUntilReady`, `resetUsedTokens`, dynamic limits, timeout/cache/deny reasons) backed by Convex DB tables.
  - Add `kitcn/plugins/ratelimit/react` with `useRateLimit` hook support for browser-side status checks and retry timing.
  - Add `ratelimitPlugin()` for explicit ratelimit internal table enablement in ORM `defineSchema`.

  Usage:

  - Replace example app rate limiting from `@convex-dev/rate-limiter` component usage to `kitcn/plugins/ratelimit`.
  - Add `/ratelimit` coverage demo and guard test suite for ratelimit coverage definitions.
  - Rewrite rate-limiting docs/template references to the new `kitcn/plugins/ratelimit` package surface.

## 0.7.3

### Patch Changes

- [#103](https://github.com/udecode/kitcn/pull/103) [`590c6e3`](https://github.com/udecode/kitcn/commit/590c6e37d1d61cd4f91b7edba3cd3120206d751a) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Features
  - Add built-in ORM migrations with `defineMigration`, `defineMigrationSet`, and typed migration plan/status helpers.
  - Add generated migration procedures (`migrationRun`, `migrationRunChunk`, `migrationStatus`, `migrationCancel`) to generated server/runtime contracts.
  - Add `kitcn migrate` CLI commands: `create`, `up`, `down`, `status`, and `cancel`.
  - Add migration orchestration to `kitcn dev` and `kitcn deploy` with configurable strictness, waiting, batching, and drift policy.
  - Add safe-bypass migration writes by default with per-migration `writeMode: "normal"` override.
  - Make `kitcn reset` clear migration state/history tables (`migration_state`, `migration_run`) in addition to user and aggregate tables.

## 0.7.2

### Patch Changes

- [`9bccd91`](https://github.com/udecode/kitcn/commit/9bccd91a5ac883fcfe6d1345d1f04ca000dcd62e) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix auth adapter date output regression.

  `getAuth(ctx).api.*` date fields are normalized back to Convex-safe unix millis (`number`) on output, preventing unsupported `Date` values from leaking into raw Convex query/mutation/action returns (for example `auth.api.listOrganizations`).

## 0.7.1

### Patch Changes

- [#99](https://github.com/udecode/kitcn/pull/99) [`ea02427`](https://github.com/udecode/kitcn/commit/ea02427192747fe18859de2e65ede0a96ba7a446) Thanks [@zbeyens](https://github.com/zbeyens)! - ## Patches
  - Fix server auth queries and mutations to refresh stale JWTs and retry once on unauthorized responses before returning unauthenticated results.
  - Fix auth header generation to fall back to Better Auth session-token cookies when JWT identity is unavailable, including secure and custom cookie prefixes.
  - Update `@convex-dev/better-auth` support to `0.10.11` to include upstream cross-domain and Convex plugin auth fixes.
  - Fix `ConvexAuthProvider` token refresh behavior by deduplicating concurrent token fetches and forcing non-throwing internal token fetch calls.
  - Improve SSR/OTT auth stability in `ConvexAuthProvider` so session hydration and one-time-token URL handling avoid transient unauthorized states.
  - Align reactive auth query subscriptions with `skipUnauth` semantics so unauthorized subscription updates resolve to `null` instead of triggering unauthorized callbacks.
  - Ensure `ConvexAuthProvider` auth state follows confirmed Better Auth session state so stale JWTs do not keep authenticated state after sign-out.
  - Fix auth adapter date output normalization to return `Date` values for date fields.
  - Fix Next.js auth token forwarding by removing body-related headers from internal token fetch requests.
  - Prefer `better-auth/minimal` imports in auth runtime/type paths where available

## 0.7.0

### Minor Changes

- [#97](https://github.com/udecode/kitcn/pull/97) [`4f83203`](https://github.com/udecode/kitcn/commit/4f83203381bbd5030db77b76baed47db29d25057) Thanks [@{](https://github.com/{)! - ## Auth

  ### Breaking changes

  - Redesign auth trigger API from flat callbacks to nested `{ create, update, delete, change }` shape matching ORM `defineTriggers` pattern.
  - Replace split auth exports (`getAuthOptions` + `authTriggers`) with one default `defineAuth((ctx) => ({ ...options, triggers }))` contract.
  - Drop generated trigger procedures (`beforeCreate`, `onCreate`, `beforeUpdate`, `onUpdate`, `beforeDelete`, `onDelete`); triggers now run inline in the same CRUD transaction.
  - Add `ctx` as second parameter to all trigger callbacks for access to mutation context.
  - Add `before` hook return contract: `void` (continue unchanged), `{ data }` (shallow merge into payload), `false` (cancel write).
  - Add unified `change(change, ctx)` handler with discriminated union `{ operation, id, newDoc, oldDoc }`.
  - Rename `createApi` option `skipValidation` to `validateInput`; default is now `validateInput: false`.
  - Rename auth package entrypoints from hyphenated to namespaced paths:
    - `kitcn/auth-client` -> `kitcn/auth/client`
    - `kitcn/auth-config` -> `kitcn/auth/config`
    - `kitcn/auth-nextjs` -> `kitcn/auth/nextjs`
  - Move HTTP auth helpers to `kitcn/auth/http`:
    - `authMiddleware` and `registerRoutes` now import from `kitcn/auth/http` (not `kitcn/auth`).
    - `kitcn/auth/http` auto-installs the Convex-safe `MessageChannel` polyfill. You can remove your own `http-polyfills.ts` file.

  ```ts
  // Before
  export const getAuthOptions = (ctx) => ({ ...options });
  export const authTriggers = { user: { onCreate: async (ctx, user) => {} } };

  // After
  import { defineAuth } from "./generated/auth";

  export default defineAuth((ctx) => ({
    ...options,
    triggers: {

        create: {
          before: async (data, ctx) => ({ data: { ...data, role: "user" } }),
          after: async (doc, ctx) => {},
        },
        update: {
          after: async (newDoc, ctx) => {},
        },
        change: async (change, ctx) => {
          // change.operation: 'insert' | 'update' | 'delete'
          // change.id, change.newDoc, change.oldDoc
        },
      },
    },
  }));
  ```

  ```ts
  // Before
  import { getAuth } from "./auth";
  createApi(schema, getAuth, { skipValidation: true });

  // After
  import { getAuth } from "./generated/auth";
  createApi(schema, getAuth); // validateInput defaults to false
  createApi(schema, getAuth, { validateInput: true });
  ```

  ```ts
  // Before
  import { convexClient } from "kitcn/auth-client";
  import { getAuthConfigProvider } from "kitcn/auth-config";
  import { convexBetterAuth } from "kitcn/auth-nextjs";

  // After
  import { convexClient } from "kitcn/auth/client";
  import { getAuthConfigProvider } from "kitcn/auth/config";
  import { convexBetterAuth } from "kitcn/auth/nextjs";
  ```

  ```ts
  // Before
  import "../lib/http-polyfills";
  import { authMiddleware, registerRoutes } from "kitcn/auth";

  // After
  import { authMiddleware, registerRoutes } from "kitcn/auth/http";
  ```

  ### Features

  - Add `defineAuth` helpers to unify codegen and non-codegen auth setup.
  - Add always-generated Better Auth runtime contract in `convex/functions/generated/auth.ts`.
  - Add generated `defineAuth` export in `convex/functions/generated/auth.ts` for inference-first `auth.ts` authoring.
  - Support ORM-aware auth writes (insert/update/delete go through ORM when available).

  ## Codegen

  ### Breaking changes

  - Drop generated internal auth calls from `internal.auth.*`; use `internal.generated.*`.
  - Drop manual `initCRPC.dataModel().context(...)` bootstrap; import generated `initCRPC` from `convex/functions/generated/server`.
  - Drop manual `ctx.runQuery`/`ctx.runMutation` for inter-procedure calls; use per-module `create<Module>Handler`/`create<Module>Caller` from `convex/functions/generated/<module>.runtime`.
  - Require `export const httpRouter = router(...)` in `convex/functions/http.ts` so codegen can include typed HTTP routes in generated API output.

  ```ts
  // Before
  import { initCRPC } from "kitcn/server";
  import type { DataModel } from "./_generated/dataModel";

  const c = initCRPC
    .dataModel<DataModel>()
    .context({
      query: (ctx) => withOrm(ctx),
      mutation: (ctx) => withOrm(ctx),
    })
    .meta<{
      auth?: "optional" | "required";
      role?: "admin";
      rateLimit?: string;
    }>()
    .create();

  // After
  import { initCRPC } from "./generated/server";

  const c = initCRPC
    .meta<{
      auth?: "optional" | "required";
      role?: "admin";
      rateLimit?: string;
    }>()
    .create();
  ```

  ```ts
  // Before (http.ts)
  export const appRouter = router({
    health,
    todos: todosRouter,
  });
  export default createHttpRouter(app, appRouter);

  // After (http.ts)
  export const httpRouter = router({
    health,
    todos: todosRouter,
  });
  export default createHttpRouter(app, httpRouter);
  ```

  ### Features

  - Add generated `convex/functions/generated/` directory:
    - `generated/server.ts` — ORM exports (`orm`, `withOrm`, `scheduledMutationBatch`, `scheduledDelete`), wrapped ctx types (`OrmCtx`, `QueryCtx`, `MutationCtx`, `GenericCtx`), prewired `initCRPC`.
    - `generated/auth.ts` — `defineAuth`, `getAuth`, auth runtime contract.
    - `generated/<module>.runtime.ts` — per-module scoped caller/handler factories.
  - Add per-module `create<Module>Handler(ctx)` (DEFAULT) for zero-overhead internal composition in queries/mutations. Bypasses input validation, middleware, and output validation. Same transaction, no serialization.
  - Add per-module `create<Module>Caller(ctx)` for actions and HTTP routes only. Goes through validation + middleware.
    - Root calls in `ActionCtx` dispatch via `ctx.runQuery` / `ctx.runMutation`.
    - Direct action calls are explicit under `caller.actions.*` and dispatch via `ctx.runAction`.
    - Scheduled calls are available under `caller.schedule.*`:
      - `caller.schedule.now.<mutation|action>(input)` (alias for `after(0)`)
      - `caller.schedule.after(ms).<mutation|action>(input)`
      - `caller.schedule.at(dateOrMs).<mutation|action>(input)`
      - `caller.schedule.cancel(jobId)`
    - Auto-generate procedure registry per module from cRPC exports (public + internal).
    - Enforce call matrix: query ctx → root queries only; mutation ctx → root queries+mutations plus `schedule`; action ctx → root queries+mutations plus `actions` and `schedule`.
    - Reserve module export names `actions` and `schedule` in runtime callers (codegen throws explicit conflict error).
  - Never use `ctx.runQuery`/`ctx.runMutation` directly — always use `create<Module>Handler` or `create<Module>Caller`.
  - Keep manual `initCRPC` setup from `kitcn/server` supported for apps not using codegen.
  - Add `kitcn.json` support (plus `--config <path>`) for codegen/dev defaults, feature toggles (`api`, `auth`), and passthrough Convex arg presets.

  ```ts
  // Before — manual runQuery/runMutation with function references
  import { api, internal } from "./_generated/api";

  const result = await ctx.runQuery(api.todos.list, { limit: 10 });
  await ctx.runMutation(internal.todoInternal.create, { userId, ...input });

  // After (query/mutation) — per-module handler, zero overhead, same transaction
  import { createSeedHandler } from "./generated/seed.runtime";

  const handler = createSeedHandler(ctx);
  await handler.cleanupSeedData();
  await handler.seedUsers();
  ```

  ```ts
  // After (action/HTTP) — per-module caller, validation + middleware
  import { createSeedCaller } from "./generated/seed.runtime";

  const caller = createSeedCaller(ctx);
  await caller.generateSamplesBatch({ count: 5, userId, batchIndex: 0 });
  ```

  ### Patches

  - Add generated internal API refs for async ORM workers and generated auth handlers under `internal.generated`.

  ## API Types

  ### Breaking changes

  - Drop separate `meta` arguments in context/proxy/caller/auth setup APIs; pass only `api`.
  - Drop the `@convex/types` workflow and use generated `@convex/api` types.
  - Drop manual codegen outputs `convex/shared/meta.ts` and `convex/shared/types.ts` in favor of generated `convex/shared/api.ts`.

  ```ts
  // Before
  import type { Api, ApiInputs, ApiOutputs } from "@convex/types";
  createCRPCContext({ api, meta, convexSiteUrl });
  createServerCRPCProxy({ api, meta });

  // After
  import type { Api, ApiInputs, ApiOutputs } from "@convex/api";
  createCRPCContext({ api, convexSiteUrl });
  createServerCRPCProxy({ api });
  ```

  ```ts
  // Before
  import type { Select, Insert } from "./shared/types";

  // After
  import type { Select, Insert } from "@convex/api";
  ```

  ### Features

  - Add a single generated `@convex/api` surface that exports `api`, `Api`, `ApiInputs`, and `ApiOutputs` for client typing.
  - Add optional generated table helpers (`TableName`, `Select`, `Insert`) when schema exports `tables`.

  ### Patches

  - Add Date-safe API inference from cRPC exports so `z.date()` fields stay typed as `Date` in generated API input/output types.
  - Improve generated `Api` typing so HTTP router types are embedded in `typeof api`, reducing manual `<Api>` generics in common setup calls.
  - Build function metadata from the generated `api` object at runtime, eliminating separate `meta` plumbing in cRPC React/RSC/server helpers.
  - Filter internal/private namespaces from generated client/caller type surfaces (e.g. `_http`, `_generated`-style keys).
  - Improve lazy caller invalid-path errors with clearer failure messages.

  ```ts
  // Before
  import type { Api } from "@convex/api";

  export const { CRPCProvider, useCRPC, useCRPCClient } =
    createCRPCContext<Api>({
      api,
      convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
    });

  export const crpc = createServerCRPCProxy<Api>({ api });

  // After
  export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
    api,
    convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  });

  export const crpc = createServerCRPCProxy({ api });
  ```

  ## Dependency

  ### Breaking changes

  - Bump Convex minimum peer dependency to `>=1.32`.

  ## ORM

  ### Breaking changes

  - Drop manual `convex/lib/orm.ts` server wiring; import `orm`/`withOrm` from `convex/functions/generated/server`.
  - Drop `OrmQueryCtx`/`OrmMutationCtx`; import wrapped `QueryCtx`/`MutationCtx` from `convex/functions/generated/server`.
  - Table-level lifecycle registration in `convexTable(..., extraConfig)` is removed.
  - Lifecycle helpers `onInsert`, `onUpdate`, `onDelete`, and `onChange` are removed from `kitcn/orm`.

  ```ts
  // Before
  import type { OrmQueryCtx, OrmMutationCtx } from "../lib/orm";
  import { withOrm } from "../lib/orm";

  // After
  import type { QueryCtx, MutationCtx } from "./generated/server";
  import { withOrm } from "./generated/server";
  ```

  ### Features

  - ORM triggers are schema-level only and must be exported as `export const triggers = defineTriggers(relations, { ... })`.
  - Trigger definitions use object hooks per table:
    - `create.before` / `create.after`
    - `update.before` / `update.after`
    - `delete.before` / `delete.after`
    - `change(change, ctx)`
  - `before` return contract is:
    - `void` => continue unchanged
    - `{ data }` => shallow merge into write payload
    - `false` => cancel write via `TriggerCancelledError`
  - Generated server wiring includes `triggers` only when `schema.ts` exports both `relations` and `triggers`.
  - Add `createOrm({ schema, triggers })` support for generated and manual setups.
  - Add `ctx.orm.withoutTriggers(callback)` to bypass trigger hooks for bulk operations (e.g. data resets, migrations). The callback receives a trigger-free ORM instance scoped to the same transaction.

  ## Aggregates

  ### Features

  - Add built-in aggregate-core runtime (B-tree backed).
  - Add `aggregateIndex` schema builder for declaring ORM count and aggregate index coverage:
    - `aggregateIndex(name).on(field1, field2)` — filter key fields.
    - `aggregateIndex(name).all()` — unfiltered (global) metrics.
    - Chainable metric methods: `.count(field)`, `.sum(field)`, `.avg(field)`, `.min(field)`, `.max(field)`.

  ```ts
  // Schema declaration
  const orders = convexTable(
    "orders",
    { orgId: text(), amount: integer(), score: integer() },
    (t) => [
      aggregateIndex("by_org")
        .on(t.orgId)
        .sum(t.amount)
        .avg(t.amount)
        .min(t.score)
        .max(t.score),
      aggregateIndex("all_metrics").all().sum(t.amount).count(t.orgId),
    ]
  );
  ```

  - Add `ctx.orm.query.<table>.count()` and `ctx.orm.query.<table>.count({ where, select, orderBy, skip, take, cursor })` for O(1) filtered counts backed by `aggregateIndex`. Windowed count (`skip`/`take`/`cursor`) counts rows within a window defined by ordering and bounds.
  - Add `ctx.orm.query.<table>.aggregate({ where, _count, _sum, _avg, _min, _max, orderBy, skip, take, cursor })` for Prisma-style aggregate blocks with optional windowed bounds.
  - Add safe finite `OR` rewrite for aggregate/count `where` — `OR` branches collapse when each is index-plannable (differs on one scalar eq/in/isNull field).
  - Add `findMany({ distinct })` deterministic `DISTINCT_UNSUPPORTED` error directing to `select().distinct({ fields })` pipeline.
  - Add relation `_count` loading via `with: { _count: { todos: true } }` with optional filtered variants.
  - Add through-filtered relation `_count` for `through()` relations using indexed lookups + no-scan-safe filter validation.
  - Add mutation `returning({ _count })` for insert/update/delete via split selection + relation count loading.
  - Add Prisma-style `_sum` nullability: returns `null` for empty sets or all-null field values (instead of `0`).
  - Add `groupBy()` to the ORM query builder with Prisma-style `by`, `_count`, `_sum`, `_avg`, `_min`, `_max` blocks. Requires finite `where` constraints (`eq`/`in`/`isNull`) on every `by` field — no `having`/`orderBy`/`skip`/`take`/`cursor` in v1.

  ```ts
  // Count
  const total = await ctx.orm.query.todos.count({ where: { projectId } });

  // Aggregate
  const stats = await ctx.orm.query.orders.aggregate({
    where: { orgId: "org-1" },
    _count: { _all: true },
    _sum: { amount: true },
    _avg: { amount: true },
  });

  // Relation _count
  const users = await ctx.orm.query.user.findMany({
    with: { _count: { todos: { where: { completed: true } } } },
  });
  ```

  - Add generated `aggregateBackfill` and `aggregateBackfillStatus` procedures for index building and status polling.
  - Add ORM internal storage tables (`aggregate_bucket`, `aggregate_member`, `aggregate_extrema`, `aggregate_state`, `aggregate_rank_tree`, `aggregate_rank_node`) auto-injected by `defineSchema`. Convex rejects table names starting with `_`, so internals use the `aggregate_` prefix.
  - Add `rankIndex` schema builder for declaring ranked/ordered aggregate indexes:
    - `rankIndex(name).partitionBy(field1, field2).orderBy(t.score).sum(t.amount)` — partitioned rank index with optional weighted sum.
    - `rankIndex(name).all().orderBy(t.score)` — unpartitioned (global) rank index.
    - `orderBy()` supports `integer()`/`timestamp()`/`date()` columns only.
  - Add `db.query.<table>.rank(indexName, { where })` query builder with O(log n) operations:
    - `.count()`, `.sum()` — aggregate reads.
    - `.at(offset)` — positional access by rank.
    - `.indexOf({ id })` — rank lookup by document ID.
    - `.paginate({ cursor, limit })` — cursor-based ranked pagination.
    - `.min()`, `.max()`, `.random()` — extrema and random sampling.
  - Add backfill support for rank indexes alongside metric indexes (shared `aggregateBackfill`/`aggregateBackfillStatus` procedures).

  ## CLI

  ### Features

  - Add `kitcn analyze` command with two modes:
    - Default **hotspot** mode: per-entry bundle analysis showing output size, dependency size, and handler counts. Interactive TUI with keyboard navigation, live filtering, sort cycling, detail panes (handlers/packages/inputs), and file watch for auto-refresh.
    - `--deploy` mode: single-isolate bundle analysis matching Convex deploy bundling. Reports total size, top inputs, and top packages.
    - `--fail-mb <n>` for CI gating: exit 1 if largest entry or chunk exceeds threshold.
    - Positional regex argument to filter entry points (e.g. `kitcn analyze "auth.*"`).
  - Add `kitcn deploy` command that wraps `convex deploy` with automatic post-deploy aggregate backfill.
  - Add `kitcn aggregate rebuild` command for full aggregate index rebuild.
  - Add `kitcn aggregate backfill` command for resume-mode backfill (no clear/rebuild).
  - Add automatic aggregate backfill to `kitcn dev` (auto-resumes on startup, non-blocking).
  - Add `aggregateBackfill` config section in `kitcn.json` for both `dev` and `deploy`:
    - `enabled`: `"auto"` (skip if function not found), `"on"`, or `"off"`.
    - `wait`: poll until all indexes READY or timeout (default `true`).
    - `batchSize`, `pollIntervalMs`, `timeoutMs`: tuning knobs.
    - `strict`: exit 1 on failure/timeout (default `true` for deploy, `false` for dev).
  - Add CLI flags for aggregate backfill overrides: `--backfill`, `--backfill-wait`, `--backfill-strict`, `--backfill-batch-size`, `--backfill-timeout-ms`, `--backfill-poll-ms`.
  - Add `kitcn reset --yes` command: calls `generated/server:reset`. Supports `--before <fn>` and `--after <fn>` hooks.

## 0.6.4

### Patch Changes

- [#93](https://github.com/udecode/kitcn/pull/93) [`8153811`](https://github.com/udecode/kitcn/commit/81538110000a33855f1b5bb9b66f613604cd8388) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix `findFirst` now returns `null` instead of `undefined` when no result is found. Fix `.returning()` crash on nullable timestamp fields.

## 0.6.3

### Patch Changes

- [#88](https://github.com/udecode/kitcn/pull/88) [`207d62f`](https://github.com/udecode/kitcn/commit/207d62f19912ccf355ff4c5e9ec5fee56ecf58cb) Thanks [@zbeyens](https://github.com/zbeyens)! - ORM/RLS update: async policy callbacks, safe empty `inArray([])` handling in query + mutation paths, and runtime+types support for system fields (`t.id`) in `extraConfig` callbacks.

## 0.6.2

### Patch Changes

- [#86](https://github.com/udecode/kitcn/pull/86) [`49098fa`](https://github.com/udecode/kitcn/commit/49098fa5919b4a9c4a3e73b989ab55d897df02c3) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix Better Auth HTTP adapter error handling to preserve auth error status/code instead of surfacing unexpected 500s.

## 0.6.1

### Patch Changes

- [#82](https://github.com/udecode/kitcn/pull/82) [`aed9972`](https://github.com/udecode/kitcn/commit/aed9972f5869949cfc02ca2eb6bfcb7e57fb754d) Thanks [@zbeyens](https://github.com/zbeyens)! - Migration example: https://github.com/udecode/kitcn/pull/82

  Added `AnyColumn` type export for self-referencing foreign keys (mirrors Drizzle's `AnyPgColumn`).

  ```ts
  import { type AnyColumn, convexTable, text } from "kitcn/orm";

  export const comments = convexTable("comments", {
    body: text().notNull(),
    parentId: text().references((): AnyColumn => comments.id, {
      onDelete: "cascade",
    }),
  });
  ```

## 0.6.0

### Minor Changes

- [#75](https://github.com/udecode/kitcn/pull/75) [`54eeb6d`](https://github.com/udecode/kitcn/commit/54eeb6d68909737b21b3dddfa860de0fc84e7924) Thanks [@zbeyens](https://github.com/zbeyens)! - - Added `kitcn/orm` as the recommended DB API surface (Drizzle-style schema/query/mutation API).

  - Docs: [/docs/db/orm](https://www.kitcn.dev/docs/db/orm)
  - Migration guide: [/docs/migrations/convex](https://www.kitcn.dev/docs/migrations/convex)

  ## Breaking changes

  - `createAuth(ctx)` is removed. Use `getAuth(ctx)` for query/mutation/action/http.

  ```ts
  // Before
  export const createAuth = (ctx: ActionCtx) =>
    betterAuth(createAuthOptions(ctx));
  app.use(authMiddleware(createAuth));

  // After
  export const getAuth = (ctx: GenericCtx) => betterAuth(getAuthOptions(ctx));
  app.use(authMiddleware(getAuth));
  ```

  - `authClient.httpAdapter` is no longer needed. Use context-aware `adapter(...)`.

  ```ts
  // Before
  database: authClient.httpAdapter(ctx);

  // After
  database: authClient.adapter(ctx, getAuthOptions);
  ```

  - cRPC templates now use `ctx.orm` (not `ctx.table`) and string IDs at the API boundary.

  ```ts
  // Before
  input: z.object({ id: zid("user") });
  const user = await ctx.table("user").get(input.id);

  // After
  input: z.object({ id: z.string() });
  const user = await ctx.orm.query.user.findFirst({ where: { id: input.id } });
  ```

  - cRPC/auth context ID types are now string-based at the procedure boundary (`ctx.userId`, params, input/output IDs).

  ```ts
  // Before
  const userId: Id<"user"> = ctx.userId;

  // After
  const userId: string = ctx.userId;
  ```

  - `getAuthConfigProvider` should be imported from `kitcn/auth/config`.
    (instead of legacy `@convex-dev/better-auth/auth-config`, or old `kitcn/auth` docs)

  ```ts
  // Before
  import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";

  // After
  import { getAuthConfigProvider } from "kitcn/auth/config";
  ```

  - Remove legacy app deps: `@convex-dev/better-auth`, `convex-ents`, and `convex-helpers`.

  ```sh
  bun remove @convex-dev/better-auth convex-ents convex-helpers
  ```

  - `convex-helpers` primitives are no longer part of the template path.
    Replace `zid(...)` with `z.string()`, and remove `customMutation`/`Triggers` wrappers in favor of:
    - `initCRPC.create()` defaults
    - trigger declarations in schema table config
  - ORM row shape is `id`/`createdAt` (not `_id`/`_creationTime`) at the app boundary.
    Update UI/client code and shared types accordingly.

  ## Features

  - `initCRPC.create()` supports default Convex builders, so old manual wiring is usually unnecessary.

  ```ts
  // Before (remove this boilerplate)
  const c = initCRPC.create({
    query,
    internalQuery,
    mutation,
    internalMutation,
    action,
    internalAction,
    httpAction,
  });
  const internalMutationWithTriggers = customMutation(...);

  // After
  const c = initCRPC.create();
  // Triggers are declared in schema table config.
  ```

  - cRPC now supports wire transformers end-to-end (Date codec included by default).
    - Supported in `initCRPC.create({ transformer })`, HTTP proxy, server caller, React client, and RSC query client.

  ```ts
  const c = initCRPC.create({ transformer: superjson });

  const http = createHttpProxy({
    convexSiteUrl,
    routes,
    transformer: superjson,
  });
  ```

  - Auth setup supports `triggers` + `context` in `createClient`, and `context` in `createApi`.

  ```ts
  const authClient = createClient({
    authFunctions,
    schema,
    triggers,
    context: getOrmCtx,
  });

  const authApi = createApi(schema, getAuth, {
    context: getOrmCtx,
  });
  ```

  - `createEnv` can replace manual env parsing/throw boilerplate.

  ```ts
  // Before
  export const getEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) throw new Error("Invalid environment variables");
    return parsed.data;
  };

  // After
  export const getEnv = createEnv({ schema: envSchema });
  ```

  - Added new public server helpers: context guards (`isActionCtx`/`requireActionCtx`, etc.).

  ## Patched

  - Updated template and docs to use:
    - `kitcn/auth/client` (`convexClient`)
    - `kitcn/auth/config` (`getAuthConfigProvider`)
  - Example app migration now reflects the current user-facing API (`ctx.orm`, `getAuth(ctx)`, simpler `initCRPC.create()`).
  - cRPC/server error handling now normalizes known causes into deterministic CRPC errors:
    - `OrmNotFoundError` -> `NOT_FOUND`
    - `APIError` status/statusCode -> mapped cRPC code
    - standard `Error.message`/stack preservation on wrapped errors
  - HTTP route validation errors (params/query/body/form) now return `BAD_REQUEST` consistently.
  - `createAuthMutations` now throws `AUTH_STATE_TIMEOUT` when auth token never appears after sign-in/up flow.
  - `getSession` now returns `null` when no session id is present (instead of attempting invalid DB lookups).
  - CLI reliability improvements (`kitcn dev/codegen/env`): argument parsing and entrypoint resolution are more robust across runtime/symlink setups.

  ```ts
  // Client import migration
  // Before
  import { convexClient } from "@convex-dev/better-auth/client/plugins";

  // After
  import { convexClient } from "kitcn/auth/client";
  ```

  ```ts
  // Retry only non-deterministic errors
  import { isCRPCError } from "kitcn/crpc";

  retry: (count, error) => !isCRPCError(error) && count < 3;
  ```

## 0.5.8

### Patch Changes

- [#73](https://github.com/udecode/kitcn/pull/73) [`232d126`](https://github.com/udecode/kitcn/commit/232d12697602e5c1cb3965b6e12cfe9b880d3c5c) Thanks [@zbeyens](https://github.com/zbeyens)! - Support multiple WHERE conditions in `update()` for Better Auth organization plugin compatibility.
  - Multiple AND conditions with equality checks now work
  - Validates exactly 1 document matches before updating (prevents accidental bulk updates)
  - OR conditions and non-eq operators still require `updateMany()`

## 0.5.7

### Patch Changes

- [#61](https://github.com/udecode/kitcn/pull/61) [`7e63e54`](https://github.com/udecode/kitcn/commit/7e63e541fc2853d8d1d45e4f1fb7db3f82e0592c) Thanks [@zbeyens](https://github.com/zbeyens)! - Auth mutation hooks now properly trigger `onError` when Better Auth returns errors (401, 422, etc.).

  ```tsx
  // Before: onSuccess always ran, even on errors
  // After: onError fires on auth failures

  const signUp = useMutation(
    useSignUpMutationOptions({
      onSuccess: () => router.push("/"), // Only on success now
      onError: (error) => toast.error(error.message), // Fires on auth errors
    })
  );
  ```

  New exports: `AuthMutationError` class and `isAuthMutationError` type guard for error handling.

## 0.5.6

### Patch Changes

- [`fdeae26`](https://github.com/udecode/kitcn/commit/fdeae26ef81b46dc1334a4940814628d398659d9) Thanks [@zbeyens](https://github.com/zbeyens)! - - Support Convex 1.31.6
  - Missing `jotai` dependency

## 0.5.5

### Patch Changes

- [#56](https://github.com/udecode/kitcn/pull/56) [`b34a396`](https://github.com/udecode/kitcn/commit/b34a39621af83c6b6f2b2e6e11e35997981c5bb4) Thanks [@zbeyens](https://github.com/zbeyens)! - Add `ConvexProviderWithAuth` for `@convex-dev/auth` users (React Native):

  ```tsx
  import { ConvexProviderWithAuth } from "kitcn/react";

  <ConvexProviderWithAuth client={convex} useAuth={useAuthFromConvexDev}>
    <App />
  </ConvexProviderWithAuth>;
  ```

  Enables `skipUnauth` queries, `useAuth`, and conditional rendering components.

## 0.5.4

### Patch Changes

- [#54](https://github.com/udecode/kitcn/pull/54) [`4321118`](https://github.com/udecode/kitcn/commit/43211189285333f998cef34c7726efa1735837aa) Thanks [@zbeyens](https://github.com/zbeyens)! - Support nested file structures in meta generation:

  ```
  convex/functions/
    todos.ts           → crpc.todos.*
    items/queries.ts   → crpc.items.queries.*
  ```

  - Organize functions in subdirectories
  - `_` prefixed files/directories are excluded

## 0.5.3

### Patch Changes

- [#44](https://github.com/udecode/kitcn/pull/44) [`ea6bfce`](https://github.com/udecode/kitcn/commit/ea6bfce4fb20dda7afdad4a9d0663aa7021e2a88) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix queries throwing without auth provider.

## 0.5.2

### Patch Changes

- [`185f496`](https://github.com/udecode/kitcn/commit/185f496c6b64e70cba96adcfe25e459c8c559a92) Thanks [@zbeyens](https://github.com/zbeyens)! - Add `staticQueryOptions` method to CRPC proxy for non-hook usage in event handlers.

- [`2288076`](https://github.com/udecode/kitcn/commit/228807652c04df9bdb1e9f054a0664d35a643ff2) Thanks [@zbeyens](https://github.com/zbeyens)! - Fix `MiddlewareBuilder` generic parameter mismatch causing typecheck failures when using reusable middleware with `.use()`. Factory functions now correctly pass through the `TInputOut` parameter added in v0.5.1.

## 0.5.1

### Patch Changes

- [#39](https://github.com/udecode/kitcn/pull/39) [`ede0d47`](https://github.com/udecode/kitcn/commit/ede0d473ed8f7254f44b9edb86172cfd3c900857) Thanks [@zbeyens](https://github.com/zbeyens)! - Middleware now receives `input` and `getRawInput` parameters:

  ```ts
  publicQuery
    .input(z.object({ projectId: zid("projects") }))
    .use(async ({ ctx, input, next }) => {
      // input.projectId is typed!
      const project = await ctx.db.get(input.projectId);
      return next({ ctx: { ...ctx, project } });
    });
  ```

  - Middleware after `.input()` receives typed input
  - Middleware before `.input()` receives `unknown`
  - `getRawInput()` returns raw input before validation
  - `next({ input })` allows modifying input for downstream middleware
  - Non-breaking: existing middleware works unchanged

## 0.5.0

### Minor Changes

- [#34](https://github.com/udecode/kitcn/pull/34) [`e2a2f62`](https://github.com/udecode/kitcn/commit/e2a2f6258d75007c39b6dc86d6000e0a9460052d) Thanks [@zbeyens](https://github.com/zbeyens)! - URL searchParams now auto-coerce to numbers and booleans based on Zod schema type, eliminating `z.coerce.*` boilerplate:

  ```ts
  // Before: Required z.coerce.* boilerplate
  .searchParams(z.object({
    page: z.coerce.number().optional(),
    active: z.coerce.boolean().optional(),
  }))

  // After: Standard Zod schemas work directly
  .searchParams(z.object({
    page: z.number().optional(),
    active: z.boolean().optional(),
  }))
  ```

  Coercion behavior:

  - `z.number()` - parses string to number (`"5"` → `5`)
  - `z.boolean()` - parses `"true"`/`"1"` → `true`, everything else → `false`
  - Works with `.optional()`, `.nullable()`, `.default()` wrappers
  - `z.coerce.*` still works if preferred

  ### Vanilla CRPC client

  `useCRPCClient()` now returns a typed proxy for direct procedural calls without React Query:

  ```ts
  const client = useCRPCClient();

  // Convex functions
  const user = await client.user.get.query({ id });
  await client.user.update.mutate({ id, name: "test" });

  // HTTP endpoints
  const todos = await client.http.todos.list.query();
  await client.http.todos.create.mutate({ title: "New" });
  ```

  Useful for event handlers, effects, or when you don't need caching/deduplication.

  **Breaking:** `useCRPCClient()` return type changed from `ConvexReactClient` to typed proxy. Use `useConvex()` (now exported from `kitcn/react`) for raw client access.

  ### Error handling: `isCRPCError` helper

  New unified error check for retry logic - returns true for any deterministic CRPC error (Convex 4xx or HTTP 4xx):

  ```ts
  import { isCRPCError } from "kitcn/crpc";

  // In query client config
  retry: (failureCount, error) => {
    if (isCRPCError(error)) return false; // Don't retry client errors
    return failureCount < 3;
  };
  ```

## 0.4.0

### Minor Changes

- [#31](https://github.com/udecode/kitcn/pull/31) [`618ec38`](https://github.com/udecode/kitcn/commit/618ec386eaf7e893d87570616871386953789753) Thanks [@zbeyens](https://github.com/zbeyens)! - ### HTTP Client: Hybrid API

  The HTTP client now uses a hybrid API combining tRPC-style JSON body at root level with explicit `params`/`searchParams` for URL data.

  #### Breaking Changes

  - **Query/mutation args restructured**: Path params and search params now use explicit keys instead of flat merging
    - Before: `queryOptions({ id: '123', limit: 10 })`
    - After: `queryOptions({ params: { id: '123' }, searchParams: { limit: '10' } })`
  - **Client options in args**: `fetch`, `init`, `headers` go in args (1st param)
    - `queryOptions(args?, queryOpts?)` - args = params/searchParams/form/headers/etc
    - `mutationOptions(mutationOpts?)` - client opts go in `mutate(args)` call
  - **Server handler `query` renamed to `searchParams`**: Consistent naming between client and server
    - Before: `.query(async ({ query }) => { query.limit })`
    - After: `.query(async ({ searchParams }) => { searchParams.limit })`

  #### New Features

  - **Explicit input args**: `params`, `searchParams` keys for clear separation
  - **JSON body at root**: Non-reserved keys spread at root level (tRPC-style): `mutate({ title: 'New' })`
  - **Typed form uploads**: `.form()` builder method for typed FormData schemas (client args + server handler)
  - **Client options in args**: Per-request `fetch`, `init`, `headers` in args (1st param)
  - **mutationOptions for GET**: Use `useMutation` for one-time fetches (exports/downloads) without caching

  #### Migration

  ```tsx
  // Client: Before
  crpc.http.todos.list.queryOptions({ limit: 10 });
  updateTodo.mutate({ id, completed: true });
  deleteTodo.mutate({ id });

  // Client: After
  crpc.http.todos.list.queryOptions({ searchParams: { limit: "10" } });
  updateTodo.mutate({ params: { id }, completed: true });
  deleteTodo.mutate({ params: { id } });

  // Headers go in args (1st param)
  // Before: queryOptions({ header: { 'X-Custom': 'value' } })
  // After:
  crpc.http.todos.list.queryOptions({ headers: { 'X-Custom': 'value' } });

  // Mutations: client opts in mutate args
  updateTodo.mutate({ params: { id }, completed: true, headers: { 'X-Custom': 'value' } });

  // Server: Before
  .query(async ({ query }) => ({ limit: query.limit }))

  // Server: After
  .query(async ({ searchParams }) => ({ limit: searchParams.limit }))

  // Server: Typed form (new)
  .form(z.object({ file: z.instanceof(Blob) }))
  .mutation(async ({ form }) => {
    // form.file is typed as Blob
  })
  ```

## 0.3.1

### Patch Changes

- [#29](https://github.com/udecode/kitcn/pull/29) [`2638311`](https://github.com/udecode/kitcn/commit/26383112835605dd806151832edfbcd98e1e75b2) Thanks [@zbeyens](https://github.com/zbeyens)! - - Move hono to peerDependencies (type-only imports in package)
  - Add stale cursor auto-recovery for `useInfiniteQuery` - automatically recovers from stale pagination cursors after WebSocket reconnection without losing scroll position

## 0.3.0

### Minor Changes

- [#27](https://github.com/udecode/kitcn/pull/27) [`6309e68`](https://github.com/udecode/kitcn/commit/6309e688b3f92b07877966a6f6f7929f2cb7ade0) Thanks [@zbeyens](https://github.com/zbeyens)! - ### HTTP Router: Hono Integration

  The HTTP router now wraps a Hono app, enabling full middleware support.

  #### New Features

  - **Hono-based routing**: `createHttpRouter(app, router)` accepts a Hono app
  - **Auth middleware**: `authMiddleware(createAuth)` for Better Auth routes
  - **Hono context in handlers**: Access `c.json()`, `c.text()`, `c.redirect()`, `c.req`
  - **Non-JSON response support**
  - **CLI watch improvements**: Watches `routers/**/*.ts` and `http.ts` for changes

  #### Breaking Changes

  - **Removed `response()` mode**: Return `Response` directly from handler
  - **Removed per-procedure `cors()`**: Use Hono's `cors()` middleware
  - **CORS via Hono**: `app.use('/api/*', cors())` instead of router options
  - **Handler signature**: `{ ctx, c, input, params, query }` - `c` is Hono Context

  #### Migration

  Before:

  ```ts
  import { registerRoutes } from "kitcn/auth/http";
  import { registerCRPCRoutes } from "kitcn/server";
  import { httpRouter } from "convex/server";

  const http = httpRouter();

  registerRoutes(http, createAuth);

  export const appRouter = router({
    health,
    todos: todosRouter,
  });

  registerCRPCRoutes(http, appRouter, {
    httpAction,
    cors: {
      allowedOrigins: [process.env.SITE_URL!],
      allowCredentials: true,
    },
  });

  export default http;
  ```

  After:

  ```ts
  import { authMiddleware } from "kitcn/auth/http";
  import { createHttpRouter } from "kitcn/server";
  import { Hono } from "hono";
  import { cors } from "hono/cors";

  const app = new Hono();

  app.use(
    "/api/*",
    cors({
      origin: process.env.SITE_URL!,
      credentials: true,
    })
  );

  app.use(authMiddleware(createAuth));

  export const appRouter = router({
    health,
    todos: todosRouter,
  });

  export default createHttpRouter(app, appRouter);
  ```

  #### Handler Examples with `c`

  cRPC handlers now receive `c` (Hono Context) for custom responses:

  ```ts
  // File download with custom headers
  export const download = authRoute
    .get("/api/todos/export/:format")
    .params(z.object({ format: z.enum(["json", "csv"]) }))
    .query(async ({ ctx, params, c }) => {
      const todos = await ctx.runQuery(api.todos.list, {});

      c.header(
        "Content-Disposition",
        `attachment; filename="todos.${params.format}"`
      );

      if (params.format === "csv") {
        return c.text(todos.map((t) => `${t.id},${t.title}`).join("\n"));
      }
      return c.json({ todos });
    });

  // Webhook with signature verification
  export const webhook = publicRoute
    .post("/webhooks/stripe")
    .mutation(async ({ ctx, c }) => {
      const signature = c.req.header("stripe-signature");
      if (!signature) throw new CRPCError({ code: "BAD_REQUEST" });

      const body = await c.req.text();
      await ctx.runMutation(internal.stripe.process, { body, signature });

      return c.text("OK", 200);
    });

  // Redirect
  export const redirect = publicRoute
    .get("/api/old-path")
    .query(async ({ c }) => c.redirect("/api/new-path", 301));
  ```

## 0.2.1

### Patch Changes

- [#24](https://github.com/udecode/kitcn/pull/24) [`b5555ea`](https://github.com/udecode/kitcn/commit/b5555eac9e67ef06328f5e122ce2d4512f3b3c7f) Thanks [@zbeyens](https://github.com/zbeyens)! - - Fix (`UNAUTHORIZED`) queries failing after switching tabs and returning to the app. The auth token is now preserved during session refetch instead of being cleared.
  - Fix (`UNAUTHORIZED`) `useSuspenseQuery` failing on initial page load when auth is still loading. WebSocket subscriptions now wait for auth to settle before connecting.
  - Fix logout setting `isAuthenticated: false` before unsubscribing to prevent query re-subscriptions.
  - Add missing `dotenv` dependency for CLI.

## 0.2.0

### Minor Changes

- [#22](https://github.com/udecode/kitcn/pull/22) [`27d355e`](https://github.com/udecode/kitcn/commit/27d355e4ac067503e00bf534164c6ce2974a8a46) Thanks [@zbeyens](https://github.com/zbeyens)! - **BREAKING:** Refactored `createCRPCContext` and `createServerCRPCProxy` to use options object:

  Before:

  ```ts
  createCRPCContext(api, meta);
  createServerCRPCProxy(api, meta);
  ```

  After:

  ```ts
  createCRPCContext<Api>({ api, meta, convexSiteUrl });
  createServerCRPCProxy<Api>({ api, meta });
  ```

  **BREAKING:** `getServerQueryClientOptions` now requires `convexSiteUrl`:

  ```ts
  getServerQueryClientOptions({
    getToken: caller.getToken,
    convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  });
  ```

  **Feature:** Added type-safe HTTP routes with tRPC-style client:

  ```ts
  // 1. Pass httpAction to initCRPC.create()
  const c = initCRPC.dataModel<DataModel>().create({
    query, mutation, action, httpAction,
  });
  export const publicRoute = c.httpAction;
  export const authRoute = c.httpAction.use(authMiddleware);
  export const router = c.router;

  // 2. Define routes with .get()/.post()/.patch()/.delete()
  export const health = publicRoute
    .get('/api/health')
    .output(z.object({ status: z.string() }))
    .query(async () => ({ status: 'ok' }));

  // 3. Use .params(), .searchParams(), .input() for typed inputs
  export const todosRouter = router({
    list: publicRoute.get('/api/todos')
      .searchParams(z.object({ limit: z.coerce.number().optional() }))
      .query(...),
    get: publicRoute.get('/api/todos/:id')
      .params(z.object({ id: zid('todos') }))
      .query(...),
    create: authRoute.post('/api/todos')
      .input(z.object({ title: z.string() }))
      .mutation(...),
  });

  // 4. Register with CORS
  registerCRPCRoutes(http, appRouter, {
    httpAction,
    cors: { allowedOrigins: [process.env.SITE_URL!], allowCredentials: true },
  });

  // 5. Add to Api type for inference
  export type Api = WithHttpRouter<typeof api, typeof appRouter>;

  // 6. Client: TanStack Query integration via crpc.http.*
  const crpc = useCRPC();
  useSuspenseQuery(crpc.http.todos.list.queryOptions({ limit: 10 }));
  useMutation(crpc.http.todos.create.mutationOptions());
  queryClient.invalidateQueries(crpc.http.todos.list.queryFilter());

  // 7. RSC: prefetch helper
  prefetch(crpc.http.health.queryOptions({}));
  ```

  **Fix:** Improved authentication in `ConvexAuthProvider`:

  - **FetchAccessTokenContext**: New context passes `fetchAccessToken` through React tree - eliminates race conditions where token wasn't available during render
  - **Token Expiration Tracking**: Added `expiresAt` field with `decodeJwtExp()` - 60s cache leeway prevents unnecessary token refreshes
  - **SSR Hydration Fix**: Defensive `isLoading` check prevents UNAUTHORIZED errors when Better Auth briefly returns null during hydration
  - **Removed HMR persistence**: No more globalThis Symbol storage (`getPersistedToken`/`persistToken`)
  - **Simplified AuthStore**: Removed `guard` method and `AuthEffect` - state synced via `useConvexAuth()` directly

## 0.1.0

### Minor Changes

- [#18](https://github.com/udecode/kitcn/pull/18) [`681e9ba`](https://github.com/udecode/kitcn/commit/681e9bafdeaa62928f15fe9781f944d42ce2d2b4) Thanks [@zbeyens](https://github.com/zbeyens)! - Initial release
