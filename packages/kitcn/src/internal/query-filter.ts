/**
 * Single owner for the "no args means every args variant" filter rule.
 *
 * Every `queryFilter` in kitcn — Convex (`crpc.*`) and HTTP (`crpc.http.*`),
 * React and Solid — resolves args through here, so the four proxies cannot
 * drift apart on what an omitted argument means.
 *
 * No imports on purpose: this is pure key arithmetic, safe to pull into any
 * bundle.
 */

/** Prefix that namespaces a Convex query key. */
export type ConvexKeyPrefix = 'convexQuery' | 'convexAction';

/** Exact cache key for one Convex function + args, as stored in the client. */
export type ConvexFnQueryKey = readonly [ConvexKeyPrefix, string, unknown];

/**
 * Function-wide prefix key that matches every args variant.
 * Not a cache key: nothing is ever stored under it.
 */
export type ConvexFnPrefixKey = readonly [ConvexKeyPrefix, string];

/**
 * Whether a `queryFilter` call actually narrowed by args.
 *
 * Nullish args and `{}` all mean "match every args variant". They have to
 * collapse to a shorter prefix key rather than sit in the args slot, because
 * TanStack matches filters with `partialMatchKey`, which walks
 * `Object.keys(filterKey)` — an args slot holding `undefined` or `null` is
 * compared against the real args and fails on every entry that carries any,
 * so the filter silently matches nothing.
 */
export function hasQueryFilterArgs(args: unknown): boolean {
  if (args == null) return false;
  if (typeof args === 'object') {
    return Object.keys(args).length > 0;
  }
  return true;
}

/**
 * Build the key for a Convex `queryFilter`.
 *
 * With args, this is the exact 3-element key and TanStack partial-matches the
 * args object. Without args, it stops before the args slot so the filter
 * matches every variant of the function.
 */
export function buildConvexFilterKey(
  prefix: ConvexKeyPrefix,
  funcName: string,
  args?: unknown
): ConvexFnQueryKey | ConvexFnPrefixKey {
  return hasQueryFilterArgs(args)
    ? ([prefix, funcName, args] as const)
    : ([prefix, funcName] as const);
}
