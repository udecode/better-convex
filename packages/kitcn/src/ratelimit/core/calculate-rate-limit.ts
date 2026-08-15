import type {
  FixedWindowAlgorithm,
  RatelimitSnapshot,
  RatelimitState,
  ResolvedAlgorithm,
  SlidingWindowAlgorithm,
  TokenBucketAlgorithm,
} from '../types';
import { algorithmBudget, shardAlgorithm } from './algorithms';

export type EvaluationResult = {
  state: RatelimitState;
  retryAfter?: number;
  /** Tokens left after this request, floored to `0`. */
  remaining: number;
  /** Exact tokens left after this request. Negative when the request overdraws. */
  remainingRaw: number;
  reset: number;
  limit: number;
};

export function calculateRatelimit(
  state: RatelimitState | null,
  algorithm: ResolvedAlgorithm,
  now: number,
  count: number
): EvaluationResult {
  const shardStates = state?.shards;
  if (algorithm.shards > 1 && shardStates?.length === algorithm.shards) {
    return calculateShardedRatelimit(shardStates, algorithm, now, count);
  }

  if (algorithm.kind === 'fixedWindow') {
    return calculateFixedWindow(state, algorithm, now, count);
  }
  if (algorithm.kind === 'tokenBucket') {
    return calculateTokenBucket(state, algorithm, now, count);
  }
  return calculateSlidingWindow(state, algorithm, now, count);
}

function calculateShardedRatelimit(
  shardStates: NonNullable<RatelimitState['shards']>,
  algorithm: ResolvedAlgorithm,
  now: number,
  count: number
): EvaluationResult {
  const candidates = shardStates.map(({ shard, state: shardState }) => {
    const perShard = shardAlgorithm(algorithm, shard);
    return {
      baseline: calculateRatelimit(shardState, perShard, now, 0),
      requested: calculateRatelimit(shardState, perShard, now, count),
      shard,
    };
  });
  const successful =
    count === 0
      ? candidates
      : candidates.filter(
          (candidate) => candidate.requested.retryAfter === undefined
        );
  const selected = [...successful].sort(
    (a, b) => b.requested.remainingRaw - a.requested.remainingRaw
  )[0];
  const projected = candidates.map((candidate) => ({
    evaluated:
      count !== 0 && candidate.shard === selected?.shard
        ? candidate.requested
        : candidate.baseline,
    shard: candidate.shard,
  }));
  const retryValues = candidates.flatMap((candidate) =>
    candidate.requested.retryAfter === undefined
      ? []
      : [candidate.requested.retryAfter]
  );
  const retryAfter = selected ? undefined : Math.min(...retryValues);
  const remaining = selected
    ? projected.reduce(
        (total, candidate) => total + candidate.evaluated.remaining,
        0
      )
    : 0;
  const remainingRaw = selected
    ? projected.reduce(
        (total, candidate) =>
          total + Math.max(0, candidate.evaluated.remainingRaw),
        0
      )
    : Math.max(
        ...candidates.map((candidate) => candidate.requested.remainingRaw)
      );
  const auxTimestamps = projected.flatMap((candidate) =>
    candidate.evaluated.state.auxTs === undefined
      ? []
      : [candidate.evaluated.state.auxTs]
  );

  return {
    state: {
      value:
        selected || count === 0
          ? projected.reduce(
              (total, candidate) => total + candidate.evaluated.state.value,
              0
            )
          : remainingRaw,
      ts: Math.max(
        ...projected.map((candidate) => candidate.evaluated.state.ts)
      ),
      ...(auxTimestamps.length > 0
        ? {
            auxValue: projected.reduce(
              (total, candidate) =>
                total + (candidate.evaluated.state.auxValue ?? 0),
              0
            ),
            auxTs: Math.max(...auxTimestamps),
          }
        : {}),
      shards: projected.map(({ evaluated, shard }) => ({
        shard,
        state: {
          value: evaluated.state.value,
          ts: evaluated.state.ts,
          auxValue: evaluated.state.auxValue,
          auxTs: evaluated.state.auxTs,
        },
      })),
    },
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    remaining,
    remainingRaw,
    reset: Math.min(
      ...candidates.map((candidate) => candidate.requested.reset)
    ),
    limit: algorithmBudget(algorithm),
  };
}

function calculateTokenBucket(
  state: RatelimitState | null,
  config: TokenBucketAlgorithm,
  now: number,
  count: number
): EvaluationResult {
  const ratePerMs = config.refillRate / config.interval;
  const initial = state ?? { value: config.maxTokens, ts: now };
  const elapsed = Math.max(0, now - initial.ts);
  const available = Math.min(
    initial.value + elapsed * ratePerMs,
    config.maxTokens
  );
  const nextValue = available - count;
  const retryAfter =
    nextValue < 0 ? Math.ceil(-nextValue / ratePerMs) : undefined;

  return {
    state: { value: nextValue, ts: now },
    retryAfter,
    remaining: Math.max(0, Math.floor(nextValue)),
    remainingRaw: nextValue,
    reset: retryAfter ? now + retryAfter : now,
    limit: config.maxTokens,
  };
}

function calculateFixedWindow(
  state: RatelimitState | null,
  config: FixedWindowAlgorithm,
  now: number,
  count: number
): EvaluationResult {
  const windowStart = alignWindowStart(now, config.window, config.start);
  const initial = state ?? {
    value: config.capacity,
    ts: windowStart,
  };

  const elapsedWindows = Math.max(
    0,
    Math.floor((now - initial.ts) / config.window)
  );
  const replenished = Math.min(
    initial.value + config.limit * elapsedWindows,
    config.capacity
  );
  const ts = initial.ts + elapsedWindows * config.window;
  const nextValue = replenished - count;

  const retryAfter =
    nextValue < 0
      ? ts + config.window * Math.ceil(-nextValue / config.limit) - now
      : undefined;

  return {
    state: { value: nextValue, ts },
    retryAfter,
    remaining: Math.max(0, Math.floor(nextValue)),
    remainingRaw: nextValue,
    reset: ts + config.window,
    limit: config.limit,
  };
}

function calculateSlidingWindow(
  state: RatelimitState | null,
  config: SlidingWindowAlgorithm,
  now: number,
  count: number
): EvaluationResult {
  const windowStart = alignWindowStart(now, config.window);
  const previousWindowStart = windowStart - config.window;
  const elapsedInWindow = now - windowStart;
  const previousWeight = Math.max(
    0,
    (config.window - elapsedInWindow) / config.window
  );

  let currentCount = 0;
  let previousCount = 0;

  if (state) {
    if (state.ts === windowStart) {
      currentCount = Math.max(0, state.value);
      if (state.auxTs === previousWindowStart) {
        previousCount = Math.max(0, state.auxValue ?? 0);
      }
    } else if (state.ts === previousWindowStart) {
      previousCount = Math.max(0, state.value);
    }
  }

  const projectedCurrent = currentCount + count;
  const projectedUsed = projectedCurrent + previousCount * previousWeight;
  const remaining = config.limit - projectedUsed;
  const retryAfter =
    remaining < 0 ? Math.max(1, config.window - elapsedInWindow) : undefined;

  return {
    state: {
      value: projectedCurrent,
      ts: windowStart,
      auxValue: previousCount,
      auxTs: previousWindowStart,
    },
    retryAfter,
    remaining: Math.max(0, Math.floor(remaining)),
    remainingRaw: remaining,
    reset: windowStart + config.window,
    limit: config.limit,
  };
}

/**
 * Convert a {@link RatelimitSnapshot} back into the `RatelimitState` shape that
 * {@link calculateRatelimit} consumes.
 *
 * Snapshot `value` is always "tokens left". Fixed window and token bucket store
 * that directly, but sliding window state stores the used count, so it has to be
 * inverted before it can be replayed.
 */
export function snapshotToState(snapshot: RatelimitSnapshot): RatelimitState {
  return { ...snapshot.state };
}

function alignWindowStart(now: number, window: number, start = 0): number {
  const offsetNow = now - start;
  return start + Math.floor(offsetNow / window) * window;
}
