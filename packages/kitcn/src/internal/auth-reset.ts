/**
 * Dropping auth-bound cache entries on an identity transition. No framework
 * imports, so the React and Solid `ConvexQueryClient`s erase the previous
 * account's data identically.
 */

export type AuthResetObserver = {
  options: object;
  setOptions(options: object): void;
};

/** Minimal view of a query-core `Query` used when clearing auth-bound entries. */
export type AuthResetQuery = {
  cancel(options?: { silent?: boolean }): Promise<void>;
  getObserversCount(): number;
  observers: AuthResetObserver[];
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
 * Every entry is removed so query-core forgets both its current state and its
 * private `initialState`. Mounted observers are rebound with `initialData`
 * removed, creating a pristine replacement query that future public resets
 * cannot use to resurrect the previous account's rows.
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
    const observers = [...query.observers];
    cache.remove(query);

    for (const observer of observers) {
      observer.setOptions({ ...observer.options, initialData: undefined });
    }
  }
}
