/** @jsxImportSource solid-js */
/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import { render, renderHook, waitFor } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  useAuthStore,
  useFetchAccessToken,
  useSafeConvexAuth,
} from './auth-store';
import { ConvexAuthProvider } from './convex-auth-provider';

const makeJwt = (
  expSecondsFromNow: number,
  claims: Record<string, unknown> = {}
) => {
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = btoa(JSON.stringify({ ...claims, exp }));
  return `x.${payload}.z`;
};

describe('ConvexAuthProvider', () => {
  let originalHref = window.location.href;

  beforeEach(() => {
    originalHref = window.location.href;
  });

  afterEach(() => {
    try {
      window.history.replaceState({}, '', originalHref);
    } catch {
      // Happy DOM may reject some URL transitions; don't let cleanup fail the suite.
    }
  });

  function makeSessionAccessor(data: unknown, isPending: boolean) {
    const [session] = createSignal({ data, isPending });
    return session;
  }

  test('provides fetchAccessToken that returns cached SSR token while session is pending', async () => {
    const initialToken = makeJwt(3600);

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = vi.fn(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => makeSessionAccessor(null, true),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: {
        oneTimeToken: {
          verify: async () => ({ data: {} }),
        },
      },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result).toBe('function');

    const fetched = await result!({ forceRefreshToken: false });

    expect(fetched).toBe(initialToken);
    expect(convexToken).toHaveBeenCalledTimes(0);
  });

  test('does not assign an unowned SSR token to the hydrated session', async () => {
    const ssrToken = makeJwt(3600, { sub: 'user-1' });
    const hydratedToken = makeJwt(7200, { sub: 'user-2' });
    let resolveHydratedToken!: (value: { data: { token: string } }) => void;
    const convexToken = vi.fn(
      () =>
        new Promise<{ data: { token: string } }>((resolve) => {
          resolveHydratedToken = resolve;
        })
    );
    const client = {
      setAuth: (
        fetchToken: (args: { forceRefreshToken: boolean }) => Promise<unknown>,
        onChange: (isAuthenticated: boolean) => void
      ) => {
        void fetchToken({ forceRefreshToken: false }).then(() =>
          onChange(true)
        );
      },
      clearAuth: () => {},
    };
    const authClient = {
      useSession: () =>
        makeSessionAccessor({ session: { id: 'session-2' } }, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={ssrToken}
      >
        {props.children}
      </ConvexAuthProvider>
    );
    const { result } = renderHook(
      () => ({ auth: useSafeConvexAuth(), store: useAuthStore() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(convexToken).toHaveBeenCalledTimes(1);
    });
    expect(result.auth.identity).toBeNull();

    resolveHydratedToken({ data: { token: hydratedToken } });

    await waitFor(() => {
      expect(result.store.get('token')).toBe(hydratedToken);
    });
    await waitFor(() => {
      expect(result.auth.identity).toBe('session-2');
    });
    expect(convexToken).toHaveBeenCalledTimes(1);
  });

  test('passes throw=false when fetching a fresh token', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const jwt = makeJwt(7200);
    const convexToken = vi.fn(async (_opts?: unknown) => ({
      data: { token: jwt },
    }));

    const authClient = {
      useSession: () =>
        makeSessionAccessor({ session: { id: 'session-1' } }, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result).toBe('function');

    const fetched = await result!({ forceRefreshToken: true });
    expect(fetched).toBe(jwt);

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
    const convexToken = vi.fn(async (_opts?: unknown) => ({
      data: { token: convexJwt },
    }));

    const authClient = {
      useSession: () =>
        makeSessionAccessor({ session: { id: 'session-1' } }, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(
      () => ({
        fetchAccessToken: useFetchAccessToken(),
        store: useAuthStore(),
      }),
      { wrapper }
    );

    result.store.set('token', 'session-token');
    result.store.set('expiresAt', null);

    const fetched = await result.fetchAccessToken!({ forceRefreshToken: true });

    expect(fetched).toBe(convexJwt);
    expect(convexToken).toHaveBeenCalledTimes(1);
    expect(convexToken).toHaveBeenCalledWith({
      fetchOptions: {
        headers: {
          Authorization: 'Bearer session-token',
        },
        throw: false,
      },
    });
  });

  test('deduplicates concurrent token fetches', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const jwt = makeJwt(7200);
    const convexToken = vi.fn(async (_opts?: unknown) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: { token: jwt } };
    });

    const authClient = {
      useSession: () =>
        makeSessionAccessor({ session: { id: 'session-1' } }, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result).toBe('function');

    const tokens = await Promise.all([
      result!({ forceRefreshToken: false }),
      result!({ forceRefreshToken: false }),
    ]);
    expect(tokens).toEqual([jwt, jwt]);
    expect(convexToken).toHaveBeenCalledTimes(1);
  });

  test('reauthenticates for identity claims, not routine token rotation', async () => {
    const sessionOneJwt = makeJwt(7200, { sub: 'user-1' });
    const sessionTwoJwt = makeJwt(7200, { sub: 'user-2' });
    const convexToken = vi
      .fn()
      .mockResolvedValueOnce({ data: { token: sessionOneJwt } })
      .mockResolvedValue({ data: { token: sessionTwoJwt } });

    const setAuthCalls: string[] = [];
    const client = {
      setAuth: (
        fetchToken: (args: { forceRefreshToken: boolean }) => Promise<unknown>
      ) => {
        setAuthCalls.push('setAuth');
        // Convex's AuthenticationManager.setConfig invokes fetchToken
        // synchronously; the reads it performs must not become effect deps.
        void fetchToken({ forceRefreshToken: false });
      },
      clearAuth: () => {},
    };

    const [session, setSession] = createSignal({
      data: { session: { id: 'session-1' } },
      isPending: false,
    });
    const authClient = {
      useSession: () => session,
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => {
      expect(result.get('token')).toBe(sessionOneJwt);
    });

    // The fetch wrote token and expiresAt. Neither flips isLoading or
    // isAuthenticated, so Convex must not be re-authenticated: every extra
    // setAuth pauses the socket and bumps the identity version, re-running
    // every live subscription server-side.
    expect(setAuthCalls).toHaveLength(1);
    expect(convexToken).toHaveBeenCalledTimes(1);

    result.set('token', makeJwt(9000, { sub: 'user-1' }));
    result.set('expiresAt', Date.now() + 9_000_000);

    expect(setAuthCalls).toHaveLength(1);

    result.set('token', makeJwt(9000, { role: 'admin', sub: 'user-1' }));

    expect(setAuthCalls).toHaveLength(2);

    setSession({
      data: { session: { id: 'session-2' } },
      isPending: false,
    });

    await waitFor(() => {
      expect(result.get('token')).toBe(sessionTwoJwt);
    });
    expect(setAuthCalls).toHaveLength(3);
    expect(convexToken).toHaveBeenCalledTimes(2);
  });

  test('does not reuse an in-flight token request across sessions', async () => {
    const sessionOneJwt = makeJwt(7200, { sub: 'user-1' });
    const sessionTwoJwt = makeJwt(7200, { sub: 'user-2' });
    let resolveSessionOne!: (value: { data: { token: string } }) => void;
    const sessionOneRequest = new Promise<{ data: { token: string } }>(
      (resolve) => {
        resolveSessionOne = resolve;
      }
    );
    const convexToken = vi
      .fn()
      .mockImplementationOnce(() => sessionOneRequest)
      .mockResolvedValue({ data: { token: sessionTwoJwt } });
    const client = {
      setAuth: (
        fetchToken: (args: { forceRefreshToken: boolean }) => Promise<unknown>
      ) => {
        void fetchToken({ forceRefreshToken: false });
      },
      clearAuth: () => {},
    };
    const [session, setSession] = createSignal({
      data: { session: { id: 'session-1' } },
      isPending: false,
    });
    const authClient = {
      useSession: () => session,
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => {
      expect(convexToken).toHaveBeenCalledTimes(1);
    });

    setSession({
      data: { session: { id: 'session-2' } },
      isPending: false,
    });

    await waitFor(() => {
      expect(convexToken).toHaveBeenCalledTimes(2);
    });

    resolveSessionOne({ data: { token: sessionOneJwt } });

    await waitFor(() => {
      expect(result.get('token')).toBe(sessionTwoJwt);
    });
  });

  test('treats empty session payload as unauthenticated', async () => {
    const initialToken = makeJwt(3600);
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = vi.fn(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => makeSessionAccessor({}, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result).toBe('function');

    const fetched = await result!({ forceRefreshToken: false });

    expect(fetched).toBeNull();
    expect(convexToken).toHaveBeenCalledTimes(0);
  });

  test('treats user-only payload as unauthenticated when session object is missing', async () => {
    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const convexToken = vi.fn(async () => ({ data: { token: makeJwt(7200) } }));

    const authClient = {
      useSession: () => makeSessionAccessor({ user: { id: 'user-1' } }, false),
      convex: { token: convexToken },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    const { result } = renderHook(() => useFetchAccessToken(), { wrapper });
    expect(typeof result).toBe('function');

    const fetched = await result!({ forceRefreshToken: false });

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
      useSession: () => makeSessionAccessor(null, false),
      convex: { token: async () => ({ data: {} }) },
      getSession: async () => null,
      updateSession: () => {},
      crossDomain: { oneTimeToken: { verify: async () => ({ data: {} }) } },
    };

    // Render a component that reads store reactively (Solid renderHook captures static snapshot)
    function AuthStateDisplay() {
      const store = useAuthStore();
      return (
        <div
          data-has-session={String(!!store.get('token'))}
          data-is-authenticated={String(store.get('isAuthenticated'))}
          data-is-loading={String(store.get('isLoading'))}
          data-testid="auth-state"
        />
      );
    }

    const { queryByTestId } = render(() => (
      <ConvexAuthProvider
        authClient={authClient as any}
        client={client as any}
        initialToken={initialToken}
      >
        <AuthStateDisplay />
      </ConvexAuthProvider>
    ));

    await waitFor(() => {
      const el = queryByTestId('auth-state');
      expect(el?.getAttribute('data-has-session')).toBe('false');
      expect(el?.getAttribute('data-is-authenticated')).toBe('false');
      expect(el?.getAttribute('data-is-loading')).toBe('false');
    });
  });

  test('verifies OTT and refreshes session, then removes ott from URL', async () => {
    const ott = 'OTT123';

    window.history.replaceState({}, '', `/?ott=${ott}`);
    let currentOtt = new URL(window.location.href).searchParams.get('ott');
    if (currentOtt !== ott) {
      try {
        window.location.href = `http://localhost/?ott=${ott}`;
      } catch {
        // Ignore
      }
      currentOtt = new URL(window.location.href).searchParams.get('ott');
    }
    expect(currentOtt).toBe(ott);

    const verify = vi.fn(async () => {
      expect(new URL(window.location.href).searchParams.get('ott')).toBeNull();
      return {
        data: { session: { token: 'SESSION_TOKEN' } },
      };
    });
    const getSession = vi.fn(async (_opts: any) => null);
    const updateSession = vi.fn(() => {});

    const client = {
      setAuth: () => {},
      clearAuth: () => {},
    };

    const authClient = {
      useSession: () => makeSessionAccessor(null, false),
      convex: { token: async () => ({ data: {} }) },
      getSession,
      updateSession,
      crossDomain: { oneTimeToken: { verify } },
    };

    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexAuthProvider authClient={authClient as any} client={client as any}>
        {props.children}
      </ConvexAuthProvider>
    );

    renderHook(() => null, { wrapper });

    // Wait for the full onMount async OTT chain to complete
    await waitFor(() => {
      expect(updateSession).toHaveBeenCalled();
    });

    expect(verify).toHaveBeenCalledWith({ token: ott });
    expect(getSession).toHaveBeenCalledWith({
      fetchOptions: { headers: { Authorization: 'Bearer SESSION_TOKEN' } },
    });

    const url = new URL(window.location.href);
    expect(url.searchParams.get('ott')).toBeNull();
  });
});
