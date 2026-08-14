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
  const shards = normalizeShards(options?.shards);
  validateShardBudget(limit, 'limit', shards);
  const capacity = options?.capacity ?? limit;
  validatePositive(capacity, 'capacity');

  return {
    kind: 'fixedWindow',
    limit,
    window: toMs(window),
    capacity,
    maxReserved: options?.maxReserved,
    start: options?.start,
    shards,
  };
}

export function slidingWindow(
  limit: number,
  window: Duration,
  options?: AlgorithmOptions
): SlidingWindowAlgorithm {
  validatePositive(limit, 'limit');
  const shards = normalizeShards(options?.shards);
  validateShardBudget(limit, 'limit', shards);

  return {
    kind: 'slidingWindow',
    limit,
    window: toMs(window),
    maxReserved: options?.maxReserved,
    shards,
  };
}

export function tokenBucket(
  refillRate: number,
  interval: Duration,
  maxTokens: number,
  options?: AlgorithmOptions
): TokenBucketAlgorithm {
  validatePositive(refillRate, 'refillRate');
  validatePositive(maxTokens, 'maxTokens');
  const shards = normalizeShards(options?.shards);
  validateShardBudget(maxTokens, 'maxTokens', shards);

  return {
    kind: 'tokenBucket',
    refillRate,
    interval: toMs(interval),
    maxTokens,
    maxReserved: options?.maxReserved,
    shards,
  };
}

export function applyDynamicLimit(
  algorithm: ResolvedAlgorithm,
  dynamicLimit: number | null
): ResolvedAlgorithm {
  if (!dynamicLimit || dynamicLimit <= 0) {
    return algorithm;
  }

  if (algorithm.kind === 'tokenBucket') {
    return {
      ...algorithm,
      refillRate: dynamicLimit,
      maxTokens:
        algorithm.maxTokens === algorithm.refillRate
          ? dynamicLimit
          : algorithm.maxTokens,
    };
  }

  if (algorithm.kind === 'fixedWindow') {
    return {
      ...algorithm,
      limit: dynamicLimit,
      capacity:
        algorithm.capacity === algorithm.limit
          ? dynamicLimit
          : algorithm.capacity,
    };
  }

  return {
    ...algorithm,
    limit: dynamicLimit,
  };
}

/**
 * Split the configured budget evenly across shards.
 *
 * Every shard stores its own row, so each one may only spend `budget / shards`.
 * Without this the effective limit would be multiplied by the shard count.
 */
export function shardAlgorithm(
  algorithm: ResolvedAlgorithm
): ResolvedAlgorithm {
  const { shards } = algorithm;
  if (shards <= 1) {
    return algorithm;
  }

  const maxReserved =
    algorithm.maxReserved === undefined
      ? undefined
      : algorithm.maxReserved / shards;

  if (algorithm.kind === 'tokenBucket') {
    return {
      ...algorithm,
      refillRate: algorithm.refillRate / shards,
      maxTokens: algorithm.maxTokens / shards,
      maxReserved,
    };
  }

  if (algorithm.kind === 'fixedWindow') {
    return {
      ...algorithm,
      limit: algorithm.limit / shards,
      capacity: algorithm.capacity / shards,
      maxReserved,
    };
  }

  return {
    ...algorithm,
    limit: algorithm.limit / shards,
    maxReserved,
  };
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
 * Each shard may only spend `budget / shards`, so a shard holding less than one
 * token can never grant a request. Reject that at construction time instead of
 * denying every request at runtime.
 */
function validateShardBudget(
  value: number,
  field: string,
  shards: number
): void {
  if (value / shards < 1) {
    throw new Error(
      `${field} (${value}) must be at least shards (${shards}). Each shard holds ${field} / shards tokens, so every request would be denied. Lower shards or raise ${field}.`
    );
  }
}
