---
"kitcn": minor
---

## Breaking changes

- Require `api` on `convexBetterAuthReactStart`, which now returns `createCaller`
  and `createContext` alongside the auth helpers.

```ts
// Before
export const { handler, getToken } = convexBetterAuthReactStart({
  convexUrl: import.meta.env.VITE_CONVEX_URL!,
  convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL!,
});

// After
export const { handler, getToken, createCaller, createContext } =
  convexBetterAuthReactStart({
    api,
    convexUrl: import.meta.env.VITE_CONVEX_URL!,
    convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL!,
  });
```

- Drop `runServerCall` from the TanStack Start scaffold. Call procedures on a
  caller bound once with `createCaller()`.

```ts
// Before
export function runServerCall<T>(fn: (caller: ServerCaller) => Promise<T> | T) {
  const caller = createServerCaller();
  return fn(caller);
}
await runServerCall((caller) => caller.user.getSessionUser({}));

// After
export const caller = createCaller();
await caller.user.getSessionUser({});
```

- Move TanStack Start JWT caching under `auth.jwtCache`, a boolean.

```ts
// Before
convexBetterAuthReactStart({
  jwtCache: { enabled: true, isAuthError },
  // ...
});

// After
convexBetterAuthReactStart({
  auth: { jwtCache: true, isUnauthorized: isAuthError },
  // ...
});
```

## Patches

- Fetch the Convex auth token once per request on TanStack Start. Every
  procedure call, `getToken()`, and `fetchAuthQuery`/`fetchAuthMutation`/
  `fetchAuthAction` in a request now share one token, instead of each paying its
  own round trip.
- Stop replaying a rejected auth token for the rest of a request. After a
  refresh, the remaining calls sharing that context use the new token instead of
  re-failing and re-running non-idempotent mutations and actions.
- Refresh expired TanStack Start tokens instead of failing. Forced refresh and
  token freshness now reach the token layer, so a stale token retries once and a
  fresh one is no longer replayed on an authorization error.

Existing TanStack Start apps: re-run `kitcn add auth --overwrite` to update
`src/lib/convex/auth-server.ts` and `src/lib/convex/server.ts`.
