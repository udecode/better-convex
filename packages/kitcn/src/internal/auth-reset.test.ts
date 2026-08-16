import { QueryClient, QueryObserver } from '@tanstack/query-core';

import { clearAuthBoundQueries } from './auth-reset';

const isAuthBound = (query: { meta: unknown }) => {
  const authType = (query.meta as { authType?: string } | undefined)?.authType;
  return authType === 'required' || authType === 'optional';
};

/** Mirrors what convexQuery() emits: nothing refetches these on its own. */
const frozen = {
  refetchOnMount: false as const,
  refetchOnReconnect: false as const,
  refetchOnWindowFocus: false as const,
  staleTime: Number.POSITIVE_INFINITY,
};

describe('clearAuthBoundQueries', () => {
  test('removes an auth-bound entry nobody renders rather than restoring its initialData', async () => {
    const queryClient = new QueryClient();
    const queryKey = ['convexQuery', 'viewer:required', {}] as const;

    const observer = new QueryObserver(queryClient, {
      ...frozen,
      initialData: 'ACCOUNT_A',
      meta: { authType: 'required' },
      queryFn: async () => 'ACCOUNT_B',
      queryKey,
    });
    // Mount and unmount: the entry survives for gcTime with the account's rows,
    // which is exactly the state `resetQueries` would restore it to.
    observer.subscribe(() => {})();
    expect(queryClient.getQueryData(queryKey)).toBe('ACCOUNT_A');

    await clearAuthBoundQueries(queryClient.getQueryCache(), isAuthBound);

    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  test('puts an observed auth-bound entry back to pending instead of its initialData', async () => {
    const queryClient = new QueryClient();
    const queryKey = ['convexQuery', 'viewer:disabled', {}] as const;

    const observer = new QueryObserver(queryClient, {
      ...frozen,
      // A disabled query never refetches, so restoring `initialState` would
      // leave the previous account's rows on screen for good.
      enabled: false,
      initialData: 'ACCOUNT_A',
      meta: { authType: 'optional' },
      queryFn: async () => 'ACCOUNT_B',
      queryKey,
    });
    const unsubscribe = observer.subscribe(() => {});

    await clearAuthBoundQueries(queryClient.getQueryCache(), isAuthBound);

    const query = queryClient.getQueryCache().getAll()[0];
    expect(query).toBeDefined();
    expect(query.state.data).toBeUndefined();
    expect(query.state.status).toBe('pending');

    unsubscribe();
  });

  test('leaves queries with no auth binding untouched', async () => {
    const queryClient = new QueryClient();
    const queryKey = ['convexQuery', 'messages:list', {}] as const;

    const observer = new QueryObserver(queryClient, {
      ...frozen,
      initialData: 'PUBLIC',
      queryFn: async () => 'PUBLIC',
      queryKey,
    });
    const unsubscribe = observer.subscribe(() => {});

    await clearAuthBoundQueries(queryClient.getQueryCache(), isAuthBound);

    expect(queryClient.getQueryData(queryKey)).toBe('PUBLIC');

    unsubscribe();
  });
});
