import { describe, expect, test } from 'vitest';
import { convexTest } from '../../../../convex/setup.testing';
import {
  convexTable,
  createOrm,
  defineRelations,
  defineSchema,
  eq,
  rlsPolicy,
  text,
} from '.';

let usingCalls = 0;

const viewers = convexTable('rls_scope_viewers', {
  ownerId: text().notNull(),
});

const secrets = convexTable(
  'rls_scope_secrets',
  {
    ownerId: text().notNull(),
    value: text().notNull(),
  },
  (t) => [
    rlsPolicy('secrets_read', {
      for: 'select',
      // Depends on live database state, so a write between two executions of
      // the same query object must change what the policy resolves to.
      using: async (ctx: any) => {
        usingCalls += 1;
        const viewer = await ctx.db.get(ctx.viewerId);
        return eq(t.ownerId, viewer.ownerId);
      },
    }),
  ]
);

const schema = defineSchema({
  rls_scope_secrets: secrets,
  rls_scope_viewers: viewers,
});

const relations = defineRelations({
  rls_scope_secrets: secrets,
  rls_scope_viewers: viewers,
});

const orm = createOrm({ schema: relations });

describe('rls policy resolution scope', () => {
  test('re-awaiting a query re-resolves policies against current state', async () => {
    usingCalls = 0;
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const viewerId = await ctx.db.insert('rls_scope_viewers', {
        ownerId: 'u1',
      });
      await ctx.db.insert('rls_scope_secrets', { ownerId: 'u1', value: 'a' });
      await ctx.db.insert('rls_scope_secrets', { ownerId: 'u2', value: 'b' });

      const db = orm.db(ctx.db as any, {
        rls: { ctx: { db: ctx.db, viewerId } },
      }) as any;

      const query = db.query.rls_scope_secrets.findMany({ limit: 10 });

      const first = await query;
      expect(first.map((row: any) => row.value)).toEqual(['a']);
      expect(usingCalls).toBe(1);

      await ctx.db.patch(viewerId, { ownerId: 'u2' });

      const second = await query;
      expect(second.map((row: any) => row.value)).toEqual(['b']);
      expect(usingCalls).toBe(2);
    });
  });

  test('concurrent awaits of one query object resolve policies independently', async () => {
    usingCalls = 0;
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const viewerId = await ctx.db.insert('rls_scope_viewers', {
        ownerId: 'u1',
      });
      await ctx.db.insert('rls_scope_secrets', { ownerId: 'u1', value: 'a' });
      await ctx.db.insert('rls_scope_secrets', { ownerId: 'u2', value: 'b' });

      const db = orm.db(ctx.db as any, {
        rls: { ctx: { db: ctx.db, viewerId } },
      }) as any;

      const query = db.query.rls_scope_secrets.findMany({ limit: 10 });
      const [left, right] = await Promise.all([query, query]);

      expect(left.map((row: any) => row.value)).toEqual(['a']);
      expect(right.map((row: any) => row.value)).toEqual(['a']);
      expect(usingCalls).toBe(2);
    });
  });

  test('one execution resolves each policy once across every row', async () => {
    usingCalls = 0;
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const viewerId = await ctx.db.insert('rls_scope_viewers', {
        ownerId: 'u1',
      });
      for (let i = 0; i < 25; i++) {
        await ctx.db.insert('rls_scope_secrets', {
          ownerId: i % 2 === 0 ? 'u1' : 'u2',
          value: `v${i}`,
        });
      }

      const db = orm.db(ctx.db as any, {
        rls: { ctx: { db: ctx.db, viewerId } },
      }) as any;

      const rows = await db.query.rls_scope_secrets.findMany({ limit: 100 });

      expect(rows).toHaveLength(13);
      expect(usingCalls).toBe(1);
    });
  });
});
