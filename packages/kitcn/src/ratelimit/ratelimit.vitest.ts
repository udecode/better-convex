import { beforeEach, describe, expect, test, vi } from 'vitest';
import { EphemeralBlockCache } from './core/cache';
import {
  calculateRatelimit,
  snapshotToState,
} from './core/calculate-rate-limit';
import { Ratelimit } from './ratelimit';
import type { ConvexRatelimitDbWriter } from './types';

const RATELIMIT_PLUGIN_REGEX =
  /convex\/lib\/plugins\/ratelimit\/schema\.ts|kitcn add ratelimit/i;
const TIMER_UNSUPPORTED_REGEX = /not supported in convex queries\/mutations/i;
const SHARD_BUDGET_REGEX = /must be at least shards/i;
const POSITIVE_NUMBER_REGEX = /positive number/i;

type TableRow = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

function createMockDb(options?: { delayMs?: number }) {
  const tables = new Map<string, TableRow[]>();
  const counters = {
    uniqueReads: 0,
    collectReads: 0,
  };

  const getTable = (name: string) => {
    const table = tables.get(name);
    if (table) {
      return table;
    }
    const created: TableRow[] = [];
    tables.set(name, created);
    return created;
  };

  const delay = async () => {
    const ms = options?.delayMs ?? 0;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  };

  const db: ConvexRatelimitDbWriter = {
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
              counters.uniqueReads += 1;
              await delay();
              return filtered()[0] ?? null;
            },
            async collect() {
              counters.collectReads += 1;
              await delay();
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

  return { db, counters };
}

function createSeededRandom(seed = 1): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

async function withTimersDisabled<T>(run: () => Promise<T>): Promise<T> {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  globalThis.setTimeout = (() => {
    throw new Error(
      "Can't use setTimeout in queries and mutations. Please consider using an action."
    );
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = (() => {}) as unknown as typeof clearTimeout;

  try {
    return await run();
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
}

describe('Ratelimit', () => {
  beforeEach(() => {
    Math.random = () => 0;
  });

  test('fixed window limits and returns retry metadata', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(2, '10 s'),
    });

    const one = await limiter.limit('user-1');
    const two = await limiter.limit('user-1');
    const three = await limiter.limit('user-1');

    expect(one.success).toBe(true);
    expect(two.success).toBe(true);
    expect(three.success).toBe(false);
    expect(three.reset).toBeGreaterThan(Date.now());
  });

  test('check is non-consuming', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(1, '10 s'),
    });

    const check = await limiter.check('user-2');
    const first = await limiter.limit('user-2');
    const second = await limiter.limit('user-2');

    expect(check.success).toBe(true);
    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });

  test('check evaluates the requested count without consuming tokens', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(2, '10 s'),
    });

    const oversized = await limiter.check('check-count-user', { count: 5 });
    const first = await limiter.limit('check-count-user');
    const second = await limiter.limit('check-count-user');
    const exhausted = await limiter.check('check-count-user');

    expect(oversized.success).toBe(false);
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(exhausted.success).toBe(false);
    expect(exhausted.remaining).toBe(0);
  });

  test('shards split the configured limit instead of multiplying it', async () => {
    Math.random = createSeededRandom();

    const granted: Record<string, number> = {};

    for (const [limit, shards] of [
      [5, 1],
      [5, 2],
      [5, 4],
      [20, 8],
    ] as const) {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.fixedWindow(limit, '1 m', { shards }),
      });

      let allowed = 0;
      for (let attempt = 0; attempt < 50; attempt++) {
        const result = await limiter.limit('sharded-user');
        if (result.success) {
          allowed += 1;
        }
      }
      granted[`limit${limit}/shards${shards}`] = allowed;
    }

    expect(granted).toEqual({
      'limit5/shards1': 5,
      'limit5/shards2': 5,
      'limit5/shards4': 5,
      'limit20/shards8': 20,
    });
  });

  test('shards keep the full budget when a limit is indivisible', async () => {
    Math.random = createSeededRandom(7);

    const granted: Record<string, number> = {};

    for (const [limit, shards] of [
      [7, 2],
      [10, 3],
      [23, 4],
    ] as const) {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        limiter: Ratelimit.slidingWindow(limit, '1 m', { shards }),
      });

      let allowed = 0;
      for (let attempt = 0; attempt < 80; attempt++) {
        const result = await limiter.limit('remainder-user');
        if (result.success) {
          allowed += 1;
        }
      }
      granted[`limit${limit}/shards${shards}`] = allowed;
    }

    expect(granted).toEqual({
      'limit7/shards2': 7,
      'limit10/shards3': 10,
      'limit23/shards4': 23,
    });
  });

  test('shards preserve whole requests for fractional budgets', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(5.5, '1 m', { shards: 2 }),
    });

    let allowed = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      Math.random = () => (attempt % 2 === 0 ? 0.1 : 0.9);
      const result = await limiter.limit('fractional-shard-user');
      if (result.success) {
        allowed += 1;
      }
    }

    expect(allowed).toBe(5);
  });

  test('shards keep whole-token reservation headroom', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(2, '1 m', {
        maxReserved: 1,
        shards: 2,
      }),
    });

    Math.random = () => 0;
    const first = await limiter.limit('reserved-shard-user');
    const reserved = await limiter.limit('reserved-shard-user', {
      reserve: true,
    });

    expect(first.success).toBe(true);
    expect(reserved.success).toBe(true);
  });

  test('a normal cache block does not hide reservation headroom', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(1, '1 m', { maxReserved: 1 }),
    });

    const first = await limiter.limit('reserved-cache-user');
    const denied = await limiter.limit('reserved-cache-user');
    const reserved = await limiter.limit('reserved-cache-user', {
      reserve: true,
    });

    expect(first.success).toBe(true);
    expect(denied.success).toBe(false);
    expect(reserved.success).toBe(true);
  });

  test('permanently oversized reserved requests have no retry deadline', async () => {
    const algorithms = [
      Ratelimit.tokenBucket(2, '1 s', 2, { maxReserved: 1 }),
      Ratelimit.fixedWindow(2, '1 s', { maxReserved: 1 }),
    ];

    for (const algorithm of algorithms) {
      const { db, counters } = createMockDb();
      const limiter = new Ratelimit({ db, limiter: algorithm });
      const denied = await limiter.limit('oversized-reserved-user', {
        count: 4,
        reserve: true,
      });

      expect(denied.success).toBe(false);
      expect(denied.reason).toBe('requestTooLarge');
      expect(denied.reset).toBe(0);
      expect(counters.uniqueReads).toBe(0);
    }
  });

  test('permanently undersized shards do not shorten reservation retries', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const { db } = createMockDb();
    await db.insert('ratelimitState', {
      name: 'kitcn/ratelimit',
      key: 'uneven-reserved-user',
      shard: 0,
      value: -1,
      ts: 1000,
    });
    await db.insert('ratelimitState', {
      name: 'kitcn/ratelimit',
      key: 'uneven-reserved-user',
      shard: 1,
      value: 2,
      ts: 1000,
    });
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(5, '1 s', {
        maxReserved: 1,
        shards: 2,
      }),
    });

    try {
      Math.random = () => 0.9;
      const denied = await limiter.limit('uneven-reserved-user', {
        count: 4,
        reserve: true,
      });

      expect(denied.success).toBe(false);
      expect(denied.reset).toBe(3000);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('reserved token bucket retries when reservation headroom is ready', async () => {
    let now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        limiter: Ratelimit.tokenBucket(1, '1 s', 2, { maxReserved: 1 }),
      });

      const first = await limiter.limit('reserved-retry-user', { count: 2 });
      const denied = await limiter.limit('reserved-retry-user', {
        count: 2,
        reserve: true,
      });

      expect(first.success).toBe(true);
      expect(denied.success).toBe(false);
      expect(denied.reset).toBe(2000);

      now = 2000;
      const ready = await limiter.limit('reserved-retry-user', {
        count: 2,
        reserve: true,
      });
      expect(ready.success).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('reserved fixed window retries when reservation headroom is ready', async () => {
    let now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        limiter: Ratelimit.fixedWindow(1, '1 s', { maxReserved: 1 }),
      });

      await limiter.limit('reserved-window-user');
      const denied = await limiter.limit('reserved-window-user', {
        count: 2,
        reserve: true,
      });
      expect(denied.success).toBe(false);
      expect(denied.reset).toBe(2000);

      now = 2000;
      const ready = await limiter.limit('reserved-window-user', {
        count: 2,
        reserve: true,
      });
      expect(ready.success).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('an exhausted shard falls back to preserve the configured budget', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(4, '1 m', { shards: 2 }),
    });

    // Route the first three requests to shard 0 and the rest to shard 1.
    const routes = [0.1, 0.1, 0.1, 0.9, 0.9];
    const outcomes: Array<{ success: boolean; reason?: string }> = [];

    for (const route of routes) {
      Math.random = () => route;
      const result = await limiter.limit('strand-user');
      outcomes.push({ success: result.success, reason: result.reason });
    }

    expect(outcomes).toEqual([
      { success: true, reason: undefined },
      { success: true, reason: undefined },
      { success: true, reason: undefined },
      { success: true, reason: undefined },
      { success: false, reason: undefined },
    ]);
  });

  test('a fully exhausted sharded limiter is served from the cache', async () => {
    const { db, counters } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(2, '1 m', { shards: 2 }),
    });

    Math.random = () => 0;
    const first = await limiter.limit('cached-user');
    const second = await limiter.limit('cached-user');
    const denied = await limiter.limit('cached-user');
    const readsAfterBlock = counters.uniqueReads;
    const cached = await limiter.limit('cached-user');

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(denied.success).toBe(false);
    expect(denied.reason).toBeUndefined();
    expect(cached.success).toBe(false);
    expect(cached.reason).toBe('cacheBlock');
    expect(counters.uniqueReads).toBe(readsAfterBlock);
  });

  test('a cached large request does not block a smaller request', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(6, '1 m', { shards: 2 }),
    });

    const oversized = await limiter.limit('count-cache-user', { count: 4 });
    const smaller = await limiter.limit('count-cache-user', { count: 1 });

    expect(oversized.success).toBe(false);
    expect(oversized.reason).toBe('requestTooLarge');
    expect(oversized.reset).toBe(0);
    expect(smaller.success).toBe(true);
  });

  test('cache writes prune expired count variants', () => {
    const cache = new Map<string, number>();
    const blockCache = new EphemeralBlockCache(cache);
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);

    try {
      blockCache.blockUntil('cache-user', 0, 4, false, 900);
      blockCache.blockUntil('cache-user', 0, 3, false, 2000);

      expect(blockCache.size()).toBe(1);
      expect(blockCache.isBlocked('cache-user', 0, 3, false)).toEqual({
        blocked: true,
        reset: 2000,
      });
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('a cached shard contributes to the earliest retry time', async () => {
    const { db } = createMockDb();
    const cache = new Map<string, number>();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: cache,
      limiter: Ratelimit.tokenBucket(2, '10 s', 2, { shards: 2 }),
    });

    Math.random = () => 0.9;
    await limiter.limit('retry-cache-user');

    const cachedReset = Date.now() + 1000;
    new EphemeralBlockCache(cache).blockUntil(
      'kitcn/ratelimit:retry-cache-user',
      0,
      1,
      false,
      cachedReset
    );
    Math.random = () => 0;
    const denied = await limiter.limit('retry-cache-user');

    expect(denied.success).toBe(false);
    expect(denied.reset).toBe(cachedReset);
  });

  test('rejects budgets that leave a shard under one token', () => {
    expect(() => Ratelimit.fixedWindow(3, '1 m', { shards: 4 })).toThrow(
      SHARD_BUDGET_REGEX
    );
    expect(() => Ratelimit.slidingWindow(3, '1 m', { shards: 4 })).toThrow(
      SHARD_BUDGET_REGEX
    );
    expect(() => Ratelimit.tokenBucket(3, '1 m', 3, { shards: 4 })).toThrow(
      SHARD_BUDGET_REGEX
    );
    expect(() => Ratelimit.fixedWindow(5, '1 m', { shards: 8 })).toThrow(
      SHARD_BUDGET_REGEX
    );
    expect(() =>
      Ratelimit.fixedWindow(10, '1 m', { capacity: 1, shards: 2 })
    ).toThrow(SHARD_BUDGET_REGEX);

    expect(() => Ratelimit.fixedWindow(4, '1 m', { shards: 4 })).not.toThrow();
    expect(() =>
      Ratelimit.fixedWindow(10, '1 m', { capacity: 20, shards: 2 })
    ).not.toThrow();
  });

  test('getRemaining reports sliding window tokens left', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    });

    const fresh = await limiter.getRemaining('sliding-user');
    await limiter.limit('sliding-user');
    const afterOne = await limiter.getRemaining('sliding-user');

    expect(fresh.remaining).toBe(10);
    expect(fresh.limit).toBe(10);
    expect(afterOne.remaining).toBe(9);
  });

  test('sliding snapshots preserve previous-window decay state', async () => {
    let now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.slidingWindow(10, '1 s'),
      });

      await limiter.limit('sliding-snapshot-user', { count: 10 });
      now = 2500;
      const snapshot = await limiter.getValue('sliding-snapshot-user');
      const projected = calculateRatelimit(
        snapshotToState(snapshot),
        snapshot.config,
        3000,
        0
      );

      expect(snapshot.value).toBe(5);
      expect(projected.remaining).toBe(10);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('all-shard snapshots preserve independent fixed-window saturation', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(0);

    try {
      const { db } = createMockDb();
      await db.insert('ratelimitState', {
        name: 'kitcn/ratelimit',
        key: 'saturated-snapshot-user',
        shard: 0,
        value: 5,
        ts: 0,
      });
      await db.insert('ratelimitState', {
        name: 'kitcn/ratelimit',
        key: 'saturated-snapshot-user',
        shard: 1,
        value: 0,
        ts: 0,
      });
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.fixedWindow(2, '1 m', {
          capacity: 10,
          shards: 2,
        }),
      });

      const snapshot = await limiter.getValue('saturated-snapshot-user', {
        sampleShards: 2,
      });
      const projected = calculateRatelimit(
        snapshotToState(snapshot),
        snapshot.config,
        60_000,
        0
      );

      expect(snapshot.state.shards).toHaveLength(2);
      expect(projected.remainingRaw).toBe(6);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('getRemaining sums every shard instead of extrapolating one', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(10, '1 m', { shards: 2 }),
    });

    // Drain shard 0 only; shard 1 keeps its full five-token share.
    Math.random = () => 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      await limiter.limit('aggregate-user');
    }

    const remaining = await limiter.getRemaining('aggregate-user');

    expect(remaining.remaining).toBe(5);
    expect(remaining.limit).toBe(10);
  });

  test('getRemaining does not refill an aggregated token snapshot twice', async () => {
    const now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.tokenBucket(2, '1 s', 2, { shards: 2 }),
      });

      Math.random = () => 0;
      await limiter.limit('aggregate-token-user');

      let readClockCalls = 0;
      nowSpy.mockImplementation(() => {
        readClockCalls += 1;
        return readClockCalls === 1 ? 1500 : 1750;
      });
      const remaining = await limiter.getRemaining('aggregate-token-user');

      expect(remaining.remaining).toBe(1);
      expect(remaining.limit).toBe(2);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('getRemaining does not net reserved debt against an open shard', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(2, '1 m', {
        maxReserved: 1,
        shards: 2,
      }),
    });

    Math.random = () => 0;
    await limiter.limit('usable-debt-user');
    await limiter.limit('usable-debt-user', { reserve: true });
    const remaining = await limiter.getRemaining('usable-debt-user');

    expect(remaining.remaining).toBe(1);
  });

  test('getRemaining does not combine unusable shard fractions', async () => {
    let now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.tokenBucket(2, '1 s', 2, { shards: 2 }),
      });

      Math.random = () => 0;
      await limiter.limit('usable-fraction-user');
      await limiter.limit('usable-fraction-user');
      now = 1500;
      const remaining = await limiter.getRemaining('usable-fraction-user');

      expect(remaining.remaining).toBe(0);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('uneven token buckets restore their full aggregate refill', async () => {
    let now = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        ephemeralCache: false,
        limiter: Ratelimit.tokenBucket(5, '1 s', 5, { shards: 2 }),
      });

      for (let attempt = 0; attempt < 5; attempt++) {
        expect((await limiter.limit('uneven-refill-user')).success).toBe(true);
      }

      now = 2000;
      const refilled: boolean[] = [];
      for (let attempt = 0; attempt < 5; attempt++) {
        refilled.push((await limiter.limit('uneven-refill-user')).success);
      }

      expect(refilled).toEqual([true, true, true, true, true]);
    } finally {
      nowSpy.mockRestore();
    }
  });

  test('fixed-window projections scale by capacity instead of refill limit', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      limiter: Ratelimit.fixedWindow(3, '1 m', {
        capacity: 100,
        shards: 2,
      }),
    });

    Math.random = () => 0.9;
    const fresh = await limiter.getValue('capacity-user');
    const consumed = await limiter.limit('capacity-user');

    expect(fresh.value).toBe(100);
    expect(consumed.limit).toBe(3);
    expect(consumed.remaining).toBe(98);
  });

  test('resetUsedTokens clears the ephemeral block', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      prefix: 'reset-demo',
      limiter: Ratelimit.fixedWindow(1, '1 m'),
    });

    const first = await limiter.limit('reset-user');
    const blocked = await limiter.limit('reset-user');
    await limiter.resetUsedTokens('reset-user');
    const afterReset = await limiter.limit('reset-user');

    expect(first.success).toBe(true);
    expect(blocked.success).toBe(false);
    expect(afterReset.success).toBe(true);
    expect(afterReset.reason).toBeUndefined();
  });

  test('dynamic limits can be set and read', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      dynamicLimits: true,
      prefix: 'dynamic-demo',
      limiter: Ratelimit.fixedWindow(5, '10 s'),
    });

    await limiter.setDynamicLimit({ limit: 1 });
    const current = await limiter.getDynamicLimit();
    expect(current.dynamicLimit).toBe(1);

    await limiter.limit('user-3');
    const second = await limiter.limit('user-3');
    expect(second.success).toBe(false);
  });

  test('dynamic limit changes invalidate snapshots and block decisions', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      dynamicLimits: true,
      limiter: Ratelimit.slidingWindow(1, '1 m'),
    });

    await limiter.limit('dynamic-cache-user');
    const initial = await limiter.getValue('dynamic-cache-user');
    const blocked = await limiter.limit('dynamic-cache-user');
    await limiter.setDynamicLimit({ limit: 2 });
    const updated = await limiter.getValue('dynamic-cache-user');
    const allowed = await limiter.limit('dynamic-cache-user');

    expect(initial.config.limit).toBe(1);
    expect(blocked.success).toBe(false);
    expect(updated.config.limit).toBe(2);
    expect(allowed.success).toBe(true);
  });

  test('rejects a dynamic limit the shard split cannot serve', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      dynamicLimits: true,
      prefix: 'dynamic-shards',
      limiter: Ratelimit.fixedWindow(100, '1 m', { shards: 10 }),
    });

    await expect(limiter.setDynamicLimit({ limit: 5 })).rejects.toThrow(
      SHARD_BUDGET_REGEX
    );

    const current = await limiter.getDynamicLimit();
    expect(current.dynamicLimit).toBeNull();

    await limiter.setDynamicLimit({ limit: 20 });
    const allowed = await limiter.limit('dynamic-shard-user');
    expect(allowed.success).toBe(true);
    expect(allowed.limit).toBe(20);
  });

  test('rejects invalid token-bucket refill overrides before persisting', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      dynamicLimits: true,
      prefix: 'dynamic-token-refill',
      limiter: Ratelimit.tokenBucket(5, '1 m', 10),
    });

    for (const limit of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(limiter.setDynamicLimit({ limit })).rejects.toThrow(
        POSITIVE_NUMBER_REGEX
      );
    }

    expect((await limiter.getDynamicLimit()).dynamicLimit).toBeNull();
  });

  test('fallback shard reads run within the configured timeout', async () => {
    const { db } = createMockDb({ delayMs: 20 });
    const identifier = 'parallel-fallback-user';
    for (let shard = 0; shard < 10; shard += 1) {
      await db.insert('ratelimitState', {
        name: 'kitcn/ratelimit',
        key: identifier,
        shard,
        value: 0,
        ts: Date.now(),
      });
    }
    const limiter = new Ratelimit({
      db,
      ephemeralCache: false,
      failureMode: 'open',
      timeout: 100,
      limiter: Ratelimit.fixedWindow(10, '1 m', { shards: 10 }),
    });

    const denied = await limiter.limit(identifier);

    expect(denied.success).toBe(false);
    expect(denied.reason).toBeUndefined();
  });

  test('deny list rejects matching values with reason', async () => {
    const { db } = createMockDb();
    const limiter = new Ratelimit({
      db,
      enableProtection: true,
      denyList: {
        ips: ['10.0.0.1'],
      },
      limiter: Ratelimit.fixedWindow(2, '10 s'),
    });

    const denied = await limiter.limit('user-4', { ip: '10.0.0.1' });
    expect(denied.success).toBe(false);
    expect(denied.reason).toBe('denyList');
    expect(denied.deniedValue).toBe('10.0.0.1');
  });

  test('timeout in open mode succeeds with timeout reason', async () => {
    const { db } = createMockDb({ delayMs: 25 });
    const limiter = new Ratelimit({
      db,
      timeout: 1,
      failureMode: 'open',
      limiter: Ratelimit.fixedWindow(1, '10 s'),
    });

    const result = await limiter.limit('slow-user');
    expect(result.success).toBe(true);
    expect(result.reason).toBe('timeout');
  });

  test('timeout in closed mode fails with timeout reason', async () => {
    const { db } = createMockDb({ delayMs: 25 });
    const limiter = new Ratelimit({
      db,
      timeout: 1,
      failureMode: 'closed',
      limiter: Ratelimit.fixedWindow(1, '10 s'),
    });

    const result = await limiter.limit('slow-closed-user');
    expect(result.success).toBe(false);
    expect(result.reason).toBe('timeout');
  });

  test('dedupes repeated reads in same invocation path', async () => {
    const { db, counters } = createMockDb();
    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(10, '10 s'),
    });

    await limiter.check('user-5');
    await limiter.getValue('user-5', { sampleShards: 1 });
    await limiter.getValue('user-5', { sampleShards: 1 });

    expect(counters.uniqueReads).toBe(1);
  });

  test('degrades safely when timer APIs are unavailable', async () => {
    await withTimersDisabled(async () => {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        limiter: Ratelimit.fixedWindow(1, '10 s'),
      });

      const check = await limiter.check('timerless-user');
      const first = await limiter.limit('timerless-user');

      expect(check.success).toBe(true);
      expect(first.success).toBe(true);
    });
  });

  test('blockUntilReady throws actionable error when timers are unavailable', async () => {
    await withTimersDisabled(async () => {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        limiter: Ratelimit.fixedWindow(1, '10 s'),
      });

      await limiter.limit('timerless-block-user');

      await expect(
        limiter.blockUntilReady('timerless-block-user', 100)
      ).rejects.toThrow(TIMER_UNSUPPORTED_REGEX);
    });
  });

  test('does not call timer APIs during limit/check (Convex-safe)', async () => {
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((() => {
        throw new Error('setTimeout should not be called');
      }) as unknown as typeof globalThis.setTimeout);
    const clearTimeoutSpy = vi
      .spyOn(globalThis, 'clearTimeout')
      .mockImplementation((() => {}) as typeof globalThis.clearTimeout);

    try {
      const { db } = createMockDb();
      const limiter = new Ratelimit({
        db,
        timeout: 1,
        failureMode: 'open',
        limiter: Ratelimit.fixedWindow(1, '10 s'),
      });

      const check = await limiter.check('convex-safe-user');
      const limit = await limiter.limit('convex-safe-user');

      expect(check.success).toBe(true);
      expect(limit.success).toBe(true);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(0);
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });

  test('throws actionable guidance when ratelimit tables are missing', async () => {
    const db: ConvexRatelimitDbWriter = {
      query() {
        return {
          withIndex() {
            return {
              async unique() {
                throw new Error('Table ratelimitState does not exist');
              },
              async collect() {
                throw new Error('Table ratelimitState does not exist');
              },
            };
          },
        };
      },
      async insert() {
        throw new Error('Table ratelimitState does not exist');
      },
      async patch() {
        throw new Error('Table ratelimitState does not exist');
      },
      async delete() {
        throw new Error('Table ratelimitState does not exist');
      },
    };

    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(1, '10 s'),
    });

    await expect(limiter.limit('missing-table-user')).rejects.toThrow(
      RATELIMIT_PLUGIN_REGEX
    );
  });

  test('uses schema table keys for Convex storage tables', async () => {
    const queriedTables: string[] = [];
    const insertedTables: string[] = [];
    const db: ConvexRatelimitDbWriter = {
      query(tableName: string) {
        queriedTables.push(tableName);
        return {
          withIndex() {
            return {
              async unique() {
                return null;
              },
              async collect() {
                return [];
              },
            };
          },
        };
      },
      async insert(tableName) {
        insertedTables.push(tableName);
        return `${tableName}_1`;
      },
      async patch() {},
      async delete() {},
    };

    const limiter = new Ratelimit({
      db,
      limiter: Ratelimit.fixedWindow(1, '10 s'),
      dynamicLimits: true,
      prefix: 'schema-keys',
    });

    await limiter.limit('schema-key-user');
    await limiter.setDynamicLimit({ limit: 5 });

    expect(queriedTables).toContain('ratelimitState');
    expect(insertedTables).toContain('ratelimitState');
    expect(queriedTables).toContain('ratelimitDynamicLimit');
    expect(insertedTables).toContain('ratelimitDynamicLimit');
  });
});
