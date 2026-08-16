---
"kitcn": patch
---

## Patches

- Fix auth-bound queries being reset every time Convex refreshes the access
  token. Convex rotates the token roughly every 15 minutes and on every socket
  reauth, and each mint carried a new timestamp, so the whole page flashed back
  to its loading state and every query ran twice against the backend. Queries now
  keep their data and their live subscriptions across a refresh, and still reset
  on a real identity change — sign in, sign out, session rotation, or an
  organization/role switch.
- Fix `fetchNextPage` from `useInfiniteQuery` getting a new identity on every
  render, which re-registered any effect keyed on it — including the
  infinite-scroll observer pattern the docs recommend. It is now stable for the
  life of the hook.
- Improve `useInfiniteQuery` to reuse its page queries and aggregation across
  unrelated re-renders, instead of re-hashing arguments once per loaded page and
  re-scanning every loaded item.
- Improve `queryOptions()` to keep its result referentially stable when nothing
  changed, including the two-argument form with inline options.
- Fix query options losing referential stability entirely on pages that hold more
  than 500 distinct sets of query arguments.
- Improve `useCRPC()` and `useCRPCClient()` to return the same value across
  renders, so they are safe to place in a dependency array.
- Improve real-time updates to skip a redundant query-key hash per pushed query.
