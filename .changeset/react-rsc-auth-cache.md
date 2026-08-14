---
"kitcn": patch
---

## Patches

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
