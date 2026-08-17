import { act, render, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { AuthStore } from '../react/auth-store';
import {
  decodeJwtExp,
  useAuth,
  useAuthStore,
  useConvexAuthRecovery,
  useFetchAccessToken,
} from '../react/auth-store';
import { ConvexAuthProvider } from './convex-auth-provider';

const makeJwt = (expSecondsFromNow: number) => {
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = btoa(JSON.stringify({ exp }));
  return `x.${payload}.z`;
};

// Fake timers move Date.now() too, so the grace window closes without the test
// spending ten real seconds on it. Stepping a second at a time lets React flush
// between the awaited backoff and the next probe.
const advanceSeconds = async (seconds: number) => {
  for (let step = 0; step < seconds; step += 1) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
  }
};

describe('ConvexAuthProvider', () => {
  let originalHref = window.location.href;

  beforeEach(() => {
    originalHref = window.location.href;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    try {
      window.history.replaceState({}, '', originalHref);
    } catch {
      // Happy DOM may reject some URL transitions; don't let cleanup fail the suite.
    }
  });

  test('recovers Better Auth after a transient token refresh failure', async () => {
    const bindings: Array<{
      fetchToken: (args: {
        forceRefreshToken: boolean;
      }) => Promise<string | null>;
      onChange: (isAuthenticated: boolean) => void;
    }> = [];
    const client = {
      clearAuth: mock(() => {}),
      setAuth: mock(
        (
          fetchToken: (args: {
            forceRefreshToken: boolean;
          }) => Promise<string | null>,
          onChange: (isAuthenticated: boolean) => void
        ) => {
          bindings.push({ fetchToken, onChange });
        }
      ),
    };
    const recoveredToken = makeJwt(7200);
    const token = mock()
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { token: recoveredToken } });
    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    let recovery: ReturnType<typeof useConvexAuthRecovery> | undefined;
    expect(() => {
      renderHook(
        () => {
          recovery = useConvexAuthRecovery();
        },
        { wrapper }
      );
    }).not.toThrow();

    await waitFor(() => {
      expect(bindings).toHaveLength(1);
    });
    let failedToken: string | null = null;
    await act(async () => {
      failedToken = await bindings[0]!.fetchToken({
        forceRefreshToken: true,
      });
    });
    expect(failedToken).toBeNull();
    act(() => {
      bindings[0]!.onChange(false);
    });

    let recovered!: Promise<void>;
    act(() => {
      recovered = recovery!.recover({ timeoutMs: 1_000 });
    });
    await waitFor(() => {
      expect(bindings).toHaveLength(2);
    });
    let freshToken: string | null = null;
    await act(async () => {
      freshToken = await bindings[1]!.fetchToken({
        forceRefreshToken: false,
      });
    });
    expect(freshToken).toBe(recoveredToken);
    act(() => {
      bindings[1]!.onChange(true);
    });

    await expect(recovered).resolves.toBeUndefined();
    expect(token).toHaveBeenCalledTimes(2);
  });

  test('syncs ConvexQueryClient with the auth store before children render', () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authClient = {
      useSession: () => ({ data: null, isPending: true }),
      convex: { token: mock(async () => ({ data: { token: makeJwt(7200) } })) },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    let syncedStore: ReturnType<typeof useAuthStore> | undefined;
    const convexQueryClient = {
      updateAuthStore: mock((authStore: ReturnType<typeof useAuthStore>) => {
        syncedStore = authStore;
      }),
    };

    function StoreProbe() {
      const authStore = useAuthStore();
      expect(syncedStore?.store).toBe(authStore.store);
      return null;
    }

    render(
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        convexQueryClient={convexQueryClient}
      >
        <StoreProbe />
      </ConvexAuthProvider>
    );

    expect(convexQueryClient.updateAuthStore).toHaveBeenCalled();
  });

  test('provides fetchAccessToken that returns cached SSR token while session is pending', async () => {
    const initialToken = makeJwt(3600);

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = mock(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => ({ data: null, isPending: true }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current!({ forceRefreshToken: false });
    });

    // Assignment happens inside `act` callback; widen back to the declared union.
    expect(fetched as string | null).toBe(initialToken);
    expect(convexToken).toHaveBeenCalledTimes(0);
  });

  test('fetches a fresh token when forceRefreshToken=true while session is pending', async () => {
    const initialToken = makeJwt(3600);
    const freshToken = makeJwt(7200);

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = mock(async () => ({ data: { token: freshToken } }));

    const authClient = {
      useSession: () => ({ data: null, isPending: true }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current!({ forceRefreshToken: true });
    });

    expect(fetched as string | null).toBe(freshToken);
    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: { throw: false },
    });
  });

  test('falls back to SSR token when forced refresh fails while session is pending', async () => {
    const initialToken = makeJwt(3600);

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = mock(async () => ({ data: {} }));

    const authClient = {
      useSession: () => ({ data: null, isPending: true }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    let forcedFetched: string | null = null;
    await act(async () => {
      forcedFetched = await result.current!({ forceRefreshToken: true });
    });

    let nonForcedFetched: string | null = null;
    await act(async () => {
      nonForcedFetched = await result.current!({ forceRefreshToken: false });
    });

    expect(forcedFetched as string | null).toBe(initialToken);
    expect(nonForcedFetched as string | null).toBe(initialToken);
    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: { throw: false },
    });
  });

  test('retries forced refresh when pending in-flight refresh resolves null', async () => {
    const initialToken = makeJwt(3600);
    const freshToken = makeJwt(7200);

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    let callCount = 0;
    let resolveFirstCallGate!: () => void;
    const firstCallGate = new Promise<void>((resolve) => {
      resolveFirstCallGate = resolve;
    });

    const convexToken = mock(async () => {
      callCount += 1;
      if (callCount === 1) {
        await firstCallGate;
        return { data: {} };
      }
      return { data: { token: freshToken } };
    });

    const authClient = {
      useSession: () => ({ data: null, isPending: true }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    const firstForcedPromise = result.current!({ forceRefreshToken: true });
    await Promise.resolve();
    const secondForcedPromise = result.current!({ forceRefreshToken: true });

    resolveFirstCallGate();

    let firstResult: string | null = null;
    let secondResult: string | null = null;
    await act(async () => {
      firstResult = await firstForcedPromise;
      secondResult = await secondForcedPromise;
    });

    expect(firstResult as string | null).toBe(initialToken);
    expect(secondResult as string | null).toBe(freshToken);
    expect(convexToken).toHaveBeenCalledTimes(2);
  });

  test('passes throw=false when fetching a fresh token', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const jwt = makeJwt(7200);
    const convexToken = mock(async (_opts?: unknown) => ({
      data: { token: jwt },
    }));

    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    await act(async () => {
      const fetched = await result.current!({ forceRefreshToken: true });
      expect(fetched).toBe(jwt);
    });

    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: { throw: false },
    });
  });

  test('passes the cached session token as bearer auth when it is not a JWT', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexJwt = makeJwt(7200);
    const convexToken = mock(async (_opts?: unknown) => ({
      data: { token: convexJwt },
    }));

    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(
      () => ({
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.store.set('token', 'session-token');
      result.current.store.set('expiresAt', null);
    });

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current.fetchAccessToken!({
        forceRefreshToken: true,
      });
    });

    expect(fetched as string | null).toBe(convexJwt);
    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: {
        credentials: 'omit',
        headers: {
          Authorization: 'Bearer session-token',
        },
        throw: false,
      },
    });
  });

  test('rehydrates auth from a persisted session token fallback on reload', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const sessionAtomState = {
      data: null as unknown,
      error: null as unknown,
      isPending: false,
      isRefetching: false,
      refetch: async () => {},
    };
    const sessionAtom = {
      get: () => sessionAtomState,
      set: mock((value: typeof sessionAtomState) => {
        sessionAtomState.data = value.data;
        sessionAtomState.error = value.error;
        sessionAtomState.isPending = value.isPending;
        sessionAtomState.isRefetching = value.isRefetching;
        sessionAtomState.refetch = value.refetch;
      }),
    };

    const authFetch = mock(async () => ({
      data: {
        session: { id: 'session-1' },
        user: { email: 'persisted@example.com' },
      },
    }));

    const authClient = {
      $store: { atoms: { session: sessionAtom } },
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: makeJwt(7200) } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    renderHook(
      () => ({
        auth: useAuth(),
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(authFetch).toHaveBeenCalledWith('/get-session', {
      credentials: 'omit',
      headers: {
        Authorization: 'Bearer persisted-session-token',
      },
    });
    // A live token costs exactly one immediate request, with no pre-delay.
    expect(authFetch).toHaveBeenCalledTimes(1);
  });

  test('clears seeded session atom when persisted token recheck fails', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );
    window.sessionStorage.setItem(
      'kitcn.auth.session-data',
      JSON.stringify({
        session: { id: 'session-1' },
        user: { email: 'persisted@example.com' },
      })
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const sessionAtomState = {
      data: null as unknown,
      error: null as unknown,
      isPending: false,
      isRefetching: false,
      refetch: async () => {},
    };
    const sessionAtom = {
      get: () => sessionAtomState,
      set: mock((value: typeof sessionAtomState) => {
        sessionAtomState.data = value.data;
        sessionAtomState.error = value.error;
        sessionAtomState.isPending = value.isPending;
        sessionAtomState.isRefetching = value.isRefetching;
        sessionAtomState.refetch = value.refetch;
      }),
    };

    const authFetch = mock(async () => ({ data: null }));
    const authClient = {
      $store: { atoms: { session: sessionAtom } },
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: makeJwt(7200) } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(sessionAtomState.data).toBeNull();
    expect(
      window.sessionStorage.getItem('kitcn.auth.session-token')
    ).toBeNull();
    expect(window.sessionStorage.getItem('kitcn.auth.session-data')).toBeNull();
    // 200 with a null body is definitive: no retry storm.
    expect(authFetch).toHaveBeenCalledTimes(1);
  });

  test('keeps the persisted token when every session recheck fails in transport', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );
    window.sessionStorage.setItem(
      'kitcn.auth.session-data',
      JSON.stringify({
        session: { id: 'session-1' },
        user: { email: 'persisted@example.com' },
      })
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const sessionAtomState = {
      data: null as unknown,
      error: null as unknown,
      isPending: false,
      isRefetching: false,
      refetch: async () => {},
    };
    const sessionAtom = {
      get: () => sessionAtomState,
      set: mock((value: typeof sessionAtomState) => {
        sessionAtomState.data = value.data;
        sessionAtomState.error = value.error;
        sessionAtomState.isPending = value.isPending;
        sessionAtomState.isRefetching = value.isRefetching;
        sessionAtomState.refetch = value.refetch;
      }),
    };

    const authFetch = mock(async () => ({
      data: null,
      error: { status: 0, statusText: 'Failed to fetch' },
    }));
    const authClient = {
      $store: { atoms: { session: sessionAtom } },
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: makeJwt(7200) } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });

    const token = window.sessionStorage.getItem('kitcn.auth.session-token');
    const data = window.sessionStorage.getItem('kitcn.auth.session-data');

    // A dropped request must not sign the user out.
    expect(token).toBe('persisted-session-token');
    expect(data).not.toBeNull();
    expect(authFetch).toHaveBeenCalledTimes(3);
  });

  test('resolves the auth state when the grace window closes with no answer', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authFetch = mock(async () => ({
      data: null,
      error: { status: 0, statusText: 'Failed to fetch' },
    }));
    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    jest.useFakeTimers();
    let result: {
      current: { auth: ReturnType<typeof useAuth>; store: AuthStore };
    };
    try {
      result = renderHook(() => ({ auth: useAuth(), store: useAuthStore() }), {
        wrapper,
      }).result;

      // Well past AUTH_SESSION_SYNC_GRACE_MS.
      await advanceSeconds(40);
    } finally {
      jest.useRealTimers();
    }

    // The optimistic state the restore created must not outlive its own grace
    // window, or the app hangs on `isLoading` forever.
    expect(result.current.auth.isLoading).toBe(false);
    expect(result.current.auth.isAuthenticated).toBe(false);
    expect(result.current.store.get('token')).toBeNull();
    expect(result.current.store.get('sessionSyncGraceUntil')).toBeNull();
    // The credential still survives, so the next mount can retry it.
    expect(window.sessionStorage.getItem('kitcn.auth.session-token')).toBe(
      'persisted-session-token'
    );
  });

  test('restores the session in the same mount when the transport recovers', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const restored = {
      session: { id: 'session-1' },
      user: { email: 'persisted@example.com' },
    };
    let online = false;
    const authFetch = mock(async () =>
      online
        ? { data: restored }
        : { data: null, error: { status: 0, statusText: 'Failed to fetch' } }
    );
    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    jest.useFakeTimers();
    let result: {
      current: { auth: ReturnType<typeof useAuth>; store: AuthStore };
    };
    try {
      result = renderHook(() => ({ auth: useAuth(), store: useAuthStore() }), {
        wrapper,
      }).result;

      await advanceSeconds(3);
      online = true;
      await advanceSeconds(4);
    } finally {
      jest.useRealTimers();
    }

    // Connectivity returned inside the window, so no remount is needed.
    expect(window.sessionStorage.getItem('kitcn.auth.session-data')).toBe(
      JSON.stringify(restored)
    );
    expect(result.current.store.get('token')).toBe('persisted-session-token');
  });

  test('stops the persisted-token recovery once a Convex JWT takes over', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authFetch = mock(async () => ({
      data: null,
      error: { status: 0, statusText: 'Failed to fetch' },
    }));
    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const jwt = makeJwt(7200);
    jest.useFakeTimers();
    let result: {
      current: { auth: ReturnType<typeof useAuth>; store: AuthStore };
    };
    let callsAtTakeover = 0;
    try {
      result = renderHook(() => ({ auth: useAuth(), store: useAuthStore() }), {
        wrapper,
      }).result;

      await advanceSeconds(2);
      // Stand in for fetchAccessToken exchanging the opaque token for a JWT.
      await act(async () => {
        result.current.store.set('token', jwt);
        result.current.store.set('expiresAt', decodeJwtExp(jwt));
        result.current.store.set('sessionSyncGraceUntil', null);
      });
      callsAtTakeover = authFetch.mock.calls.length;
      await advanceSeconds(40);
    } finally {
      jest.useRealTimers();
    }

    // The restore stands down instead of racing the live token.
    expect(authFetch).toHaveBeenCalledTimes(callsAtTakeover);
    expect(result.current.store.get('token')).toBe(jwt);
  });

  test('ignores a restored session after the persisted token loses ownership', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };
    const restored = {
      session: { id: 'stale-session' },
      user: { email: 'stale@example.com' },
    };
    let resolveFetch!: (value: { data: typeof restored }) => void;
    const authFetch = mock(
      () =>
        new Promise<{ data: typeof restored }>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.set('token', null);
      result.current.set('expiresAt', null);
      result.current.set('sessionSyncGraceUntil', null);
    });
    await act(async () => {
      resolveFetch({ data: restored });
      await Promise.resolve();
    });

    expect(result.current.get('token')).toBeNull();
    expect(window.sessionStorage.getItem('kitcn.auth.session-data')).toBeNull();
  });

  test('accepts a restored session when the seeded session was cloned', async () => {
    const persisted = {
      session: { id: 'persisted-session' },
      user: { email: 'persisted@example.com' },
    };
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );
    window.sessionStorage.setItem(
      'kitcn.auth.session-data',
      JSON.stringify(persisted)
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };
    const restored = {
      session: { id: 'persisted-session' },
      user: { email: 'fresh@example.com' },
    };
    let currentSession: unknown = null;
    let resolveFetch!: (value: { data: typeof restored }) => void;
    const authFetch = mock(
      () =>
        new Promise<{ data: typeof restored }>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const sessionAtom = {
      get: () => ({ refetch: async () => {} }),
      set: mock((value: { data: unknown }) => {
        currentSession = structuredClone(value.data);
      }),
    };
    const authClient = {
      $store: { atoms: { session: sessionAtom } },
      useSession: () => ({ data: currentSession, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );
    const { rerender } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1));
    rerender();
    await act(async () => {
      resolveFetch({ data: restored });
      await Promise.resolve();
    });

    expect(window.sessionStorage.getItem('kitcn.auth.session-data')).toBe(
      JSON.stringify(restored)
    );
  });

  test('ignores a restored session after a different session takes over', async () => {
    const persisted = {
      session: { id: 'persisted-session' },
      user: { email: 'persisted@example.com' },
    };
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );
    window.sessionStorage.setItem(
      'kitcn.auth.session-data',
      JSON.stringify(persisted)
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };
    const stale = {
      session: { id: 'persisted-session' },
      user: { email: 'stale@example.com' },
    };
    let currentSession: unknown = null;
    let resolveFetch!: (value: { data: typeof stale }) => void;
    const authFetch = mock(
      () =>
        new Promise<{ data: typeof stale }>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const authClient = {
      useSession: () => ({ data: currentSession, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );
    const { rerender } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1));
    currentSession = {
      session: { id: 'new-session' },
      user: { email: 'new@example.com' },
    };
    rerender();
    await act(async () => {
      resolveFetch({ data: stale });
      await Promise.resolve();
    });

    expect(window.sessionStorage.getItem('kitcn.auth.session-data')).toBe(
      JSON.stringify(persisted)
    );
  });

  test('expires persisted-token recovery when a request never settles', async () => {
    window.sessionStorage.setItem(
      'kitcn.auth.session-token',
      'persisted-session-token'
    );

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };
    const authFetch = mock(() => new Promise(() => {}));
    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      $fetch: authFetch,
      convex: { token: mock(async () => ({ data: { token: null } })) },
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    jest.useFakeTimers();
    let result: {
      current: { auth: ReturnType<typeof useAuth>; store: AuthStore };
    };
    try {
      result = renderHook(() => ({ auth: useAuth(), store: useAuthStore() }), {
        wrapper,
      }).result;
      await advanceSeconds(40);
    } finally {
      jest.useRealTimers();
    }

    expect(result.current.auth.isLoading).toBe(false);
    expect(result.current.store.get('token')).toBeNull();
    expect(result.current.store.get('sessionSyncGraceUntil')).toBeNull();
    expect(authFetch).toHaveBeenCalledTimes(1);
  });

  test('keeps a cached JWT when a later token refresh returns null', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const firstJwt = makeJwt(7200);
    const convexToken = mock(async () => ({ data: { token: firstJwt } }));

    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(
      () => ({
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    await act(async () => {
      const fetched = await result.current.fetchAccessToken!({
        forceRefreshToken: true,
      });
      expect(fetched).toBe(firstJwt);
    });

    convexToken.mockImplementationOnce(async () => ({ data: {} }));

    await act(async () => {
      const fetched = await result.current.fetchAccessToken!({
        forceRefreshToken: true,
      });
      expect(fetched).toBe(firstJwt);
    });

    expect(result.current.store.get('token')).toBe(firstJwt);
  });

  test('does not fall back to an expired cached JWT when refresh returns null', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const expiredJwt = makeJwt(-60);
    const convexToken = mock(async () => ({ data: {} }));

    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(
      () => ({
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    act(() => {
      result.current.store.set('token', expiredJwt);
      result.current.store.set('expiresAt', decodeJwtExp(expiredJwt));
    });

    let fetched: string | null = 'placeholder';
    await act(async () => {
      fetched = await result.current.fetchAccessToken!({
        forceRefreshToken: true,
      });
    });

    expect(fetched as string | null).toBeNull();
    expect(result.current.store.get('token')).toBeNull();
    expect(result.current.store.get('expiresAt')).toBeNull();
  });

  test('deduplicates concurrent token fetches', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const jwt = makeJwt(7200);
    const convexToken = mock(async (_opts?: unknown) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: { token: jwt } };
    });

    const authClient = {
      useSession: () => ({
        data: { session: { id: 'session-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    await act(async () => {
      const tokens = (await Promise.all([
        result.current!({ forceRefreshToken: false }),
        result.current!({ forceRefreshToken: false }),
      ])) as Array<string | null>;
      expect(tokens).toEqual([jwt, jwt]);
    });
    expect(convexToken).toHaveBeenCalledTimes(1);
  });

  test('treats empty session payload as unauthenticated', async () => {
    const initialToken = makeJwt(3600);
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = mock(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => ({ data: {}, isPending: false }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current!({ forceRefreshToken: false });
    });

    expect(fetched).toBeNull();
    expect(convexToken).toHaveBeenCalledTimes(0);
  });

  test('treats user-only payload as unauthenticated when session object is missing', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = mock(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => ({
        data: { user: { id: 'user-1' } },
        isPending: false,
      }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result.current).toBe('function');

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current!({ forceRefreshToken: false });
    });

    expect(fetched).toBeNull();
    expect(convexToken).toHaveBeenCalledTimes(0);
  });

  test('useAuth reports unauthenticated when session is confirmed missing, even with SSR token', async () => {
    const initialToken = makeJwt(3600);
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      convex: { token: async () => ({ data: {} }) },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.hasSession).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('exchanges a freshly seeded session token for a Convex JWT while session sync catches up', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexJwt = makeJwt(7200);
    const convexToken = mock(async () => ({ data: { token: convexJwt } }));

    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(
      () => ({
        auth: useAuth(),
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.store.set('token', 'session-token');
      result.current.store.set('expiresAt', null);
      result.current.store.set('sessionSyncGraceUntil', Date.now() + 5_000);
    });

    let fetched: string | null = null;
    await act(async () => {
      fetched = await result.current.fetchAccessToken!({
        forceRefreshToken: false,
      });
    });

    expect(fetched).toBe(convexJwt);
    expect(result.current.store.get('token')).toBe(convexJwt);
    expect(result.current.auth.hasSession).toBe(true);
    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: {
        credentials: 'omit',
        headers: {
          Authorization: 'Bearer session-token',
        },
        throw: false,
      },
    });
  });

  test('verifies OTT and refreshes session, then removes ott from the URL', async () => {
    const ott = 'OTT123';

    window.history.replaceState({}, '', `/?ott=${ott}`);
    let currentOtt = new URL(window.location.href).searchParams.get('ott');
    if (currentOtt !== ott) {
      try {
        window.location.href = `http://localhost/?ott=${ott}`;
      } catch {
        // Ignore - we'll assert based on actual href below.
      }
      currentOtt = new URL(window.location.href).searchParams.get('ott');
    }
    expect(currentOtt).toBe(ott);

    const verify = mock(async () => {
      expect(new URL(window.location.href).searchParams.get('ott')).toBeNull();
      return {
        data: { session: { token: 'SESSION_TOKEN' } },
      };
    });
    const getSession = mock(async (_opts: any) => null);
    const updateSession = mock(() => {});

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authClient = {
      useSession: () => ({ data: null, isPending: false }),
      convex: { token: async () => ({ data: {} }) },
      getSession,
      updateSession,
      crossDomain: { oneTimeToken: { verify } },
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {children}
      </ConvexAuthProvider>
    );

    renderHook(() => null, { wrapper });

    // Flush the async IIFE started in useEffect().
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(verify.mock.calls.length).toBeGreaterThan(0);
    expect(verify).toHaveBeenCalledWith({ token: ott });
    expect(getSession.mock.calls.length).toBeGreaterThan(0);
    expect(getSession).toHaveBeenCalledWith({
      fetchOptions: {
        credentials: 'omit',
        headers: { Authorization: 'Bearer SESSION_TOKEN' },
      },
    });
    expect(updateSession.mock.calls.length).toBeGreaterThan(0);

    const url = new URL(window.location.href);
    expect(url.searchParams.get('ott')).toBeNull();
  });
});
