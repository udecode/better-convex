import type { QueryObserverResult } from '@tanstack/query-core';
import {
  type DefaultError,
  type SolidQueryOptions,
  useQueryClient,
} from '@tanstack/solid-query';
import type {
  PaginatedQueryArgs,
  PaginatedQueryItem,
  PaginatedQueryReference,
} from 'convex/react';
import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  type PaginationResult,
} from 'convex/server';
import {
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  on,
} from 'solid-js';
import { createStore } from 'solid-js/store';

import { CRPCClientError, isCRPCClientError } from '../crpc/error';
import { convexQuery } from '../crpc/query-options';
import { type ExtractPaginatedItem, FUNC_REF_SYMBOL } from '../crpc/types';
import { type EnabledFn, resolveEnabled } from '../internal/enabled';
import { shouldSplitPaginationPage } from '../internal/pagination';
import type { DistributiveOmit } from '../internal/types';
import { useMeta } from './auth';
import { useAuthStore, useAuthValue, useSafeConvexAuth } from './auth-store';
import { createQueriesResults } from './create-queries-results';
import type { ConvexInfiniteQueryOptionsWithRef } from './crpc-types';

/** Reserved options controlled by infinite query hooks */
type ReservedInfiniteOptions =
  | 'queryKey'
  | 'queryFn'
  | 'staleTime'
  | 'refetchInterval'
  | 'refetchOnMount'
  | 'refetchOnReconnect'
  | 'refetchOnWindowFocus';

/** Base options for infinite query internal hook */
type InfiniteQueryOptions<TItem> = {
  limit?: number;
  /** Auth binding of the paginated function, from the caller's cRPC meta. */
  authType?: 'optional' | 'required';
  /**
   * Accessor, not a value: the gate is re-read inside the hook's memos so auth
   * transitions and a caller predicate both keep working after mount.
   */
  enabled?: () => boolean | EnabledFn;
} & DistributiveOmit<
  SolidQueryOptions<TItem[], DefaultError>,
  ReservedInfiniteOptions | 'enabled'
>;

/**
 * Pagination state persisted in queryClient.
 * Enables scroll restoration when navigating back to a paginated list.
 *
 * Uses flat { cursor, limit } structure like tRPC.
 */
export type PaginationState = {
  id: number;
  nextPageKey: number;
  pageKeys: number[];
  queries: Record<
    number,
    {
      /** Flat pagination args - tRPC style */
      args: Record<string, unknown> & {
        cursor: string | null;
        limit?: number;
        /** Internal pagination ID for subscription management */
        __paginationId?: number;
      };
      endCursor?: string | null;
    }
  >;
  version: number;
  /** Recovery key to prevent infinite recovery loops */
  autoRecoveryAttempted?: string;
};

// Query key prefix for pagination state storage
const PAGINATION_KEY_PREFIX = '__pagination__' as const;

// Pagination ID store - persists across mounts for cache reuse
// Key: query name + args, Value: pagination ID
const paginationIdStore = new Map<string, number>();
let paginationIdCounter = 0;

const getOrCreatePaginationId = (storeKey: string): number => {
  const existing = paginationIdStore.get(storeKey);
  if (existing !== undefined) {
    return existing;
  }

  const newId = ++paginationIdCounter;
  paginationIdStore.set(storeKey, newId);
  return newId;
};

export type PaginationStatus =
  | 'CanLoadMore'
  | 'Exhausted'
  | 'LoadingFirstPage'
  | 'LoadingMore';

/** Return type for infinite query hooks */
export type UseInfiniteQueryResult<T> = {
  /** Flattened array of all loaded items */
  data: T[];
  /** The combined error from all pages */
  error: Error | null;
  /** Whether fetching next page failed */
  isFetchNextPageError: boolean;
  /** Whether any page has an error */
  isError: boolean;
  /** Whether any page is fetching */
  isFetching: boolean;
  /** Whether the query is fetching the next page */
  isFetchingNextPage: boolean;
  /** Whether the first page is loading */
  isLoading: boolean;
  /** Whether data is placeholder data */
  isPlaceholderData: boolean;
  /** Whether the query is refetching */
  isRefetching: boolean;
  /** Failure reason */
  failureReason: Error | null;
  /** Fetch the next page */
  fetchNextPage: (limit?: number) => void;
  /** Whether the query has a next page */
  hasNextPage: boolean;
  /** Array of page arrays (raw, not flattened) */
  pages: T[][];
  /** Current pagination status */
  status: PaginationStatus;
};

type PageState = {
  /** Flat pagination args - tRPC style */
  args: Record<string, unknown> & {
    cursor: string | null;
    limit?: number;
    /** Internal pagination ID for subscription management */
    __paginationId?: number;
  };
  endCursor?: string | null; // For page splitting - the cursor where this page ends
};

/** Aggregate of every page query, derived from the raw observer results */
type CombinedPages<TItem> = {
  data: TItem[];
  dataUpdatedAt: number;
  error: Error | null;
  failureReason: Error | null;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  isPlaceholderData: boolean;
  isRefetching: boolean;
  lastPage: PaginationResult<TItem> | undefined;
  pages: TItem[][];
  status: PaginationStatus;
};

/** Read the identity of a Convex document, tolerating `id` and `_id` shapes */
const getItemId = (item: unknown): string | undefined => {
  const doc = item as { _id?: string; id?: string } | null | undefined;
  return doc?._id || doc?.id;
};

/**
 * Fold the per-page observer results into one pagination-shaped aggregate.
 * Pure: same inputs always produce the same output, so it is safe to re-run
 * inside a reactive derivation.
 */
const aggregatePages = <TItem>(
  results: QueryObserverResult[],
  hasPlaceholderData: boolean
): CombinedPages<TItem> => {
  // Aggregate pages with deduplication
  const allItems: TItem[] = [];
  const pages: TItem[][] = [];
  const seenIds = new Set<string>();
  let lastPage: PaginationResult<TItem> | undefined;
  let status: PaginationStatus = 'LoadingFirstPage';

  for (let i = 0; i < results.length; i++) {
    const pageQuery = results[i];
    if (pageQuery.isLoading || pageQuery.data === undefined) {
      status = i === 0 ? 'LoadingFirstPage' : 'LoadingMore';
      break;
    }
    const page = pageQuery.data as PaginationResult<TItem>;
    lastPage = page;
    pages.push(page.page);
    for (const item of page.page) {
      const id = getItemId(item);
      if (id && seenIds.has(id)) continue;
      if (id) seenIds.add(id);
      allItems.push(item);
    }
    status = page.isDone ? 'Exhausted' : 'CanLoadMore';
  }

  // Computed values for overrides
  const firstPage = results.length > 0 ? results[0] : undefined;
  const isPlaceholderData = firstPage
    ? firstPage.isPlaceholderData
    : hasPlaceholderData;
  const isFetching = results.some((r) => r.isFetching);
  // Aggregate errors across all pages
  const error = (results.find((r) => r.isError)?.error ?? null) as Error | null;

  return {
    data: allItems,
    // Use latest dataUpdatedAt across all pages
    dataUpdatedAt: Math.max(...results.map((r) => r.dataUpdatedAt)),
    error,
    failureReason: error,
    isError: results.some((r) => r.isError),
    isFetchNextPageError:
      results.length > 1 && (results.at(-1)?.isError ?? false),
    // Aggregate fetching across all pages
    isFetching,
    isLoading: status === 'LoadingFirstPage',
    // Override with placeholder-aware values
    isPlaceholderData,
    isRefetching: isFetching && allItems.length > 0 && !isPlaceholderData,
    lastPage,
    pages,
    status,
  };
};

/** Build a unique key for recovery attempt detection */
const buildRecoveryKey = (
  pageKeys: number[],
  page0Cursor: string | null,
  page0UpdatedAt: number
): string => JSON.stringify({ pageKeys, page0Cursor, page0UpdatedAt });

/** Minimal shape the effects need from a raw page result */
type PageResult = {
  data?: unknown;
  dataUpdatedAt?: number;
  isError?: boolean;
  isFetching?: boolean;
};

type UseStaleCursorRecoveryOptions = {
  argsObject: () => Record<string, unknown>;
  combined: {
    isFetchNextPageError: boolean;
    status: string;
  };
  limit?: number;
  /** Raw per-page observer results, fresh identity on every update */
  pageResults: () => PageResult[];
  setState: (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => void;
  state: () => PaginationState;
};

/**
 * Hook for auto-recovering from stale cursors after WebSocket reconnection.
 *
 * When Convex WebSocket reconnects, page 0 (cursor: null) resubscribes and
 * gets fresh data. However, pages 1+ may have stale cursors that fail.
 *
 * This hook detects this pattern and creates a recovery page that fetches
 * enough items to cover the lost pages, preserving the user's scroll position.
 */
const useStaleCursorRecovery = ({
  argsObject,
  combined,
  limit,
  pageResults,
  setState,
  state,
}: UseStaleCursorRecoveryOptions): void => {
  // Auto-recovery from stale cursors
  // Triggers when: page 0 OK + pages 1+ errored + page 0 has continueCursor
  createEffect(
    on(
      [
        () => combined.isFetchNextPageError,
        pageResults,
        () => state().pageKeys,
        () => state().queries,
        () => state().autoRecoveryAttempted,
        argsObject,
      ],
      () => {
        if (!combined.isFetchNextPageError) return;

        const results = pageResults();
        const page0Result = results[0];
        const page0Data = page0Result?.data as
          | PaginationResult<unknown>
          | undefined;
        const page0UpdatedAt = page0Result?.dataUpdatedAt ?? 0;

        const hasPage0Data = page0Data !== undefined && !page0Result?.isError;
        const hasSubsequentErrors = results
          .slice(1)
          .some((q) => q?.isError && !q?.isFetching);

        if (!hasPage0Data || !hasSubsequentErrors || !page0Data?.continueCursor)
          return;

        const currentState = state();
        const recoveryKey = buildRecoveryKey(
          currentState.pageKeys,
          page0Data.continueCursor,
          page0UpdatedAt
        );

        if (currentState.autoRecoveryAttempted === recoveryKey) return;

        const erroredPageKeys = currentState.pageKeys.filter(
          (_, i) => i > 0 && results[i]?.isError
        );
        const itemsToRecover = erroredPageKeys.reduce((sum, key) => {
          const pageLimit =
            currentState.queries[key]?.args?.limit ?? limit ?? 20;
          return sum + pageLimit;
        }, 0);

        console.warn('[Pagination] Auto-recovering from stale cursors', {
          erroredPages: erroredPageKeys.length,
          itemsToRecover,
        });

        setState((prev) => ({
          ...prev,
          id: prev.id,
          nextPageKey: 2,
          pageKeys: [prev.pageKeys[0], 1],
          queries: {
            [prev.pageKeys[0]]: prev.queries[prev.pageKeys[0]],
            1: {
              args: {
                ...argsObject(),
                cursor: page0Data.continueCursor,
                limit: Math.min(itemsToRecover + (limit ?? 20), 500),
                __paginationId: prev.id,
              },
            },
          },
          version: prev.version + 1,
          autoRecoveryAttempted: recoveryKey,
        }));
      }
    )
  );

  // Clear recovery flag on success
  createEffect(
    on([() => combined.status, () => state().autoRecoveryAttempted], () => {
      if (
        (combined.status === 'CanLoadMore' ||
          combined.status === 'Exhausted') &&
        state().autoRecoveryAttempted
      ) {
        setState((prev) => ({
          ...prev,
          autoRecoveryAttempted: undefined,
        }));
      }
    })
  );
};

/**
 * Internal infinite query hook using TanStack Query + convexQuery.
 * Each page gets:
 * - Convex WebSocket subscription (real-time reactivity)
 * - TanStack Query retry on timeout errors
 *
 * Use `useInfiniteQuery` for the public API with auth handling.
 */
const useInfiniteQueryInternal = <Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query>,
  options: InfiniteQueryOptions<PaginatedQueryItem<Query>>
): UseInfiniteQueryResult<PaginatedQueryItem<Query>> => {
  // Extract our custom options, the rest are TanStack Query options for page queries
  const { limit, authType, enabled, placeholderData, ...queryOptions } =
    options;

  const safeAuth = useSafeConvexAuth();
  const authStore = useAuthStore();
  const meta = useMeta();
  const queryClient = useQueryClient();

  // Look up server-prefetched data using server-compatible queryKey.
  // This is a mount-time gate only ("did the server give us page 0?"), never
  // page 0's `initialData`: the prefetch is written under page 0's own query
  // key, so TanStack already serves it, while `initialData` would additionally
  // freeze it into the query's `initialState` — where an identity transition
  // resurrects the previous account's page.
  const prefetchedFirstPage = createMemo(() => {
    const serverQueryKey = [
      'convexQuery',
      getFunctionName(query),
      {
        ...(args as Record<string, unknown>),
        cursor: null,
        limit,
      },
    ];
    const data = queryClient.getQueryData(serverQueryKey);
    return data ?? null;
  });

  // Don't skip if we have prefetched data - use it for instant hydration.
  // `enabled` is read through the accessor so both reads stay tracked.
  const skip = createMemo(
    () =>
      !prefetchedFirstPage() && (safeAuth.isLoading || enabled?.() === false)
  );

  // Helper to get/set pagination state from queryClient with gcTime: Infinity
  const getPaginationState = (key: string): PaginationState | undefined => {
    const queryKey = [PAGINATION_KEY_PREFIX, key] as const;
    const paginationState = queryClient.getQueryData<PaginationState>(queryKey);
    return paginationState;
  };
  const setPaginationState = (
    key: string,
    paginationState: PaginationState
  ) => {
    const queryKey = [PAGINATION_KEY_PREFIX, key] as const;
    queryClient.setQueryData<PaginationState>(queryKey, paginationState);
  };
  const argsObject = createMemo(
    () => (skip() ? {} : args) as Record<string, unknown>
  );

  // Stable store key for pagination ID persistence across mounts.
  // Cursors index into one account's result set, so an auth-bound list carries
  // the account generation: a transition re-keys it, which routes the hook
  // through its existing "args changed" reset instead of restoring the previous
  // account's page chain and paging from its cursors.
  const storeKey = createMemo(() =>
    JSON.stringify({
      query: getFunctionName(query),
      args: argsObject(),
      ...(authType ? { authEpoch: authStore.get('authEpoch') } : {}),
    })
  );

  // Helper to create initial state
  const createInitialState = (): PaginationState => {
    const id = getOrCreatePaginationId(storeKey());
    return {
      id,
      nextPageKey: 1,
      pageKeys: skip() ? [] : [0],
      queries: skip()
        ? {}
        : {
            0: {
              args: {
                ...argsObject(),
                cursor: null,
                limit,
                __paginationId: id,
              },
            },
          },
      version: 0,
    };
  };

  // Track previous args to detect changes
  let prevArgs: { storeKey: string; skip: boolean } | null = null;

  // State: tracks pages with cursors (mirrors Convex's usePaginatedQuery)
  // Check queryClient first for state persistence across navigations
  // Note: Solid's createSignal doesn't accept a factory function like React useState,
  // so we compute the initial value eagerly.
  const computeInitialState = (): PaginationState => {
    if (skip()) {
      return { id: 0, nextPageKey: 1, pageKeys: [], queries: {}, version: 0 };
    }
    // Try to restore from queryClient (enables scroll restoration)
    const existingState = getPaginationState(storeKey());
    if (existingState) {
      return existingState;
    }
    return createInitialState();
  };
  const [state, setLocalState] = createSignal<PaginationState>(
    computeInitialState()
  );

  // Sync state changes to queryClient for persistence across navigations
  const setState = (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => {
    setLocalState((prev) => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      setPaginationState(storeKey(), newState);
      return newState;
    });
  };

  // Handle initialization and args changes
  createEffect(
    on([skip, storeKey], () => {
      const prev = prevArgs;
      const isFirstRun = prev === null;
      const currentStoreKey = storeKey();
      const currentSkip = skip();
      const argsChanged =
        prev !== null &&
        (prev.storeKey !== currentStoreKey || prev.skip !== currentSkip);
      const skipBecameFalse = prev?.skip && !currentSkip;

      // Update ref for next render
      prevArgs = { storeKey: currentStoreKey, skip: currentSkip };

      // Skip state - don't initialize
      if (currentSkip) {
        return;
      }

      // First run with skip=false: state was initialized in createSignal, sync to queryClient
      if (isFirstRun) {
        setPaginationState(currentStoreKey, state());
        return;
      }

      // Skip just became false (auth loaded): initialize state
      if (skipBecameFalse) {
        // Try to restore from queryClient first
        const existingState = getPaginationState(currentStoreKey);
        if (existingState) {
          setLocalState(existingState);
          return;
        }
        // Create new initial state
        const newState = createInitialState();
        setLocalState(newState);
        setPaginationState(currentStoreKey, newState);
        return;
      }

      // Args changed (different query/args): reset state
      if (argsChanged) {
        // Try to restore from queryClient first (for back navigation)
        const existingState = getPaginationState(currentStoreKey);
        if (existingState) {
          setLocalState(existingState);
          return;
        }
        // Create new initial state
        const newState = createInitialState();
        setLocalState(newState);
        setPaginationState(currentStoreKey, newState);
      }
    })
  );

  // Build TanStack queries from state (each page = separate convexQuery)
  // structuralSharing: false ensures Convex WebSocket updates trigger re-renders
  const tanstackQueries = createMemo(() =>
    state().pageKeys.map((key, index) => {
      // Strip internal __paginationId before passing to Convex
      const pageArgs = state().queries[key]?.args;
      const convexArgs = pageArgs
        ? (({ __paginationId, ...rest }) => rest)(pageArgs)
        : 'skip';

      return {
        ...convexQuery(query, convexArgs as any, meta),
        // Resolve the caller's `enabled` here so a predicate is evaluated
        // per page instead of being collapsed into a boolean upstream.
        enabled: resolveEnabled(!skip() && !!state().queries[key], enabled?.()),
        structuralSharing: false,
        // Apply TanStack Query options to all pages
        ...(queryOptions ?? {}),
        // Use placeholder data for first page (wrapped in pagination format)
        ...(index === 0 && placeholderData
          ? {
              placeholderData: {
                page: placeholderData,
                isDone: false,
                continueCursor: null,
              },
            }
          : {}),
      };
    })
  );

  // Subscribe every page and keep the raw observer results.
  const pageResults = createQueriesResults(() => tanstackQueries() as any);

  // Aggregate the pages into a store so each property notifies independently:
  // a consumer reading only `status` is untouched when only `data` changes.
  const derive = (): CombinedPages<PaginatedQueryItem<Query>> =>
    aggregatePages<PaginatedQueryItem<Query>>(pageResults(), !!placeholderData);
  const [combined, setCombined] = createStore<
    CombinedPages<PaginatedQueryItem<Query>>
  >(derive());
  createRenderEffect(() => setCombined(derive()));

  // Auto-recovery from stale cursors after WebSocket reconnection
  useStaleCursorRecovery({
    argsObject,
    combined,
    limit,
    pageResults,
    setState,
    state,
  });

  // Split when Convex requests it or a reactive page outgrows its target size.
  createEffect(
    on(
      [pageResults, () => state().pageKeys, () => state().queries, argsObject],
      () => {
        const results = pageResults();
        for (let i = 0; i < results.length; i++) {
          const pageQuery = results[i];
          if (pageQuery.data) {
            const page = pageQuery.data as PaginationResult<
              PaginatedQueryItem<Query>
            >;
            const pageKey = state().pageKeys[i];
            const pageState = state().queries[pageKey];

            // Check if this page needs splitting and we haven't already split it
            if (
              shouldSplitPaginationPage(page, limit) &&
              pageState &&
              !pageState.endCursor
            ) {
              setState((prev) => {
                const currentPageState = prev.queries[pageKey];
                if (!currentPageState || currentPageState.endCursor)
                  return prev;

                const newKey = prev.nextPageKey;
                const splitCursor = page.splitCursor;
                const splitPageArgs = {
                  ...argsObject(),
                  cursor: splitCursor,
                  limit: currentPageState.args.limit,
                  __paginationId: prev.id,
                };

                // Insert new page after the split page
                const pageKeyIndex = prev.pageKeys.indexOf(pageKey);
                const newPageKeys = [...prev.pageKeys];
                newPageKeys.splice(pageKeyIndex + 1, 0, newKey);

                return {
                  ...prev,
                  nextPageKey: newKey + 1,
                  pageKeys: newPageKeys,
                  queries: {
                    ...prev.queries,
                    // Mark current page with its end cursor
                    [pageKey]: {
                      ...currentPageState,
                      endCursor: splitCursor,
                    },
                    // Add the new split page
                    [newKey]: {
                      args: splitPageArgs,
                    },
                  } as Record<number, PageState>,
                };
              });
              return; // Only handle one split per render
            }
          }
        }
      }
    )
  );

  // loadMore: add new page to state
  const loadMore = (pageLimit?: number) => {
    if (
      combined.status !== 'CanLoadMore' ||
      !combined.lastPage?.continueCursor
    ) {
      return;
    }

    setState((prev) => {
      const newKey = prev.nextPageKey;
      return {
        ...prev,
        nextPageKey: newKey + 1,
        pageKeys: [...prev.pageKeys, newKey],
        queries: {
          ...prev.queries,
          [newKey]: {
            args: {
              ...argsObject(),
              cursor: combined.lastPage!.continueCursor,
              limit: pageLimit,
              __paginationId: prev.id,
            },
          },
        },
      };
    });
  };

  const hasNextPage = createMemo(() => combined.status === 'CanLoadMore');
  const isFetchingNextPage = createMemo(
    () => combined.status === 'LoadingMore'
  );

  return {
    get data() {
      return combined.data;
    },
    get error() {
      return combined.error instanceof Error ? combined.error : null;
    },
    get failureReason() {
      return (combined.failureReason as Error | null) ?? null;
    },
    get isFetchNextPageError() {
      return combined.isFetchNextPageError;
    },
    get isError() {
      return combined.isError;
    },
    get isFetching() {
      return combined.isFetching;
    },
    get isFetchingNextPage() {
      return isFetchingNextPage();
    },
    get isLoading() {
      return combined.isLoading;
    },
    get isPlaceholderData() {
      return combined.isPlaceholderData;
    },
    get isRefetching() {
      return combined.isRefetching;
    },
    fetchNextPage: (n?: number) => loadMore(n ?? limit),
    get hasNextPage() {
      return hasNextPage();
    },
    get pages() {
      return combined.pages;
    },
    get status() {
      return combined.status;
    },
  };
};

/**
 * Infinite query hook using cRPC-style options.
 * Accepts options from `crpc.posts.list.infiniteQueryOptions()`.
 *
 * @example
 * ```tsx
 * const crpc = useCRPC();
 * const { data, fetchNextPage } = useInfiniteQuery(
 *   crpc.posts.list.infiniteQueryOptions({ userId }, { limit: 20 })
 * );
 * ```
 */
export function useInfiniteQuery<
  T extends FunctionReference<'query'>,
  TItem = ExtractPaginatedItem<FunctionReturnType<T>>,
>(
  infiniteOptions: ConvexInfiniteQueryOptionsWithRef<T>
): UseInfiniteQueryResult<TItem> {
  // Extract function reference from Symbol (attached by proxy)
  const query = infiniteOptions[FUNC_REF_SYMBOL];
  const onQueryUnauthorized = useAuthValue('onQueryUnauthorized');
  const safeAuth = useSafeConvexAuth();

  // Extract metadata and query options from infiniteOptions.
  // `enabled` is pulled out of the rest so a frozen value never reaches a page
  // query; it is read lazily through `factoryEnabled()` below.
  const {
    queryKey: _queryKey,
    staleTime: _staleTime,
    refetchInterval: _refetchInterval,
    refetchOnMount: _refetchOnMount,
    refetchOnReconnect: _refetchOnReconnect,
    refetchOnWindowFocus: _refetchOnWindowFocus,
    enabled: _enabled,
    meta,
    ...queryOptions
  } = infiniteOptions;
  const { queryName, args, limit, authType, skipUnauth } = meta;

  // Default skipUnauth to false (throws CRPCClientError)
  const skipUnauthFinal = skipUnauth ?? false;

  // Read through the options object so the factory's `enabled` getter runs in
  // a tracking scope. A Solid component body is not one, so reading it here
  // would pin the value to whatever auth was at mount.
  const factoryEnabled = () => infiniteOptions.enabled;

  // Auth required but user not authenticated (after auth loads)
  const isUnauthorized = createMemo(
    () =>
      authType === 'required' &&
      !safeAuth.isLoading &&
      !safeAuth.isAuthenticated
  );

  // Determine if we should skip the query
  const shouldSkip = createMemo(
    () =>
      factoryEnabled() === false ||
      (authType === 'required' && safeAuth.isLoading) ||
      (authType === 'required' && !safeAuth.isAuthenticated)
  );

  // Create error when unauthorized (unless skipUnauth)
  const authError = createMemo(() => {
    if (isUnauthorized() && !skipUnauthFinal) {
      return new CRPCClientError({
        code: 'UNAUTHORIZED',
        functionName: queryName,
      });
    }
    return null;
  });

  // Call callback in createEffect (not during render) to avoid setState-in-render.
  // `isUnauthorized` is a memo, so this fires once per real auth transition.
  createEffect(() => {
    if (isUnauthorized() && !skipUnauthFinal) {
      onQueryUnauthorized({ queryName });
    }
  });

  const result = useInfiniteQueryInternal(query as any, args as any, {
    authType,
    limit,
    ...(queryOptions as any),
    // Internal hook handles prefetch detection and will bypass skip if data
    // exists. Forward an accessor so auth transitions reach the page gate, and
    // a caller predicate survives to be resolved per page.
    enabled: () => resolveEnabled(!shouldSkip(), factoryEnabled()),
  });

  // Include auth loading in loading state for optional and required types
  const authLoadingApplies = authType === 'optional' || authType === 'required';

  // When skipUnauth + unauthorized: return empty data, not placeholder
  const isSkippedUnauth = createMemo(() => isUnauthorized() && skipUnauthFinal);

  return {
    get data() {
      return isSkippedUnauth() ? ([] as TItem[]) : (result.data as TItem[]);
    },
    get pages() {
      return isSkippedUnauth()
        ? ([] as TItem[][])
        : (result.pages as TItem[][]);
    },
    get error() {
      const ae = authError();
      return ae ?? result.error;
    },
    get isError() {
      return authError() ? true : result.isError;
    },
    get isPlaceholderData() {
      return isSkippedUnauth() ? false : result.isPlaceholderData;
    },
    get isLoading() {
      const ae = authError();
      const isClientError = isCRPCClientError(result.error);
      return (
        (authLoadingApplies && safeAuth.isLoading) ||
        (!isClientError && !ae && !isSkippedUnauth() && result.isLoading)
      );
    },
    get isFetching() {
      return result.isFetching;
    },
    get isFetchingNextPage() {
      return result.isFetchingNextPage;
    },
    get isFetchNextPageError() {
      return result.isFetchNextPageError;
    },
    get isRefetching() {
      return result.isRefetching;
    },
    get failureReason() {
      return result.failureReason;
    },
    fetchNextPage: result.fetchNextPage,
    get hasNextPage() {
      return result.hasNextPage;
    },
    get status() {
      return result.status;
    },
  };
}
