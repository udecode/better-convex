import { describe, expect, test } from 'vitest';
import { convexTest } from '../../../../convex/setup.testing';
import {
  convexTable,
  createOrm,
  defineRelations,
  defineSchema,
  eq,
  inArray,
  ne,
  rlsPolicy,
  text,
} from '.';

const INSERT_POLICY_ERROR_RE = /RLS policy violation for insert/;

let insertPolicyCalls = 0;
let deletePolicyCalls = 0;

const insertAccounts = convexTable(
  'mutation_rls_insert_accounts',
  { name: text().notNull() },
  (t) => [
    rlsPolicy('one_account', {
      for: 'insert',
      withCheck: async (ctx: any) => {
        insertPolicyCalls += 1;
        const existing = await ctx.db
          .query('mutation_rls_insert_accounts')
          .first();
        return existing ? eq(t.name, '__blocked__') : ne(t.name, '__blocked__');
      },
    }),
  ]
);

const deleteAccounts = convexTable(
  'mutation_rls_delete_accounts',
  { name: text().notNull() },
  (t) => [
    rlsPolicy('keep_one_account', {
      for: 'delete',
      using: async (ctx: any) => {
        deletePolicyCalls += 1;
        const remaining = await ctx.db
          .query('mutation_rls_delete_accounts')
          .take(2);
        return remaining.length > 1
          ? ne(t.name, '__blocked__')
          : eq(t.name, '__blocked__');
      },
    }),
  ]
);

const schema = defineSchema({
  mutation_rls_delete_accounts: deleteAccounts,
  mutation_rls_insert_accounts: insertAccounts,
});

const relations = defineRelations({
  mutation_rls_delete_accounts: deleteAccounts,
  mutation_rls_insert_accounts: insertAccounts,
});

const orm = createOrm({ schema: relations });

describe('mutation RLS execution scope', () => {
  test('multi-row insert re-resolves stateful policies after each write', async () => {
    insertPolicyCalls = 0;
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const db = orm.db(ctx.db as any, { rls: { ctx: { db: ctx.db } } }) as any;

      await expect(
        db
          .insert(insertAccounts)
          .values([{ name: 'first' }, { name: 'second' }])
          .execute()
      ).rejects.toThrow(INSERT_POLICY_ERROR_RE);

      expect(insertPolicyCalls).toBe(2);
      expect(
        await ctx.db.query('mutation_rls_insert_accounts').collect()
      ).toHaveLength(1);
    });
  });

  test('multi-row delete re-resolves stateful policies after each write', async () => {
    deletePolicyCalls = 0;
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const firstId = await ctx.db.insert('mutation_rls_delete_accounts', {
        name: 'first',
      });
      const secondId = await ctx.db.insert('mutation_rls_delete_accounts', {
        name: 'second',
      });
      const db = orm.db(ctx.db as any, { rls: { ctx: { db: ctx.db } } }) as any;

      await db
        .delete(deleteAccounts)
        .where(inArray(deleteAccounts.id, [firstId, secondId]))
        .execute();

      expect(deletePolicyCalls).toBe(2);
      expect(
        await ctx.db.query('mutation_rls_delete_accounts').collect()
      ).toHaveLength(1);
    });
  });
});
