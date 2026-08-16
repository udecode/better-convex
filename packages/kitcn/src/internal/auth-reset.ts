/**
 * Dropping auth-bound cache entries on an identity transition. No framework
 * imports, so the React and Solid `ConvexQueryClient`s erase the previous
 * account's data identically.
 */

/**
 * The state a query is born with when it declares no `initialData`. Mirrors
 * query-core's `getDefaultState` for that case.
 */
const PRISTINE_QUERY_STATE = {
  data: undefined,
  dataUpdateCount: 0,
  dataUpdatedAt: 0,
  error: null,
  errorUpdateCount: 0,
  errorUpdatedAt: 0,
  fetchFailureCount: 0,
  fetchFailureReason: null,
  fetchMeta: null,
  isInvalidated: false,
  status: 'pending',
  fetchStatus: 'idle',
} as const;

type PristineQueryState = typeof PRISTINE_QUERY_STATE;

/** Minimal view of a query-core `Query` used when clearing auth-bound entries. */
export type AuthResetQuery = {
  cancel(options?: { silent?: boolean }): Promise<void>;
  getObserversCount(): number;
  setState(state: PristineQueryState): void;
};

/** Minimal view of a query-core `QueryCache`. */
export type AuthResetCache<TQuery> = {
  getAll(): TQuery[];
  remove(query: TQuery): void;
};

/**
 * Erase the cached result of every auth-bound query.
 *
 * `queryClient.resetQueries()` is not enough. It restores each query's
 * `initialState`, and query-core derives that from `initialData` when the query
 * is built, never re-deriving it once real data lands. An auth-bound entry
 * therefore comes back holding the previous account's rows marked `success`,
 * and nothing corrects it: Convex query options set `staleTime: Infinity` with
 * every refetch trigger off, and `resetQueries` only refetches entries that are
 * currently active.
 *
 * Entries nobody renders are removed outright. The rest are forced back to
 * `pending`, so their observers render empty instead of the previous account's
 * rows while the new fetch is in flight.
 */
export async function clearAuthBoundQueries<TQuery extends AuthResetQuery>(
  cache: AuthResetCache<TQuery>,
  isAuthBound: (query: TQuery) => boolean
): Promise<void> {
  const authQueries = cache.getAll().filter((query) => isAuthBound(query));

  // Cancel first: a fetch issued under the previous identity would otherwise
  // resolve after the clear and re-seed the entry it just emptied.
  await Promise.all(authQueries.map((query) => query.cancel({ silent: true })));

  for (const query of authQueries) {
    if (query.getObserversCount() === 0) {
      cache.remove(query);
      continue;
    }

    query.setState({ ...PRISTINE_QUERY_STATE });
  }
}
