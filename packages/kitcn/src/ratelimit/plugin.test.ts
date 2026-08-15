import { beforeEach, describe, expect, test } from 'bun:test';
import { definePlugin } from '../plugins';
import { CRPCError, initCRPC } from '../server';
import { resetProtectionState } from './core/deny-list';
import { MINUTE, Ratelimit, RatelimitPlugin } from './index';
import type {
  ConvexRatelimitDbWriter,
  LimitRequest,
  ProtectionLists,
} from './types';

type TableRow = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

function createMockDb(): ConvexRatelimitDbWriter {
  const tables = new Map<string, TableRow[]>();

  const getTable = (name: string) => {
    const table = tables.get(name);
    if (table) {
      return table;
    }
    const created: TableRow[] = [];
    tables.set(name, created);
    return created;
  };

  return {
    query(tableName: string) {
      const table = getTable(tableName);
      return {
        withIndex(_name, cb) {
          const filters: Array<{ field: string; value: unknown }> = [];
          cb({
            eq(field: string, value: unknown) {
              filters.push({ field, value });
              return this;
            },
          });

          const filtered = () =>
            table.filter((row) =>
              filters.every((filter) => row[filter.field] === filter.value)
            );

          return {
            async unique() {
              return filtered()[0] ?? null;
            },
            async collect() {
              return filtered();
            },
          };
        },
      };
    },
    async insert(tableName, value) {
      const table = getTable(tableName);
      const id = `${tableName}_${table.length + 1}`;
      table.push({
        _id: id,
        _creationTime: Date.now(),
        ...value,
      } as TableRow);
      return id;
    },
    async patch(id, value) {
      for (const table of tables.values()) {
        const row = table.find((candidate) => candidate._id === id);
        if (row) {
          Object.assign(row, value);
          return;
        }
      }
      throw new Error(`Row not found: ${id}`);
    },
    async delete(tableName, id) {
      const table = getTable(tableName);
      const index = table.findIndex((row) => row._id === id);
      if (index >= 0) {
        table.splice(index, 1);
      }
    },
  };
}

type TestUser = {
  id: string;
  plan?: 'premium' | null;
};

type TestCtx = {
  db: ConvexRatelimitDbWriter;
  scheduler: {};
  user: TestUser | null;
  ip?: string;
};

type TestMeta = {
  ratelimit?: 'default' | 'interactive';
};

const fixed = (rate: number) => Ratelimit.fixedWindow(rate, MINUTE);

function createConfiguredPlugin(options?: {
  onSignals?: (request: LimitRequest | undefined) => void;
  denyList?: ProtectionLists;
}) {
  return RatelimitPlugin.configure({
    denyList: options?.denyList,
    buckets: {
      default: {
        public: fixed(1),
        free: fixed(1),
        premium: fixed(2),
      },
      interactive: {
        public: fixed(1),
        free: fixed(1),
        premium: fixed(1),
      },
    },
    getBucket: ({ meta }: { meta: TestMeta }) => meta.ratelimit ?? 'default',
    getUser: ({ ctx }: { ctx: TestCtx }) => ctx.user,
    getTier: (user: TestUser | null) => (user?.plan ? 'premium' : 'free'),
    getSignals: ({ ctx, user }: { ctx: TestCtx; user: TestUser | null }) => {
      const request = {
        ip: ctx.ip ?? (user ? '127.0.0.1' : '127.0.0.2'),
        userAgent: 'bun:test',
      } satisfies LimitRequest;
      options?.onSignals?.(request);
      return request;
    },
    getIdentifier: ({
      user,
      signals,
    }: {
      user: TestUser | null;
      signals: LimitRequest | undefined;
    }) => user?.id ?? `ip:${signals?.ip ?? 'unknown'}`,
    failureMode: 'closed',
    enableProtection: true,
    denyListThreshold: 30,
    prefix: ({ bucket, tier }) => `ratelimit:${bucket}:${tier}`,
  });
}

describe('RatelimitPlugin', () => {
  // Deny-list state is module-scope, so every test in this file shares it.
  beforeEach(() => {
    resetProtectionState();
  });

  test('middleware() injects ctx.api.ratelimit and uses default bucket when unset', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin();
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation
      .use(plugin.middleware())
      .mutation(async ({ ctx }) => ctx.api.ratelimit.buckets.default.free.kind);

    await expect((proc as any)._handler({}, {})).resolves.toBe('fixedWindow');
  });

  test('middleware() uses configured bucket resolver and throws CRPCError on limit failure', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin();
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation
      .meta({ ratelimit: 'interactive' })
      .use(plugin.middleware())
      .mutation(async () => 'ok');

    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    await expect((proc as any)._handler({}, {})).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    } satisfies Partial<CRPCError>);
  });

  test('middleware() uses configured tier resolver', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin();
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: {
              id: 'user-1',
              plan: 'premium',
            },
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation.use(plugin.middleware()).mutation(async () => 'ok');

    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    await expect((proc as any)._handler({}, {})).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    } satisfies Partial<CRPCError>);
  });

  test('middleware() uses configured signal resolver', async () => {
    const db = createMockDb();
    let request: LimitRequest | undefined;
    const plugin = createConfiguredPlugin({
      onSignals: (nextRequest) => {
        request = nextRequest;
      },
    });
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: {
              id: 'user-2',
              plan: null,
            },
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation.use(plugin.middleware()).mutation(async () => 'ok');

    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    expect(request).toEqual({
      ip: '127.0.0.1',
      userAgent: 'bun:test',
    });
  });

  test('middleware() resolves signals before the identifier so each request ip gets its own budget', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin();
    const ips = ['203.0.113.1', '203.0.113.2', '203.0.113.1'];
    let call = 0;
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
            ip: ips[call++],
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation.use(plugin.middleware()).mutation(async () => 'ok');

    // Two distinct ips do not share the single-token public budget.
    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');
    // The first ip comes back and is out of budget.
    await expect((proc as any)._handler({}, {})).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    } satisfies Partial<CRPCError>);
  });

  test('middleware() forwards denyList to the limiter', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin({
      denyList: { ips: ['203.0.113.9'] },
    });
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
            ip: '203.0.113.9',
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation.use(plugin.middleware()).mutation(async () => 'ok');

    // Denied on the first call: a static deny list short-circuits before any
    // budget is spent, so this only passes if `denyList` reached the limiter.
    await expect((proc as any)._handler({}, {})).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    } satisfies Partial<CRPCError>);
  });

  test('middleware() calls getSignals once per request', async () => {
    const db = createMockDb();
    let signalCalls = 0;
    const plugin = createConfiguredPlugin({
      onSignals: () => {
        signalCalls += 1;
      },
    });
    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation.use(plugin.middleware()).mutation(async () => 'ok');

    await expect((proc as any)._handler({}, {})).resolves.toBe('ok');

    expect(signalCalls).toBe(1);
  });

  test('extend() can coexist with named middleware presets', async () => {
    const db = createMockDb();
    const plugin = createConfiguredPlugin().extend(({ middleware }) => ({
      tagged: () =>
        middleware().pipe(async ({ ctx, next }) =>
          next({
            ctx: {
              ...ctx,
              tag: 'tagged' as const,
            },
          })
        ),
    }));

    const c = initCRPC
      .context({
        mutation: () =>
          ({
            db,
            scheduler: {},
            user: null,
          }) satisfies TestCtx,
      })
      .meta<TestMeta>()
      .create();

    const proc = c.mutation
      .use(plugin.middleware())
      .use(plugin.tagged())
      .mutation(async ({ ctx }) => (ctx as typeof ctx & { tag: 'tagged' }).tag);

    await expect((proc as any)._handler({}, {})).resolves.toBe('tagged');
  });
});
