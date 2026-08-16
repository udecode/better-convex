---
"kitcn": minor
---

## Breaking changes

- Support a function-form `enabled` in `kitcn/solid` instead of discarding it. A
  predicate gates both the fetch and the Convex subscription, so a query you
  disabled that way stops fetching and stops holding a live subscription.

```tsx
const posts = useQuery(() =>
  crpc.posts.list.queryOptions({ tag }, { enabled: () => false })
);

// Before — fetched, and held a live subscription for the page lifetime
// After  — disabled: no fetch, no subscription
```

- Fix `kitcn/solid` action queries on an `auth: 'required'` function reaching the
  server while unauthenticated. They fail with
  `CRPCClientError({ code: 'UNAUTHORIZED' })` and call `onQueryUnauthorized`
  before any request is sent, matching queries and the React bindings.

```tsx
const report = useQuery(() => crpc.ai.summarize.queryOptions({}));

// Before — an unauthenticated call reached Convex and returned a raw error
// After  — CRPCClientError({ code: 'UNAUTHORIZED' }), no request sent
```

- Drop every auth-bound query from the cache when signing in, signing up, or
  signing out with `kitcn/solid`.

```tsx
await signIn.mutateAsync({ email, password });
const todos = useQuery(() => crpc.todos.list.queryOptions({}));

// Before — todos.data was the previous account's rows, reported as success
// After  — todos is pending, then resolves with the new account's rows
```

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
- Fix an account transition leaving the previous account's rows in queries the
  new account never refetches. Signing in or out clears auth-bound entries
  outright, so a query that is disabled, unobserved, or non-subscribed cannot
  keep serving them, and one that is mounted reads as pending until the new
  account's data arrives.
- Fix a paginated list restoring the previous account's cursors after signing
  in or out. An auth-bound list starts again from its first page instead of
  paging from cursors that point into another account's results.
- Fix an auth-bound query refetching everything on every scheduled token
  refresh. A refreshed JWT for the same account leaves the cache alone; only an
  actual account change clears it.
