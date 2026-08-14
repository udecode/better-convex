---
"kitcn": minor
---

## Breaking changes

- Split the configured budget evenly across `shards` instead of giving every
  shard the full budget. A limiter with `shards: S` previously allowed `S` times
  its configured limit, so existing sharded configs now enforce the limit you
  wrote. Builders throw when `limit / shards` (or `maxTokens / shards`) drops
  below `1`, because a shard holding less than one token can never grant a
  request.

  ```ts
  // Before: 5 per minute per shard, so 20 per minute in total
  Ratelimit.fixedWindow(5, '1 m', { shards: 4 });

  // After: 20 per minute in total, spread over 4 shards
  Ratelimit.fixedWindow(20, '1 m', { shards: 4 });
  ```

- Evaluate the requested `count` / `rate` in `check()` against the tokens already
  spent. It previously evaluated nothing and returned `success: true` for every
  caller, so a pre-flight gate now reports `success: false` where it always said
  "allowed".

  ```ts
  // Before: always true, even for an exhausted identifier
  const gate = await limiter.check(userId, { count: 5 });

  // After: matches what limit() would decide, without consuming tokens
  const gate = await limiter.check(userId, { count: 5 });
  if (!gate.success) return { retryAt: gate.reset };
  ```

## Features

- Add `snapshotToState` to convert a `getValue()` snapshot into the state shape
  `calculateRatelimit()` expects.
- Add `remainingRaw` to `calculateRatelimit()` results for the exact token
  balance, including the negative value when a request overdraws.

## Patches

- Fix `getRemaining()` inverting sliding-window quotas. An identifier with no
  traffic reported `remaining: 0`, and quota banners or `X-RateLimit-Remaining`
  headers showed the opposite of the truth.
- Fix `resetUsedTokens()` leaving an identifier blocked by the ephemeral cache,
  so an admin quota reset silently failed for the rest of the window.
- Improve shard selection to compare exact token balances, so sharded limiters
  spread load onto the emptier shard instead of tying on rounded counts.
