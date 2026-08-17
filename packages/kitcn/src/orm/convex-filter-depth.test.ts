/**
 * Convex parses a query's serialized filter with a bounded recursion depth, so
 * an `in` list that compiles to a left-nested `q.or(q.or(...))` chain is
 * rejected outright — `Received invalid json: recursion limit exceeded` — once
 * the list passes a few dozen values. `q.or`/`q.and` are variadic, so every
 * combinator must be called once with N operands rather than folded pairwise.
 *
 * These assertions pin serialized DEPTH, not row semantics: `convex-test`
 * evaluates `$or`/`$and` recursively with no depth cap, so the integration
 * suite in `convex/orm/**` stays green either way and cannot own this.
 */

import { text } from './builders/text';
import { createOrm } from './create-orm';
import { and, eq, inArray } from './filter-expression';
import { index, uniqueIndex } from './indexes';
import { defineSchema } from './schema';
import { convexTable } from './table';

const cards = convexTable(
  'convex_filter_depth_cards',
  {
    note: text(),
    number: text().notNull(),
    status: text(),
    userId: text().notNull(),
  },
  (t) => [
    index('by_user').on(t.userId),
    uniqueIndex('by_user_number').on(t.userId, t.number),
    index('by_number').on(t.number),
  ]
);

const schema = defineSchema({ cards });

/**
 * Mirror of Convex's real filter builder
 * (`convex/src/server/impl/filter_builder_impl.ts`). `or`/`and` are variadic
 * there and serialize to a FLAT `{ $or: [...] }`; a binary-arity stub would
 * make the fixed code look broken and would hide the regression.
 */
const EXPRESSION = Symbol('serializedExpression');

type FakeExpression = { [EXPRESSION]: unknown };

const isExpression = (value: unknown): value is FakeExpression =>
  typeof value === 'object' && value !== null && EXPRESSION in value;

const serialize = (value: unknown): unknown =>
  isExpression(value) ? value[EXPRESSION] : { $literal: value ?? null };

const expression = (serialized: unknown): FakeExpression => ({
  [EXPRESSION]: serialized,
});

const binary =
  (op: string) =>
  (left: unknown, right: unknown): FakeExpression =>
    expression({ [op]: [serialize(left), serialize(right)] });

const filterBuilder = {
  and: (...exprs: unknown[]) => expression({ $and: exprs.map(serialize) }),
  eq: binary('$eq'),
  field: (path: string) => expression({ $field: path }),
  gt: binary('$gt'),
  gte: binary('$gte'),
  lt: binary('$lt'),
  lte: binary('$lte'),
  neq: binary('$neq'),
  not: (x: unknown) => expression({ $not: serialize(x) }),
  or: (...exprs: unknown[]) => expression({ $or: exprs.map(serialize) }),
};

const jsonDepth = (node: unknown): number => {
  if (node === null || typeof node !== 'object') {
    return 0;
  }
  const children = Array.isArray(node) ? node : Object.values(node);
  return (
    1 +
    children.reduce((max: number, child) => Math.max(max, jsonDepth(child)), 0)
  );
};

/**
 * Stub reader that records every predicate handed to `.filter()`. `insert`,
 * `patch`, `replace` and `delete` must exist or the ORM hides the writer
 * builders and `update()`/`delete()` never compile a filter at all.
 */
const createCapturingDb = () => {
  const captured: unknown[] = [];
  const builder: any = {
    collect: async () => [],
    filter: (predicate: (q: any) => FakeExpression) => {
      captured.push(serialize(predicate(filterBuilder)));
      return builder;
    },
    first: async () => null,
    order: () => builder,
    paginate: async () => ({ continueCursor: '', isDone: true, page: [] }),
    take: async () => [],
    withIndex: () => builder,
    [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true }) }),
  };
  const db = {
    delete: async () => undefined,
    get: async () => null,
    insert: async () => 'card_1',
    normalizeId: (_table: string, id: string) => id,
    patch: async () => undefined,
    query: () => builder,
    replace: async () => undefined,
    system: { query: () => builder },
  };
  return { captured, db };
};

const values = (count: number) =>
  Array.from({ length: count }, (_, i) => `v${i}`);

/** Deepest filter the ORM handed to Convex for `count` values. */
const maxFilterDepth = async (
  run: (orm: any, list: string[]) => Promise<unknown>,
  count: number
): Promise<{ depth: number; filters: number }> => {
  const { captured, db } = createCapturingDb();
  const orm = createOrm({ schema }).db({ db } as any);
  await run(orm, values(count));
  return {
    depth: captured.reduce(
      (max: number, filter) => Math.max(max, jsonDepth(filter)),
      0
    ),
    filters: captured.length,
  };
};

// Every shape the reporter hit, plus the `id` control that bypasses `.filter()`
// through the primary-id pipeline.
const CASES: Array<{
  name: string;
  run: (orm: any, list: string[]) => Promise<unknown>;
}> = [
  {
    name: 'findMany in on an indexed column (multi-probe promotion)',
    run: (orm, list) =>
      orm.query.cards.findMany({ limit: 500, where: { number: { in: list } } }),
  },
  {
    name: 'findMany in anchored by an eq on another indexed column',
    run: (orm, list) =>
      orm.query.cards.findMany({
        limit: 500,
        where: { number: { in: list }, userId: 'u1' },
      }),
  },
  {
    name: 'findMany in on an unindexed column',
    run: (orm, list) =>
      orm.query.cards.findMany({ limit: 500, where: { note: { in: list } } }),
  },
  {
    name: 'findMany notIn on an unindexed column',
    run: (orm, list) =>
      orm.query.cards.findMany({
        limit: 500,
        where: { note: { notIn: list } },
      }),
  },
  {
    name: 'findMany OR over many operands',
    run: (orm, list) =>
      orm.query.cards.findMany({
        limit: 500,
        where: { OR: list.map((value) => ({ note: value })) },
      }),
  },
  {
    name: 'update where(and(eq, inArray))',
    run: (orm, list) =>
      orm
        .update(cards)
        .set({ status: 'x' })
        .where(and(eq(cards.userId, 'u1'), inArray(cards.number, list)))
        .allowFullScan(),
  },
  {
    name: 'delete where(inArray)',
    run: (orm, list) =>
      orm.delete(cards).where(inArray(cards.note, list)).allowFullScan(),
  },
];

describe('Convex filter serialization depth', () => {
  for (const { name, run } of CASES) {
    test(`${name} keeps filter depth constant as the list grows`, async () => {
      const small = await maxFilterDepth(run, 2);
      expect(small.filters).toBeGreaterThan(0);

      // 64 is where the left-fold first exceeded Convex's parser: depth 2N+1
      // crosses 128 there, which matches the reporter's 67-value failure.
      for (const count of [64, 200, 1000]) {
        const wide = await maxFilterDepth(run, count);
        expect(wide.depth).toBe(small.depth);
      }
    });
  }

  test('in on the primary id never reaches .filter()', async () => {
    for (const count of [2, 200]) {
      const { filters } = await maxFilterDepth(
        (orm, list) =>
          orm.query.cards.findMany({ limit: 500, where: { id: { in: list } } }),
        count
      );
      expect(filters).toBe(0);
    }
  });

  test('in compiles to one flat $or rather than a nested chain', async () => {
    const { captured, db } = createCapturingDb();
    const orm = createOrm({ schema }).db({ db } as any);
    await orm.query.cards.findMany({
      limit: 5,
      where: { note: { in: ['a', 'b', 'c'] } },
    });

    expect(captured[0]).toEqual({
      $or: [
        { $eq: [{ $field: 'note' }, { $literal: 'a' }] },
        { $eq: [{ $field: 'note' }, { $literal: 'b' }] },
        { $eq: [{ $field: 'note' }, { $literal: 'c' }] },
      ],
    });
  });

  test('notIn compiles to one flat $and rather than a nested chain', async () => {
    const { captured, db } = createCapturingDb();
    const orm = createOrm({ schema }).db({ db } as any);
    await orm.query.cards.findMany({
      limit: 5,
      where: { note: { notIn: ['a', 'b', 'c'] } },
    });

    expect(captured[0]).toEqual({
      $and: [
        { $neq: [{ $field: 'note' }, { $literal: 'a' }] },
        { $neq: [{ $field: 'note' }, { $literal: 'b' }] },
        { $neq: [{ $field: 'note' }, { $literal: 'c' }] },
      ],
    });
  });

  test('a single-value in stays unwrapped', async () => {
    const { captured, db } = createCapturingDb();
    const orm = createOrm({ schema }).db({ db } as any);
    await orm.query.cards.findMany({
      limit: 5,
      where: { note: { in: ['only'] } },
    });

    expect(captured[0]).toEqual({
      $eq: [{ $field: 'note' }, { $literal: 'only' }],
    });
  });
});
