/**
 * HTTP Server Query Options
 *
 * Server-side HTTP query options builder for RSC prefetching.
 * Query execution is delegated to getServerQueryClientOptions.
 */

import type { QueryOptions } from '@tanstack/react-query';
import { executeHttpRequest, type HttpInputArgs } from '../crpc/http-client';
import { buildHttpQueryKey, type HttpRouteInfo } from '../crpc/http-types';
import type { CombinedDataTransformer } from '../crpc/transformer';

/** Metadata attached to HTTP query options for execution by QueryClient */
export interface HttpQueryMeta {
  method: string;
  path: string;
}

/**
 * Build query options for an HTTP route (server-side).
 * Does NOT include queryFn - execution handled by getServerQueryClientOptions.
 */
export function buildHttpQueryOptions(
  route: HttpRouteInfo,
  routeKey: string,
  args?: unknown
): QueryOptions {
  return {
    // Shared builder guarantees the key matches the browser observer's key
    queryKey: buildHttpQueryKey(routeKey, args),
    // Route info stored in meta for queryFn to use
    meta: {
      path: route.path,
      method: route.method,
    } satisfies HttpQueryMeta,
  };
}

/**
 * Execute an HTTP route fetch.
 * Called by getServerQueryClientOptions queryFn.
 *
 * Shares the browser client's request builder so a prefetched entry hydrates
 * the client cache instead of being refetched from a different URL.
 */
export async function fetchHttpRoute(
  convexSiteUrl: string,
  routeMeta: HttpQueryMeta,
  args: unknown,
  token: string | undefined,
  transformer: CombinedDataTransformer
): Promise<unknown> {
  const result = await executeHttpRequest({
    args: args as HttpInputArgs | undefined,
    baseHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    convexSiteUrl,
    procedureName: `${routeMeta.method} ${routeMeta.path}`,
    route: routeMeta,
    transformer,
  });

  // TanStack Query rejects `undefined` as query data.
  return result ?? null;
}
