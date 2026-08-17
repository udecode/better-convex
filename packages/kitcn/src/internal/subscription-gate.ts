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
  // Query-core resolves `enabled` across every observer, so this handles both
  // predicates and two observers that disagree.
  if (query.isDisabled()) {
    return false;
  }
  if (opts.shouldSkipSubscription(meta?.authType)) {
    return false;
  }

  return true;
}
