import { describe, expect, test } from 'bun:test';
import { aggregateCapability } from './aggregate-index';
import { integer, text } from './builders';
import { createOrm } from './create-orm';
import { aggregateIndex } from './indexes';
import { migrationCapability } from './migrations';
import { defineRelations } from './relations';
import { defineSchema } from './schema';
import { convexTable } from './table';

const createReader = () =>
  ({
    query: () => ({}),
    system: {},
  }) as any;

const plainTable = convexTable('capability_plain', {
  name: text().notNull(),
});

const indexedTable = convexTable(
  'capability_indexed',
  {
    name: text().notNull(),
    score: integer(),
  },
  (t) => [aggregateIndex('by_name').on(t.name)]
);

const plainSchema = defineRelations(defineSchema({ plain: plainTable }));
const indexedSchema = defineRelations(defineSchema({ indexed: indexedTable }));

describe('ORM capabilities', () => {
  test('a schema without aggregate indexes needs no capability', () => {
    expect(() => createOrm({ schema: plainSchema })).not.toThrow();
  });

  test('a filtered count() without the aggregate capability throws a setup error', async () => {
    const orm = createOrm({ schema: plainSchema });
    const db = orm.db(createReader()) as any;

    // `count()` returns the ORM's lazy thenable, which bun's `.rejects` does
    // not accept as a promise, so assert on the thrown value directly.
    let thrown: unknown;
    try {
      await db.query.plain.count({ where: { name: 'a' } });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toMatch(
      /requires the aggregate capability/
    );
  });

  test('a schema declaring aggregateIndex requires the capability up front', () => {
    expect(() => createOrm({ schema: indexedSchema })).toThrow(
      /requires the aggregate capability/
    );
    expect(() =>
      createOrm({
        schema: indexedSchema,
        capabilities: [aggregateCapability()],
      })
    ).not.toThrow();
  });

  test('the aggregate capability reaches the query engine through ctx', () => {
    const orm = createOrm({
      schema: indexedSchema,
      capabilities: [aggregateCapability()],
    });
    const db = orm.db(createReader()) as any;

    // `createDatabase` stashes capabilities on the ORM context symbol, which is
    // how `query.ts` finds the runtime without importing it.
    const ormContext = Object.getOwnPropertySymbols(db)
      .map((symbol) => (db as Record<symbol, unknown>)[symbol])
      .find(
        (value): value is { capabilities?: { aggregate?: unknown } } =>
          !!value && typeof value === 'object' && 'capabilities' in value
      );

    expect(ormContext?.capabilities?.aggregate).toBeDefined();
  });

  test('migrationCapability is a distinct registration', () => {
    const capability = migrationCapability();
    expect(capability.kind).toBe('migrations');
    expect(aggregateCapability().kind).toBe('aggregate');
  });
});
