import { ConvexError } from 'convex/values';
import { z } from 'zod';

import { CRPC_ERROR_CODE_TO_HTTP, CRPCError } from './error';
import {
  createHttpProcedureBuilder,
  extractPathParams,
  handleHttpError,
  matchPathParams,
} from './http-builder';

describe('server/http-builder', () => {
  test('extractPathParams returns param names in order', () => {
    expect(extractPathParams('/todos/:id')).toEqual(['id']);
    expect(extractPathParams('/orgs/:org_id/users/:userId')).toEqual([
      'org_id',
      'userId',
    ]);
    expect(extractPathParams('/static/path')).toEqual([]);
  });

  test('matchPathParams matches templates and decodes URI components', () => {
    expect(matchPathParams('/todos/:id', '/todos/123')).toEqual({ id: '123' });
    expect(matchPathParams('/todos/:id', '/todos/hello%20world')).toEqual({
      id: 'hello world',
    });
    expect(matchPathParams('/todos/:id', '/todos')).toBeNull();
    expect(matchPathParams('/todos/:id', '/posts/123')).toBeNull();
    expect(matchPathParams('/a/:x/b/:y', '/a/1/b/2')).toEqual({
      x: '1',
      y: '2',
    });
  });

  test('handleHttpError maps CRPCError codes and returns structured JSON', async () => {
    const resp = handleHttpError(
      new CRPCError({ code: 'UNAUTHORIZED', message: 'Nope' })
    );

    expect(resp.status).toBe(401);
    await expect(resp.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Nope' },
    });
  });

  test('handleHttpError maps every cRPC error code to its canonical status', async () => {
    // Server faults are logged, so the 5xx codes in this sweep would otherwise
    // print for every iteration.
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    try {
      for (const [code, status] of Object.entries(CRPC_ERROR_CODE_TO_HTTP)) {
        const resp = handleHttpError(
          new CRPCError({ code: code as keyof typeof CRPC_ERROR_CODE_TO_HTTP })
        );
        expect([code, resp.status]).toEqual([code, status]);
        expect([code, errorSpy.mock.calls.length > 0]).toEqual([
          code,
          status >= 500,
        ]);
        errorSpy.mockClear();
      }
    } finally {
      errorSpy.mockRestore();
    }
  });

  test('handleHttpError recovers cRPC errors thrown across a Convex syscall boundary', async () => {
    // `ctx.runQuery`/`ctx.runMutation` never rethrow the original error object:
    // Convex builds a fresh ConvexError from the message and re-attaches `.data`.
    const rethrown = new ConvexError('Todo not found');
    rethrown.data = { code: 'NOT_FOUND', message: 'Todo not found' };

    const resp = handleHttpError(rethrown);

    expect(resp.status).toBe(404);
    await expect(resp.json()).resolves.toEqual({
      error: { code: 'NOT_FOUND', message: 'Todo not found' },
    });
  });

  test('route surfaces a cRPC error raised by a procedure it called through ctx.runQuery', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: (ctx) => ctx as any,
      meta: {},
    });

    const proc = http
      .get('/api/todos/:id')
      .params(z.object({ id: z.string() }))
      .query(async ({ ctx, params }) =>
        (ctx as any).runQuery('todosInternal:get', { id: params.id })
      );

    const convexCtx = {
      runQuery: () => {
        // Convex rebuilds the error across the syscall boundary, so the
        // route only ever sees a ConvexError carrying `.data`.
        const rethrown = new ConvexError('Todo not found');
        rethrown.data = { code: 'NOT_FOUND', message: 'Todo not found' };
        return Promise.reject(rethrown);
      },
    };

    const resp = await (proc as any)(
      convexCtx,
      new Request('https://example.com/api/todos/123')
    );

    expect(resp.status).toBe(404);
    await expect(resp.json()).resolves.toEqual({
      error: { code: 'NOT_FOUND', message: 'Todo not found' },
    });
  });

  test('handleHttpError returns 500 for unknown errors', async () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    try {
      const resp = handleHttpError(new Error('boom'));
      expect(resp.status).toBe(500);
      await expect(resp.json()).resolves.toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  test('procedure returns 400 BAD_REQUEST when input schema validation fails', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .post('/todos/:id')
      .params(z.object({ id: z.string() }))
      .input(z.object({ name: z.string() }))
      .mutation(async () => ({ ok: true }));

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/todos/123', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 123 }),
      })
    );

    expect(resp.status).toBe(400);
    await expect(resp.json()).resolves.toEqual({
      error: { code: 'BAD_REQUEST', message: 'Invalid input' },
    });
  });

  test('procedure returns 400 BAD_REQUEST for an unparseable JSON body', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .post('/x')
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => input);

    for (const body of ['{"name": ', '']) {
      const resp = await (proc as any)(
        {},
        new Request('https://example.com/x', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        })
      );

      expect(resp.status).toBe(400);
      await expect(resp.json()).resolves.toEqual({
        error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
      });
    }
  });

  test('procedure returns 400 BAD_REQUEST for an unparseable form body', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .post('/upload')
      .form(z.object({ note: z.string() }))
      .mutation(async ({ form }) => form);

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/upload', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data; boundary=----nope',
        },
        body: 'not actually multipart',
      })
    );

    expect(resp.status).toBe(400);
    await expect(resp.json()).resolves.toEqual({
      error: { code: 'BAD_REQUEST', message: 'Invalid form data' },
    });
  });

  test('procedure returns 500 when output schema validation fails', async () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    try {
      const http = createHttpProcedureBuilder({
        base: (handler) => handler as any,
        createContext: () => ({}) as any,
        meta: {},
      });

      const proc = http
        .get('/x')
        .output(z.object({ ok: z.boolean() }))
        .query(async () => ({ ok: 'nope' }) as any);

      const resp = await (proc as any)(
        {},
        new Request('https://example.com/x')
      );

      // A server fault, so the status stays 500 - but the response names the
      // mismatch instead of the generic unhandled-error message.
      expect(resp.status).toBe(500);
      await expect(resp.json()).resolves.toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Output validation failed',
        },
      });

      // The body cannot carry the Zod issues without leaking server internals,
      // so the failing path must still reach the server log.
      expect(errorSpy).toHaveBeenCalled();
      const logged = errorSpy.mock.calls[0]?.[1] as any;
      expect(logged.data.ZodError).toEqual([
        {
          expected: 'boolean',
          code: 'invalid_type',
          path: ['ok'],
          message: 'Invalid input: expected boolean, received string',
        },
      ]);
    } finally {
      errorSpy.mockRestore();
    }
  });

  test('procedure parses params + searchParams with schema-based coercion', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/todos/:id')
      .params(z.object({ id: z.string() }))
      .searchParams(
        z.object({
          ids: z.array(z.string()),
          limit: z.number(),
          enabled: z.boolean().optional(),
        })
      )
      .query(async ({ params, searchParams }) => ({
        id: params.id,
        ids: searchParams.ids,
        limit: searchParams.limit,
        enabled: searchParams.enabled,
      }));

    const resp = await (proc as any)(
      {},
      new Request(
        'https://example.com/todos/hello%20world?ids=a&ids=b&limit=42&enabled=1'
      )
    );
    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      id: 'hello world',
      ids: ['a', 'b'],
      limit: 42,
      enabled: true,
    });
  });

  test('searchParams keys outside the schema stay raw strings', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/raw')
      .searchParams(z.looseObject({ limit: z.number() }))
      .query(async ({ searchParams }) => searchParams);

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/raw?limit=3&who=me&tag=a&tag=b')
    );
    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      limit: 3,
      who: 'me',
      tag: ['a', 'b'],
    });
  });

  test('a non-object searchParams schema gets no coercion', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/record')
      .searchParams(z.record(z.string(), z.string()))
      .query(async ({ searchParams }) => searchParams);

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/record?limit=3&flag=true')
    );
    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({ limit: '3', flag: 'true' });
  });

  test('procedure parses application/x-www-form-urlencoded bodies', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .post('/x')
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => input);

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/x', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name: 'alice' }),
      })
    );

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({ name: 'alice' });
  });

  test('http middleware receives automatic procedure route info', async () => {
    const seen: unknown[] = [];
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/todos/:id')
      .use(async ({ ctx, procedure, next }) => {
        seen.push(procedure);
        return next({ ctx });
      })
      .params(z.object({ id: z.string() }))
      .query(async ({ params }) => ({ id: params.id }));

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/todos/123')
    );

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({ id: '123' });
    expect(seen).toEqual([
      {
        method: 'GET',
        name: 'GET /todos/:id',
        path: '/todos/:id',
        type: 'httpAction',
      },
    ]);
  });

  test('http middleware wraps the procedure handler', async () => {
    const events: string[] = [];
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/x')
      .use(async ({ next }) => {
        events.push('before');
        const result = await next();
        events.push('after');
        return result;
      })
      .query(async () => {
        events.push('handler');
        return { ok: true };
      });

    const resp = await (proc as any)({}, new Request('https://example.com/x'));

    expect(resp.status).toBe(200);
    expect(events).toEqual(['before', 'handler', 'after']);
  });

  test('middleware getRawInput reports malformed JSON as BAD_REQUEST', async () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    try {
      const http = createHttpProcedureBuilder({
        base: (handler) => handler as any,
        createContext: () => ({}) as any,
        meta: {},
      });

      const proc = http
        .post('/x')
        .use(async ({ getRawInput, next }) => {
          await getRawInput();
          return next();
        })
        .mutation(async () => ({ ok: true }));

      const resp = await (proc as any)(
        {},
        new Request('https://example.com/x', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"name": ',
        })
      );

      expect(resp.status).toBe(400);
      await expect(resp.json()).resolves.toEqual({
        error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  test('procedure parses multipart form data via .form()', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .post('/upload')
      .form(z.object({ file: z.any(), note: z.string() }))
      .mutation(async ({ form }) => ({
        hasFile: form.file instanceof File,
        note: form.note,
      }));

    const fd = new FormData();
    fd.set('note', 'hello');
    fd.set('file', new File(['hi'], 'hi.txt', { type: 'text/plain' }));

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/upload', { method: 'POST', body: fd })
    );

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      hasFile: true,
      note: 'hello',
    });
  });

  test('procedure returns Response results directly (does not wrap)', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
    });

    const proc = http
      .get('/x')
      .query(async () => new Response('ok', { status: 201 }));
    const resp = await (proc as any)({}, new Request('https://example.com/x'));
    expect(resp.status).toBe(201);
    await expect(resp.text()).resolves.toBe('ok');
  });

  test('procedure uses custom transformer for body decode and json encode', async () => {
    const http = createHttpProcedureBuilder({
      base: (handler) => handler as any,
      createContext: () => ({}) as any,
      meta: {},
      transformer: {
        input: {
          serialize: (value: unknown) => value,
          deserialize: (value: unknown) => (value as any)?.$in ?? value,
        },
        output: {
          serialize: (value: unknown) => ({ $out: value }),
          deserialize: (value: unknown) => value,
        },
      },
    });

    const proc = http
      .post('/x')
      .input(z.object({ x: z.number() }))
      .mutation(async ({ input }) => ({ x: input.x + 1 }));

    const resp = await (proc as any)(
      {},
      new Request('https://example.com/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ $in: { x: 1 } }),
      })
    );

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      $out: { x: 2 },
    });
  });
});
