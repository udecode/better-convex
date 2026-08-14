import * as tokenModule from '../auth/internal/token';
import { convexBetterAuth } from './index';

describe('convexBetterAuth', () => {
  // Bun shares one process across test files, so a fetch stub installed by an
  // earlier file can still be live here. Pin the global around every test so
  // this file neither inherits nor leaks one.
  let ambientFetch: typeof globalThis.fetch;

  beforeEach(() => {
    ambientFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = ambientFetch;
  });

  test('creates GET/POST/OPTIONS handlers that rewrite request URL to convex site', async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<{
      input: RequestInfo | URL;
      init?: RequestInit;
    }> = [];

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      calls.push({ init, input });
      return new Response('ok');
    }) as typeof fetch;

    try {
      const result = convexBetterAuth({
        api: {},
        convexSiteUrl: 'https://my-app.convex.site',
      });

      await result.handler.GET(
        new Request('https://example.com/path?a=1', { method: 'GET' })
      );
      const postBody = JSON.stringify({ email: 'user@example.com' });
      await result.handler.POST({
        arrayBuffer: async () => new TextEncoder().encode(postBody).buffer,
        headers: new Headers({
          connection: 'keep-alive',
          'content-length': String(postBody.length),
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
        }),
        method: 'POST',
        url: 'https://example.com/other?b=2',
      } as unknown as Request);
      const preflightRequest = {
        headers: {
          'access-control-request-method': 'POST',
          origin: 'http://localhost:1420',
        },
        method: 'OPTIONS',
        url: 'https://example.com/api/auth/session',
      } as unknown as Request;
      await result.handler.OPTIONS(preflightRequest);

      expect(calls).toHaveLength(3);

      expect(calls[0]?.input).toBe('https://my-app.convex.site/path?a=1');
      expect(calls[0]?.init?.method).toBe('GET');
      expect(calls[0]?.init?.redirect).toBe('manual');
      const getHeaders = new Headers(calls[0]?.init?.headers);
      expect(getHeaders.get('accept-encoding')).toBe('application/json');
      expect(getHeaders.get('host')).toBe('my-app.convex.site');
      expect(getHeaders.get('x-forwarded-host')).toBe('example.com');
      expect(getHeaders.get('x-forwarded-proto')).toBe('https');
      expect(getHeaders.get('x-better-auth-forwarded-host')).toBe(
        'example.com'
      );
      expect(getHeaders.get('x-better-auth-forwarded-proto')).toBe('https');
      expect(calls[0]?.init?.body).toBeUndefined();

      expect(calls[1]?.input).toBe('https://my-app.convex.site/other?b=2');
      expect(calls[1]?.init?.method).toBe('POST');
      expect(calls[1]?.init?.redirect).toBe('manual');
      const postHeaders = new Headers(calls[1]?.init?.headers);
      expect(postHeaders.get('accept-encoding')).toBe('application/json');
      expect(postHeaders.get('host')).toBe('my-app.convex.site');
      expect(postHeaders.get('x-forwarded-host')).toBe('example.com');
      expect(postHeaders.get('x-forwarded-proto')).toBe('https');
      expect(postHeaders.get('x-better-auth-forwarded-host')).toBe(
        'example.com'
      );
      expect(postHeaders.get('x-better-auth-forwarded-proto')).toBe('https');
      expect(postHeaders.get('connection')).toBeNull();
      expect(postHeaders.get('content-length')).toBeNull();
      expect(postHeaders.get('transfer-encoding')).toBeNull();
      await expect(
        new Response(calls[1]?.init?.body as BodyInit).text()
      ).resolves.toBe(postBody);

      expect(calls[2]?.input).toBe(
        'https://my-app.convex.site/api/auth/session'
      );
      expect(calls[2]?.init?.method).toBe('OPTIONS');
      expect(calls[2]?.init?.redirect).toBe('manual');
      const optionsHeaders = new Headers(calls[2]?.init?.headers);
      expect(optionsHeaders.get('host')).toBe('my-app.convex.site');
      expect(optionsHeaders.get('x-forwarded-host')).toBe('example.com');
      expect(optionsHeaders.get('x-forwarded-proto')).toBe('https');
      expect(optionsHeaders.get('origin')).toBe('http://localhost:1420');
      expect(calls[2]?.init?.body).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // These two assert how `auth.jwtCache` is forwarded to the token layer.
  // They spy on the token module rather than stubbing `globalThis.fetch`, so
  // no ambient fetch state can shadow the call being measured. How many times
  // the token layer is called is not part of the contract — retries and
  // ambient state can change it — so assert only on the values forwarded.
  describe('jwtCache forwarding', () => {
    let getTokenSpy: ReturnType<typeof spyOn>;

    // Distinct `jwtCache.enabled` values across every recorded call. `[false]`
    // means "called at least once, and every call disabled the cache".
    const forwardedCacheFlags = () =>
      Array.from(
        new Set(
          getTokenSpy.mock.calls.map(
            (call) =>
              (call?.[2] as { jwtCache?: { enabled?: boolean } } | undefined)
                ?.jwtCache?.enabled
          )
        )
      );

    beforeEach(() => {
      getTokenSpy = spyOn(tokenModule, 'getToken').mockImplementation(
        async () => ({ isFresh: true, token: 'server-token' })
      );
    });

    afterEach(() => {
      getTokenSpy.mockRestore();
    });

    test('jwtCache false disables the cache without disabling auth', async () => {
      const { createContext } = convexBetterAuth({
        api: {},
        auth: { jwtCache: false },
        convexSiteUrl: 'https://my-app.convex.site',
      });

      const ctx = await createContext({ headers: new Headers() });

      // With auth wired off entirely the token layer is never reached at all
      // and the request runs anonymously.
      expect(getTokenSpy).toHaveBeenCalled();
      expect(forwardedCacheFlags()).toEqual([false]);
      expect(ctx.token).toBe('server-token');
      expect(ctx.isAuthenticated).toBe(true);
    });

    test('jwtCache defaults to enabled', async () => {
      const { createContext } = convexBetterAuth({
        api: {},
        convexSiteUrl: 'https://my-app.convex.site',
      });

      const ctx = await createContext({ headers: new Headers() });

      expect(getTokenSpy).toHaveBeenCalled();
      expect(forwardedCacheFlags()).toEqual([true]);
      expect(ctx.token).toBe('server-token');
    });
  });
});
