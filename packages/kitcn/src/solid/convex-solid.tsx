/** @jsxImportSource solid-js */

/**
 * Convex Provider for SolidJS
 *
 * Provides ConvexClient via context and auth integration.
 */

import type { AuthTokenFetcher, ConvexClient } from 'convex/browser';
import {
  batch,
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
      /** Stable account/session identity. Token refreshes must keep this value. */
      identity?: string | null;
      isLoading: boolean;
      isAuthenticated: boolean;
      fetchAccessToken: AuthTokenFetcher;
    };
  }>
) {
  const client = props.client as unknown as IConvexClient;
  const [authEpoch, setAuthEpoch] = createSignal(0);
  const [convexIdentity, setConvexIdentity] = createSignal<unknown>(null);
  const [isConvexLoading, setIsConvexLoading] = createSignal(true);
  const [isConvexAuthenticated, setIsConvexAuthenticated] = createSignal(false);

  const settleAuth = (nextIdentity: unknown, isAuthenticated: boolean) => {
    batch(() => {
      setConvexIdentity(nextIdentity);
      setAuthEpoch((epoch) => epoch + 1);
      setIsConvexAuthenticated(isAuthenticated);
      setIsConvexLoading(false);
    });
  };

  // Memoize the provider's booleans, fetcher, and stable identity separately so
  // a token-only write stops here. Run the body through `on` so the synchronous
  // `fetchAccessToken` call inside `setAuth` cannot add the JWT and expiry as
  // dependencies. Both leaks re-enter `setAuth`, pause the socket, and
  // re-execute every live subscription server-side.
  //
  // `fetchAccessToken` is a source, not just a value read in the body: a custom
  // `useAuth` may hand back a new fetcher when its session state changes, and
  // Convex would otherwise keep refreshing through the fetcher bound to the
  // previous account. Memo equality is referential, so a fetcher that stays the
  // same function across a token write still stops here.
  const authSnapshot = createMemo(() => props.useAuth(), undefined, {
    equals: false,
  });
  const isAuthLoading = createMemo(() => authSnapshot().isLoading);
  const isAuthenticated = createMemo(() => authSnapshot().isAuthenticated);
  const fetchAccessToken = createMemo(() => authSnapshot().fetchAccessToken);
  const identity = createMemo(() => {
    const snapshot = authSnapshot();
    // Existing custom providers do not publish an identity. Preserve their
    // safe legacy behavior: any reactive auth change rebinds Convex. Providers
    // that supply a stable identity avoid rebinding for token-only writes.
    return snapshot.identity === undefined
      ? Symbol('legacy-auth-transition')
      : snapshot.identity;
  });

  createEffect(
    on([isAuthLoading, isAuthenticated, fetchAccessToken, identity], () => {
      if (isAuthLoading()) {
        setIsConvexLoading(true);
        return;
      }

      const nextIdentity = identity();
      setIsConvexLoading(true);

      if (!isAuthenticated()) {
        client.clearAuth();
        settleAuth(nextIdentity, false);
        return;
      }

      client.setAuth(fetchAccessToken(), (isAuth: boolean) => {
        settleAuth(nextIdentity, isAuth);
      });
    })
  );

  onCleanup(() => {
    client.clearAuth();
  });

  return (
    <ConvexContext.Provider value={props.client}>
      <ConvexAuthBridge
        authEpoch={authEpoch()}
        identity={convexIdentity()}
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
