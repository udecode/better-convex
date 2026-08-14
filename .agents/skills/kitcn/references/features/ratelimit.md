# Ratelimit Reference

Runtime accounting for the ratelimit plugin. Prerequisites: `setup/server.md` (scaffold, buckets, `ratelimit.middleware()`).

The API mirrors Upstash Ratelimit (`limit`, `check`, `getRemaining`, `resetUsedTokens`, `blockUntilReady`). This file covers only where kitcn's behavior is load-bearing or differs.

## Algorithms

```ts
import { MINUTE, Ratelimit } from 'kitcn/ratelimit';

Ratelimit.fixedWindow(limit, window, options?);            // limit tokens per window
Ratelimit.slidingWindow(limit, window, options?);          // weighted across window boundary
Ratelimit.tokenBucket(refillRate, interval, maxTokens, options?);
```

`options`: `shards`, `maxReserved`, `capacity` (fixedWindow only), `start` (fixedWindow only).

`capacity` is the stored ceiling, `limit` is the per-window refill. Set `capacity > limit` for burst headroom.

## Sharding — delta from parity

`shards > 1` distributes writes to cut contention. The configured budget is **dealt** across shards, never duplicated.

- Shares are whole tokens that sum to the configured budget, with the remainder going to the low-numbered shards. `fixedWindow(5, '1 m', { shards: 2 })` deals `3` and `2`, and enforces exactly 5/min.
- Fractional totals deal their whole portion first and retain the fraction on one shard, so whole requests are not stranded.
- Whole-token `maxReserved` headroom is dealt the same way, so configured reservations remain usable under sharding.
- `tokenBucket` deals `maxTokens` but splits `refillRate` evenly — a bucket refills continuously, so a fractional rate still accumulates.
- One call spends from one shard, so `count` can never exceed that shard's share. Aim for a share of ten or more times your largest `count`.
- Builders **throw** when `limit / shards`, `capacity / shards`, or `maxTokens / shards` drops below `1`. `setDynamicLimit()` throws on the same rule instead of silently denying every request.
- The ephemeral block cache is keyed per shard, requested count, and reservation mode, so an exhausted shard never blocks peers and a failed large or ordinary request never blocks a smaller or reserved one.
- Preferred shards are tried first; if none can serve the request, the limiter retries the remaining shards before denying it.
- Failure `reset` is the earliest retry across both cached and freshly evaluated shards.

Default to `shards: 1`. Raise it only after observing write contention on hot identifiers.

## Reads

| Call | Shards read | Accuracy |
| --- | --- | --- |
| `getRemaining(id)` | all | exact at one common read timestamp |
| `getValue(id, { sampleShards })` | `sampleShards` (default 1) | estimate, scaled up by the sampled share |
| `limit()` / `check()` → `remaining` | the serving shard | estimate under `shards > 1` |

Use `getRemaining()` for quota headers and banners. Use `getValue()` for the React hook and custom projections where a cheap read matters more than exactness.

Fixed-window projections scale by stored `capacity`; the response `limit` remains the configured per-window refill.
`getRemaining()` evaluates every raw shard at one common timestamp and sums each shard's independently usable whole tokens. It never lets a full shard absorb another shard's refill, nets reserved debt against an open peer, or combines unusable fractions across isolated shards.

## `check()` vs `limit()`

`check()` runs the same evaluation as `limit()` for the requested `count` / `rate` and never writes. A `check()` that returns `success: true` is what `limit()` would decide at that moment.

```ts
const gate = await limiter.check(userId, { count: 5 });
if (!gate.success) return { retryAt: gate.reset };
```

## Snapshots

`getValue()` returns tokens **left**; `calculateRatelimit()` takes stored **state**. Sliding windows store the used count, so the two differ. Always convert:

```ts
import { calculateRatelimit, snapshotToState } from 'kitcn/ratelimit';

const snapshot = await limiter.getValue('user_123');
const result = calculateRatelimit(
  snapshotToState(snapshot),
  snapshot.config,
  Date.now(),
  1
);
```

`result.remaining` is floored to `0`. `result.remainingRaw` is exact and goes negative when the request overdraws — use it to rank shards or size a backoff.

`RatelimitSnapshot.shard` is the sampled shard holding the most tokens, not "the" shard.
`RatelimitSnapshot.state` is the projected aggregate state. It retains sliding-window `value`, `auxValue`, `ts`, and `auxTs`, so `snapshotToState()` preserves decay across later window boundaries.

For denied reserved fixed-window and token-bucket requests, `reset` is when the request fits within `maxReserved`, not when all debt reaches zero.

## Convex constraints

- `blockUntilReady()` needs `setTimeout`, so it only runs in actions or non-Convex runtimes. It throws with that guidance inside queries and mutations. `limit()` and `check()` never touch timers.
- `limit()`, `resetUsedTokens()`, and `setDynamicLimit()` write state, so they need a mutation `ctx.db`. `check()`, `getValue()`, `getRemaining()`, and `getDynamicLimit()` are read-only and work from a query reader.
- Missing tables throw actionable setup guidance — run `bunx kitcn add ratelimit` and register `ratelimitExtension()`.

## Failure modes

| Option | Effect |
| --- | --- |
| `failureMode: 'closed'` (default) | a timeout denies the request, `reason: 'timeout'` |
| `failureMode: 'open'` | a timeout allows the request, `success: true` with `reason: 'timeout'` |

`reason` is `'timeout' \| 'cacheBlock' \| 'denyList'`. `success: true` with `reason: 'timeout'` is reachable only under `failureMode: 'open'` — do not treat `reason` as proof of denial.

## Dynamic limits

Requires `dynamicLimits: true` in the constructor, otherwise `setDynamicLimit()` / `getDynamicLimit()` throw. The override replaces `limit` (or `refillRate`) at read time and is rejected when the shard split cannot serve it.

```ts
await limiter.setDynamicLimit({ limit: 20 }); // false clears the override
```
