import { describe, expect, test } from 'vitest';
import schema from '../../../../../convex/schema';
import { convexTest } from '../../../../../convex/setup.testing';
import {
  AGGREGATE_STATE_KIND_METRIC,
  AGGREGATE_STATE_KIND_RANK,
  COUNT_STATUS_BUILDING,
  COUNT_STATUS_CLEARING,
  COUNT_STATUS_READY,
  setCountState,
} from './runtime';
import {
  AGGREGATE_BUCKET_TABLE,
  AGGREGATE_EXTREMA_TABLE,
  AGGREGATE_MEMBER_TABLE,
  AGGREGATE_RANK_NODE_TABLE,
  AGGREGATE_RANK_TREE_TABLE,
  AGGREGATE_STATE_TABLE,
  rankAggregateName,
} from './schema';

const TABLE_NAME = 'users';
const INDEX_NAME = 'by_stalled_clear';
const UNDRAINED = /is CLEARING with stored state left/;

const stateFields = {
  indexName: INDEX_NAME,
  keyDefinitionHash: 'key',
  metricDefinitionHash: 'metric',
  cursor: null,
  processed: 0,
  startedAt: 0,
  updatedAt: 0,
  completedAt: null,
  lastError: null,
};

/** Stored row shape: the state table keys the table by `tableKey`. */
const seedClearingRow = (db: any, kind: string) =>
  db.insert(AGGREGATE_STATE_TABLE, {
    ...stateFields,
    kind,
    tableKey: TABLE_NAME,
    status: COUNT_STATUS_CLEARING,
  });

/** `setCountState` argument shape: it takes `tableName` and maps it itself. */
const advanceTo = (status: string) => ({
  ...stateFields,
  tableName: TABLE_NAME,
  status,
});

const insertMember = (db: any, kind: string) =>
  db.insert(AGGREGATE_MEMBER_TABLE, {
    kind,
    tableKey: TABLE_NAME,
    indexName: INDEX_NAME,
    docId: 'doc-1',
    keyHash: '["org-1"]',
    keyParts: ['org-1'],
    sumValues: {},
    nonNullCountValues: {},
    extremaValues: {},
    updatedAt: 0,
  });

// The backfill state machine drains before it advances, so nothing reachable
// through the public handlers can trip this guard. It exists for the branch that
// forgets to, which is exactly what these tests stand in for.
describe('setCountState refuses to leave CLEARING undrained', () => {
  test.each([
    ['a surviving member', insertMember],
    [
      'a residual bucket',
      (db: any) =>
        db.insert(AGGREGATE_BUCKET_TABLE, {
          tableKey: TABLE_NAME,
          indexName: INDEX_NAME,
          keyHash: '["org-1"]',
          keyParts: ['org-1'],
          count: 1,
          sumValues: {},
          nonNullCountValues: {},
          updatedAt: 0,
        }),
    ],
    [
      'a residual extrema row',
      (db: any) =>
        db.insert(AGGREGATE_EXTREMA_TABLE, {
          tableKey: TABLE_NAME,
          indexName: INDEX_NAME,
          keyHash: '["org-1"]',
          fieldName: 'score',
          valueHash: '1',
          value: 1,
          sortKey: '1',
          count: 1,
          updatedAt: 0,
        }),
    ],
  ])('throws on %s', async (_label, seed) => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await seedClearingRow(ctx.db, AGGREGATE_STATE_KIND_METRIC);
      await seed(ctx.db, AGGREGATE_STATE_KIND_METRIC);

      await expect(
        setCountState(
          ctx.db,
          advanceTo(COUNT_STATUS_BUILDING) as any,
          AGGREGATE_STATE_KIND_METRIC
        )
      ).rejects.toThrow(UNDRAINED);

      // READY is the worse half of the same mistake: it would serve queries from
      // a half-drained index.
      await expect(
        setCountState(
          ctx.db,
          advanceTo(COUNT_STATUS_READY) as any,
          AGGREGATE_STATE_KIND_METRIC
        )
      ).rejects.toThrow(UNDRAINED);
    });
  });

  test('throws while a rank tree survives, and names the index type', async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await seedClearingRow(ctx.db, AGGREGATE_STATE_KIND_RANK);
      const root = await ctx.db.insert(AGGREGATE_RANK_NODE_TABLE, {
        items: [],
        subtrees: [],
      } as any);
      const tree = await ctx.db.insert(AGGREGATE_RANK_TREE_TABLE, {
        aggregateName: rankAggregateName(TABLE_NAME, INDEX_NAME),
        maxNodeSize: 16,
        root,
      } as any);

      await expect(
        setCountState(
          ctx.db,
          advanceTo(COUNT_STATUS_BUILDING) as any,
          AGGREGATE_STATE_KIND_RANK
        )
      ).rejects.toThrow(
        new RegExp(`rankIndex '${TABLE_NAME}.${INDEX_NAME}' is CLEARING`)
      );

      // Drained: the same write is now the legitimate hand-off to the rebuild.
      await ctx.db.delete(AGGREGATE_RANK_TREE_TABLE, tree as any);
      await setCountState(
        ctx.db,
        advanceTo(COUNT_STATUS_BUILDING) as any,
        AGGREGATE_STATE_KIND_RANK
      );

      const states = await ctx.db.query(AGGREGATE_STATE_TABLE).collect();
      expect(states.map((entry: any) => entry.status)).toEqual([
        COUNT_STATUS_BUILDING,
      ]);
    });
  });

  test('a metric index never mistakes a rank index for its own state', async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await seedClearingRow(ctx.db, AGGREGATE_STATE_KIND_METRIC);
      // Same table and index name, rank kind: the metric index is drained.
      await insertMember(ctx.db, AGGREGATE_STATE_KIND_RANK);

      await setCountState(
        ctx.db,
        advanceTo(COUNT_STATUS_BUILDING) as any,
        AGGREGATE_STATE_KIND_METRIC
      );

      const states = await ctx.db.query(AGGREGATE_STATE_TABLE).collect();
      expect(states.map((entry: any) => entry.status)).toEqual([
        COUNT_STATUS_BUILDING,
      ]);
    });
  });
});
