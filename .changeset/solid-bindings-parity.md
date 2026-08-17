---
"kitcn": minor
---

## Features

- Support stable identity values from custom Solid auth providers.

## Patches

- Fix function-form `enabled` predicates in `kitcn/solid` query options so
  they gate both requests and live subscriptions.
- Fix unauthenticated `auth: "required"` Solid action queries to reject locally with
  `CRPCClientError`, matching the React bindings.
- Fix auth-bound cached data crossing identity transitions. Unobserved entries are
  removed; mounted entries are rebuilt without their previous `initialData`,
  return to pending without prior-account placeholder data, and refetch for the
  new account.

- Fix `kitcn/solid` paginated lists on an `auth: 'required'` function never
  issuing a query. Auth state is tracked, so a list mounted before sign-in loads
  once auth settles instead of showing a permanent loading state, and logging
  out stops its page subscriptions.
- Fix `kitcn/solid` tearing down a Convex subscription that another mounted
  component still needs when two components share a query key and one passes
  `enabled: false`. The remaining component keeps receiving real-time updates.
- Fix `skipUnauth` being ignored by `kitcn/solid`. Queries marked
  `skipUnauth: true` resolve to `null` on an unauthorized result instead of
  sticking in an error state.
- Fix `kitcn/solid` re-authenticating Convex on every JWT write. Signing in
  authenticates once instead of three times, and a scheduled token refresh no
  longer pauses the socket and re-runs every live subscription.
- Fix `kitcn/solid` ignoring a `useAuth` that returns a new `fetchAccessToken`.
  Convex is rebound to the current fetcher instead of refreshing through the one
  captured for the previous session.
- Fix provider-driven identity transitions retaining the previous account's
  auth-bound cache or Convex binding. `ConvexProviderWithAuth` accepts an
  optional stable `identity`; providers that omit it retain the safe legacy
  behavior of rebinding on reactive auth changes. Replacing a Better Auth
  session also invalidates its cached JWT and abandons in-flight token requests
  owned by the previous session before authenticating the new one. SSR tokens
  remain hydration fallbacks only until a client session is confirmed and
  cannot seed that session's cache identity. The first settled client identity
  clears auth-bound hydration state when its ownership cannot be proven.
- Fix an account transition leaving the previous account's rows in disabled,
  unobserved, or non-subscribed queries.
- Fix a paginated list restoring the previous account's cursors after signing
  in or out. An auth-bound list starts again from its first page instead of
  paging from cursors that point into another account's results.
- Fix an auth-bound query refetching everything on every scheduled token
  refresh. A refreshed JWT for the same account leaves the cache alone; only an
  authorization identity change clears it, including tenant or role claims
  changing inside the same Better Auth session.
- Fix sign-in and sign-up mutations clearing auth-bound queries before Convex
  adopts the new identity. The provider clears previous-account data while the
  binding changes, holds mounted observers idle, then restores and refetches
  only after Convex reports the transition as settled. Sign-out follows the
  same provider-owned transition.
- Fix custom Solid Convex auth being replaced by the fallback Better Auth
  store. Query subscriptions follow the custom provider, settled identity and
  account epoch instead of remaining blocked or reusing another account's
  pagination state.
- Fix account transitions retaining obsolete pagination ID entries. Pagination
  state in the QueryClient remains the persistence owner without a second
  process-wide key map.
- Fix prefetched optional pagination queries fetching while authentication is
  loading. Hydrated data remains readable, but its observer stays disabled
  until the auth binding settles.
