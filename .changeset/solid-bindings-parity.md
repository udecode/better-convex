---
"kitcn": minor
---

## Breaking changes

- Preserve function-form `enabled` predicates in `kitcn/solid` query options so
  they gate both requests and live subscriptions.
- Reject unauthenticated `auth: "required"` Solid action queries locally with
  `CRPCClientError`, matching the React bindings.
- Clear auth-bound cached data on identity transitions. Unobserved entries are
  removed; mounted entries return to pending and refetch for the new account.

## Patches

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
- Fix an account transition leaving the previous account's rows in disabled,
  unobserved, or non-subscribed queries.
- Fix a paginated list restoring the previous account's cursors after signing
  in or out. An auth-bound list starts again from its first page instead of
  paging from cursors that point into another account's results.
- Fix an auth-bound query refetching everything on every scheduled token
  refresh. A refreshed JWT for the same account leaves the cache alone; only an
  actual account change clears it.
