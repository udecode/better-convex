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
  validateMaxReserved(options?.maxReserved);

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
  validateMaxReserved(options?.maxReserved);

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
  validateMaxReserved(options?.maxReserved);

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
  if (dynamicLimit === null) {
    return algorithm;
  }
  validatePositive(dynamicLimit, 'dynamicLimit');

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
  // Reservation headroom is spent as debt, so whole tokens must stay whole.
  // Otherwise maxReserved: 1 over two shards becomes two unusable 0.5 shares.
  const maxReserved =
    algorithm.maxReserved === undefined
      ? undefined
      : share(algorithm.maxReserved);

  if (algorithm.kind === 'tokenBucket') {
    const maxTokens = share(algorithm.maxTokens);
    return {
      ...algorithm,
      // Match refill ownership to capacity ownership. An even rate split clips
      // tokens on smaller buckets when capacities are dealt unevenly.
      refillRate: algorithm.refillRate * (maxTokens / algorithm.maxTokens),
      maxTokens,
      maxReserved,
      shards: 1,
    };
  }

  if (algorithm.kind === 'fixedWindow') {
    return {
      ...algorithm,
      limit: share(algorithm.limit),
      capacity: share(algorithm.capacity),
      maxReserved,
      shards: 1,
    };
  }

  return {
    ...algorithm,
    limit: share(algorithm.limit),
    maxReserved,
    shards: 1,
  };
}

/** Tokens a shard-level config may spend, ignoring the per-window refill. */
export function algorithmBudget(algorithm: ResolvedAlgorithm): number {
  return algorithm.kind === 'tokenBucket'
    ? algorithm.maxTokens
    : algorithm.limit;
}

/** Tokens the algorithm can hold, including fixed-window burst capacity. */
export function algorithmCapacity(algorithm: ResolvedAlgorithm): number {
  if (algorithm.kind === 'fixedWindow') {
    return algorithm.capacity;
  }
  return algorithmBudget(algorithm);
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
  const whole = Math.floor(total);
  const fractional = total - whole;
  const wholeShare =
    Math.floor(whole / shards) + (shard < whole % shards ? 1 : 0);
  return wholeShare + (shard === 0 ? fractional : 0);
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

function validateMaxReserved(value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error('maxReserved must be a non-negative finite number');
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
