import { makeFunctionReference } from 'convex/server';
import { createHashFn } from '../internal/hash';
import { createHttpProxy } from '../react/http-proxy';
import { createServerCRPCProxy } from './proxy-server';

/**
 * Hydration is hash-addressed: a server-prefetched entry only hydrates a client
 * observer when both sides hash to the same key. These tests build both keys
 * through the real proxies, so a default drift between them fails here.
 */

const api = {
  http: {
    health: makeFunctionReference<'query', Record<string, never>, unknown>(
      'http:health'
    ),
  },
  _http: {
    health: { path: '/api/health', method: 'GET' },
  },
} as const;

const routes = {
  health: { method: 'GET', path: '/api/health' },
} as const;

const hash = createHashFn();

const serverProxy: any = createServerCRPCProxy({ api });
const clientProxy: any = createHttpProxy<any>({
  convexSiteUrl: 'https://example.convex.site',
  routes,
});

describe('rsc/http hydration key', () => {
  test('no-arg queryOptions hash identically on server and client', () => {
    const serverKey = serverProxy.http.health.queryOptions().queryKey;
    const clientKey = clientProxy.health.queryOptions().queryKey;

    expect(serverKey).toEqual(['httpQuery', 'health', {}]);
    expect(clientKey).toEqual(['httpQuery', 'health', {}]);
    expect(hash(serverKey)).toBe(hash(clientKey));
  });

  test('omitted args hash identically to an explicit empty object', () => {
    const omitted = clientProxy.health.queryOptions().queryKey;
    const explicit = clientProxy.health.queryOptions({}).queryKey;

    expect(hash(omitted)).toBe(hash(explicit));
    expect(hash(serverProxy.http.health.queryOptions({}).queryKey)).toBe(
      hash(omitted)
    );
  });

  test('args-bearing queryOptions hash identically on server and client', () => {
    const args = { searchParams: { limit: '10' } };
    const serverKey = serverProxy.http.health.queryOptions(args).queryKey;
    const clientKey = clientProxy.health.queryOptions(args).queryKey;

    expect(hash(serverKey)).toBe(hash(clientKey));
  });

  test('client queryOptions carry a freshness window so hydrated data is not refetched on mount', () => {
    const opts = clientProxy.health.queryOptions();

    expect(opts.staleTime).toBeGreaterThan(0);
    // refetchOnMount stays default so a query invalidated while unmounted still
    // refetches — HTTP routes have no push channel to correct stale data.
    expect(opts.refetchOnMount).toBeUndefined();
  });

  test('caller-supplied options win over the default freshness window', () => {
    const opts = clientProxy.health.queryOptions(undefined, { staleTime: 0 });

    expect(opts.staleTime).toBe(0);
  });

  test('queryKey()/queryFilter() keep emitting prefix keys for invalidation', () => {
    expect(clientProxy.health.queryKey()).toEqual(['httpQuery', 'health']);
    expect(clientProxy.health.queryFilter()).toEqual({
      queryKey: ['httpQuery', 'health'],
    });
  });
});
