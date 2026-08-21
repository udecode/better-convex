/**
 * Shared query key utilities for Convex + TanStack Query.
 * This file has NO React dependencies so it can be imported in both
 * server (RSC) and client contexts.
 */

import { convexToJson, type Value } from 'convex/values';

import { encodeWire } from '../crpc/transformer';

/**
 * Check if query key is for a Convex query function.
 * Format: ['convexQuery', 'namespace:functionName', { args }]
 *
 * Requires the args slot: a 2-element key is a `queryFilter` prefix, never a
 * cache key, and hashing one would serialize `undefined` args and throw.
 */
export function isConvexQuery(
  queryKey: readonly unknown[]
): queryKey is ['convexQuery', string, Record<string, unknown>] {
  return queryKey.length >= 3 && queryKey[0] === 'convexQuery';
}

/**
 * Check if query key is for a Convex action function.
 * Format: ['convexAction', 'namespace:functionName', { args }]
 *
 * Requires the args slot, for the same reason as {@link isConvexQuery}.
 */
export function isConvexAction(
  queryKey: readonly unknown[]
): queryKey is ['convexAction', string, Record<string, unknown>] {
  return queryKey.length >= 3 && queryKey[0] === 'convexAction';
}

/**
 * Serialize args the same way they go over the wire, so non-native Convex
 * types the transformer supports (e.g. `Date`) can be hashed.
 */
function hashArgs(args: Record<string, unknown>): string {
  return JSON.stringify(convexToJson(encodeWire(args) as Value));
}

/**
 * Create stable hash for Convex query keys.
 * Uses Convex's JSON serialization for consistent argument hashing.
 */
export function hashConvexQuery(
  queryKey: ['convexQuery', string, Record<string, unknown>]
): string {
  const [, funcName, args] = queryKey;
  return `convexQuery|${funcName}|${hashArgs(args)}`;
}

/**
 * Create stable hash for Convex action keys.
 * Uses Convex's JSON serialization for consistent argument hashing.
 */
export function hashConvexAction(
  queryKey: ['convexAction', string, Record<string, unknown>]
): string {
  const [, funcName, args] = queryKey;
  return `convexAction|${funcName}|${hashArgs(args)}`;
}
