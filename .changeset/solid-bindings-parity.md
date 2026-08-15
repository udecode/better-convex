---
"kitcn": minor
---

## Breaking changes

- `kitcn/solid` honors a function-form `enabled` instead of discarding it. A
  predicate now gates both the fetch and the Convex subscription, so a query you
  disabled that way stops fetching and stops holding a live subscription.

```tsx
const posts = useQuery(() =>
  crpc.posts.list.queryOptions({ tag }, { enabled: () => false })
);

// Before — fetched, and held a live subscription for the page lifetime
// After  — disabled: no fetch, no subscription
```

- `kitcn/solid` action queries on an `auth: 'required'` function fail with
  `CRPCClientError({ code: 'UNAUTHORIZED' })` and call `onQueryUnauthorized`
  before reaching the server, matching queries and the React bindings.

```tsx
const report = useQuery(() => crpc.ai.summarize.queryOptions({}));

// Before — an unauthenticated call reached Convex and returned a raw error
// After  — CRPCClientError({ code: 'UNAUTHORIZED' }), no request sent
```

- Signing in, signing up, and signing out with `kitcn/solid` clear every
  auth-bound query from the cache.

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
