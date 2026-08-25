import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { makeFunctionReference } from 'convex/server';

// The real `getRequest`/`getRequestHeaders` read TanStack Start's per-request
// AsyncLocalStorage, which only a live server runtime enters. Faking the two
// accessors lets the test own request boundaries explicitly, and keeps it
// immune to `mock.module` state leaking in from sibling files.
let currentRequest: Request;

const enterRequest = (cookie: string) => {
  currentRequest = new Request('https://app.example.com/');
  // happy-dom (registered by tooling/test-setup.ts) drops `cookie` when passed
  // through the Request constructor init, so set it after construction.
  currentRequest.headers.set('cookie', cookie);
};

mock.module('@tanstack/react-start/server', () => ({
  getRequest: () => currentRequest,
  getRequestHeaders: () => currentRequest.headers,
}));

let tokenFetches = 0;

mock.module('../auth/internal/token', () => ({
  getToken: async (_siteUrl: string, headers: Headers) => {
    tokenFetches++;
    return { isFresh: true, token: `jwt-for-${headers.get('cookie')}` };
  },
}));

let convexCalls = 0;
let lastConvexToken: string | undefined;

mock.module('convex/nextjs', () => ({
  fetchAction: async () => 'ok',
  fetchMutation: async () => 'ok',
  fetchQuery: async (
    _query: unknown,
    _args: unknown,
    options?: { token?: string }
  ) => {
    convexCalls++;
    lastConvexToken = options?.token;
    return 'ok';
  },
}));

const listRef = makeFunctionReference<'query'>('posts:list');
const api = {
  posts: {
    list: Object.assign(listRef, { functionRef: listRef, type: 'query' }),
  },
};

const createAuth = async () => {
  const { convexBetterAuthReactStart } = await import('./server');

  return convexBetterAuthReactStart({
    api,
    convexSiteUrl: 'https://app.convex.site',
    convexUrl: 'https://app.convex.cloud',
  });
};

describe('auth/start request-scoped auth', () => {
  beforeEach(() => {
    tokenFetches = 0;
    convexCalls = 0;
    lastConvexToken = undefined;
  });

  afterEach(() => {
    mock.restore();
  });

  test('K procedure calls in one request cost 1 token fetch', async () => {
    const { createCaller } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');

    await caller.posts.list({});
    await caller.posts.list({});
    await caller.posts.list({});

    expect(convexCalls).toBe(3);
    expect(tokenFetches).toBe(1);
  });

  test('concurrent procedure calls share one in-flight token fetch', async () => {
    const { createCaller } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');

    await Promise.all([
      caller.posts.list({}),
      caller.posts.list({}),
      caller.posts.list({}),
    ]);

    expect(convexCalls).toBe(3);
    expect(tokenFetches).toBe(1);
  });

  test('caller, getToken, and fetchAuthQuery share one token fetch', async () => {
    const { createCaller, getToken } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');

    await caller.posts.list({});
    const token = await getToken();
    await caller.posts.list({});

    expect(token).toBe('jwt-for-session=alice');
    expect(tokenFetches).toBe(1);
  });

  test('SECURITY: the per-request memo never serves one request the other request token', async () => {
    const { createCaller, getToken } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');
    await caller.posts.list({});
    const aliceCallerToken = lastConvexToken;
    const aliceToken = await getToken();
    const fetchesAfterAlice = tokenFetches;

    enterRequest('session=bob');
    await caller.posts.list({});
    const bobCallerToken = lastConvexToken;
    const bobToken = await getToken();

    // A module-scope memo would satisfy every dedupe count below while handing
    // bob alice's token, so these identity assertions are the real guard.
    expect(aliceCallerToken).toBe('jwt-for-session=alice');
    expect(aliceToken).toBe('jwt-for-session=alice');
    expect(bobCallerToken).toBe('jwt-for-session=bob');
    expect(bobToken).toBe('jwt-for-session=bob');

    expect(fetchesAfterAlice).toBe(1);
    expect(tokenFetches).toBe(2);
  });

  test('an explicit createContext mints its own token instead of reusing the request memo', async () => {
    const { createCaller, createContext } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');
    await caller.posts.list({});
    expect(tokenFetches).toBe(1);

    const otherHeaders = new Headers();
    otherHeaders.set('cookie', 'session=carol');
    const ctx = await createContext({ headers: otherHeaders });

    expect(ctx.token).toBe('jwt-for-session=carol');
    expect(tokenFetches).toBe(2);
  });

  test('survives the request swapping its Headers object mid-request', async () => {
    // srvx serves a lazy header view until something materializes the native
    // Request (a server function reading `formData()`), then swaps in that
    // Request's own Headers. Values survive, identity does not. Anything that
    // compares against the live accessor stops matching after the swap.
    const headersA = new Headers();
    headersA.set('cookie', 'session=alice');
    const headersB = new Headers();
    headersB.set('cookie', 'session=alice');

    let swapped = false;
    currentRequest = {
      get headers() {
        return swapped ? headersB : headersA;
      },
    } as unknown as Request;

    const { createCaller, getToken } = await createAuth();
    const caller = createCaller();

    // Resolve the ambient token first, so the request's headers are captured
    // before the swap and the caller's context is built after it.
    await expect(getToken()).resolves.toBe('jwt-for-session=alice');
    expect(tokenFetches).toBe(1);

    swapped = true;

    await caller.posts.list({});
    await caller.posts.list({});

    expect(headersA).not.toBe(headersB);
    expect(convexCalls).toBe(2);
    expect(tokenFetches).toBe(1);
  });

  test('a failed token fetch is evicted so the next call retries', async () => {
    let shouldFail = true;
    mock.module('../auth/internal/token', () => ({
      getToken: async (_siteUrl: string, headers: Headers) => {
        tokenFetches++;
        if (shouldFail) {
          throw new Error('token endpoint down');
        }
        return { isFresh: true, token: `jwt-for-${headers.get('cookie')}` };
      },
    }));

    const { createCaller } = await createAuth();
    const caller = createCaller();

    enterRequest('session=alice');

    await expect(caller.posts.list({})).rejects.toThrow('token endpoint down');
    expect(tokenFetches).toBe(1);

    shouldFail = false;
    await expect(caller.posts.list({})).resolves.toBe('ok');
    expect(tokenFetches).toBe(2);
  });
});
