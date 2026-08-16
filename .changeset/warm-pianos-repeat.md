---
"kitcn": minor
---

## Breaking changes

- Resolve `getSignals` before `getIdentifier` in `RatelimitPlugin.configure` and
  pass its result in as `signals`. `getSignals` no longer receives `identifier`,
  and `getIdentifier` also receives `tier`.

```ts
// Before
getIdentifier: ({ user }: { user: RatelimitUser | null }) =>
  user?.id ?? 'anonymous',
getSignals: ({ ctx }: { ctx: RatelimitCtx }) => getRequestSignals(ctx),

// After
getSignals: ({ ctx }: { ctx: RatelimitCtx }) => getRequestSignals(ctx),
getIdentifier: ({
  user,
  signals,
}: {
  user: RatelimitUser | null;
  signals: LimitRequest | undefined;
}) => (user ? user.id : signals?.ip ? `ip:${signals.ip}` : 'ip:unknown'),
```

- Key anonymous rate-limit traffic by request IP instead of one shared
  identifier, so a single visitor can no longer spend every other visitor's
  budget or arm a 24 hour deny-list block against all of them. Run
  `kitcn add ratelimit --overwrite` to take the new plugin.
- Schedule cleanup of `ratelimitState` documents: per-IP keys write one document
  per visitor per bucket and tier, and nothing reaps them. A cron that deletes
  documents older than your longest window is enough.
- Store no-arg `crpc.http.*` entries under `['httpQuery', route, {}]` on both the
  client and the RSC server, so a server-prefetched route hydrates instead of
  refetching.
- Return the exact cache key from `crpc.http.*.queryKey()`, `{}` included, so
  `getQueryData` and `setQueryData` hit. Use `queryFilter()` to match every args
  variant of a route.

```ts
// Before
queryClient.getQueryData(['httpQuery', 'health', undefined]);
crpc.http.health.queryKey(); // ['httpQuery', 'health']

// After
queryClient.getQueryData(crpc.http.health.queryKey());
crpc.http.health.queryKey(); // ['httpQuery', 'health', {}]
```

- Narrow `HttpQueryKey` to that exact three-element key. The route-wide prefix
  `queryFilter()` builds is typed as `HttpQueryPrefixKey`.

## Features

- Add `timeout`, `dynamicLimits`, `denyList`, and `ephemeralCache` to
  `RatelimitPlugin.configure`. They reach the limiter instead of being dropped.

## Patches

- Fix `crpc.http.*` routes being fetched twice on first paint. `queryOptions`
  carries a 30 second `staleTime` shared with the RSC QueryClient, overridable
  per call, and `refetchOnMount` keeps its default so a route invalidated while
  unmounted still refetches.
- Fix the deny list blocking shared NAT and mobile-carrier IPs. Failures stop
  counting 10 minutes after the last one, while a caller that reaches
  `denyListThreshold` inside that window is still blocked for 24 hours.
- Fix deny-list memory growing without bound when callers forge `User-Agent`
  headers.
- Fix `ephemeralCache: false` being ignored while a limit is evaluated, which
  kept an in-memory block cache alive after you disabled it.
