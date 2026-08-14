import { type Duration, toMs } from '../duration';
import type {
  AlgorithmOptions,
  FixedWindowAlgorithm,
  ResolvedAlgorithm,
  SlidingWindowAlgorithm,
  TokenBucketAlgorithm,
} from '../types';

const DEFAULT_SHARDS = 1;

export function fixedWindow(
  limit: number,
  window: Duration,
  options?: AlgorithmOptions
): FixedWindowAlgorithm {
  validatePositive(limit, 'limit');
  const capacity = options?.capacity ?? limit;
  validatePositive(capacity, 'capacity');

  return assertShardBudget({
    kind: 'fixedWindow',
    limit,
    window: toMs(window),
    capacity,
    maxReserved: options?.maxReserved,
    start: options?.start,
    shards: normalizeShards(options?.shards),
  });
}

export function slidingWindow(
  limit: number,
  window: Duration,
  options?: AlgorithmOptions
): SlidingWindowAlgorithm {
  validatePositive(limit, 'limit');

  return assertShardBudget({
    kind: 'slidingWindow',
    limit,
    window: toMs(window),
    maxReserved: options?.maxReserved,
    shards: normalizeShards(options?.shards),
  });
}

export function tokenBucket(
  refillRate: number,
  interval: Duration,
  maxTokens: number,
  options?: AlgorithmOptions
): TokenBucketAlgorithm {
  validatePositive(refillRate, 'refillRate');
  validatePositive(maxTokens, 'maxTokens');

  return assertShardBudget({
    kind: 'tokenBucket',
    refillRate,
    interval: toMs(interval),
    maxTokens,
    maxReserved: options?.maxReserved,
    shards: normalizeShards(options?.shards),
  });
}

export function applyDynamicLimit(
  algorithm: ResolvedAlgorithm,
  dynamicLimit: number | null
): ResolvedAlgorithm {
  if (!dynamicLimit || dynamicLimit <= 0) {
    return algorithm;
  }

  if (algorithm.kind === 'tokenBucket') {
    return assertShardBudget({
      ...algorithm,
      refillRate: dynamicLimit,
      maxTokens:
        algorithm.maxTokens === algorithm.refillRate
          ? dynamicLimit
          : algorithm.maxTokens,
    });
  }

  if (algorithm.kind === 'fixedWindow') {
    return assertShardBudget({
      ...algorithm,
      limit: dynamicLimit,
      capacity:
        algorithm.capacity === algorithm.limit
          ? dynamicLimit
          : algorithm.capacity,
    });
  }

  return assertShardBudget({
    ...algorithm,
    limit: dynamicLimit,
  });
}

/**
 * Narrow the configured budget down to the slice one shard owns.
 *
 * Every shard stores its own row and spends only what it owns, so without this
 * the effective limit would be multiplied by the shard count. Shares are dealt
 * so they add back up to the configured budget exactly — see {@link shardShare}.
 */
export function shardAlgorithm(
  algorithm: ResolvedAlgorithm,
  shard: number
): ResolvedAlgorithm {
  const { shards } = algorithm;
  if (shards <= 1) {
    return algorithm;
  }

  const share = (value: number) => shardShare(value, shards, shard);
  // Reserved headroom is a threshold, not a counter, so it splits evenly and
  // never needs a whole token.
  const maxReserved =
    algorithm.maxReserved === undefined
      ? undefined
      : algorithm.maxReserved / shards;

  if (algorithm.kind === 'tokenBucket') {
    return {
      ...algorithm,
      // A bucket refills continuously, so a fraction of a token per interval
      // still accumulates. Dealing it would hand a shard a rate of zero.
      refillRate: algorithm.refillRate / shards,
      maxTokens: share(algorithm.maxTokens),
      maxReserved,
    };
  }

  if (algorithm.kind === 'fixedWindow') {
    return {
      ...algorithm,
      limit: share(algorithm.limit),
      capacity: share(algorithm.capacity),
      maxReserved,
    };
  }

  return {
    ...algorithm,
    limit: share(algorithm.limit),
    maxReserved,
  };
}

/** Tokens a shard-level config may spend, ignoring the per-window refill. */
export function algorithmBudget(algorithm: ResolvedAlgorithm): number {
  return algorithm.kind === 'tokenBucket'
    ? algorithm.maxTokens
    : algorithm.limit;
}

/**
 * Deal a whole-token budget across `shards` so the shares sum back to `total`.
 *
 * A plain `total / shards` strands the fractional part of every shard: a shard
 * holding `2.5` tokens only ever grants two whole requests and refills to `2.5`
 * again, so `limit: 5` over two shards would enforce `4` forever. Whole budgets
 * are dealt as `floor` plus one extra token to the first `total % shards` shards
 * instead. Fractional budgets have no whole-token floor to hit, so they keep the
 * even split.
 */
function shardShare(total: number, shards: number, shard: number): number {
  if (!Number.isInteger(total)) {
    return total / shards;
  }
  return Math.floor(total / shards) + (shard < total % shards ? 1 : 0);
}

function normalizeShards(shards: number | undefined): number {
  if (shards === undefined) return DEFAULT_SHARDS;
  const rounded = Math.round(shards);
  if (rounded < 1) {
    throw new Error('shards must be >= 1');
  }
  return rounded;
}

function validatePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
}

/**
 * Reject budgets that leave a shard with nothing to spend.
 *
 * Shares are dealt, so the smallest shard holds `floor(budget / shards)`. Once
 * that reaches zero the shard is dead weight: it absorbs writes it can never
 * grant, and the caller sees unexplained denials. Fail where the budget is
 * configured instead — including the runtime override, which rewrites the
 * budget after the builders ran.
 */
function assertShardBudget<T extends ResolvedAlgorithm>(algorithm: T): T {
  const { shards } = algorithm;

  if (algorithm.kind === 'tokenBucket') {
    validateShardBudget(algorithm.maxTokens, 'maxTokens', shards);
    return algorithm;
  }

  validateShardBudget(algorithm.limit, 'limit', shards);
  if (algorithm.kind === 'fixedWindow') {
    validateShardBudget(algorithm.capacity, 'capacity', shards);
  }
  return algorithm;
}

function validateShardBudget(
  value: number,
  field: string,
  shards: number
): void {
  if (value / shards < 1) {
    throw new Error(
      `${field} (${value}) must be at least shards (${shards}). Sharding deals ${field} across the shards, and a share below one token cannot serve a request. Lower shards or raise ${field}.`
    );
  }
}
