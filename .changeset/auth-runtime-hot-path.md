---
"kitcn": minor
---

## Breaking changes

- `createClient` now takes a `getBetterAuthSchema` thunk and its `adapter(ctx)`
  takes only the context. The Better Auth table schema is derived once for the
  isolate and shared, instead of every adapter re-deriving it. `dbAdapter` drops
  its options-getter argument for the same reason.

```ts
// Before
const authClient = createClient({ authFunctions, schema });
const database = authClient.adapter(ctx, getAuthOptions);

// After
const authClient = createClient({ authFunctions, getBetterAuthSchema, schema });
const database = authClient.adapter(ctx);
```

## Patches

- Improve authenticated request latency: `getAuth(ctx)` evaluates your
  `defineAuth` callback once per request instead of twice.
- Improve `admin.listUsers` and other counted reads: totals no longer hold every
  matching row in memory while paginating.
- Improve Better Auth record updates: an update is one Convex call that reads
  the row once, instead of a separate pre-check call that read it again. The
  "expected exactly 1 match" error now comes from the write itself, so it can no
  longer be invalidated by a concurrent insert or delete.
- Improve auth request CPU: the Convex auth plugin reuses its OIDC provider, and
  unique-field lookups no longer rescan the auth schema on every read and write.
- Fix session recovery from a persisted token issuing a fixed 250ms delay plus
  up to ten `/get-session` requests. A live token is recovered with one immediate
  request, a server-confirmed missing session stops after one, and only transport
  failures retry.
- Fix a dropped `/get-session` request signing the user out. Transport failures
  retry with backoff for the rest of the session-sync grace window, so a session
  is restored in the same mount once connectivity returns.
- Fix an outage during session recovery leaving the app stuck on `isLoading`.
  When the grace window closes with no answer, auth resolves to unauthenticated
  instead of holding a token no request ever confirmed. The persisted token is
  kept so the next mount can retry it.
