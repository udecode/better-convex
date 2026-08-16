/** @jsxImportSource solid-js */
/** biome-ignore-all lint/suspicious/noExplicitAny: testing */

import { render } from '@solidjs/testing-library';
import type { AuthTokenFetcher } from 'convex/browser';
import { createSignal, type JSX } from 'solid-js';
import { describe, expect, test } from 'vitest';

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
      };
    });

    expect(setAuthCalls).toHaveLength(1);

    setToken('token-b');

    // Every extra setAuth pauses the socket and bumps the Convex identity
    // version, which re-runs every live subscription server-side.
    expect(setAuthCalls).toHaveLength(1);
  });
});
