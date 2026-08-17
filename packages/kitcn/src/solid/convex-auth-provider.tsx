/** @jsxImportSource solid-js */

/**
 * Unified Convex + Better Auth provider for SolidJS
 *
 * Port of the React ConvexAuthProvider to SolidJS.
 * Handles token sync and auth callbacks.
 */

import type { ConvexClient } from 'convex/browser';
import { createEffect, type JSX, onMount, type ParentProps } from 'solid-js';

import { CRPCClientError, defaultIsUnauthorized } from '../crpc/error';
import { decodeJwtIdentity } from '../internal/jwt';
import {
  AuthProvider,
  decodeJwtExp,
  FetchAccessTokenContext,
  useAuthStore,
} from './auth-store';
import { ConvexProviderWithAuth, useConvexAuth } from './convex-solid';
import type { SolidAuthProviderClient } from './types';

type AuthGetSession = (options?: {
  fetchOptions?: {
    credentials?: RequestCredentials;
    headers?: Record<string, string>;
  };
}) => Promise<unknown> | unknown;

export type ConvexAuthProviderProps = {
  children: JSX.Element;
  /** Convex client instance */
  client: ConvexClient;
  /** Better Auth client instance */
  authClient: SolidAuthProviderClient;
  /** Initial session token (from SSR) */
  initialToken?: string;
  /** Callback when mutation called while unauthorized */
  onMutationUnauthorized?: () => void;
  /** Callback when query called while unauthorized */
  onQueryUnauthorized?: (info: { queryName: string }) => void;
  /** Custom function to detect UNAUTHORIZED errors. Default checks code property. */
  isUnauthorized?: (error: unknown) => boolean;
};

const defaultMutationHandler = () => {
  throw new CRPCClientError({
    code: 'UNAUTHORIZED',
    functionName: 'mutation',
  });
};

const hasActiveSessionData = (session: unknown) => {
  if (!session || typeof session !== 'object') {
    return false;
  }
  return Boolean((session as { session?: unknown }).session);
};

const getSessionId = (sessionData: unknown): string | undefined => {
  if (!sessionData || typeof sessionData !== 'object') {
    return;
  }
  const session = (sessionData as { session?: unknown }).session;
  if (!session || typeof session !== 'object') {
    return;
  }
  const id = (session as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
};

/**
 * Unified auth provider for Convex + Better Auth (SolidJS).
 * Handles token sync and auth callbacks.
 *
 * Structure: AuthProvider wraps ConvexAuthProviderInner so that
 * useAuthStore() is available when creating fetchAccessToken.
 */
export function ConvexAuthProvider(props: ConvexAuthProviderProps) {
  useOTTHandler(props.authClient);

  const tokenValues = () => ({
    expiresAt: props.initialToken ? decodeJwtExp(props.initialToken) : null,
    token: props.initialToken ?? null,
  });

  return (
    <AuthProvider
      initialValues={tokenValues()}
      isUnauthorized={props.isUnauthorized ?? defaultIsUnauthorized}
      onMutationUnauthorized={
        props.onMutationUnauthorized ?? defaultMutationHandler
      }
      onQueryUnauthorized={props.onQueryUnauthorized ?? (() => {})}
    >
      <ConvexAuthProviderInner
        authClient={props.authClient}
        client={props.client}
      >
        {props.children}
      </ConvexAuthProviderInner>
    </AuthProvider>
  );
}

/**
 * Inner provider that has access to AuthStore via useAuthStore().
 * Creates fetchAccessToken and passes it through context.
 */
function ConvexAuthProviderInner(
  props: ParentProps<{
    client: ConvexClient;
    authClient: SolidAuthProviderClient;
  }>
) {
  const authStore = useAuthStore();

  // In Solid, useSession returns an Accessor
  const sessionAccessor = props.authClient.useSession();

  // Stable ref for pending token promise (no re-renders in Solid)
  let pendingTokenPromise: Promise<string | null> | null = null;
  let pendingTokenSessionId: string | undefined;
  let authIdentity: string | null = null;
  let identityClaims: string | null = null;
  let identityInitialized = false;
  let identitySessionId: string | undefined;
  let tokenSessionId: string | undefined;
  let tokenSessionInitialized = false;

  // Clear token when session becomes null (logout)
  createEffect(() => {
    const sessionState = sessionAccessor();
    const session = sessionState.data;
    const isPending = sessionState.isPending;
    const sessionId = getSessionId(session);

    if (!hasActiveSessionData(session) && !isPending) {
      authStore.set('token', null);
      authStore.set('expiresAt', null);
      authStore.set('isAuthenticated', false);
      tokenSessionId = undefined;
      tokenSessionInitialized = false;
    } else if (hasActiveSessionData(session)) {
      if (
        (!tokenSessionInitialized && authStore.get('token') !== null) ||
        (tokenSessionInitialized && sessionId !== tokenSessionId)
      ) {
        authStore.set('token', null);
        authStore.set('expiresAt', null);
      }
      tokenSessionId = sessionId;
      tokenSessionInitialized = true;
    }
  });

  // Stable fetchAccessToken - no useCallback needed in Solid
  const fetchAccessToken = async ({
    forceRefreshToken = false,
  }: {
    forceRefreshToken?: boolean;
  } = {}) => {
    const sessionState = sessionAccessor();
    const currentSession = sessionState.data;
    const currentIsPending = sessionState.isPending;
    const hasSession = hasActiveSessionData(currentSession);
    const currentSessionId = getSessionId(currentSession);

    // If no session:
    // - If still pending (hydration), return cached token from SSR
    // - If not pending (confirmed no session), clear cache
    if (!hasSession) {
      if (!currentIsPending) {
        authStore.set('token', null);
        authStore.set('expiresAt', null);
      }
      return authStore.get('token');
    }

    // Check cached JWT from store
    const cachedToken = authStore.get('token');
    const expiresAt = authStore.get('expiresAt');
    const timeRemaining = expiresAt ? expiresAt - Date.now() : 0;

    // Return cached if valid and not forced (60s leeway)
    if (
      !forceRefreshToken &&
      cachedToken &&
      expiresAt &&
      currentSessionId === tokenSessionId &&
      timeRemaining >= 60_000
    ) {
      return cachedToken;
    }

    if (
      !forceRefreshToken &&
      pendingTokenPromise &&
      pendingTokenSessionId === currentSessionId
    ) {
      return pendingTokenPromise;
    }

    const fetchOptions: {
      headers?: {
        Authorization: string;
      };
      throw: false;
    } = {
      throw: false,
    };
    if (
      cachedToken &&
      currentSessionId === tokenSessionId &&
      decodeJwtExp(cachedToken) === null
    ) {
      fetchOptions.headers = {
        Authorization: `Bearer ${cachedToken}`,
      };
    }

    const sessionStillOwnsRequest = () => {
      const latestSession = sessionAccessor().data;
      return (
        hasActiveSessionData(latestSession) &&
        getSessionId(latestSession) === currentSessionId
      );
    };

    // Fetch fresh JWT
    let tokenPromise!: Promise<string | null>;
    // biome-ignore lint/suspicious/noExplicitAny: convex plugin type
    tokenPromise = (props.authClient as any).convex
      .token({ fetchOptions })
      .then((result: { data?: { token?: string | null } | null }) => {
        if (!sessionStillOwnsRequest()) {
          return null;
        }

        const jwt = result.data?.token || null;

        if (jwt) {
          const exp = decodeJwtExp(jwt);
          authStore.set('token', jwt);
          authStore.set('expiresAt', exp);
          return jwt;
        }

        authStore.set('token', null);
        authStore.set('expiresAt', null);
        return null;
      })
      .catch((error: unknown) => {
        if (!sessionStillOwnsRequest()) {
          return null;
        }

        authStore.set('token', null);
        authStore.set('expiresAt', null);
        console.error('[fetchAccessToken] error', error);
        return null;
      })
      .finally(() => {
        if (pendingTokenPromise === tokenPromise) {
          pendingTokenPromise = null;
          pendingTokenSessionId = undefined;
        }
      });

    pendingTokenPromise = tokenPromise;
    pendingTokenSessionId = currentSessionId;

    return tokenPromise;
  };

  // Create useAuth function for ConvexProviderWithAuth
  // In Solid, this is a plain function (stable, no useCallback needed)
  const useAuth = () => {
    const sessionState = sessionAccessor();
    const hasSession = hasActiveSessionData(sessionState.data);
    const sessionMissing = !hasSession && !sessionState.isPending;
    const token = authStore.get('token');
    const sessionId = getSessionId(sessionState.data);
    const claims = token ? decodeJwtIdentity(token) : null;

    const sessionChanged =
      identityInitialized && sessionId !== identitySessionId;

    if (!identityInitialized || sessionChanged) {
      identityInitialized = true;
      identitySessionId = sessionId;
      // A token still in the store during a session transition belongs to the
      // previous session. Bind the transition to the new session ID and adopt
      // claims only after that session's token request completes.
      identityClaims = sessionChanged ? null : claims;
      authIdentity =
        !sessionChanged && claims
          ? JSON.stringify({ claims, sessionId: sessionId ?? null })
          : (sessionId ?? null);
    } else if (claims && identityClaims === null) {
      // The first token arrives through the setAuth call already in flight.
      // Record its claims without pausing and restarting the same auth attempt.
      identityClaims = claims;
    } else if (claims && claims !== identityClaims) {
      identityClaims = claims;
      authIdentity = JSON.stringify({ claims, sessionId: sessionId ?? null });
    }

    return {
      identity: authIdentity,
      isLoading: sessionState.isPending && !token,
      // If Better Auth confirms no session, stale JWT should not keep auth=true.
      isAuthenticated: sessionMissing ? false : hasSession || token !== null,
      fetchAccessToken,
    };
  };

  return (
    <FetchAccessTokenContext.Provider value={fetchAccessToken}>
      <ConvexProviderWithAuth client={props.client} useAuth={useAuth}>
        <AuthStateSync>{props.children}</AuthStateSync>
      </ConvexProviderWithAuth>
    </FetchAccessTokenContext.Provider>
  );
}

/**
 * Syncs auth state from useConvexAuth() to the auth store.
 * MUST be inside ConvexProviderWithAuth to access useConvexAuth().
 *
 * Defensive isLoading computation handles SSR hydration race:
 * 1. SSR sets token from cookie
 * 2. Client hydrates
 * 3. Better Auth's useSession() briefly returns null before loading cookie
 * 4. Convex sets isConvexAuthenticated = false (no auth to wait for)
 * 5. Without defensive check, we'd sync { isLoading: false, isAuthenticated: false }
 * 6. Queries would throw UNAUTHORIZED before token is validated
 */
function AuthStateSync(props: ParentProps) {
  // Don't destructure — access via getters inside createEffect to preserve reactivity
  const convexAuth = useConvexAuth();
  const authStore = useAuthStore();

  createEffect(() => {
    // Read token inside effect so changes are tracked
    const token = authStore.get('token');

    // DEFENSIVE: If we have a token but Convex says not authenticated,
    // stay in loading state to avoid UNAUTHORIZED errors during hydration
    const hasTokenButNotAuth = !!token && !convexAuth.isAuthenticated;
    const isLoading = convexAuth.isLoading || hasTokenButNotAuth;

    authStore.set('isLoading', isLoading);
    authStore.set('isAuthenticated', convexAuth.isAuthenticated);
  });

  return props.children;
}

/**
 * Handles cross-domain one-time token (OTT) verification.
 */
function useOTTHandler(authClient: SolidAuthProviderClient) {
  onMount(async () => {
    if (typeof window === 'undefined' || !window.location?.href) {
      return;
    }

    const url = new URL(window.location.href);
    const token = url.searchParams.get('ott');

    if (token) {
      // biome-ignore lint/suspicious/noExplicitAny: cross-domain plugin type
      const authClientWithCrossDomain = authClient as any;
      url.searchParams.delete('ott');
      window.history.replaceState({}, '', url);
      const result =
        await authClientWithCrossDomain.crossDomain.oneTimeToken.verify({
          token,
        });
      const session = result.data?.session;

      if (session) {
        const getSession = authClient.getSession as AuthGetSession | undefined;
        await getSession?.({
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          },
        });
        authClientWithCrossDomain.updateSession();
      }
    }
  });
}
