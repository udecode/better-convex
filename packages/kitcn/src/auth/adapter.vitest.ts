import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { describe, expect, test } from 'vitest';
import { convexTest } from '../../../../convex/setup.testing';
import { handlePagination } from './adapter';
import { paginate } from './adapter-utils';

const schema = defineSchema({
  member: defineTable({
    organizationId: v.string(),
    role: v.string(),
    userId: v.string(),
  }).index('organizationId', ['organizationId']),
});

const betterAuthSchema = {
  member: {
    fields: { organizationId: {}, role: {}, userId: {} },
    modelName: 'member',
  },
} as any;

// Rows that fail a post-index filter still consume scan budget, so pages come
// back as SplitRecommended. Alternating roles guarantees that.
const seedMembers = async (ctx: any, count: number) => {
  for (let index = 0; index < count; index++) {
    await ctx.db.insert('member', {
      organizationId: 'org1',
      role: index % 2 === 0 ? 'guest' : 'admin',
      userId: `u${index}`,
    });
  }
};

const where = [
  { field: 'organizationId', operator: 'eq' as const, value: 'org1' },
  { field: 'role', operator: 'contains' as const, value: 'admin' },
];

describe('handlePagination over split pages', () => {
  test('returns each matching document exactly once', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seedMembers(ctx, 16);

      const result = await handlePagination(
        async ({ paginationOpts }) =>
          await paginate(ctx as any, schema, betterAuthSchema, {
            model: 'member',
            paginationOpts,
            where,
          }),
        { numItems: 5 }
      );
      const ids = result.docs.map((doc: any) => doc._id);

      expect(ids).toHaveLength(8);
      expect(new Set(ids).size).toBe(8);
    });
  });

  test('stops at the requested limit without replaying rows', async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await seedMembers(ctx, 16);

      const result = await handlePagination(
        async ({ paginationOpts }) =>
          await paginate(ctx as any, schema, betterAuthSchema, {
            model: 'member',
            paginationOpts,
            where,
          }),
        { limit: 6, numItems: 5 }
      );
      const ids = result.docs.map((doc: any) => doc._id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
