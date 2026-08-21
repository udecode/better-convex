import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { describe, expect, test, vi } from 'vitest';
import { convexTest } from '../../../../convex/setup.testing';
import { listOne, paginate } from './adapter-utils';
import { deleteOneHandler, updateOneHandler } from './create-api';

const schema = defineSchema({
  user: defineTable({
    email: v.string(),
    role: v.string(),
  }).index('email', ['email']),
  member: defineTable({
    organizationId: v.string(),
    role: v.string(),
    userId: v.string(),
  }).index('organizationId', ['organizationId']),
  invitation: defineTable({
    organizationId: v.string(),
    status: v.string(),
  }).index('organizationId', ['organizationId']),
});

const betterAuthSchema = {
  invitation: {
    fields: { organizationId: {}, status: {} },
    modelName: 'invitation',
  },
  member: {
    fields: { organizationId: {}, role: {}, userId: {} },
    modelName: 'member',
  },
  user: {
    fields: { email: { unique: true }, role: {} },
    modelName: 'user',
  },
} as any;

const insertUser = (ctx: any) =>
  ctx.db.insert('user', { email: 'victim@example.com', role: 'user' });

describe('id where clauses are scoped to the queried table', () => {
  test('findOne for one model does not return a row from another table', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const userId = await insertUser(ctx);

      const doc = await listOne(ctx as any, schema, betterAuthSchema, {
        model: 'member',
        where: [{ field: '_id', operator: 'eq', value: userId }],
      });

      expect(doc ?? null).toBeNull();
    });
  });

  test('update for one model does not patch a row from another table', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const userId = await insertUser(ctx);

      await expect(
        updateOneHandler(
          ctx as any,
          {
            input: {
              model: 'member',
              update: { role: 'owner' },
              where: [{ field: '_id', operator: 'eq', value: userId }],
            },
          },
          schema as any,
          betterAuthSchema
        )
      ).rejects.toThrow('Failed to update member');

      expect(await ctx.db.get(userId)).toMatchObject({ role: 'user' });
    });
  });

  test('delete for one model does not delete a row from another table', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const userId = await insertUser(ctx);

      await deleteOneHandler(
        ctx as any,
        {
          input: {
            model: 'member',
            where: [{ field: '_id', operator: 'eq', value: userId }],
          },
        },
        schema as any,
        betterAuthSchema
      );

      expect(await ctx.db.get(userId)).toMatchObject({
        email: 'victim@example.com',
      });
    });
  });

  test('in clauses on id drop ids that belong to another table', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const userId = await insertUser(ctx);
      const memberId = await ctx.db.insert('member', {
        organizationId: 'org1',
        role: 'member',
        userId: 'u1',
      });

      const result = await paginate(ctx as any, schema, betterAuthSchema, {
        model: 'member',
        paginationOpts: { cursor: null, numItems: 10 },
        where: [{ field: '_id', operator: 'in', value: [userId, memberId] }],
      });

      expect(result.page.map((doc: any) => doc._id)).toEqual([memberId]);
    });
  });

  test('malformed ids resolve to not found instead of throwing', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const doc = await listOne(ctx as any, schema, betterAuthSchema, {
        model: 'member',
        where: [{ field: '_id', operator: 'eq', value: 'not-an-id' }],
      });

      expect(doc ?? null).toBeNull();
    });
  });

  test('id where clauses still resolve rows in the queried table', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      const memberId = await ctx.db.insert('member', {
        organizationId: 'org1',
        role: 'member',
        userId: 'u1',
      });

      const doc: any = await listOne(ctx as any, schema, betterAuthSchema, {
        model: 'member',
        where: [{ field: '_id', operator: 'eq', value: memberId }],
      });

      expect(doc?._id).toBe(memberId);
    });
  });
});

// Mirrors what `createSchema` emits for the organization plugin's `member`
// table, composite included.
const indexedSchema = defineSchema({
  member: defineTable({
    organizationId: v.string(),
    role: v.string(),
    userId: v.string(),
  })
    .index('organizationId', ['organizationId'])
    .index('organizationId_role', ['organizationId', 'role'])
    .index('organizationId_userId', ['organizationId', 'userId'])
    .index('role', ['role'])
    .index('userId', ['userId']),
});

// The scan bound is 200 rows, so a member seeded past it is only reachable
// through an index or through paging.
const seedOrgMembers = async (ctx: any, count: number) => {
  for (let index = 0; index < count; index++) {
    await ctx.db.insert('member', {
      organizationId: 'org1',
      role: 'member',
      userId: `u${index}`,
    });
  }
};

const memberWhere = [
  { field: 'organizationId', operator: 'eq' as const, value: 'org1' },
  { field: 'userId', operator: 'eq' as const, value: 'u240' },
];

describe('two-field member lookups past the scan bound', () => {
  test('the generated composite index answers without a table scan', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const t = convexTest(indexedSchema);
      await t.run(async (ctx) => {
        await seedOrgMembers(ctx, 250);

        const doc: any = await listOne(
          ctx as any,
          indexedSchema,
          betterAuthSchema,
          { model: 'member', where: memberWhere }
        );

        expect(doc?.userId).toBe('u240');
      });

      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test('an unindexed lookup pages instead of reporting a false miss', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      // `schema` has no composite on `member`, so this is the unindexed path.
      const t = convexTest(schema);
      await t.run(async (ctx) => {
        await seedOrgMembers(ctx, 250);

        const doc: any = await listOne(ctx as any, schema, betterAuthSchema, {
          model: 'member',
          where: memberWhere,
        });

        expect(doc?.userId).toBe('u240');
      });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Querying without an index on table "member"')
      );
    } finally {
      warn.mockRestore();
    }
  });

  test('a genuine miss still resolves to null', async () => {
    const t = convexTest(indexedSchema);
    await t.run(async (ctx) => {
      await seedOrgMembers(ctx, 250);

      const doc = await listOne(ctx as any, indexedSchema, betterAuthSchema, {
        model: 'member',
        where: [
          { field: 'organizationId', operator: 'eq', value: 'org1' },
          { field: 'userId', operator: 'eq', value: 'nobody' },
        ],
      });

      expect(doc ?? null).toBeNull();
    });
  });
});

describe('not_in clauses are applied before the page limit', () => {
  test('findOne returns a match that is not in the first scanned row', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await ctx.db.insert('invitation', {
        organizationId: 'org1',
        status: 'cancelled',
      });
      await ctx.db.insert('invitation', {
        organizationId: 'org1',
        status: 'pending',
      });

      const doc: any = await listOne(ctx as any, schema, betterAuthSchema, {
        model: 'invitation',
        where: [
          { field: 'organizationId', operator: 'eq', value: 'org1' },
          { field: 'status', operator: 'not_in', value: ['cancelled'] },
        ],
      });

      expect(doc?.status).toBe('pending');
    });
  });

  test('paginated not_in queries fill the page with matching rows', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      for (let index = 0; index < 6; index++) {
        await ctx.db.insert('invitation', {
          organizationId: 'org1',
          status: index % 2 === 0 ? 'cancelled' : 'pending',
        });
      }

      const result = await paginate(ctx as any, schema, betterAuthSchema, {
        model: 'invitation',
        paginationOpts: { cursor: null, numItems: 3 },
        where: [
          { field: 'organizationId', operator: 'eq', value: 'org1' },
          { field: 'status', operator: 'not_in', value: ['cancelled'] },
        ],
      });

      expect(result.page.map((doc: any) => doc.status)).toEqual([
        'pending',
        'pending',
        'pending',
      ]);
    });
  });
});
