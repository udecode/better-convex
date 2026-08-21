import { getRequest } from '@tanstack/react-start/server';
import { stripIndent } from 'common-tags';
import { ConvexHttpClient } from 'convex/browser';
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from 'convex/server';
import { type GetTokenOptions, getToken } from '../auth/internal/token';
import { defaultIsUnauthorized } from '../crpc/error';
import {
  type ConvexContext,
  createCallerFactory,
} from '../server/caller-factory';

type ClientOptions = {
  convexSiteUrl: string;
  convexUrl: string;
  token?: string;
};

type TokenResult = {
  token?: string;
  isFresh?: boolean;
};

/** Auth options for server-side calls. */
type AuthOptions = {
  /** Better Auth auth route base path. Defaults to `/api/auth`. */
  basePath?: string;
  /**
   * Read the Convex JWT from the session cookie instead of fetching it.
   * Default: false.
   *
   * The token this saves a round trip on is also the token
   * `syncConvexAuthForStartLoader` hands the browser Convex client, which
   * captures it for the lifetime of the socket. A cookie JWT can be within
   * seconds of expiry and cannot be renewed from that callback, so enable this
   * only for apps that do not prime the browser client from `getToken()`.
   */
  jwtCache?: boolean;
  /** Custom function to detect UNAUTHORIZED errors. Default checks code property. */
  isUnauthorized?: (error: unknown) => boolean;
  /** Expiration tolerance in seconds. */
  expirationToleranceSeconds?: number;
};

type ConvexBetterAuthReactStartOptions<TApi> = Omit<
  GetTokenOptions,
  'forceRefresh' | 'jwtCache'
> & {
  /** Your Convex API object. */
  api: TApi;
  convexSiteUrl: string;
  convexUrl: string;
  /** Auth options. */
  auth?: AuthOptions;
};

const TRAILING_COLON_RE = /:$/;

const requestCanHaveBody = (method: string) =>
  method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

const stripHopByHopHeaders = (headers: Headers) => {
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
};

function setupClient(options: ClientOptions) {
  const client = new ConvexHttpClient(options.convexUrl);
  if (options.token !== undefined) {
    client.setAuth(options.token);
  }
  (
    client as unknown as {
      setFetchOptions?: (options: RequestInit) => void;
    }
  ).setFetchOptions?.({ cache: 'no-store' });
  return client;
}

const parseConvexSiteUrl = (url: string) => {
  if (!url) {
    throw new Error(stripIndent`
      CONVEX_SITE_URL is not set.
      This is automatically set in the Convex backend, but must be set in the TanStack Start environment.
      For local development, this can be set in the .env.local file.
    `);
  }
  if (url.endsWith('.convex.cloud')) {
    throw new Error(stripIndent`
      CONVEX_SITE_URL should be set to your Convex Site URL, which ends in .convex.site.
      Currently set to ${url}.
    `);
  }
  return url;
};

const appendSetCookieHeaders = (target: Headers, source: Headers) => {
  const getSetCookie = (source as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;

  if (typeof getSetCookie === 'function') {
    const values = getSetCookie.call(source);
    for (const value of values) {
      target.append('set-cookie', value);
    }
    return;
  }

  const value = source.get('set-cookie');
  if (value) {
    target.append('set-cookie', value);
  }
};

const cloneAuthHandlerResponse = (response: Response) => {
  const headers = new Headers();

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      continue;
    }
    headers.append(key, value);
  }

  appendSetCookieHeaders(headers, response.headers);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

const handler = async (
  request: Request,
  opts: { convexSiteUrl: string }
): Promise<Response> => {
  const requestUrl = new URL(request.url);
  const nextUrl = `${opts.convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`;
  const headers = new Headers(request.headers);
  const proto = requestUrl.protocol.replace(TRAILING_COLON_RE, '');

  stripHopByHopHeaders(headers);
  headers.set('accept-encoding', 'application/json');
  headers.set('host', new URL(opts.convexSiteUrl).host);
  headers.set('x-forwarded-host', requestUrl.host);
  headers.set('x-forwarded-proto', proto);
  headers.set('x-better-auth-forwarded-host', requestUrl.host);
  headers.set('x-better-auth-forwarded-proto', proto);
  let body: ArrayBuffer | undefined;
  if (requestCanHaveBody(request.method)) {
    const bufferedBody = await request.arrayBuffer();
    if (bufferedBody.byteLength > 0) {
      body = bufferedBody;
    }
  }

  return fetch(nextUrl, {
    body,
    headers,
    method: request.method,
    redirect: 'manual',
  });
};

/**
 * Create Convex caller factory with Better Auth integration for TanStack Start.
 *
 * Every request resolves its Convex token once. TanStack Start runs each request
 * inside an `AsyncLocalStorage` scope, so `getRequest()` returns an object whose
 * identity is stable for that request and distinct across requests. Keying the
 * memos on it makes them request-scoped by construction: nothing auth-related is
 * ever held at module scope, and entries are collected with the request.
 *
 * @example
 * ```ts
 * // auth-server.ts
 * export const { createCaller, handler, getToken } = convexBetterAuthReactStart({
 *   api,
 *   convexUrl: import.meta.env.VITE_CONVEX_URL!,
 *   convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL!,
 * });
 *
 * // server.ts
 * export const caller = createCaller();
 *
 * // any server function or server route - single token fetch per request
 * const user = await caller.user.getSessionUser();
 * const posts = await caller.posts.list();
 * ```
 */
export const convexBetterAuthReactStart = <
  TApi extends Record<string, unknown>,
>(
  opts: ConvexBetterAuthReactStartOptions<TApi>
) => {
  const siteUrl = parseConvexSiteUrl(opts.convexSiteUrl);
  const auth = opts.auth ?? {};
  const jwtCacheEnabled = auth.jwtCache === true;

  const fetchTokenFor = (
    headers: Headers,
    forceRefresh?: boolean
  ): Promise<TokenResult> => {
    const mutableHeaders = new Headers(headers);
    stripHopByHopHeaders(mutableHeaders);
    mutableHeaders.set('accept-encoding', 'identity');

    return getToken(siteUrl, mutableHeaders, {
      basePath: auth.basePath ?? opts.basePath,
      cookiePrefix: opts.cookiePrefix,
      forceRefresh,
      jwtCache: {
        enabled: jwtCacheEnabled,
        expirationToleranceSeconds: auth.expirationToleranceSeconds,
        isAuthError: auth.isUnauthorized ?? defaultIsUnauthorized,
      },
    });
  };

  const headersByRequest = new WeakMap<Request, Headers>();
  const tokenByRequest = new WeakMap<Request, Promise<TokenResult>>();
  const contextByRequest = new WeakMap<Request, Promise<ConvexContext<TApi>>>();

  /**
   * Snapshot the current request's headers once.
   *
   * `getRequestHeaders()` is not identity-stable within a request: srvx serves a
   * lazy header view until anything materializes the native Request (a server
   * function reading `formData()`, for example), then swaps in that Request's
   * own `Headers` and drops the old one. Header *values* survive the swap, so a
   * snapshot taken at any point is correct, but comparing or keying on the live
   * accessor would silently stop matching mid-request.
   */
  const requestHeaders = (request: Request): Headers => {
    const cached = headersByRequest.get(request);
    if (cached) {
      return cached;
    }

    const snapshot = new Headers(request.headers);
    headersByRequest.set(request, snapshot);

    return snapshot;
  };

  /**
   * Memoize `create` for the lifetime of the current request. The pending
   * promise is stored before it settles so concurrent callers share one
   * in-flight fetch, and a rejection is evicted so the next caller can retry.
   */
  const perRequest = <T>(
    store: WeakMap<Request, Promise<T>>,
    create: (request: Request) => Promise<T>
  ): Promise<T> => {
    const request = getRequest();
    const cached = store.get(request);
    if (cached) {
      return cached;
    }

    const pending = create(request).catch((error: unknown) => {
      if (store.get(request) === pending) {
        store.delete(request);
      }
      throw error;
    });
    store.set(request, pending);

    return pending;
  };

  /**
   * The current request, or `undefined` outside a Start request scope.
   * `getRequest()` throws there, and an explicit `createContext({ headers })`
   * is allowed to run with no ambient request at all.
   */
  const currentRequest = (): Request | undefined => {
    try {
      return getRequest();
    } catch {
      return;
    }
  };

  /** Ambient token for the current request, resolved at most once. */
  const requestToken = () =>
    perRequest(tokenByRequest, (request) =>
      fetchTokenFor(requestHeaders(request))
    );

  const { createContext, createCaller } = createCallerFactory({
    api: opts.api,
    auth: {
      getToken: (_tokenSiteUrl, headers, getTokenOpts) => {
        const forceRefresh = (getTokenOpts as GetTokenOptions | undefined)
          ?.forceRefresh;
        const request = currentRequest();
        // Share the per-request token only when this context was built from the
        // request's own header snapshot. An explicit `createContext({ headers })`
        // must mint its own token, and a forced refresh bypasses the memo.
        if (
          !forceRefresh &&
          request &&
          headers === headersByRequest.get(request)
        ) {
          return requestToken();
        }
        return fetchTokenFor(headers, forceRefresh);
      },
      isUnauthorized: auth.isUnauthorized,
    },
    convexSiteUrl: opts.convexSiteUrl,
    convexUrl: opts.convexUrl,
  });

  /** Request-scoped context. One context, one token, per request. */
  const createRequestContext = () =>
    perRequest(contextByRequest, (request) =>
      createContext({ headers: requestHeaders(request) })
    );

  const callWithToken = async <
    FnType extends 'query' | 'mutation' | 'action',
    Fn extends FunctionReference<FnType>,
  >(
    fn: (token?: string) => Promise<FunctionReturnType<Fn>>
  ): Promise<FunctionReturnType<Fn>> => {
    const token = await requestToken();
    try {
      return await fn(token.token);
    } catch (error) {
      // Only replay when a cached token may be the cause. A freshly fetched
      // token cannot be stale, and replaying is unsafe for mutations/actions.
      if (
        token.isFresh ||
        !(auth.isUnauthorized ?? defaultIsUnauthorized)(error)
      ) {
        throw error;
      }
      const refreshed = await fetchTokenFor(requestHeaders(getRequest()), true);
      // Share the refreshed token with the rest of this request so later calls
      // do not each replay against the same rejected token.
      token.token = refreshed.token;
      token.isFresh = refreshed.isFresh;
      return await fn(refreshed.token);
    }
  };

  return {
    /**
     * Bind a cRPC caller. Defaults to the request-scoped context, so every
     * procedure call in a request shares one token fetch.
     */
    createCaller: (
      ctxFn: () => Promise<ConvexContext<TApi>> = createRequestContext
    ) => createCaller(ctxFn),
    createContext,
    getToken: async () => {
      const token = await requestToken();
      return token.token;
    },
    handler: async (request: Request) =>
      cloneAuthHandlerResponse(await handler(request, opts)),
    fetchAuthQuery: async <Query extends FunctionReference<'query'>>(
      query: Query,
      ...args: OptionalRestArgs<Query>
    ): Promise<FunctionReturnType<Query>> => {
      return callWithToken((token?: string) => {
        const client = setupClient({ ...opts, token });
        return client.query(query, ...args);
      });
    },
    fetchAuthMutation: async <Mutation extends FunctionReference<'mutation'>>(
      mutation: Mutation,
      ...args: OptionalRestArgs<Mutation>
    ): Promise<FunctionReturnType<Mutation>> => {
      return callWithToken((token?: string) => {
        const client = setupClient({ ...opts, token });
        return client.mutation(mutation, ...args);
      });
    },
    fetchAuthAction: async <Action extends FunctionReference<'action'>>(
      action: Action,
      ...args: OptionalRestArgs<Action>
    ): Promise<FunctionReturnType<Action>> => {
      return callWithToken((token?: string) => {
        const client = setupClient({ ...opts, token });
        return client.action(action, ...args);
      });
    },
  };
};
