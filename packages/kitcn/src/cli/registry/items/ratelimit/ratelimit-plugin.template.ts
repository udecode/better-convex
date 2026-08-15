const FUNCTIONS_DIR_IMPORT_PLACEHOLDER = '__KITCN_FUNCTIONS_DIR__';

export const RATELIMIT_PLUGIN_TEMPLATE = `import {
  type LimitRequest,
  MINUTE,
  Ratelimit,
  RatelimitPlugin,
} from "kitcn/ratelimit";
import type { MutationCtx } from "${FUNCTIONS_DIR_IMPORT_PLACEHOLDER}/generated/server";

const fixed = (rate: number) => Ratelimit.fixedWindow(rate, MINUTE);

export const ratelimitBuckets = {
  default: {
    public: fixed(30),
    free: fixed(60),
    premium: fixed(200),
  },
} as const;

type RatelimitTier = keyof (typeof ratelimitBuckets)["default"];
export type RatelimitBucket = keyof typeof ratelimitBuckets;

type RatelimitUser = {
  id: string;
  isAdmin?: boolean;
  plan?: "premium" | "team" | null;
};

type RatelimitCtx = MutationCtx & {
  user?: RatelimitUser | null;
};

type RatelimitMeta = {
  ratelimit?: RatelimitBucket;
};

export function getUserTier(user: RatelimitUser | null): RatelimitTier {
  if (!user) {
    return "public";
  }
  if (user.isAdmin || user.plan) {
    return "premium";
  }

  return "free";
}

async function getRequestSignals(ctx: RatelimitCtx) {
  const { ip, userAgent } = await ctx.meta.getRequestMetadata();

  return {
    ...(ip ? { ip } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

/**
 * The identifier is the rate-limit partition key: everything that resolves to
 * the same string shares one budget and one \`ratelimitState\` document.
 *
 * Unauthenticated traffic is keyed by request IP so one visitor cannot spend
 * every other visitor's budget. Requests with no client IP (scheduled
 * functions, crons) all fall back to one key.
 */
function getRequestIdentifier(
  user: RatelimitUser | null,
  signals: LimitRequest | undefined
) {
  if (user) {
    return user.id;
  }

  return signals?.ip ? \`ip:\${signals.ip}\` : "ip:unknown";
}

export const ratelimit = RatelimitPlugin.configure({
  buckets: ratelimitBuckets,
  getBucket: ({ meta }: { meta: RatelimitMeta }) => meta.ratelimit ?? "default",
  getUser: ({ ctx }: { ctx: RatelimitCtx }) => ctx.user ?? null,
  getTier: getUserTier,
  getSignals: ({ ctx }: { ctx: RatelimitCtx }) => getRequestSignals(ctx),
  getIdentifier: ({
    user,
    signals,
  }: {
    user: RatelimitUser | null;
    signals: LimitRequest | undefined;
  }) => getRequestIdentifier(user, signals),
  prefix: ({ bucket, tier }) => \`ratelimit:\${bucket}:\${tier}\`,
  failureMode: "closed",
  enableProtection: true,
  denyListThreshold: 30,
});
`;
