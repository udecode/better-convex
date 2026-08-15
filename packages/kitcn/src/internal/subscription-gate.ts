/**
 * Shared preconditions for opening a Convex WebSocket subscription for a
 * TanStack query. No framework imports, so the React and Solid
 * `ConvexQueryClient`s answer "may I subscribe to this query?" identically
 * instead of each inlining the guards per cache-event branch.
 */

import type { ConvexQueryMeta } from '../crpc/types';

/** Minimal view of a query-core `Query` used by the gate. */
export type SubscriptionGateQuery = {
  getObserversCount(): number;
  isDisabled(): boolean;
  meta: unknown;
};

/** Read kitcn's meta off a TanStack query. */
export function readConvexQueryMeta(
  query: SubscriptionGateQuery
): ConvexQueryMeta | undefined {
  return query.meta as ConvexQueryMeta | undefined;
}

/**
 * Auth-bound queries are cleared and resubscribed on an identity transition so
 * one account never renders another account's cached rows.
 */
export function isAuthBoundQuery(query: SubscriptionGateQuery): boolean {
  const authType = readConvexQueryMeta(query)?.authType;
  return authType === 'required' || authType === 'optional';
}

/**
 * Ask query-core whether the query is disabled.
 * `isDisabled()` resolves `enabled` across every observer, so it handles both
 * a predicate `enabled` and two observers disagreeing; comparing
 * `query.options.enabled === false` handles neither.
 */
export function isQueryDisabled(query: SubscriptionGateQuery): boolean {
  return query.isDisabled();
}

/** Whether a Convex subscription may be opened for this query. */
export function canSubscribeQuery(
  query: SubscriptionGateQuery,
  opts: {
    isSubscribed: boolean;
    shouldSkipSubscription: (
      authType: 'optional' | 'required' | undefined
    ) => boolean;
  }
): boolean {
  if (opts.isSubscribed) {
    return false;
  }

  const meta = readConvexQueryMeta(query);
  if (meta?.subscribe === false) {
    return false;
  }
  if (query.getObserversCount() === 0) {
    return false;
  }
  if (isQueryDisabled(query)) {
    return false;
  }
  if (opts.shouldSkipSubscription(meta?.authType)) {
    return false;
  }

  return true;
}
