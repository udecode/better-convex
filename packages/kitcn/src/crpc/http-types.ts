/**
 * HTTP Client Types
 *
 * Client-side type utilities for typed HTTP endpoint calls.
 */

import type { z } from 'zod';

import type { Simplify } from '../internal/types';
import type { CRPCHttpRouter, HttpRouterRecord } from '../server/http-router';
import type { HttpProcedure } from '../server/http-types';
import type { UnsetMarker } from '../server/types';

// ============================================================================
// Route Map Types (for runtime)
// ============================================================================

/** Route definition for client runtime */
export type HttpRouteInfo = { path: string; method: string };

/** Route map type - from codegen */
export type HttpRouteMap = Record<string, HttpRouteInfo>;

// ============================================================================
// Query Key + Cache Policy (single owner for every `crpc.http.*` consumer)
// ============================================================================

/** Query key with args (3-element) or prefix key without args (2-element) for invalidation */
export type HttpQueryKey =
  | readonly ['httpQuery', string, unknown]
  | readonly ['httpQuery', string];

/** Mutation key for HTTP endpoints */
export type HttpMutationKey = readonly ['httpMutation', string];

/**
 * Build the exact cache key for an HTTP route.
 *
 * Missing args normalize to `{}` so the RSC prefetch and the browser observer
 * hash to the same key and a server-prefetched entry hydrates instead of being
 * refetched. Every producer of a 3-element `httpQuery` key goes through here.
 */
export function buildHttpQueryKey(
  routeKey: string,
  args?: unknown
): readonly ['httpQuery', string, unknown] {
  return ['httpQuery', routeKey, args ?? {}] as const;
}

/**
 * Freshness window for `crpc.http.*` routes, in milliseconds.
 *
 * HTTP routes are a pull model with no push channel, so hydrated data needs a
 * real freshness window or the browser refetches it on mount. The RSC
 * QueryClient reads the same constant, so the server dedupe window and the
 * client freshness window cannot drift apart.
 */
export const HTTP_DEFAULT_STALE_TIME = 30_000;

// ============================================================================
// Type Inference Utilities
// ============================================================================

/** Infer schema type or return empty object if UnsetMarker */
type InferSchemaOrEmpty<T> = T extends UnsetMarker
  ? object
  : T extends z.ZodTypeAny
    ? z.infer<T>
    : object;

/**
 * Infer merged input from HttpProcedure
 * Combines params, query, and body input into a single object
 */
export type InferHttpInput<T> =
  T extends HttpProcedure<
    infer TInput,
    infer _TOutput,
    infer TParams,
    infer TQuery
  >
    ? Simplify<
        InferSchemaOrEmpty<TParams> &
          InferSchemaOrEmpty<TQuery> &
          InferSchemaOrEmpty<TInput>
      >
    : object;

/**
 * Infer output type from HttpProcedure
 */
export type InferHttpOutput<T> =
  T extends HttpProcedure<
    infer _TInput,
    infer TOutput,
    infer _TParams,
    infer _TQuery
  >
    ? TOutput extends UnsetMarker
      ? unknown
      : TOutput extends z.ZodTypeAny
        ? z.infer<TOutput>
        : unknown
    : unknown;

// ============================================================================
// Client Types
// ============================================================================

/**
 * Single procedure call signature
 * Returns a function that takes merged input and returns output
 */
export type HttpProcedureCall<T extends HttpProcedure> =
  keyof InferHttpInput<T> extends never
    ? () => Promise<InferHttpOutput<T>>
    : object extends InferHttpInput<T>
      ? (input?: InferHttpInput<T>) => Promise<InferHttpOutput<T>>
      : (input: InferHttpInput<T>) => Promise<InferHttpOutput<T>>;

/**
 * HTTP Client type from router record
 * Maps each procedure to its call signature, recursively for nested routers
 */
export type HttpClient<T extends HttpRouterRecord> = {
  [K in keyof T]: T[K] extends HttpProcedure
    ? HttpProcedureCall<T[K]>
    : T[K] extends CRPCHttpRouter<infer R>
      ? HttpClient<R>
      : T[K] extends HttpRouterRecord
        ? HttpClient<T[K]>
        : never;
};

/**
 * HTTP Client type from a CRPCHttpRouter
 * Use this when your type is the router object (with _def)
 */
export type HttpClientFromRouter<TRouter extends CRPCHttpRouter<any>> =
  HttpClient<TRouter['_def']['record']>;

// ============================================================================
// Client Error
// ============================================================================

/** Error codes that can be returned from HTTP endpoints */
export type HttpErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'CONFLICT'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNKNOWN';

/** HTTP client error */
export class HttpClientError extends Error {
  readonly name = 'HttpClientError';
  readonly code: HttpErrorCode;
  readonly status: number;
  readonly procedureName: string;

  constructor(opts: {
    code: HttpErrorCode;
    status: number;
    procedureName: string;
    message?: string;
  }) {
    super(opts.message ?? `${opts.code}: ${opts.procedureName}`);
    this.code = opts.code;
    this.status = opts.status;
    this.procedureName = opts.procedureName;
  }
}

/** Type guard for HttpClientError */
export const isHttpClientError = (error: unknown): error is HttpClientError =>
  error instanceof HttpClientError;
