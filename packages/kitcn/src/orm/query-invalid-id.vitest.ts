import { describe, expect, test } from 'vitest';
import {
  aggregateIndex,
  convexTable,
  createOrm,
  defineRelations,
  id,
  index,
  text,
} from '.';

const users = convexTable('invalid_id_users', {
  name: text().notNull(),
});

const orm = createOrm({
  schema: defineRelations({
    invalid_id_users: users,
  }),
});

const relationUsers = convexTable('invalid_id_relation_users', {
  name: text().notNull(),
});
const relationPosts = convexTable('invalid_id_relation_posts', {
  authorId: id('invalid_id_relation_users').notNull(),
  title: text().notNull(),
});
const relationGroups = convexTable(
  'invalid_id_relation_groups',
  {
    name: text().notNull(),
  },
  (t) => [aggregateIndex('by_name').on(t.name)]
);
const relationMemberships = convexTable(
  'invalid_id_relation_memberships',
  {
    groupId: id('invalid_id_relation_groups').notNull(),
    userId: id('invalid_id_relation_users').notNull(),
  },
  (t) => [index('by_group_id').on(t.groupId), index('by_user_id').on(t.userId)]
);

const relationOrm = createOrm({
  schema: defineRelations(
    {
      invalid_id_relation_posts: relationPosts,
      invalid_id_relation_groups: relationGroups,
      invalid_id_relation_memberships: relationMemberships,
      invalid_id_relation_users: relationUsers,
    },
    (r) => ({
      invalid_id_relation_posts: {
        author: r.one.invalid_id_relation_users({
          from: r.invalid_id_relation_posts.authorId,
          to: r.invalid_id_relation_users.id,
        }),
      },
      invalid_id_relation_users: {
        groups: r.many.invalid_id_relation_groups({
          from: r.invalid_id_relation_users.id.through(
            r.invalid_id_relation_memberships.userId
          ),
          to: r.invalid_id_relation_groups.id.through(
            r.invalid_id_relation_memberships.groupId
          ),
        }),
      },
    })
  ),
});

const createIndexedQuery = (rows: Record<string, unknown>[]) => ({
  withIndex: (_name: string, apply: (q: any) => any) => {
    const filters: { field: string; value: unknown }[] = [];
    const range = {
      eq: (field: string, value: unknown) => {
        filters.push({ field, value });
        return range;
      },
    };
    apply(range);
    const matching = () =>
      rows.filter((row) =>
        filters.every((filter) => row[filter.field] === filter.value)
      );
    return {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      async *[Symbol.asyncIterator]() {
        for (const row of matching()) {
          yield row;
        }
      },
    };
  },
});

describe('ORM invalid ID queries', () => {
  test('findFirst treats a malformed primary ID as missing', async () => {
    const db = orm.db({
      get: async () => {
        throw new Error(
          'Invalid argument id for db.get: Unable to decode ID: Invalid ID length 13'
        );
      },
      normalizeId: () => null,
      query: () => {
        throw new Error('primary ID lookup should not query the table');
      },
      system: {},
    } as any) as any;

    await expect(
      db.query.invalid_id_users.findFirst({
        where: { id: 'some-short-id' },
      })
    ).resolves.toBeNull();
  });

  test('one relation treats a malformed target ID as missing', async () => {
    const db = relationOrm.db({
      get: async (lookupId: string) => {
        if (lookupId === 'valid-post-id') {
          return {
            _id: lookupId,
            _creationTime: 1,
            authorId: 'some-short-id',
            title: 'Post',
          };
        }
        throw new Error(
          'Invalid argument id for db.get: Unable to decode ID: Invalid ID length 13'
        );
      },
      normalizeId: (tableName: string, lookupId: string) =>
        tableName === 'invalid_id_relation_users' &&
        lookupId === 'some-short-id'
          ? null
          : lookupId,
      query: () => {
        throw new Error('ID relations should not query the table');
      },
      system: {},
    } as any) as any;

    await expect(
      db.query.invalid_id_relation_posts.findFirst({
        where: { id: 'valid-post-id' },
        with: { author: true },
      })
    ).resolves.toMatchObject({
      author: null,
      id: 'valid-post-id',
    });
  });

  test('findMany ignores malformed primary IDs and keeps valid matches', async () => {
    const reads: string[] = [];
    const db = orm.db({
      get: async (id: string) => {
        reads.push(id);
        if (id === 'some-short-id') {
          throw new Error('invalid IDs must be normalized before db.get');
        }
        return {
          _id: id,
          _creationTime: 1,
          name: 'Valid',
        };
      },
      normalizeId: (_tableName: string, id: string) =>
        id === 'some-short-id' ? null : id,
      query: () => {
        throw new Error('primary ID lookup should not query the table');
      },
      system: {},
    } as any) as any;

    const rows = await db.query.invalid_id_users.findMany({
      where: { id: { in: ['some-short-id', 'valid-user-id'] } },
      limit: 2,
    });

    expect(rows.map((row: any) => row.id)).toEqual(['valid-user-id']);
    expect(reads).toEqual(['valid-user-id']);
  });

  test('many-through relation ignores malformed target IDs', async () => {
    const memberships = [
      {
        _id: 'membership-1',
        _creationTime: 1,
        groupId: 'valid-group-id',
        userId: 'valid-user-id',
      },
      {
        _id: 'membership-2',
        _creationTime: 2,
        groupId: 'some-short-id',
        userId: 'valid-user-id',
      },
    ];
    const db = relationOrm.db({
      get: async (lookupId: string) => {
        if (lookupId === 'valid-user-id') {
          return {
            _id: lookupId,
            _creationTime: 1,
            name: 'User',
          };
        }
        if (lookupId === 'valid-group-id') {
          return {
            _id: lookupId,
            _creationTime: 1,
            name: 'Valid group',
          };
        }
        throw new Error(
          'Invalid argument id for db.get: Unable to decode ID: Invalid ID length 13'
        );
      },
      normalizeId: (tableName: string, lookupId: string) =>
        tableName === 'invalid_id_relation_groups' &&
        lookupId === 'some-short-id'
          ? null
          : lookupId,
      query: (tableName: string) => {
        if (tableName === 'invalid_id_relation_memberships') {
          return createIndexedQuery(memberships);
        }
        throw new Error(`unexpected query: ${tableName}`);
      },
      system: {},
    } as any) as any;

    const user = await db.query.invalid_id_relation_users.findFirst({
      where: { id: 'valid-user-id' },
      with: { groups: { limit: 10 } },
    });

    expect(user.groups.map((group: any) => group.id)).toEqual([
      'valid-group-id',
    ]);
  });

  test('filtered through count ignores malformed target IDs', async () => {
    const memberships = [
      {
        _id: 'membership-1',
        _creationTime: 1,
        groupId: 'valid-group-id',
        userId: 'valid-user-id',
      },
      {
        _id: 'membership-2',
        _creationTime: 2,
        groupId: 'some-short-id',
        userId: 'valid-user-id',
      },
    ];
    const aggregateStates = [
      {
        _id: 'aggregate-state-id',
        completedAt: 1,
        cursor: null,
        indexName: 'by_name',
        keyDefinitionHash: 'key',
        kind: 'metric',
        lastError: null,
        metricDefinitionHash: 'metric',
        processed: 1,
        startedAt: 1,
        status: 'READY',
        tableKey: 'invalid_id_relation_groups',
        updatedAt: 1,
      },
    ];
    const db = relationOrm.db({
      get: async (lookupId: string) => {
        if (lookupId === 'valid-user-id') {
          return {
            _id: lookupId,
            _creationTime: 1,
            name: 'User',
          };
        }
        if (lookupId === 'valid-group-id') {
          return {
            _id: lookupId,
            _creationTime: 1,
            name: 'Valid group',
          };
        }
        throw new Error(
          'Invalid argument id for db.get: Unable to decode ID: Invalid ID length 13'
        );
      },
      normalizeId: (tableName: string, lookupId: string) =>
        tableName === 'invalid_id_relation_groups' &&
        lookupId === 'some-short-id'
          ? null
          : lookupId,
      query: (tableName: string) => {
        if (tableName === 'invalid_id_relation_memberships') {
          return createIndexedQuery(memberships);
        }
        if (tableName === 'aggregate_state') {
          return createIndexedQuery(aggregateStates);
        }
        throw new Error(`unexpected query: ${tableName}`);
      },
      system: {},
    } as any) as any;

    const user = await db.query.invalid_id_relation_users.findFirst({
      where: { id: 'valid-user-id' },
      with: {
        _count: {
          groups: {
            where: { name: 'Valid group' },
          },
        },
      },
    });

    expect(user._count.groups).toBe(1);
  });
});
