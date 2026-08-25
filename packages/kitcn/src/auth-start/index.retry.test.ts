import { afterEach, describe, expect, mock, test } from 'bun:test';
import { makeFunctionReference } from 'convex/server';

describe('auth/start token refresh', () => {
  afterEach(() => {
    mock.restore();
  });

  test('retries with a fresh token when cached auth fails', async () => {
    const query = mock(async function (
      this: { token?: string },
      _ref: unknown
    ) {
      if (this.token === 'stale-token') {
        const error = new Error('unauthorized');
        (error as Error & { code?: string }).code = 'UNAUTHORIZED';
        throw error;
      }
      return 'ok';
    });

    mock.module('convex/browser', () => ({
      ConvexHttpClient: class {
        token?: string;
        constructor(_url: string) {}
        query = query;
        mutation = query;
        action = query;
        setAuth(token: string) {
          this.token = token;
        }
        setFetchOptions(_options: RequestInit) {}
      },
    }));

    const getToken = mock(async (_siteUrl: string, _headers: Headers) => {
      if (getToken.mock.calls.length === 1) {
        return { isFresh: false, token: 'stale-token' };
      }
      return { isFresh: true, token: 'fresh-token' };
    });

    mock.module('../auth/internal/token', () => ({
      getToken,
    }));

    const request = new Request('https://app.example.com/');
    mock.module('@tanstack/react-start/server', () => ({
      getRequest: () => request,
      getRequestHeaders: () => request.headers,
    }));

    const serverMutation = mock(
      async (_ref: unknown, _args: unknown, options?: { token?: string }) => {
        if (options?.token === 'stale-token') {
          const error = new Error('unauthorized');
          (error as Error & { code?: string }).code = 'UNAUTHORIZED';
          throw error;
        }
        return 'ok';
      }
    );

    mock.module('convex/nextjs', () => ({
      fetchAction: serverMutation,
      fetchMutation: serverMutation,
      fetchQuery: serverMutation,
    }));

    const mutationRef = makeFunctionReference<'mutation'>('todos:create');
    const api = {
      todos: {
        create: Object.assign(mutationRef, {
          functionRef: mutationRef,
          type: 'mutation',
        }),
      },
    } as const;

    const { convexBetterAuthReactStart } = await import('./server');

    const auth = convexBetterAuthReactStart({
      api,
      auth: {
        isUnauthorized: (error) =>
          (error as { code?: string } | undefined)?.code === 'UNAUTHORIZED',
      },
      convexSiteUrl: 'https://app.convex.site',
      convexUrl: 'https://app.convex.cloud',
    });

    const caller = auth.createCaller();
    await expect(caller.getToken()).resolves.toBe('stale-token');
    await expect(auth.fetchAuthQuery({} as never)).resolves.toBe('ok');
    await expect(caller.todos.create({})).resolves.toBe('ok');

    expect(getToken).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledTimes(2);
    expect(serverMutation).toHaveBeenCalledTimes(1);
  });
});
