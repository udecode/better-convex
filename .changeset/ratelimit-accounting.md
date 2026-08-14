---
"kitcn": minor
---

## Breaking changes

- Deal the configured budget across `shards` instead of giving every shard the
  full budget. A limiter with `shards: S` previously allowed `S` times its
  configured limit, so existing sharded configs now enforce the limit you wrote.
  Shares are whole tokens that add back up to the configured total, so
  `fixedWindow(5, '1 m', { shards: 2 })` deals `3` and `2` and still grants five
  requests. Whole-token `maxReserved` headroom is dealt the same way, so a
  configured reservation is not stranded as fractional shares. Builders throw
  when `limit / shards` (or `capacity / shards`, or
  `maxTokens / shards`) drops below `1`, because a shard holding less than one
  token can never grant a request. `setDynamicLimit()` rejects an override that
  fails the same rule instead of denying every later request.

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
- Key the ephemeral block cache per shard. One exhausted shard used to block the
  identifier outright, stranding every other shard's tokens until the window
  reset and enforcing well under the configured limit.
- Sum every shard in `getRemaining()` rather than extrapolating the fullest one.
  A half-drained sharded limiter reported its full budget as still available.
- Improve shard selection to compare exact token balances, so sharded limiters
  spread load onto the emptier shard instead of tying on rounded counts.
- Retry the remaining shards when the preferred candidates are exhausted, so
  routing cannot deny a request while another shard can still serve it.
- Preserve whole-request capacity for fractional budgets by dealing the whole
  portion and keeping the fractional remainder on one shard.
- Scale fixed-window snapshots and response balances by `capacity` rather than
  the refill `limit`, so burst configurations report valid remaining tokens.
- Scope ephemeral blocks by shard, requested count, and reservation mode, so a
  failed large or ordinary request does not hide tokens from a smaller or
  reserved request, and include cached shards when reporting the earliest
  global retry time.
- Compute reserved-request retry times against `maxReserved` headroom rather
  than the non-reserved zero-debt threshold.
- Evaluate sampled shard states at one common read timestamp and avoid refilling
  their aggregated snapshot again in `getRemaining()`.
