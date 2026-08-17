/** @jsxImportSource solid-js */
/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import { render, renderHook } from '@solidjs/testing-library';
import type { AuthTokenFetcher } from 'convex/browser';
import { createSignal, type JSX } from 'solid-js';
import { describe, expect, test } from 'vitest';

import { useConvexAuthBridge } from './auth-store';
import { ConvexProviderWithAuth } from './convex-solid';

describe('ConvexProviderWithAuth', () => {
  function makeClient() {
    const setAuthCalls: AuthTokenFetcher[] = [];
    const client = {
      setAuth: (fetchToken: AuthTokenFetcher) => {
        setAuthCalls.push(fetchToken);
      },
      clearAuth: () => {},
    };
    return { client, setAuthCalls };
  }

  function renderProvider(
    client: unknown,
    useAuth: () => {
      isLoading: boolean;
      isAuthenticated: boolean;
      fetchAccessToken: AuthTokenFetcher;
    }
  ) {
    return render(() => (
      <ConvexProviderWithAuth client={client as any} useAuth={useAuth}>
        {(<div />) as JSX.Element}
      </ConvexProviderWithAuth>
    ));
  }

  test('rebinds Convex when useAuth hands back a different fetchAccessToken', () => {
    const { client, setAuthCalls } = makeClient();
    const first: AuthTokenFetcher = async () => 'token-a';
    const second: AuthTokenFetcher = async () => 'token-b';
    const [fetcher, setFetcher] = createSignal<AuthTokenFetcher>(first);

    renderProvider(client, () => ({
      isLoading: false,
      isAuthenticated: true,
      fetchAccessToken: fetcher(),
    }));

    expect(setAuthCalls).toEqual([first]);

    setFetcher(() => second);

    // Neither boolean changed, but the fetcher did. Without rebinding, Convex
    // keeps refreshing through the callback bound to the previous session.
    expect(setAuthCalls).toEqual([first, second]);
  });

  test('rebinds Convex when the account identity changes with a stable fetcher', () => {
    const { client, setAuthCalls } = makeClient();
    const fetchAccessToken: AuthTokenFetcher = async () => 'token';
    const [identity, setIdentity] = createSignal('account-a');

    renderProvider(client, () => ({
      isLoading: false,
      isAuthenticated: true,
      fetchAccessToken,
      identity: identity(),
    }));

    expect(setAuthCalls).toEqual([fetchAccessToken]);

    setIdentity('account-b');

    expect(setAuthCalls).toEqual([fetchAccessToken, fetchAccessToken]);
  });

  test('publishes identity and epoch only after Convex auth settles', () => {
    const callbacks: Array<(isAuthenticated: boolean) => void> = [];
    const client = {
      clearAuth: () => {},
      setAuth: (
        _fetchToken: AuthTokenFetcher,
        onChange: (isAuthenticated: boolean) => void
      ) => callbacks.push(onChange),
    };
    const fetchAccessToken: AuthTokenFetcher = async () => 'token';
    const [identity, setIdentity] = createSignal('account-a');
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexProviderWithAuth
        client={client as any}
        useAuth={() => ({
          fetchAccessToken,
          identity: identity(),
          isAuthenticated: true,
          isLoading: false,
        })}
      >
        {props.children}
      </ConvexProviderWithAuth>
    );

    const { result } = renderHook(() => useConvexAuthBridge(), { wrapper });

    expect(result?.identity).toBeNull();
    expect((result as any)?.authEpoch).toBe(0);
    expect(result?.isLoading).toBe(true);

    callbacks[0](true);

    expect(result?.identity).toBe('account-a');
    expect((result as any)?.authEpoch).toBe(1);
    expect(result?.isLoading).toBe(false);

    setIdentity('account-b');

    expect(result?.identity).toBe('account-a');
    expect((result as any)?.authEpoch).toBe(1);
    expect(result?.isLoading).toBe(true);

    callbacks[1](true);

    expect(result?.identity).toBe('account-b');
    expect((result as any)?.authEpoch).toBe(2);
    expect(result?.isLoading).toBe(false);
  });

  test('ignores settlement callbacks from a superseded auth binding', () => {
    const callbacks: Array<(isAuthenticated: boolean) => void> = [];
    const client = {
      clearAuth: () => {},
      setAuth: (
        _fetchToken: AuthTokenFetcher,
        onChange: (isAuthenticated: boolean) => void
      ) => callbacks.push(onChange),
    };
    const fetchAccessToken: AuthTokenFetcher = async () => 'token';
    const [identity, setIdentity] = createSignal('account-a');
    const wrapper = (props: { children: JSX.Element }) => (
      <ConvexProviderWithAuth
        client={client as any}
        useAuth={() => ({
          fetchAccessToken,
          identity: identity(),
          isAuthenticated: true,
          isLoading: false,
        })}
      >
        {props.children}
      </ConvexProviderWithAuth>
    );

    const { result } = renderHook(() => useConvexAuthBridge(), { wrapper });

    setIdentity('account-b');
    callbacks[0](true);

    expect(result?.identity).toBeNull();
    expect((result as any)?.authEpoch).toBe(0);
    expect(result?.isLoading).toBe(true);

    callbacks[1](true);

    expect(result?.identity).toBe('account-b');
    expect((result as any)?.authEpoch).toBe(1);
    expect(result?.isLoading).toBe(false);
  });

  test('does not rebind when a token write leaves the fetcher identity alone', () => {
    const { client, setAuthCalls } = makeClient();
    const [token, setToken] = createSignal('token-a');
    const fetchAccessToken: AuthTokenFetcher = async () => token();

    renderProvider(client, () => {
      // A real `useAuth` reads the stored JWT while deriving its booleans.
      token();
      return {
        isLoading: false,
        isAuthenticated: true,
        fetchAccessToken,
        identity: 'account-a',
      };
    });

    expect(setAuthCalls).toHaveLength(1);

    setToken('token-b');

    // Every extra setAuth pauses the socket and bumps the Convex identity
    // version, which re-runs every live subscription server-side.
    expect(setAuthCalls).toHaveLength(1);
  });
});
