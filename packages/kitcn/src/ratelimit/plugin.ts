import { definePlugin } from '../plugins';
import { CRPCError } from '../server';
import { requireMutationCtx } from '../server/context-utils';
import { Ratelimit } from './ratelimit';
import type { LimitRequest, RatelimitConfig, ResolvedAlgorithm } from './types';

type MaybePromise<T> = T | Promise<T>;

type RatelimitBuckets = Record<string, Record<string, ResolvedAlgorithm>>;

type BucketName<TBuckets extends RatelimitBuckets> = Extract<
  keyof TBuckets,
  string
>;

type TierName<TBuckets extends RatelimitBuckets> = Extract<
  keyof TBuckets[BucketName<TBuckets>],
  string
>;

/** What is known before request signals are resolved. */
type RatelimitRequestArgs<
  TCtx,
  TMeta extends object,
  TUser,
  TBuckets extends RatelimitBuckets,
> = {
  ctx: TCtx;
  meta: TMeta;
  user: TUser;
  bucket: BucketName<TBuckets>;
  tier: TierName<TBuckets>;
};

/** Signals are resolved once per request and reused as the identifier input. */
type RatelimitIdentifierArgs<
  TCtx,
  TMeta extends object,
  TUser,
  TBuckets extends RatelimitBuckets,
> = RatelimitRequestArgs<TCtx, TMeta, TUser, TBuckets> & {
  signals: LimitRequest | undefined;
};

type RatelimitResolvedArgs<
  TCtx,
  TMeta extends object,
  TUser,
  TBuckets extends RatelimitBuckets,
> = RatelimitIdentifierArgs<TCtx, TMeta, TUser, TBuckets> & {
  identifier: string;
};

export type RatelimitPluginOptions<
  TCtx = unknown,
  TMeta extends object = object,
  TUser = unknown,
  TBuckets extends RatelimitBuckets = RatelimitBuckets,
> = {
  buckets: TBuckets;
  getBucket: (args: {
    ctx: TCtx;
    meta: TMeta;
  }) => MaybePromise<BucketName<TBuckets>>;
  getUser: (args: { ctx: TCtx; meta: TMeta }) => MaybePromise<TUser>;
  getTier: (user: TUser) => MaybePromise<TierName<TBuckets>>;
  /**
   * Resolved once per request, before `getIdentifier`, and reused for the limit
   * call. Read request metadata here rather than in `getIdentifier`, so a
   * guarded mutation pays at most one `ctx.meta.getRequestMetadata()` syscall.
   */
  getSignals: (
    args: RatelimitRequestArgs<TCtx, TMeta, TUser, TBuckets>
  ) => MaybePromise<LimitRequest | undefined>;
  /**
   * The rate-limit partition key. Everything sharing a value shares one budget
   * and one `ratelimitState` document, so key unauthenticated traffic by
   * `signals.ip` rather than a constant.
   */
  getIdentifier: (
    args: RatelimitIdentifierArgs<TCtx, TMeta, TUser, TBuckets>
  ) => MaybePromise<string>;
  prefix?:
    | string
    | ((
        args: RatelimitResolvedArgs<TCtx, TMeta, TUser, TBuckets>
      ) => MaybePromise<string>);
  failureMode?: 'closed' | 'open';
  enableProtection?: boolean;
  denyListThreshold?: number;
  denyList?: RatelimitConfig['denyList'];
  dynamicLimits?: boolean;
  timeout?: number;
  /**
   * Block cache backing store. The plugin builds one `Ratelimit` per guarded
   * mutation, so the default per-instance cache never outlives a request. Pass
   * a longer-lived `Map` only if you accept that a stale block can deny a
   * request a refilled shard could have served, and that a mutation replayed
   * after an OCC conflict can observe entries its first attempt wrote.
   */
  ephemeralCache?: RatelimitConfig['ephemeralCache'];
  message?:
    | string
    | ((
        args: RatelimitResolvedArgs<TCtx, TMeta, TUser, TBuckets>
      ) => MaybePromise<string>);
};

type AnyRatelimitPluginOptions = RatelimitPluginOptions<any, any, any, any>;

const DEFAULT_RATELIMIT_MESSAGE =
  'Rate limit exceeded. Please try again later.';

function resolveBucketLimiter(
  options: AnyRatelimitPluginOptions,
  bucket: string,
  tier: string
): ResolvedAlgorithm {
  const bucketConfig = options.buckets[bucket];
  if (!bucketConfig) {
    throw new Error(`Unknown ratelimit bucket "${bucket}".`);
  }

  const limiter = bucketConfig[tier];
  if (!limiter) {
    throw new Error(`Unknown ratelimit tier "${tier}" for bucket "${bucket}".`);
  }

  return limiter;
}

function resolvePrefix(
  options: AnyRatelimitPluginOptions,
  args: RatelimitResolvedArgs<any, any, any, any>
): MaybePromise<string> {
  if (typeof options.prefix === 'function') {
    return options.prefix(args);
  }
  return options.prefix ?? `ratelimit:${args.bucket}:${args.tier}`;
}

function resolveMessage(
  options: AnyRatelimitPluginOptions,
  args: RatelimitResolvedArgs<any, any, any, any>
): MaybePromise<string> {
  if (typeof options.message === 'function') {
    return options.message(args);
  }
  return options.message ?? DEFAULT_RATELIMIT_MESSAGE;
}

export const RatelimitPlugin = definePlugin<
  'ratelimit',
  AnyRatelimitPluginOptions,
  AnyRatelimitPluginOptions
>('ratelimit', ({ options }) => {
  if (!options) {
    throw new Error('RatelimitPlugin must be configured before use.');
  }
  return options;
}).extend(({ middleware }) => ({
  middleware: () =>
    middleware().pipe(async ({ ctx, meta, next }) => {
      const options = ctx.api.ratelimit;
      const mutationCtx = requireMutationCtx(ctx as any);

      const bucket = await options.getBucket({
        ctx,
        meta,
      });
      const user = await options.getUser({
        ctx,
        meta,
      });
      const tier = await options.getTier(user);
      const requestArgs = {
        ctx,
        meta,
        user,
        bucket,
        tier,
      } satisfies RatelimitRequestArgs<any, any, any, any>;

      // Resolved once: `getIdentifier` keys on the same signals the limiter
      // uses, so reading request metadata costs one syscall per mutation.
      const signals = await options.getSignals(requestArgs);
      const identifier = await options.getIdentifier({
        ...requestArgs,
        signals,
      });
      const args = {
        ...requestArgs,
        signals,
        identifier,
      } satisfies RatelimitResolvedArgs<any, any, any, any>;

      const limiter = new Ratelimit({
        db: mutationCtx.db,
        prefix: await resolvePrefix(options, args),
        limiter: resolveBucketLimiter(options, bucket, tier),
        failureMode: options.failureMode,
        enableProtection: options.enableProtection,
        denyListThreshold: options.denyListThreshold,
        denyList: options.denyList,
        dynamicLimits: options.dynamicLimits,
        timeout: options.timeout,
        ephemeralCache: options.ephemeralCache,
      });
      const status = await limiter.limit(identifier, signals);

      if (!status.success) {
        throw new CRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: await resolveMessage(options, args),
        });
      }

      return next({ ctx });
    }),
}));
