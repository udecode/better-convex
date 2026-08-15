---
"kitcn": minor
---

## Breaking changes

- Enforce the configured total budget across all `shards`.

  ```ts
  // 20 per minute in total, spread over 4 shards
  Ratelimit.fixedWindow(20, '1 m', { shards: 4 });
  ```

- Preserve configured `maxReserved` headroom across sharded limiters.
- Reject limiter budgets that leave any shard with less than one usable token.
- Reject non-positive, non-finite, or unservable dynamic limit overrides.

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
  `calculateRatelimit()` expects. Snapshots retain the full projected state,
  including sliding-window current and previous counts, so later projections
  preserve boundary decay.
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
- Prune expired ephemeral block variants when recording a new block.
- Allocate token-bucket refill rates in proportion to shard capacity, preserving
  the full configured refill when capacity shares are uneven.
- Compute reserved-request retry times against `maxReserved` headroom rather
  than the non-reserved zero-debt threshold.
- Evaluate sampled shard states at one common read timestamp, avoid refilling
  their aggregate again, and sum each shard's independently usable whole tokens
  in `getRemaining()` without netting debt or fractions across isolated shards.
- Preserve sampled per-shard state in snapshots so all-shard projections retain
  independent capacity saturation and sliding-window decay.
- Read each candidate shard set concurrently, including exhaustion fallbacks.
- Reject requests that exceed every shard's capacity and reservation headroom
  with `reason: "requestTooLarge"` and no retry deadline or shard reads.
- Exclude permanently undersized shards from retry deadlines and invalidate
  local snapshot and block-decision caches when dynamic limits change.
- Preserve permanent oversized denials through all-shard snapshots and React
  projections without scheduling an infinite retry timer.
- Apply per-shard capacity guards to partial snapshots while retaining uncapped
  reservation headroom when `maxReserved` is omitted.
- Reject negative, non-finite `maxReserved` values before sharding or retry
  calculation.
