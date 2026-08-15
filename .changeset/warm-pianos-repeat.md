---
"kitcn": minor
---

## Breaking changes

- `RatelimitPlugin.configure` resolves `getSignals` once per request, before
  `getIdentifier`, and passes the result into it. `getSignals` no longer receives
  `identifier`; `getIdentifier` now receives `tier` and `signals`. Key
  unauthenticated traffic by `signals.ip` — a constant identifier gives every
  anonymous visitor in the deployment one shared budget and one `ratelimitState`
  document, and repeated denials arm a 24 h deny-list block against that
  constant.

```ts
// Before
getIdentifier: ({ user }: { user: RatelimitUser | null }) =>
  user?.id ?? 'anonymous',
getSignals: ({ ctx }: { ctx: RatelimitCtx }) => getRequestSignals(ctx),

// After
function getRequestIdentifier(
  user: RatelimitUser | null,
  signals: LimitRequest | undefined
) {
  if (user) return user.id;
  return signals?.ip ? `ip:${signals.ip}` : 'ip:unknown';
}

getSignals: ({ ctx }: { ctx: RatelimitCtx }) => getRequestSignals(ctx),
getIdentifier: ({
  user,
  signals,
}: {
  user: RatelimitUser | null;
  signals: LimitRequest | undefined;
}) => getRequestIdentifier(user, signals),
```

  `kitcn add ratelimit` emits the new shape. Existing apps update
  `convex/lib/plugins/ratelimit/plugin.ts` by hand. Per-IP keys create one
  `ratelimitState` row per visitor per `bucket:tier` and nothing deletes them —
  schedule a cron reaping rows older than your longest window.

- A no-arg `crpc.http.*.queryOptions()` emits `['httpQuery', route, {}]` on both
  the client and the RSC server, so the two hash alike and a prefetched entry
  hydrates. Hand-written cache access keyed on `undefined` must move to
  `queryKey()`.

```ts
// Before
queryClient.getQueryData(['httpQuery', 'health', undefined]);

// After
queryClient.getQueryData(crpc.http.health.queryKey());
```

## Features

- Pass `timeout`, `dynamicLimits`, `denyList`, and `ephemeralCache` to
  `RatelimitPlugin.configure`. They forward to the limiter instead of being
  dropped.

## Patches

- Fix `crpc.http.*` routes being fetched twice on first paint: `queryOptions`
  now carries a 30 second `staleTime`, shared with the RSC QueryClient, so
  server-prefetched data is used instead of refetched on mount. Override it per
  call. `refetchOnMount` keeps its default, so a route invalidated while
  unmounted still refetches.
- Fix the deny list blocking shared NAT and mobile-carrier IPs. Failures now
  count within a rolling 10 minute window instead of accumulating for the life
  of the process, so paced failures decay. A caller that reaches
  `denyListThreshold` inside the window is still blocked for 24 hours.
- Bound deny-list memory: at most 4096 tracked values per prefix with
  least-recently-hit eviction, and values over 128 characters stored truncated,
  so forged `User-Agent` headers cannot grow it without limit.
