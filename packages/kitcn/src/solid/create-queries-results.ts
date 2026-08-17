import {
  QueriesObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/query-core';
import { useQueryClient } from '@tanstack/solid-query';
import { createComputed, createSignal, onCleanup } from 'solid-js';

/** Query options accepted by {@link createQueriesResults}. */
export type QueriesResultsOptions = QueryObserverOptions<
  any,
  any,
  any,
  any,
  any
>;

/**
 * Subscribe a reactive list of queries and expose the raw observer results.
 *
 * Solid Query's `useQueries` cannot back an aggregate result: it feeds the
 * `combine` output straight into `createStore` and then calls `.map()` on it,
 * so any non-array aggregate throws `state.map is not a function` while the
 * component is still setting up. It also routes `.data` through
 * `createResource`, which suspends the nearest boundary for as long as a query
 * is in flight.
 *
 * Driving `QueriesObserver` directly keeps every entry a plain
 * `QueryObserverResult` - the same value the React port aggregates - and leaves
 * aggregation to the caller.
 *
 * @param queries Reactive list of query options.
 * @returns Accessor for the raw observer results, in query order.
 */
export function createQueriesResults(
  queries: () => QueriesResultsOptions[]
): () => QueryObserverResult[] {
  const queryClient = useQueryClient();

  const defaulted = (): QueriesResultsOptions[] =>
    queries().map((options) => ({
      ...(queryClient.defaultQueryOptions(options) as QueriesResultsOptions),
      // Report the state each query will be in once mounted, so the first read
      // matches what the observer reports right after subscribing.
      _optimisticResults: 'optimistic' as const,
    }));

  const observer = new QueriesObserver(queryClient, defaulted());

  // `equals: false` publishes every observer notification. Consumers key
  // effects off result identity, the same way the React port does.
  const [results, setResults] = createSignal<QueryObserverResult[]>(
    observer.getCurrentResult(),
    { equals: false }
  );

  // Runs eagerly, then again whenever the query list or its args change.
  createComputed(() => {
    const next = defaulted();
    observer.setQueries(next);
    setResults(observer.getOptimisticResult(next, undefined)[0]);
  });

  const unsubscribe = observer.subscribe((next) => setResults(next));
  onCleanup(unsubscribe);

  return results;
}
