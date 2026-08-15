/** @jsxImportSource solid-js */

/**
 * Convex Provider for SolidJS
 *
 * Provides ConvexClient via context and auth integration.
 */

import type { AuthTokenFetcher, ConvexClient } from 'convex/browser';
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  type ParentProps,
  useContext,
} from 'solid-js';

import { ConvexAuthBridge, useConvexAuthBridge } from './auth-store';

type IConvexClient = {
  setAuth(
    fetchToken: AuthTokenFetcher,
    onChange?: (isAuthenticated: boolean) => void
  ): void;
  clearAuth(): void;
};

// ============================================================================
// Convex Context
// ============================================================================

const ConvexContext = createContext<ConvexClient>();

/** Get the ConvexClient instance from context */
export function useConvex(): ConvexClient {
  const client = useContext(ConvexContext);
  if (!client) {
    throw new Error('useConvex must be used within a ConvexProvider');
  }
  return client;
}

// ============================================================================
// ConvexProvider (basic, no auth)
// ============================================================================

export function ConvexProvider(
  props: ParentProps<{
    client: ConvexClient;
  }>
) {
  return (
    <ConvexContext.Provider value={props.client}>
      {props.children}
    </ConvexContext.Provider>
  );
}

// ============================================================================
// ConvexProviderWithAuth
// ============================================================================

export function ConvexProviderWithAuth(
  props: ParentProps<{
    client: ConvexClient;
    useAuth: () => {
      isLoading: boolean;
      isAuthenticated: boolean;
      fetchAccessToken: AuthTokenFetcher;
    };
  }>
) {
  const client = props.client as unknown as IConvexClient;
  const [isConvexLoading, setIsConvexLoading] = createSignal(true);
  const [isConvexAuthenticated, setIsConvexAuthenticated] = createSignal(false);

  // The provider's contract with `useAuth` is two booleans plus a stable
  // fetcher. Memoize the booleans so a token write that does not flip either
  // one stops here, and run the body through `on` so the synchronous
  // `fetchAccessToken` call inside `setAuth` cannot add its own reads (the
  // JWT and its expiry) as dependencies. Both leaks re-enter `setAuth`, and
  // each re-entry pauses the socket and bumps the Convex identity version,
  // which re-executes every live subscription server-side.
  const isAuthLoading = createMemo(() => props.useAuth().isLoading);
  const isAuthenticated = createMemo(() => props.useAuth().isAuthenticated);

  createEffect(
    on([isAuthLoading, isAuthenticated], () => {
      if (isAuthLoading()) return;

      if (!isAuthenticated()) {
        client.clearAuth();
        setIsConvexLoading(false);
        setIsConvexAuthenticated(false);
        return;
      }

      client.setAuth(props.useAuth().fetchAccessToken, (isAuth: boolean) => {
        setIsConvexLoading(false);
        setIsConvexAuthenticated(isAuth);
      });
    })
  );

  onCleanup(() => {
    client.clearAuth();
  });

  return (
    <ConvexContext.Provider value={props.client}>
      <ConvexAuthBridge
        isAuthenticated={isConvexAuthenticated()}
        isLoading={isConvexLoading()}
      >
        {props.children}
      </ConvexAuthBridge>
    </ConvexContext.Provider>
  );
}

// ============================================================================
// useConvexAuth
// ============================================================================

/** Hook returning auth state from Convex */
export function useConvexAuth(): {
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const bridge = useConvexAuthBridge();
  if (!bridge) {
    return { isLoading: false, isAuthenticated: false };
  }
  return bridge;
}
