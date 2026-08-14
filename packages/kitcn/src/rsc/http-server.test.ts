import { HttpClientError } from '../crpc/http-types';
import { buildHttpQueryOptions, fetchHttpRoute } from './http-server';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });

describe('rsc/http-server', () => {
  let fetchSpy: ReturnType<typeof spyOn> | undefined;

  afterEach(() => {
    fetchSpy?.mockRestore();
    fetchSpy = undefined;
  });

  test('buildHttpQueryOptions matches client key format and stores route meta', () => {
    const opts = buildHttpQueryOptions(
      { path: '/api/health', method: 'GET' },
      'health',
      { a: 1 }
    );

    expect(opts.queryKey).toEqual(['httpQuery', 'health', { a: 1 }]);
    expect(opts.meta).toEqual({ path: '/api/health', method: 'GET' });
  });

  test('fetchHttpRoute builds URL from params/searchParams and sends auth header', async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    fetchSpy = spyOn(globalThis, 'fetch').mockImplementation((async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      seen.push({ url: String(input), init });
      return jsonResponse({ ok: true });
    }) as any);

    const args = {
      params: { id: 'a b' },
      searchParams: { foo: 'bar', tag: ['x', 'y'] },
    };

    await expect(
      fetchHttpRoute(
        'https://example.convex.site',
        { path: '/api/todos/:id', method: 'GET' },
        args,
        't0'
      )
    ).resolves.toEqual({ ok: true });

    expect(seen[0]?.url).toBe(
      'https://example.convex.site/api/todos/a%20b?foo=bar&tag=x&tag=y'
    );
    expect(seen[0]?.init?.method).toBe('GET');
    expect(seen[0]?.init?.headers).toMatchObject({
      Authorization: 'Bearer t0',
    });

    // Ensure args are not mutated.
    expect(args).toEqual({
      params: { id: 'a b' },
      searchParams: { foo: 'bar', tag: ['x', 'y'] },
    });
  });

  test('fetchHttpRoute decodes wire-tagged payloads', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ dueDate: { __crpc: 1, t: '$date', v: 1_700_000_000_000 } })
    );

    const result = (await fetchHttpRoute(
      'https://example.convex.site',
      { path: '/api/todos', method: 'GET' },
      {},
      undefined
    )) as { dueDate: Date };

    expect(result.dueDate).toBeInstanceOf(Date);
    expect(result.dueDate.getTime()).toBe(1_700_000_000_000);
  });

  test('fetchHttpRoute returns null for empty responses', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 204 })
    );

    await expect(
      fetchHttpRoute(
        'https://example.convex.site',
        { path: '/api/health', method: 'GET' },
        {},
        undefined
      )
    ).resolves.toBeNull();

    fetchSpy.mockRestore();
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200, headers: { 'content-length': '0' } })
    );

    await expect(
      fetchHttpRoute(
        'https://example.convex.site',
        { path: '/api/health', method: 'GET' },
        {},
        undefined
      )
    ).resolves.toBeNull();
  });

  test('fetchHttpRoute throws HttpClientError for non-ok responses', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { error: { code: 'FORBIDDEN', message: 'nope' } },
        { status: 403 }
      )
    );

    await expect(
      fetchHttpRoute(
        'https://example.convex.site',
        { path: '/api/secret', method: 'GET' },
        {},
        undefined
      )
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    } satisfies Partial<HttpClientError>);
  });
});
