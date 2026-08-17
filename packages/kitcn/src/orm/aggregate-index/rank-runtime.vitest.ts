import { describe, expect, test } from 'vitest';
import { convexTest } from '../../../../../convex/setup.testing';
import { DirectAggregate } from '../../aggregate-core/runtime';
import { AGGREGATE_TREE_TABLE } from '../../aggregate-core/schema';
import schema from '../../aggregate-core/schema.fixture.js';
import {
  readRankAt,
  readRankMax,
  readRankMin,
  readRankRandom,
} from './rank-runtime';

const plan = {
  tableName: 'scores',
  indexName: 'by_score',
  definition: {
    name: 'by_score',
    partitionFields: ['orgId'],
    orderFields: [{ field: 'score', direction: 'asc' as const }],
  },
  namespace: 'org-1',
};

const rows: Array<{ id: string; score: number }> = [
  { id: 'a', score: 10 },
  { id: 'b', score: 30 },
  { id: 'c', score: 20 },
];

// Counts index queries against the rank tree table. Every redundant traversal
// costs exactly one of these, so it is the stable regression gate.
const instrumentDb = (db: any) => {
  const queries: string[] = [];
  const proxy = new Proxy(db, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (typeof value !== 'function') {
        return value;
      }
      if (prop === 'query') {
        return (table: string) => {
          queries.push(table);
          return value.call(target, table);
        };
      }
      return value.bind(target);
    },
  });
  return {
    db: proxy,
    treeQueryCount: () =>
      queries.filter((table) => table === AGGREGATE_TREE_TABLE).length,
    reset: () => {
      queries.length = 0;
    },
  };
};

const seed = async (ctx: any) => {
  const aggregate = new DirectAggregate<any>({ name: 'scores.by_score' });
  for (const row of rows) {
    await aggregate.insert({ db: ctx.db } as any, {
      id: row.id,
      key: [row.score, row.id],
      namespace: 'org-1',
      sumValue: row.score,
    });
  }
};

describe('rank runtime reads', () => {
  test('min and max read the tree once, without a guard count', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seed(ctx);
      const probe = instrumentDb(ctx.db as any);

      probe.reset();
      expect(await readRankMin(probe.db, plan as any)).toEqual({
        id: 'a',
        key: 10,
        sumValue: 10,
      });
      expect(probe.treeQueryCount()).toBe(1);

      probe.reset();
      expect(await readRankMax(probe.db, plan as any)).toEqual({
        id: 'b',
        key: 30,
        sumValue: 30,
      });
      expect(probe.treeQueryCount()).toBe(1);
    });
  });

  test('random computes the count once', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seed(ctx);
      const probe = instrumentDb(ctx.db as any);

      probe.reset();
      const picked = await readRankRandom(probe.db, plan as any);
      expect(rows.map((row) => row.id)).toContain(picked?.id);
      // One count traversal plus one offset descent. No duplicate count.
      expect(probe.treeQueryCount()).toBe(2);
    });
  });

  test('at keeps returning null for out-of-range offsets', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seed(ctx);
      expect(await readRankAt(ctx.db as any, plan as any, 1)).toEqual({
        id: 'c',
        key: 20,
        sumValue: 20,
      });
      expect(await readRankAt(ctx.db as any, plan as any, -1)).toEqual({
        id: 'b',
        key: 30,
        sumValue: 30,
      });
      expect(await readRankAt(ctx.db as any, plan as any, 3)).toBeNull();
      expect(await readRankAt(ctx.db as any, plan as any, -4)).toBeNull();
    });
  });

  test('empty namespaces return null without throwing', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seed(ctx);
      const emptyPlan = { ...plan, namespace: 'org-empty' };
      expect(await readRankMin(ctx.db as any, emptyPlan as any)).toBeNull();
      expect(await readRankMax(ctx.db as any, emptyPlan as any)).toBeNull();
      expect(await readRankAt(ctx.db as any, emptyPlan as any, 0)).toBeNull();
      expect(await readRankRandom(ctx.db as any, emptyPlan as any)).toBeNull();
    });
  });
});
