import type { SchedulableFunctionReference } from 'convex/server';
import { describe, expect, test } from 'vitest';
import { convexTable, index, integer, text } from './index';
import { defineRelations } from './relations';
import {
  type ScheduledMutationBatchArgs,
  scheduledMutationBatchFactory,
} from './scheduled-mutation-batch';
import { defineSchema, requireSchemaRelations } from './schema';

const cascadeChild = convexTable(
  'cascade_child_rows',
  {
    deletionTime: integer(),
    parentSlug: text(),
  },
  (t) => [index('by_parentSlug').on(t.parentSlug)]
);

// Schema key must match the physical table name: relational config keys tables
// by their schema key, and the worker looks tables up by the name carried on
// the cascade args.
const relations = requireSchemaRelations(
  defineRelations(defineSchema({ cascade_child_rows: cascadeChild }))
);

type FakeRow = Record<string, unknown>;

/**
 * Models the two Convex behaviors this worker depends on: `.filter()` is
 * applied *after* rows are read, and a page cursor marks the last row scanned
 * (not the last row returned). `scanned` is therefore the real cost signal.
 */
const createFakeDb = (rows: FakeRow[]) => {
  const store = new Map<string, FakeRow>(
    rows.map((row) => [String(row._id), { ...row }])
  );
  const paginateCursors: Array<string | null> = [];
  let scanned = 0;

  const buildQuery = (filtered: boolean): any => ({
    filter: () => buildQuery(true),
    first: async () => {
      throw new Error('first() must not be used to test for remaining rows');
    },
    paginate: async ({
      cursor,
      numItems,
    }: {
      cursor: string | null;
      numItems: number;
    }) => {
      paginateCursors.push(cursor ?? null);
      const all = [...store.values()];
      const start =
        cursor == null
          ? 0
          : all.findIndex((row) => String(row._id) === cursor) + 1;
      const page: FakeRow[] = [];
      let cursorIndex = start;
      while (cursorIndex < all.length && page.length < numItems) {
        const row = all[cursorIndex];
        scanned += 1;
        cursorIndex += 1;
        if (
          !filtered ||
          row.deletionTime === undefined ||
          row.deletionTime === null
        ) {
          page.push(row);
        }
      }
      return {
        continueCursor:
          cursorIndex > start
            ? String(all[cursorIndex - 1]._id)
            : (cursor ?? ''),
        isDone: cursorIndex >= all.length,
        page,
      };
    },
  });

  return {
    db: {
      delete: async (_table: string, id: string) => {
        store.delete(String(id));
      },
      get: async (_table: string, id: string) => store.get(String(id)) ?? null,
      insert: async () => {
        throw new Error('insert() is not used by cascade work');
      },
      normalizeId: (_table: string, id: string) => id,
      patch: async (_table: string, id: string, value: FakeRow) => {
        const current = store.get(String(id));
        if (current) {
          store.set(String(id), { ...current, ...value });
        }
      },
      query: () => ({ withIndex: () => buildQuery(false) }),
      system: {},
    },
    paginateCursors,
    scannedRows: () => scanned,
    store,
  };
};

const runWorker = async (
  fake: ReturnType<typeof createFakeDb>,
  args: ScheduledMutationBatchArgs
) => {
  const scheduled: ScheduledMutationBatchArgs[] = [];
  const worker = scheduledMutationBatchFactory(
    relations as any,
    [],
    {} as SchedulableFunctionReference
  );
  await worker(
    {
      db: fake.db as any,
      scheduler: {
        runAfter: async (
          _delayMs: number,
          _fn: unknown,
          nextArgs: ScheduledMutationBatchArgs
        ) => {
          scheduled.push(nextArgs);
          return 'job';
        },
      } as any,
    },
    args
  );
  return scheduled;
};

const softCascadeArgs = (
  cursor: string | null
): ScheduledMutationBatchArgs => ({
  batchSize: 2,
  cascadeMode: 'soft',
  cursor,
  delayMs: 0,
  deleteMode: 'soft',
  foreignAction: 'cascade',
  foreignIndexName: 'by_parentSlug',
  foreignSourceColumns: ['parentSlug'],
  mode: 'async',
  operation: 'delete',
  table: 'cascade_child_rows',
  targetValues: ['p1'],
  workType: 'cascade-delete',
});

describe('scheduledMutationBatch cascade continuation', () => {
  test('soft cascade forwards the page cursor and scans each row once', async () => {
    const fake = createFakeDb(
      Array.from({ length: 6 }, (_unused, i) => ({
        _id: `c${i}`,
        parentSlug: 'p1',
      }))
    );

    let next = await runWorker(fake, softCascadeArgs(null));
    expect(next).toHaveLength(1);
    // Forwarded, not restarted: re-querying from null would re-scan every row
    // already soft-deleted, because `.filter()` runs after the read.
    expect(next[0].cursor).toBe('c1');
    expect(fake.scannedRows()).toBe(2);

    next = await runWorker(fake, next[0]);
    expect(next[0].cursor).toBe('c3');
    expect(fake.scannedRows()).toBe(4);

    next = await runWorker(fake, next[0]);
    expect(fake.scannedRows()).toBe(6);
    // Range exhausted: no further continuation, and no extra probe scan.
    expect(next).toHaveLength(0);

    for (const row of fake.store.values()) {
      expect(typeof row.deletionTime).toBe('number');
    }
    expect(fake.paginateCursors).toEqual([null, 'c1', 'c3']);
  });

  test('set null cascade still restarts from null because rows leave the range', async () => {
    const fake = createFakeDb(
      Array.from({ length: 3 }, (_unused, i) => ({
        _id: `c${i}`,
        parentSlug: 'p1',
      }))
    );

    const next = await runWorker(fake, {
      ...softCascadeArgs(null),
      cascadeMode: undefined,
      deleteMode: 'hard',
      foreignAction: 'set null',
    });

    expect(next).toHaveLength(1);
    expect(next[0].cursor).toBeNull();
    expect([...fake.store.values()].slice(0, 2)).toEqual([
      { _id: 'c0', parentSlug: null },
      { _id: 'c1', parentSlug: null },
    ]);
  });
});
