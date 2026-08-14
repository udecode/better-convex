import * as convexNextjs from 'convex/nextjs';
import { makeFunctionReference } from 'convex/server';
import { defaultIsUnauthorized } from '../crpc/error';
import { encodeWire } from '../crpc/transformer';

import { createCallerFactory } from './caller-factory';

const CONVEX_SITE_URL_NOT_SET_RE = /CONVEX_SITE_URL is not set/i;
const CONVEX_SITE_URL_INVALID_DOMAIN_RE = /should end in \.convex\.site/i;

const withQueryLeafMeta = (api: {
  posts: { list: ReturnType<typeof makeFunctionReference<'query'>> };
}) =>
  ({
    posts: {
      list: Object.assign(api.posts.list, {
        functionRef: api.posts.list,
        type: 'query',
      }),
    },
  }) as const;

describe('server/caller-factory', () => {
  afterEach(() => {
    // Ensure spies are restored even if a test fails.
    (convexNextjs.fetchQuery as any).mockRestore?.();
    (convexNextjs.fetchMutation as any).mockRestore?.();
    (convexNextjs.fetchAction as any).mockRestore?.();
  });

  test('validates convexSiteUrl', () => {
    expect(() =>
      createCallerFactory({
        api: {},
        convexSiteUrl: '',
      })
    ).toThrow(CONVEX_SITE_URL_NOT_SET_RE);

    expect(() =>
      createCallerFactory({
        api: {},
        convexSiteUrl: 'https://example.convex.cloud',
      })
    ).toThrow(CONVEX_SITE_URL_INVALID_DOMAIN_RE);
  });

  test('skipUnauth returns null when no token and does not call fetchQuery', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => {
        throw new Error('unexpected fetchQuery');
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ token: undefined }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      ctx.caller.posts.list({}, { skipUnauth: true })
    ).resolves.toBeNull();
    expect(fetchQuerySpy.mock.calls.length).toBe(0);
  });

  test('passes a Convex deployment url to server fetch helpers', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => 'ok'
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ isFresh: true, token: 't0' }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).resolves.toBe('ok');

    expect(fetchQuerySpy.mock.calls[0]?.[2]).toMatchObject({
      token: 't0',
      url: 'https://example.convex.cloud',
    });
  });

  test('prefers an explicit convexUrl when provided', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => 'ok'
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ isFresh: true, token: 't0' }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
      convexUrl: 'https://custom.example.convex.cloud',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).resolves.toBe('ok');

    expect(fetchQuerySpy.mock.calls[0]?.[2]).toMatchObject({
      token: 't0',
      url: 'https://custom.example.convex.cloud',
    });
  });

  test('returns null for unauthorized errors (no retry)', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => {
        throw Object.assign(new Error('unauthorized'), {
          code: 'UNAUTHORIZED',
        });
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ isFresh: true, token: 't0' }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: {
        getToken,
        isUnauthorized: (e) =>
          !!e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as any).code === 'UNAUTHORIZED',
      },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).resolves.toBeNull();
    expect(fetchQuerySpy.mock.calls.length).toBeGreaterThan(0);
    expect(getToken.mock.calls.length).toBe(1);
  });

  test('throws unauthorized mutations without a configured isUnauthorized', async () => {
    // Scaffold shape: `auth: { getToken }` with no predicate. A genuine
    // authorization failure must surface, never resolve to null.
    const fetchMutationSpy = spyOn(
      convexNextjs,
      'fetchMutation'
    ).mockImplementation(async () => {
      throw Object.assign(new Error('unauthorized'), {
        data: { code: 'UNAUTHORIZED' },
      });
    });

    const ref = makeFunctionReference<'mutation'>('todos:create');
    const apiWithMeta = {
      todos: {
        create: Object.assign(ref, { functionRef: ref, type: 'mutation' }),
      },
    } as const;

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta as any,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      (ctx.caller as any).todos.create({ title: 'x' })
    ).rejects.toThrow('unauthorized');

    // Retried once against a fresh token, then surfaced rather than swallowed.
    expect(fetchMutationSpy.mock.calls.length).toBe(2);
  });

  test('swallows unauthorized to null only when isUnauthorized is configured', async () => {
    const fetchMutationSpy = spyOn(
      convexNextjs,
      'fetchMutation'
    ).mockImplementation(async () => {
      throw Object.assign(new Error('unauthorized'), {
        data: { code: 'UNAUTHORIZED' },
      });
    });

    const ref = makeFunctionReference<'mutation'>('todos:create');
    const apiWithMeta = {
      todos: {
        create: Object.assign(ref, { functionRef: ref, type: 'mutation' }),
      },
    } as const;

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta as any,
      auth: { getToken, isUnauthorized: defaultIsUnauthorized },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      (ctx.caller as any).todos.create({ title: 'x' })
    ).resolves.toBeNull();
    expect(fetchMutationSpy.mock.calls.length).toBe(2);
  });

  // Pins the `defaultIsUnauthorized` retry default. Note this assertion also
  // held under the old blanket-retry code; the negative tests above and below
  // are what prove the retry is now gated on the error being an auth failure.
  test('recovers a stale cached token without a configured isUnauthorized', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async (_fn: any, _args: any, opts: any) => {
        if (opts?.token === 't0') {
          // Shape Convex throws for an expired token.
          throw Object.assign(new Error('unauthorized'), {
            data: { code: 'UNAUTHORIZED' },
          });
        }
        return 'ok';
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).resolves.toBe('ok');

    expect(fetchQuerySpy.mock.calls.length).toBe(2);
    expect(getToken.mock.calls.length).toBe(2);
    expect(getToken.mock.calls[1]?.[2]?.forceRefresh).toBe(true);
  });

  test('does not retry non-auth errors without a configured isUnauthorized', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => {
        throw new Error('boom');
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).rejects.toThrow('boom');

    expect(fetchQuerySpy.mock.calls.length).toBe(1);
    expect(getToken.mock.calls.length).toBe(1);
  });

  test('surfaces unauthorized errors when no auth is configured', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => {
        throw Object.assign(new Error('unauthorized'), {
          data: { code: 'UNAUTHORIZED' },
        });
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({})).rejects.toThrow('unauthorized');
    expect(fetchQuerySpy.mock.calls.length).toBe(1);
  });

  test('does not retry non-unauthorized errors even when token is not fresh', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async () => {
        throw new Error('boom');
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken, isUnauthorized: () => false },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({ tag: 'x' })).rejects.toThrow('boom');

    expect(fetchQuerySpy.mock.calls.length).toBe(1);
    expect(getToken.mock.calls.length).toBe(1);
  });

  test('does not replay mutations on non-unauthorized errors', async () => {
    const fetchMutationSpy = spyOn(
      convexNextjs,
      'fetchMutation'
    ).mockImplementation(async () => {
      throw new Error('title already exists');
    });

    const ref = makeFunctionReference<'mutation'>('todos:create');
    const apiWithMeta = {
      todos: {
        create: Object.assign(ref, { functionRef: ref, type: 'mutation' }),
      },
    } as const;

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta as any,
      auth: { getToken, isUnauthorized: () => false },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      (ctx.caller as any).todos.create({ title: 'x' })
    ).rejects.toThrow('title already exists');

    expect(fetchMutationSpy.mock.calls.length).toBe(1);
  });

  test('does not replay actions on non-unauthorized errors', async () => {
    const fetchActionSpy = spyOn(
      convexNextjs,
      'fetchAction'
    ).mockImplementation(async () => {
      throw new Error('receipt write failed');
    });

    const ref = makeFunctionReference<'action'>('billing:charge');
    const apiWithMeta = {
      billing: {
        charge: Object.assign(ref, { functionRef: ref, type: 'action' }),
      },
    } as const;

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta as any,
      auth: { getToken, isUnauthorized: () => false },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      (ctx.caller as any).billing.charge({ orderId: 'o1' })
    ).rejects.toThrow('receipt write failed');

    expect(fetchActionSpy.mock.calls.length).toBe(1);
  });

  test('refreshes token and replays mutations on unauthorized errors when token is not fresh', async () => {
    const fetchMutationSpy = spyOn(
      convexNextjs,
      'fetchMutation'
    ).mockImplementation(async (_fn: any, _args: any, opts: any) => {
      if (opts?.token === 't0') {
        throw Object.assign(new Error('unauthorized'), {
          code: 'UNAUTHORIZED',
        });
      }
      return 'ok';
    });

    const ref = makeFunctionReference<'mutation'>('todos:create');
    const apiWithMeta = {
      todos: {
        create: Object.assign(ref, { functionRef: ref, type: 'mutation' }),
      },
    } as const;

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta as any,
      auth: {
        getToken,
        isUnauthorized: (e) =>
          !!e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as any).code === 'UNAUTHORIZED',
      },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(
      (ctx.caller as any).todos.create({ title: 'x' })
    ).resolves.toBe('ok');

    expect(fetchMutationSpy.mock.calls.length).toBe(2);
    expect(getToken.mock.calls[1]?.[2]?.forceRefresh).toBe(true);
  });

  test('refreshes token and retries once on unauthorized errors when token is not fresh', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async (_fn: any, _args: any, opts: any) => {
        if (opts?.token === 't0') {
          throw Object.assign(new Error('unauthorized'), {
            code: 'UNAUTHORIZED',
          });
        }
        return 'ok';
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(
      async (_siteUrl: string, _headers: Headers, opts?: any) => {
        if (opts?.forceRefresh) return { isFresh: true, token: 't1' };
        return { isFresh: false, token: 't0' };
      }
    );

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: {
        getToken,
        isUnauthorized: (e) =>
          !!e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as any).code === 'UNAUTHORIZED',
      },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({ tag: 'x' } as any)).resolves.toBe(
      'ok'
    );
    expect(fetchQuerySpy.mock.calls.length).toBe(2);
    expect(getToken.mock.calls.length).toBe(2);
    expect(getToken.mock.calls[1]?.[2]?.forceRefresh).toBe(true);
  });

  test('encodes Date args before fetch and decodes Date responses', async () => {
    const encoded = encodeWire({ at: new Date(1_700_000_000_000) });
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async (_fn: any, args: any) => {
        expect(args).toEqual(encoded);
        return encoded as any;
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ isFresh: true, token: 't0' }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken, isUnauthorized: () => false },
      convexSiteUrl: 'https://example.convex.site',
    });

    const ctx = await createContext({ headers: new Headers() });
    const result = await ctx.caller.posts.list({
      at: new Date(1_700_000_000_000),
    } as any);

    expect((result as any).at).toBeInstanceOf(Date);
    expect(fetchQuerySpy).toHaveBeenCalled();
  });

  test('passes custom transformer through caller factory', async () => {
    const fetchQuerySpy = spyOn(convexNextjs, 'fetchQuery').mockImplementation(
      async (_fn: any, args: any) => {
        expect(args).toEqual({ $in: { scope: 'all' } });
        return { $out: 7 } as any;
      }
    );

    const api = {
      posts: { list: makeFunctionReference<'query'>('posts:list') },
    };
    const apiWithMeta = withQueryLeafMeta(api);

    const getToken = mock(async () => ({ isFresh: true, token: 't0' }));

    const { createContext } = createCallerFactory({
      api: apiWithMeta,
      auth: { getToken, isUnauthorized: () => false },
      convexSiteUrl: 'https://example.convex.site',
      transformer: {
        input: {
          deserialize: (value: unknown) => value,
          serialize: (value: unknown) => ({ $in: value }),
        },
        output: {
          deserialize: (value: unknown) => (value as any)?.$out ?? value,
          serialize: (value: unknown) => value,
        },
      },
    });

    const ctx = await createContext({ headers: new Headers() });
    await expect(ctx.caller.posts.list({ scope: 'all' } as any)).resolves.toBe(
      7
    );
    expect(fetchQuerySpy).toHaveBeenCalled();
  });
});
