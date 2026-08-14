import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import {
  algorithmBudget,
  algorithmCapacity,
  applyDynamicLimit,
  fixedWindow,
  shardAlgorithm,
  slidingWindow,
  tokenBucket,
} from './core/algorithms';
import { createReadDedupeCache, EphemeralBlockCache } from './core/cache';
import { calculateRatelimit } from './core/calculate-rate-limit';
import {
  clearProtection,
  pickDeniedValue,
  recordRatelimitFailure,
} from './core/deny-list';
import type { Duration } from './duration';
import { ConvexRatelimitStore } from './store/convex-store';
import type {
  AlgorithmOptions,
  CheckRequest,
  DynamicLimitResponse,
  HookAPIOptions,
  LimitRequest,
  RatelimitConfig,
  RatelimitResponse,
  RatelimitSnapshot,
  RatelimitState,
  RemainingResponse,
  ResolvedAlgorithm,
} from './types';

const DEFAULT_PREFIX = 'kitcn/ratelimit';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_THRESHOLD = 30;
const MIN_POWER_OF_TWO_CHOICES = 3;

type EvaluationCandidate = {
  shard: number;
  state: RatelimitState | null;
  evaluated: ReturnType<typeof calculateRatelimit>;
  retryAfter?: number;
  success: boolean;
};

type EvaluatedShard = {
  shard: number;
  perShard: ResolvedAlgorithm;
  evaluated: ReturnType<typeof calculateRatelimit>;
};

export class Ratelimit {
  static fixedWindow = fixedWindow;
  static slidingWindow = slidingWindow;
  static tokenBucket = tokenBucket;

  private readonly store: ConvexRatelimitStore;
  private readonly prefix: string;
  private readonly timeout: number;
  private readonly dynamicLimits: boolean;
  private readonly failureMode: 'closed' | 'open';
  private readonly enableProtection: boolean;
  private readonly denyListThreshold: number;
  private readonly denyList?: RatelimitConfig['denyList'];
  private readonly limiter: ResolvedAlgorithm;
  private readonly blockCache?: EphemeralBlockCache;
  private readonly blockCacheSource?: Map<string, number>;
  private readonly checkCache = createReadDedupeCache<RatelimitSnapshot>();

  constructor(private readonly config: RatelimitConfig) {
    this.store = new ConvexRatelimitStore(config.db);
    this.prefix = config.prefix ?? DEFAULT_PREFIX;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.dynamicLimits = config.dynamicLimits ?? false;
    this.failureMode = config.failureMode ?? 'closed';
    this.enableProtection = config.enableProtection ?? false;
    this.denyListThreshold = config.denyListThreshold ?? DEFAULT_THRESHOLD;
    this.denyList = config.denyList;
    this.limiter = config.limiter;

    if (config.ephemeralCache !== false) {
      this.blockCacheSource =
        config.ephemeralCache ?? new Map<string, number>();
      this.blockCache = new EphemeralBlockCache(this.blockCacheSource);
    }
  }

  async limit(
    identifier: string,
    request?: LimitRequest
  ): Promise<RatelimitResponse> {
    return this.runWithTimeout(() => this.evaluate(identifier, request, true));
  }

  async check(
    identifier: string,
    request?: CheckRequest
  ): Promise<RatelimitResponse> {
    return this.runWithTimeout(() => this.evaluate(identifier, request, false));
  }

  async blockUntilReady(
    identifier: string,
    timeoutMs: number
  ): Promise<RatelimitResponse> {
    if (timeoutMs <= 0) {
      throw new Error('timeout must be positive');
    }

    const deadline = Date.now() + timeoutMs;
    let latest = this.timeoutResponse(false);

    while (Date.now() <= deadline) {
      latest = await this.limit(identifier);
      if (latest.success) {
        return latest;
      }

      const waitMs = Math.max(1, Math.min(latest.reset, deadline) - Date.now());
      await sleep(waitMs);
    }

    return latest;
  }

  async resetUsedTokens(identifier: string): Promise<void> {
    await this.store.deleteStates(this.prefix, identifier);
    this.checkCache.clear();
    if (this.blockCache) {
      this.blockCache.clear(this.blockKey(identifier));
    }
    clearProtection(this.prefix, identifier);
  }

  async getRemaining(identifier: string): Promise<RemainingResponse> {
    const algorithm = await this.resolveAlgorithm();
    const evaluated = await this.readShards(
      identifier,
      algorithm,
      Array.from({ length: algorithm.shards }, (_, shard) => shard)
    );

    return {
      remaining: Math.max(
        0,
        evaluated.reduce((total, shard) => total + shard.evaluated.remaining, 0)
      ),
      reset: Math.min(...evaluated.map((shard) => shard.evaluated.reset)),
      limit: algorithmBudget(algorithm),
    };
  }

  async getValue(
    identifier: string,
    options?: { sampleShards?: number }
  ): Promise<RatelimitSnapshot> {
    const cacheKey = `${identifier}:${options?.sampleShards ?? 0}`;
    const cached = this.checkCache.get(cacheKey);
    if (cached) {
      const snapshot = await cached;
      if (snapshot) {
        return snapshot;
      }
    }

    const algorithm = await this.resolveAlgorithm();
    const sampleShards = Math.max(
      1,
      Math.min(options?.sampleShards ?? 1, algorithm.shards)
    );
    const shards = pickSampleShards(algorithm.shards, sampleShards);
    const samples = await this.readShards(identifier, algorithm, shards);

    let sampledRemaining = 0;
    let sampledCapacity = 0;
    let sampledStateValue = 0;
    let sampledAuxValue = 0;
    let latestTs: number | null = null;
    let latestAuxTs: number | null = null;
    let fullestShard: number | null = null;
    let fullestRemaining = Number.NEGATIVE_INFINITY;

    for (const { evaluated, perShard, shard } of samples) {
      sampledRemaining += evaluated.remainingRaw;
      sampledCapacity += algorithmCapacity(perShard);
      sampledStateValue += evaluated.state.value;
      sampledAuxValue += evaluated.state.auxValue ?? 0;
      latestTs =
        latestTs === null
          ? evaluated.state.ts
          : Math.max(latestTs, evaluated.state.ts);
      if (evaluated.state.auxTs !== undefined) {
        latestAuxTs =
          latestAuxTs === null
            ? evaluated.state.auxTs
            : Math.max(latestAuxTs, evaluated.state.auxTs);
      }

      if (evaluated.remainingRaw > fullestRemaining) {
        fullestRemaining = evaluated.remainingRaw;
        fullestShard = shard;
      }
    }

    const result: RatelimitSnapshot =
      fullestShard === null
        ? {
            value: algorithmCapacity(algorithm),
            ts: Date.now(),
            shard: 0,
            config: algorithm,
            state: {
              value:
                algorithm.kind === 'slidingWindow'
                  ? 0
                  : algorithmCapacity(algorithm),
              ts: Date.now(),
            },
          }
        : {
            value: scaleToGlobal(
              sampledRemaining,
              sampledCapacity,
              algorithmCapacity(algorithm)
            ),
            ts: latestTs ?? Date.now(),
            shard: fullestShard,
            config: algorithm,
            state: {
              value: scaleToGlobal(
                sampledStateValue,
                sampledCapacity,
                algorithmCapacity(algorithm)
              ),
              ts: latestTs ?? Date.now(),
              ...(algorithm.kind === 'slidingWindow'
                ? {
                    auxValue: scaleToGlobal(
                      sampledAuxValue,
                      sampledCapacity,
                      algorithmCapacity(algorithm)
                    ),
                    auxTs:
                      latestAuxTs ??
                      (latestTs ?? Date.now()) - algorithm.window,
                  }
                : {}),
            },
          };

    this.checkCache.set(cacheKey, Promise.resolve(result));
    return result;
  }

  async setDynamicLimit(options: { limit: number | false }): Promise<void> {
    if (!this.dynamicLimits) {
      throw new Error(
        'dynamicLimits must be enabled in the Ratelimit constructor to use setDynamicLimit()'
      );
    }

    // Resolving throws when the override leaves a shard under one token, so an
    // unservable budget is rejected here instead of denying every later request.
    applyDynamicLimit(
      this.limiter,
      options.limit === false ? null : options.limit
    );

    await this.store.setDynamicLimit(this.prefix, options.limit);
  }

  async getDynamicLimit(): Promise<DynamicLimitResponse> {
    if (!this.dynamicLimits) {
      throw new Error(
        'dynamicLimits must be enabled in the Ratelimit constructor to use getDynamicLimit()'
      );
    }

    return { dynamicLimit: await this.store.getDynamicLimit(this.prefix) };
  }

  hookAPI(options?: HookAPIOptions) {
    return {
      getRatelimit: queryGeneric({
        args: {
          identifier: v.optional(v.string()),
          sampleShards: v.optional(v.number()),
        },
        returns: v.object({
          value: v.number(),
          ts: v.number(),
          shard: v.number(),
          config: v.any(),
          state: v.object({
            value: v.number(),
            ts: v.number(),
            auxValue: v.optional(v.number()),
            auxTs: v.optional(v.number()),
          }),
        }),
        handler: async (ctx, args): Promise<RatelimitSnapshot> => {
          const identifier = await resolveIdentifier(
            options?.identifier,
            ctx,
            args.identifier
          );
          const limiter = this.withDb(
            (ctx as { db: RatelimitConfig['db'] }).db
          );
          return limiter.getValue(identifier, {
            sampleShards: args.sampleShards ?? options?.sampleShards,
          });
        },
      }),
      getServerTime: mutationGeneric({
        args: {},
        returns: v.number(),
        handler: async () => Date.now(),
      }),
    };
  }

  private withDb(db: RatelimitConfig['db']): Ratelimit {
    return new Ratelimit({
      ...this.config,
      db,
      ephemeralCache: this.blockCacheSource,
    });
  }

  private async evaluate(
    identifier: string,
    request: LimitRequest | CheckRequest | undefined,
    consume: boolean
  ): Promise<RatelimitResponse> {
    const deniedValue = this.enableProtection
      ? pickDeniedValue({
          prefix: this.prefix,
          identifier,
          request,
          lists: this.denyList,
        })
      : undefined;

    if (deniedValue) {
      return {
        success: false,
        ok: false,
        limit: algorithmBudget(this.limiter),
        remaining: 0,
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
        reason: 'denyList',
        deniedValue,
      };
    }

    const algorithm = await this.resolveAlgorithm();
    const count = normalizeCount(request);
    const reserveRequested = Boolean(request?.reserve);

    const picked = pickCandidateShards(algorithm.shards);
    const attempted = new Set<number>();
    let blockedUntil = Number.POSITIVE_INFINITY;

    const findOpen = (shards: number[]): number[] => {
      const open: number[] = [];
      for (const shard of shards) {
        attempted.add(shard);
        const blocked =
          this.blockCache && count > 0
            ? this.blockCache.isBlocked(
                this.blockKey(identifier),
                shard,
                count,
                reserveRequested
              )
            : undefined;

        if (blocked?.blocked) {
          blockedUntil = Math.min(blockedUntil, blocked.reset);
        } else {
          open.push(shard);
        }
      }
      return open;
    };

    const now = Date.now();
    const candidates = await this.evaluateCandidates(
      identifier,
      algorithm,
      findOpen(picked),
      now,
      count,
      reserveRequested
    );

    if (!candidates.some((candidate) => candidate.success)) {
      const fallback = Array.from(
        { length: algorithm.shards },
        (_, shard) => shard
      ).filter((shard) => !attempted.has(shard));
      candidates.push(
        ...(await this.evaluateCandidates(
          identifier,
          algorithm,
          findOpen(fallback),
          now,
          count,
          reserveRequested
        ))
      );
    }

    if (candidates.length === 0) {
      return {
        success: false,
        ok: false,
        limit: algorithmBudget(algorithm),
        remaining: 0,
        reset: blockedUntil,
        pending: Promise.resolve(),
        reason: 'cacheBlock',
      };
    }

    if (consume && this.blockCache && count > 0) {
      for (const candidate of candidates) {
        if (!candidate.success) {
          this.blockCache.blockUntil(
            this.blockKey(identifier),
            candidate.shard,
            count,
            reserveRequested,
            now + (candidate.retryAfter ?? 1)
          );
        }
      }
    }

    const successful = candidates.filter((candidate) => candidate.success);

    if (successful.length > 0) {
      const best = successful.sort(
        (a, b) => b.evaluated.remainingRaw - a.evaluated.remainingRaw
      )[0];

      if (consume && count !== 0) {
        await this.store.upsertState({
          name: this.prefix,
          key: identifier,
          shard: best.shard,
          state: best.evaluated.state,
        });
      }

      clearProtection(this.prefix, identifier);
      this.checkCache.clear();

      return {
        success: true,
        ok: true,
        limit: algorithmBudget(algorithm),
        remaining: Math.max(
          0,
          Math.floor(
            scaleToGlobal(
              best.evaluated.remainingRaw,
              algorithmCapacity(shardAlgorithm(algorithm, best.shard)),
              algorithmCapacity(algorithm)
            )
          )
        ),
        reset: best.evaluated.reset,
        pending: Promise.resolve(),
      };
    }

    const failure =
      candidates
        .filter((candidate) => candidate.retryAfter !== undefined)
        .sort(
          (a, b) =>
            (a.retryAfter ?? Number.MAX_SAFE_INTEGER) -
            (b.retryAfter ?? Number.MAX_SAFE_INTEGER)
        )[0] ?? candidates[0];

    const retryAfter = failure.retryAfter ?? 1;
    const reset = Math.min(now + retryAfter, blockedUntil);

    if (consume && this.enableProtection) {
      recordRatelimitFailure({
        prefix: this.prefix,
        identifier,
        request,
        threshold: this.denyListThreshold,
      });
    }

    return {
      success: false,
      ok: false,
      limit: algorithmBudget(algorithm),
      remaining: 0,
      reset,
      pending: Promise.resolve(),
    };
  }

  private blockKey(identifier: string): string {
    return `${this.prefix}:${identifier}`;
  }

  private async readShards(
    identifier: string,
    algorithm: ResolvedAlgorithm,
    shards: number[]
  ): Promise<EvaluatedShard[]> {
    const samples: Array<{
      perShard: ResolvedAlgorithm;
      shard: number;
      state: RatelimitState | null;
    }> = [];

    for (const shard of shards) {
      samples.push({
        perShard: shardAlgorithm(algorithm, shard),
        shard,
        state: normalizeState(
          await this.store.getState(this.prefix, identifier, shard)
        ),
      });
    }

    const now = Date.now();
    return samples.map(({ perShard, shard, state }) => ({
      shard,
      perShard,
      evaluated: calculateRatelimit(state, perShard, now, 0),
    }));
  }

  private async evaluateCandidates(
    identifier: string,
    algorithm: ResolvedAlgorithm,
    shards: number[],
    now: number,
    count: number,
    reserveRequested: boolean
  ): Promise<EvaluationCandidate[]> {
    const result: EvaluationCandidate[] = [];

    for (const shard of shards) {
      const perShard = shardAlgorithm(algorithm, shard);
      const state = normalizeState(
        await this.store.getState(this.prefix, identifier, shard)
      );
      const evaluated = calculateRatelimit(state, perShard, now, count);
      const retryAfter = getRequestRetryAfter(
        evaluated,
        perShard,
        now,
        reserveRequested
      );

      result.push({
        shard,
        state,
        evaluated,
        retryAfter,
        success: retryAfter === undefined,
      });
    }

    return result;
  }

  private async resolveAlgorithm(): Promise<ResolvedAlgorithm> {
    if (!this.dynamicLimits) {
      return this.limiter;
    }

    const dynamicLimit = await this.store.getDynamicLimit(this.prefix);
    return applyDynamicLimit(this.limiter, dynamicLimit);
  }

  private async runWithTimeout(
    operation: () => Promise<RatelimitResponse>
  ): Promise<RatelimitResponse> {
    if (this.timeout <= 0) {
      return operation();
    }

    const startedAt = Date.now();
    try {
      const result = await operation();
      if (Date.now() - startedAt > this.timeout) {
        return this.timeoutResponse(this.failureMode === 'open');
      }
      return result;
    } catch (error) {
      if (Date.now() - startedAt > this.timeout) {
        return this.timeoutResponse(this.failureMode === 'open');
      }
      throw error;
    }
  }

  private timeoutResponse(success: boolean): RatelimitResponse {
    return {
      success,
      ok: success,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve(),
      reason: 'timeout',
    };
  }
}

function getRequestRetryAfter(
  evaluated: ReturnType<typeof calculateRatelimit>,
  algorithm: ResolvedAlgorithm,
  now: number,
  reserveRequested: boolean
): number | undefined {
  if (
    !reserveRequested ||
    evaluated.retryAfter === undefined ||
    algorithm.kind === 'slidingWindow'
  ) {
    return evaluated.retryAfter;
  }

  if (algorithm.maxReserved === undefined) {
    return undefined;
  }

  const excessDebt =
    -evaluated.remainingRaw - Math.max(0, algorithm.maxReserved);
  if (excessDebt <= 0) {
    return undefined;
  }

  if (algorithm.kind === 'tokenBucket') {
    return Math.ceil(excessDebt / (algorithm.refillRate / algorithm.interval));
  }

  return Math.max(
    1,
    evaluated.state.ts +
      algorithm.window * Math.ceil(excessDebt / algorithm.limit) -
      now
  );
}

/**
 * Project the tokens left on the sampled shards onto the full budget.
 *
 * Sampling every shard adds up to the real global balance, so it is returned
 * untouched. A partial sample is scaled by the share of the budget it covers,
 * which assumes the unread shards are drained like the ones that were read.
 */
function scaleToGlobal(
  remaining: number,
  sampledBudget: number,
  totalBudget: number
): number {
  if (sampledBudget <= 0 || sampledBudget >= totalBudget) {
    return remaining;
  }
  return remaining * (totalBudget / sampledBudget);
}

function normalizeCount(request?: LimitRequest | CheckRequest): number {
  if (!request) {
    return 1;
  }
  const value = request.rate ?? request.count ?? 1;
  if (!Number.isFinite(value)) {
    throw new Error('count/rate must be a finite number');
  }
  return value;
}

function normalizeState(
  row: {
    value: number;
    ts: number;
    auxValue?: number;
    auxTs?: number;
  } | null
): RatelimitState | null {
  if (!row) {
    return null;
  }
  return {
    value: row.value,
    ts: row.ts,
    auxValue: row.auxValue,
    auxTs: row.auxTs,
  };
}

function pickCandidateShards(shards: number): number[] {
  const first = Math.floor(Math.random() * shards);
  if (shards < MIN_POWER_OF_TWO_CHOICES) {
    return [first];
  }
  const second =
    (first + 1 + Math.floor(Math.random() * (shards - 1))) % shards;
  return [first, second];
}

function pickSampleShards(total: number, sample: number): number[] {
  const all = Array.from({ length: total }, (_, index) => index);
  const selected: number[] = [];

  while (all.length > 0 && selected.length < sample) {
    const randomIndex = Math.floor(Math.random() * all.length);
    const [shard] = all.splice(randomIndex, 1);
    if (shard !== undefined) {
      selected.push(shard);
    }
  }

  return selected.length > 0 ? selected : [0];
}

async function sleep(ms: number): Promise<void> {
  try {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  } catch (error) {
    if (isTimerUnsupportedError(error)) {
      throw new Error(
        'blockUntilReady is not supported in Convex queries/mutations. Use an action or non-Convex runtime.'
      );
    }
    throw error;
  }
}

function isTimerUnsupportedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("can't use settimeout in queries and mutations") ||
    message.includes('settimeout')
  );
}

async function resolveIdentifier(
  identifierOption: HookAPIOptions['identifier'],
  ctx: unknown,
  fromClient?: string
): Promise<string> {
  if (!identifierOption) {
    if (!fromClient) {
      throw new Error('hookAPI requires identifier in options or request args');
    }
    return fromClient;
  }

  if (typeof identifierOption === 'function') {
    return await identifierOption(ctx, fromClient);
  }

  return identifierOption;
}

export function createFixedWindow(
  limit: number,
  window: Duration,
  options?: AlgorithmOptions
): ResolvedAlgorithm {
  return fixedWindow(limit, window, options);
}
