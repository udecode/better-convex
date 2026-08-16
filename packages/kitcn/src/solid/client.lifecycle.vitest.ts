import { QueryObserver } from '@tanstack/query-core';
import type { QueryFunctionContext } from '@tanstack/solid-query';
import { QueryClient } from '@tanstack/solid-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CRPCClientError } from '../crpc/error';
import { ConvexQueryClient } from './client';

/** Create a mock ConvexClient with onUpdate returning an Unsubscribe-like object */
function createMockConvexClient(opts?: {
  onUpdateCb?: (cb: () => void, onError?: (e: Error) => void) => void;
  getCurrentValue?: () => unknown;
  onUnsubscribe?: () => void;
}) {
  return {
    client: { url: 'https://example.convex.cloud' },
    onUpdate: (
      _query: unknown,
      _args: unknown,
      cb: () => void,
      onError?: (e: Error) => void
    ) => {
      opts?.onUpdateCb?.(cb, onError);
      const unsub: any = () => {
        opts?.onUnsubscribe?.();
      };
      unsub.unsubscribe = unsub;
      unsub.getCurrentValue = opts?.getCurrentValue ?? (() => undefined);
      return unsub;
    },
    query: async () => undefined,
    action: async () => undefined,
  } as any;
}

describe('ConvexQueryClient (client mode lifecycle)', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {};
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window');
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  test('connect is idempotent for the same queryClient and unsubscribes when switching clients', () => {
    const queryClient1 = new QueryClient();
    let unsub1Calls = 0;
    vi.spyOn(queryClient1.getQueryCache(), 'subscribe').mockImplementation(
      () => () => {
        unsub1Calls++;
      }
    );

    const queryClient2 = new QueryClient();
    let unsub2Calls = 0;
    vi.spyOn(queryClient2.getQueryCache(), 'subscribe').mockImplementation(
      () => () => {
        unsub2Calls++;
      }
    );

    const convexClient = createMockConvexClient();

    const client = new ConvexQueryClient(convexClient, {
      queryClient: queryClient1,
      unsubscribeDelay: 0,
    });

    client.connect(queryClient1);
    expect(unsub1Calls).toBe(0);

    client.connect(queryClient2);
    expect(unsub1Calls).toBe(1);

    client.destroy();
    expect(unsub2Calls).toBe(1);
  });

  test('unsubscribeAuthQueries unsubscribes only authType=required subscriptions', () => {
    const unsubCalls: Record<string, number> = {
      required: 0,
      optional: 0,
    };
    const convexClient = {
      client: { url: 'https://example.convex.cloud' },
      onUpdate: (
        fn: unknown,
        _args: unknown,
        _cb: () => void,
        _onError?: (e: Error) => void
      ) => {
        const name = String(fn);
        const bucket = name.includes('required') ? 'required' : 'optional';
        const unsub: any = () => {
          unsubCalls[bucket]++;
        };
        unsub.unsubscribe = unsub;
        unsub.getCurrentValue = () => undefined;
        return unsub;
      },
      query: async () => undefined,
      action: async () => undefined,
    } as any;

    const queryClient = new QueryClient();
    const client = new ConvexQueryClient(convexClient, {
      queryClient,
      unsubscribeDelay: 0,
    });

    const requiredKey = [
      'convexQuery',
      'todos:required',
      { status: 'open' },
    ] as const;
    const optionalKey = [
      'convexQuery',
      'todos:optional',
      { status: 'open' },
    ] as const;

    const requiredObserver = new QueryObserver(queryClient as any, {
      meta: { authType: 'required' },
      queryFn: async () => ({ ok: true }),
      queryKey: requiredKey,
    });
    const unsubRequired = requiredObserver.subscribe(() => {});

    const optionalObserver = new QueryObserver(queryClient as any, {
      meta: { authType: 'optional' },
      queryFn: async () => ({ ok: true }),
      queryKey: optionalKey,
    });
    const unsubOptional = optionalObserver.subscribe(() => {});

    expect(Object.keys(client.subscriptions).length).toBe(2);

    client.unsubscribeAuthQueries();

    expect(unsubCalls.required).toBe(1);
    expect(unsubCalls.optional).toBe(0);
    expect(Object.keys(client.subscriptions).length).toBe(1);

    unsubRequired();
    unsubOptional();
  });

  test('resetAuthQueries clears auth-bound cache entries, including non-subscribed ones', async () => {
    const subscribed: string[] = [];
    const unsubscribed: string[] = [];
    const convexClient = {
      client: { url: 'https://example.convex.cloud' },
      onUpdate: (
        fn: unknown,
        _args: unknown,
        _cb: () => void,
        _onError?: (e: Error) => void
      ) => {
        const name = String(fn);
        subscribed.push(name);
        const unsub: any = () => {
          unsubscribed.push(name);
        };
        unsub.unsubscribe = unsub;
        unsub.getCurrentValue = () => undefined;
        return unsub;
      },
      query: async () => undefined,
      action: async () => undefined,
    } as any;

    const queryClient = new QueryClient();
    const client = new ConvexQueryClient(convexClient, {
      queryClient,
      unsubscribeDelay: 0,
    });

    const requiredKey = ['convexQuery', 'viewer:required', {}] as const;
    const optionalKey = ['convexQuery', 'viewer:optional', {}] as const;
    // An action-backed query (subscribe: false) has no Convex push to correct
    // it, so without a reset it serves the previous account's value forever.
    const oneShotKey = ['convexQuery', 'viewer:oneShot', {}] as const;
    const publicKey = ['convexQuery', 'messages:list', {}] as const;

    // Mirror what convexQuery() emits: nothing refetches these on its own.
    const frozen = {
      refetchOnMount: false as const,
      refetchOnReconnect: false as const,
      refetchOnWindowFocus: false as const,
      staleTime: Number.POSITIVE_INFINITY,
    };

    queryClient.setQueryData(requiredKey as any, 'USER_A');
    queryClient.setQueryData(optionalKey as any, 'USER_A');
    queryClient.setQueryData(oneShotKey as any, 'USER_A');
    queryClient.setQueryData(publicKey as any, 'PUBLIC');

    const requiredObserver = new QueryObserver(queryClient as any, {
      ...frozen,
      meta: { authType: 'required', subscribe: true },
      queryFn: async () => 'USER_B',
      queryKey: requiredKey,
    });
    const optionalObserver = new QueryObserver(queryClient as any, {
      ...frozen,
      meta: { authType: 'optional', subscribe: true },
      queryFn: async () => 'USER_B',
      queryKey: optionalKey,
    });
    const oneShotObserver = new QueryObserver(queryClient as any, {
      ...frozen,
      meta: { authType: 'required', subscribe: false },
      queryFn: async () => 'USER_B',
      queryKey: oneShotKey,
    });
    const publicObserver = new QueryObserver(queryClient as any, {
      ...frozen,
      meta: { subscribe: true },
      queryFn: async () => 'PUBLIC',
      queryKey: publicKey,
    });

    const unsubRequired = requiredObserver.subscribe(() => {});
    const unsubOptional = optionalObserver.subscribe(() => {});
    const unsubOneShot = oneShotObserver.subscribe(() => {});
    const unsubPublic = publicObserver.subscribe(() => {});

    // Everything but the subscribe:false query holds a Convex subscription.
    expect(Object.keys(client.subscriptions).length).toBe(3);
    expect(subscribed).toHaveLength(3);
    expect(queryClient.getQueryData(oneShotKey as any)).toBe('USER_A');

    await client.resetAuthQueries();

    // Only auth-bound queries are dropped and reopened; the public one keeps
    // its original subscription.
    expect([...unsubscribed].sort()).toEqual([
      'viewer:optional',
      'viewer:required',
    ]);
    expect(subscribed).toHaveLength(5);
    expect(Object.keys(client.subscriptions).length).toBe(3);

    expect(queryClient.getQueryData(requiredKey as any)).toBe('USER_B');
    expect(queryClient.getQueryData(optionalKey as any)).toBe('USER_B');
    expect(queryClient.getQueryData(oneShotKey as any)).toBe('USER_B');
    // Queries with no authType are untouched.
    expect(queryClient.getQueryData(publicKey as any)).toBe('PUBLIC');

    unsubRequired();
    unsubOptional();
    unsubOneShot();
    unsubPublic();
  });

  test('resetAuthQueries drops auth-bound entries nobody renders and advances the account generation', async () => {
    const authStoreState: Record<string, unknown> = {
      isLoading: false,
      isAuthenticated: true,
      onQueryUnauthorized: () => {},
      isUnauthorized: () => false,
      authEpoch: 0,
    };
    const authStore = {
      get: (key: string) => authStoreState[key],
      set: (key: string, value: unknown) => {
        authStoreState[key] = value;
      },
    } as any;

    const queryClient = new QueryClient();
    const client = new ConvexQueryClient(createMockConvexClient(), {
      authStore,
      queryClient,
      unsubscribeDelay: 0,
    });

    const queryKey = ['convexQuery', 'viewer:required', {}] as const;
    const observer = new QueryObserver(queryClient as any, {
      // An SSR-hydrated page arrives as `initialData`, which query-core bakes
      // into the query's initialState and never re-derives.
      initialData: 'ACCOUNT_A',
      meta: { authType: 'required', subscribe: true },
      queryFn: async () => 'ACCOUNT_B',
      queryKey,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    });
    // Rendered once, then unmounted: the entry lingers for gcTime holding the
    // previous account's rows and nothing is left to refetch it, so resetting
    // it to initialState would serve them to the next account.
    observer.subscribe(() => {})();

    expect(queryClient.getQueryData(queryKey as any)).toBe('ACCOUNT_A');

    await client.resetAuthQueries();

    expect(queryClient.getQueryData(queryKey as any)).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(Object.keys(client.subscriptions)).toHaveLength(0);
    expect(authStoreState.authEpoch).toBe(1);
  });

  test('onUpdateQueryKeyHash keeps existing data for undefined but accepts null subscription values', () => {
    const queryClient = new QueryClient();
    const convexClient = createMockConvexClient();
    const client = new ConvexQueryClient(convexClient, {
      queryClient,
      unsubscribeDelay: 0,
    });

    const queryKey = ['convexQuery', 'todos:list', { status: 'open' }] as const;
    queryClient.setQueryData(queryKey as any, { existing: true });

    const observer = new QueryObserver(queryClient as any, {
      meta: { subscribe: true },
      queryFn: async () => ({ ok: true }),
      queryKey,
    });
    const unsubObserver = observer.subscribe(() => {});

    const query =
      queryClient
        .getQueryCache()
        .getAll()
        .find((q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKey)) ??
      null;
    expect(query).not.toBeNull();

    let localQueryValue: unknown;
    client.subscriptions[(query as any).queryHash] = {
      queryKey: queryKey as any,
      getCurrentValue: () => localQueryValue,
      unsubscribe: () => {},
      lastError: undefined,
    };

    const setQueryData = vi.spyOn(queryClient, 'setQueryData');

    // undefined -> should NOT overwrite existing data
    client.onUpdateQueryKeyHash((query as any).queryHash);
    expect(setQueryData).not.toHaveBeenCalled();

    // null -> valid Convex result, should overwrite existing data
    localQueryValue = null;
    client.onUpdateQueryKeyHash((query as any).queryHash);
    expect(setQueryData).toHaveBeenCalledTimes(1);
    expect(setQueryData).toHaveBeenCalledWith(queryKey as any, null);

    // non-nullish -> should update
    localQueryValue = { updated: true };
    client.onUpdateQueryKeyHash((query as any).queryHash);
    expect(setQueryData).toHaveBeenCalledTimes(2);
    expect(setQueryData).toHaveBeenCalledWith(queryKey as any, {
      updated: true,
    });

    unsubObserver();
  });

  test('onUpdateQueryKeyHash pushes error state and calls onQueryUnauthorized when server returns auth error', () => {
    const onQueryUnauthorized = vi.fn(async () => undefined);
    const authStore = {
      get: (key: string) => {
        if (key === 'isLoading') return false;
        if (key === 'isAuthenticated') return true;
        if (key === 'onQueryUnauthorized') return onQueryUnauthorized;
        if (key === 'isUnauthorized') {
          return (error: unknown) =>
            error instanceof Error && error.message === 'unauthorized';
        }
        return;
      },
    };

    const queryClient = new QueryClient();
    const convexClient = createMockConvexClient();
    const client = new ConvexQueryClient(convexClient, {
      authStore: authStore as any,
      queryClient,
      unsubscribeDelay: 0,
    });

    const queryKey = ['convexQuery', 'todos:list', { status: 'open' }] as const;
    const observer = new QueryObserver(queryClient as any, {
      meta: { authType: 'required', subscribe: true },
      queryFn: async () => ({ ok: true }),
      queryKey,
    });
    const unsubObserver = observer.subscribe(() => {});

    const query =
      queryClient
        .getQueryCache()
        .getAll()
        .find((q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKey)) ??
      null;
    expect(query).not.toBeNull();

    client.subscriptions[(query as any).queryHash] = {
      queryKey: queryKey as any,
      getCurrentValue: () => undefined,
      unsubscribe: () => {},
      lastError: new Error('unauthorized'),
    };

    client.onUpdateQueryKeyHash((query as any).queryHash);

    expect(onQueryUnauthorized).toHaveBeenCalledWith({
      queryName: 'todos:list',
    });

    unsubObserver();
  });

  test('onUpdateQueryKeyHash resolves skipUnauth auth errors to null without onQueryUnauthorized', () => {
    const onQueryUnauthorized = vi.fn(async () => undefined);
    const authStore = {
      get: (key: string) => {
        if (key === 'isLoading') return false;
        if (key === 'isAuthenticated') return true;
        if (key === 'onQueryUnauthorized') return onQueryUnauthorized;
        if (key === 'isUnauthorized') {
          return (error: unknown) =>
            error instanceof Error && error.message === 'unauthorized';
        }
        return;
      },
    };

    const queryClient = new QueryClient();
    const convexClient = createMockConvexClient();
    const client = new ConvexQueryClient(convexClient, {
      authStore: authStore as any,
      queryClient,
      unsubscribeDelay: 0,
    });

    const queryKey = ['convexQuery', 'user:getCurrentUser', {}] as const;
    const observer = new QueryObserver(queryClient as any, {
      meta: { authType: 'required', skipUnauth: true, subscribe: true },
      queryFn: async () => ({ ok: true }),
      queryKey,
    });
    const unsubObserver = observer.subscribe(() => {});

    const query =
      queryClient
        .getQueryCache()
        .getAll()
        .find((q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKey)) ??
      null;
    expect(query).not.toBeNull();

    client.subscriptions[(query as any).queryHash] = {
      queryKey: queryKey as any,
      getCurrentValue: () => undefined,
      unsubscribe: () => {},
      lastError: new Error('unauthorized'),
    };

    client.onUpdateQueryKeyHash((query as any).queryHash);

    expect(onQueryUnauthorized).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(queryKey as any)).toBeNull();
    expect((query as any).state.status).toBe('success');

    unsubObserver();
  });

  test('onUpdateQueryKeyHash does not call onQueryUnauthorized when already unauthenticated', () => {
    const onQueryUnauthorized = vi.fn(async () => undefined);
    const authStore = {
      get: (key: string) => {
        if (key === 'isLoading') return false;
        if (key === 'isAuthenticated') return false;
        if (key === 'onQueryUnauthorized') return onQueryUnauthorized;
        if (key === 'isUnauthorized') {
          return (error: unknown) =>
            error instanceof Error && error.message === 'unauthorized';
        }
        return;
      },
    };

    const queryClient = new QueryClient();
    const convexClient = createMockConvexClient();
    const client = new ConvexQueryClient(convexClient, {
      authStore: authStore as any,
      queryClient,
      unsubscribeDelay: 0,
    });

    const queryKey = ['convexQuery', 'todos:list', { status: 'open' }] as const;
    const observer = new QueryObserver(queryClient as any, {
      meta: { authType: 'required', subscribe: true },
      queryFn: async () => ({ ok: true }),
      queryKey,
    });
    const unsubObserver = observer.subscribe(() => {});

    const query =
      queryClient
        .getQueryCache()
        .getAll()
        .find((q) => JSON.stringify(q.queryKey) === JSON.stringify(queryKey)) ??
      null;
    expect(query).not.toBeNull();

    client.subscriptions[(query as any).queryHash] = {
      queryKey: queryKey as any,
      getCurrentValue: () => undefined,
      unsubscribe: () => {},
      lastError: new Error('unauthorized'),
    };

    client.onUpdateQueryKeyHash((query as any).queryHash);

    expect(onQueryUnauthorized).not.toHaveBeenCalled();
    expect((query as any).state.status).toBe('error');

    unsubObserver();
  });

  test('queryFn enforces authType=required on client and throws CRPCClientError', async () => {
    const onQueryUnauthorized = vi.fn(async () => undefined);
    const authStore = {
      get: (key: string) => {
        if (key === 'isLoading') return false;
        if (key === 'isAuthenticated') return false;
        if (key === 'onQueryUnauthorized') return onQueryUnauthorized;
        if (key === 'isUnauthorized') return () => false;
        return;
      },
    };

    const convexClient = createMockConvexClient();
    const queryClient = new QueryClient();
    const client = new ConvexQueryClient(convexClient, {
      authStore: authStore as any,
      queryClient,
      unsubscribeDelay: 0,
    });

    const fn = client.queryFn();
    await expect(
      fn({
        meta: { authType: 'required' },
        queryKey: ['convexQuery', 'todos:list', { status: 'open' }],
      } as unknown as QueryFunctionContext<readonly unknown[]>)
    ).rejects.toBeInstanceOf(CRPCClientError);
    await expect(
      fn({
        meta: { authType: 'required' },
        queryKey: ['convexQuery', 'todos:list', { status: 'open' }],
      } as unknown as QueryFunctionContext<readonly unknown[]>)
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      functionName: 'todos:list',
    });
    expect(onQueryUnauthorized).toHaveBeenCalledWith({
      queryName: 'todos:list',
    });
  });
});
