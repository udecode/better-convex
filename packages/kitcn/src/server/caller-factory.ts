/** biome-ignore-all lint/suspicious/noExplicitAny: lib */

/**
 * Framework-agnostic caller factory.
 * getToken is passed as a parameter so framework auth helpers stay decoupled.
 */

import { fetchAction, fetchMutation, fetchQuery } from 'convex/nextjs';
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server';
import { defaultIsUnauthorized } from '../crpc/error';
import type { DataTransformerOptions } from '../crpc/transformer';
import type { EmptyObject } from '../internal/upstream';
import { buildMetaIndex } from '../shared/meta-utils';
import {
  type CallerOpts,
  createServerCaller,
  type ServerCaller,
} from './caller';
import { createLazyCaller, type LazyCaller } from './lazy-caller';

const CONVEX_SITE_URL_RE = /\.convex\.site(?=\/|$)/;

// Token result from getToken
type TokenResult = {
  token?: string;
  isFresh?: boolean;
};

// GetToken function signature used by kitcn auth framework helpers.
type GetTokenFn = (
  siteUrl: string,
  headers: Headers,
  opts?: unknown
) => Promise<TokenResult>;

/** Auth options for server-side calls. */
type AuthOptions = {
  /** Function to extract auth token from request headers. */
  getToken: GetTokenFn;
  /**
   * Custom function to detect UNAUTHORIZED errors.
   * Set this to resolve those errors to `null` instead of throwing.
   *
   * Refreshing an expired cached token and retrying does not require this:
   * that always falls back to `defaultIsUnauthorized`.
   */
  isUnauthorized?: (error: unknown) => boolean;
};

type CreateCallerFactoryOptions<TApi> = {
  /** Your Convex API object. */
  api: TApi;
  /** Convex site URL (must end in `.convex.site`). */
  convexSiteUrl: string;
  /**
   * Convex deployment URL (must end in `.convex.cloud`).
   * Defaults to `convexSiteUrl` with the domain swapped.
   */
  convexUrl?: string;
  /** Auth options. Pass to enable authenticated calls with JWT caching. */
  auth?: AuthOptions;
  /** Optional wire transformer for request/response payloads (always composed with Date). */
  transformer?: DataTransformerOptions;
};

type OptionalArgs<FuncRef extends FunctionReference<any, any>> =
  FuncRef['_args'] extends EmptyObject
    ? [args?: EmptyObject]
    : [args: FuncRef['_args']];

const getArgsAndOptions = <FuncRef extends FunctionReference<any, any>>(
  args: OptionalArgs<FuncRef>,
  token?: string,
  url?: string
): ArgsAndOptions<FuncRef, { token?: string; url?: string }> => [
  args[0],
  { token, url },
];

const parseConvexSiteUrl = (url: string) => {
  if (!url) {
    throw new Error(
      'CONVEX_SITE_URL is not set. This must be set in the environment.'
    );
  }
  if (url.endsWith('.convex.cloud')) {
    throw new Error(
      `CONVEX_SITE_URL should end in .convex.site, not .convex.cloud. Currently set to ${url}.`
    );
  }
  return url;
};

const getConvexUrl = (siteUrl: string, convexUrl?: string) => {
  if (convexUrl) {
    return convexUrl;
  }

  return siteUrl.replace(CONVEX_SITE_URL_RE, '.convex.cloud');
};

// Context shape returned by createContext
export type ConvexContext<TApi> = {
  token: string | undefined;
  isAuthenticated: boolean;
  caller: ServerCaller<TApi>;
};

/**
 * Framework-agnostic caller factory.
 *
 * @example
 * ```ts
 * const { createContext, createCaller } = createCallerFactory({
 *   api,
 *   convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
 *   auth: { getToken },
 * });
 * ```
 */
// Default getToken returns no auth
const noAuthGetToken: GetTokenFn = () => Promise.resolve({ token: undefined });

export function createCallerFactory<TApi extends Record<string, unknown>>(
  opts: CreateCallerFactoryOptions<TApi>
) {
  const siteUrl = parseConvexSiteUrl(opts.convexSiteUrl);
  const convexUrl = getConvexUrl(siteUrl, opts.convexUrl);
  const getToken = opts.auth?.getToken ?? noAuthGetToken;
  // Two distinct jobs, deliberately not sharing a predicate:
  // - retry: defaults on, so an expired cached token still refreshes itself.
  // - swallow-to-null: opt-in only, so authorization failures keep throwing
  //   unless the app asked for them to be turned into null.
  const isRetryableAuthError = opts.auth
    ? (opts.auth.isUnauthorized ?? defaultIsUnauthorized)
    : undefined;
  const shouldReturnNullOnUnauthorized = opts.auth?.isUnauthorized;
  const crpcMeta = buildMetaIndex(opts.api);

  // Internal: call with token and retry logic
  const callWithTokenAndRetry = async <
    FnType extends 'query' | 'mutation' | 'action',
    Fn extends FunctionReference<FnType>,
  >(
    fn: (token?: string) => Promise<FunctionReturnType<Fn>>,
    tokenResult: TokenResult,
    headers: Headers
  ): Promise<FunctionReturnType<Fn> | null> => {
    const canRefreshToken = !!opts.auth && !tokenResult.isFresh;

    try {
      return await fn(tokenResult.token);
    } catch (error) {
      // Only replay the call when the cached token may be the cause. Any other
      // failure is surfaced as-is: mutations and actions are not idempotent.
      if (!(canRefreshToken && isRetryableAuthError?.(error))) {
        if (shouldReturnNullOnUnauthorized?.(error)) {
          return null;
        }
        throw error;
      }

      // Force refresh token and retry
      const newToken = await getToken(siteUrl, headers, {
        ...opts,
        forceRefresh: true,
      });
      // Publish the refreshed token back to the context every call in this
      // request shares. Without this, a context that outlives a single call —
      // any memoized `createContext`, which is how both the Next RSC caller and
      // the Start caller are wired — replays the same rejected token on every
      // later call, re-executing non-idempotent mutations and actions.
      tokenResult.token = newToken.token;
      tokenResult.isFresh = newToken.isFresh;
      try {
        return await fn(newToken.token);
      } catch (retryError) {
        if (shouldReturnNullOnUnauthorized?.(retryError)) {
          return null;
        }
        throw retryError;
      }
    }
  };

  // createContext REQUIRES explicit headers
  const createContext = async (reqOpts: {
    headers: Headers;
  }): Promise<ConvexContext<TApi>> => {
    const tokenResult = await getToken(siteUrl, reqOpts.headers, opts);

    // Internal fetch functions
    const fetchAuthQuery = async <Query extends FunctionReference<'query'>>(
      query: Query,
      args: Query['_args'],
      callerOpts?: CallerOpts
    ): Promise<FunctionReturnType<Query> | null> => {
      // Proactive skip if not authenticated and skipUnauth
      if (callerOpts?.skipUnauth && !tokenResult.token) {
        return null;
      }
      return callWithTokenAndRetry(
        (token) => {
          const argsAndOptions = getArgsAndOptions([args], token, convexUrl);
          return fetchQuery(query, argsAndOptions[0], argsAndOptions[1]);
        },
        tokenResult,
        reqOpts.headers
      );
    };

    const fetchAuthMutation = async <
      Mutation extends FunctionReference<'mutation'>,
    >(
      mutation: Mutation,
      args: Mutation['_args'],
      callerOpts?: CallerOpts
    ): Promise<FunctionReturnType<Mutation> | null> => {
      if (callerOpts?.skipUnauth && !tokenResult.token) {
        return null;
      }
      return callWithTokenAndRetry(
        (token) => {
          const argsAndOptions = getArgsAndOptions([args], token, convexUrl);
          return fetchMutation(mutation, argsAndOptions[0], argsAndOptions[1]);
        },
        tokenResult,
        reqOpts.headers
      );
    };

    const fetchAuthAction = async <Action extends FunctionReference<'action'>>(
      action: Action,
      args: Action['_args'],
      callerOpts?: CallerOpts
    ): Promise<FunctionReturnType<Action> | null> => {
      if (callerOpts?.skipUnauth && !tokenResult.token) {
        return null;
      }
      return callWithTokenAndRetry(
        (token) => {
          const argsAndOptions = getArgsAndOptions([args], token, convexUrl);
          return fetchAction(action, argsAndOptions[0], argsAndOptions[1]);
        },
        tokenResult,
        reqOpts.headers
      );
    };

    return {
      caller: createServerCaller(opts.api, {
        fetchAction: fetchAuthAction,
        fetchMutation: fetchAuthMutation,
        fetchQuery: fetchAuthQuery,
        meta: crpcMeta,
        transformer: opts.transformer,
      }),
      isAuthenticated: !!tokenResult.token,
      token: tokenResult.token,
    };
  };

  // Factory that takes context function, returns lazy caller
  const createCaller = (
    ctxFn: () => Promise<ConvexContext<TApi>>
  ): LazyCaller<TApi> => createLazyCaller(opts.api, ctxFn);

  return { createCaller, createContext };
}
