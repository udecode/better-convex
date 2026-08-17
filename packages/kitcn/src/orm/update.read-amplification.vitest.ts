import { defineSchema as defineConvexSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { describe, expect, test } from 'vitest';
import { convexTest } from '../../../../convex/setup.testing';
import {
  convexTable,
  createOrm,
  defineRelations,
  defineSchema,
  eq,
  id,
  index,
  text,
  uniqueIndex,
  unsetToken,
} from '.';

const orgs = convexTable('ru_orgs', {
  name: text().notNull(),
});

const members = convexTable('ru_members', {
  name: text().notNull(),
  status: text().notNull(),
  nickname: text(),
  orgId: id('ru_orgs')
    .references(() => orgs.id)
    .notNull(),
});

const runtimeSchema = defineConvexSchema({
  ru_orgs: defineTable({ name: v.string() }),
  ru_members: defineTable({
    name: v.string(),
    status: v.string(),
    nickname: v.optional(v.string()),
    orgId: v.id('ru_orgs'),
  }),
});

const schema = defineRelations({ ru_orgs: orgs, ru_members: members });
const orm = createOrm({ schema });

const MEMBER_NAME_RE = /^Member /;
const FOREIGN_KEY_VIOLATION_RE = /Foreign key violation/;
const UNIQUE_RE = /[Uu]nique/;

type Counts = { get: number; query: number };

/**
 * Counts reads issued through the writer the ORM was handed. `Object.create`
 * puts the ORM's context carrier in front of this proxy, so the trap has to
 * answer prototype-chain lookups too.
 */
const countingDb = (db: any, counts: Counts) =>
  new Proxy(db, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') {
        return value;
      }
      if (prop !== 'get' && prop !== 'query') {
        return value.bind(target);
      }
      return (...args: unknown[]) => {
        counts[prop] += 1;
        return value.apply(target, args);
      };
    },
  });

const seed = async (ctx: any, rowCount: number) => {
  const orgId = await ctx.db.insert('ru_orgs', { name: 'Acme' });
  for (let index = 0; index < rowCount; index++) {
    await ctx.db.insert('ru_members', {
      name: `Member ${index}`,
      status: 'active',
      nickname: `nick-${index}`,
      orgId,
    });
  }
  return orgId;
};

/** The shape `returning()` is contractually expected to produce for a row. */
const expectedReturningRow = async (ctx: any, publicId: string) => {
  const fresh: any = await ctx.db.get(publicId);
  const { _id, _creationTime, ...rest } = fresh;
  return { ...rest, id: _id, createdAt: _creationTime };
};

describe('ORM update() read amplification', () => {
  test('returning() and the single-column id FK probe do not scale with row count', async () => {
    const t = convexTest(runtimeSchema);
    const rowCount = 8;

    await t.run(async (ctx) => {
      const orgId = await seed(ctx, rowCount);

      const counts: Counts = { get: 0, query: 0 };
      const db = orm.db(countingDb(ctx.db, counts)) as any;

      const rows = await db
        .update(members)
        .set({ status: 'archived', orgId })
        .where(eq(members.status, 'active'))
        .allowFullScan()
        .returning()
        .execute();

      expect(rows).toHaveLength(rowCount);
      for (const row of rows) {
        expect(row.status).toBe('archived');
        expect(row.orgId).toBe(orgId);
        expect(row.name).toMatch(MEMBER_NAME_RE);
        expect(typeof row.id).toBe('string');
      }

      // One FK probe for the whole statement, no post-image re-reads.
      expect(counts.get).toBe(1);
    });
  });

  test('the id FK probe alone is one read regardless of row count', async () => {
    const t = convexTest(runtimeSchema);

    await t.run(async (ctx) => {
      const orgId = await seed(ctx, 8);

      const counts: Counts = { get: 0, query: 0 };
      const db = orm.db(countingDb(ctx.db, counts)) as any;

      await db
        .update(members)
        .set({ status: 'archived', orgId })
        .where(eq(members.status, 'active'))
        .allowFullScan()
        .execute();

      expect(counts.get).toBe(1);
    });
  });

  test('returning() post-image matches a fresh read of the patched row', async () => {
    const t = convexTest(runtimeSchema);

    await t.run(async (ctx) => {
      const orgId = await seed(ctx, 3);
      const db = orm.db(ctx.db as any) as any;

      const rows = await db
        .update(members)
        .set({ status: 'archived', orgId })
        .where(eq(members.status, 'active'))
        .allowFullScan()
        .returning()
        .execute();

      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(row).toStrictEqual(await expectedReturningRow(ctx, row.id));
      }
    });
  });

  test('an unset column is absent from the returning() post-image', async () => {
    const t = convexTest(runtimeSchema);

    await t.run(async (ctx) => {
      await seed(ctx, 3);
      const db = orm.db(ctx.db as any) as any;

      const rows = await db
        .update(members)
        .set({ status: 'archived', nickname: unsetToken })
        .where(eq(members.status, 'active'))
        .allowFullScan()
        .returning()
        .execute();

      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(Object.hasOwn(row, 'nickname')).toBe(false);
        expect(row).toStrictEqual(await expectedReturningRow(ctx, row.id));
      }
    });
  });

  test('a projected returning() selection still reflects the patch', async () => {
    const t = convexTest(runtimeSchema);

    await t.run(async (ctx) => {
      await seed(ctx, 3);
      const db = orm.db(ctx.db as any) as any;

      const rows = await db
        .update(members)
        .set({ status: 'archived' })
        .where(eq(members.status, 'active'))
        .allowFullScan()
        .returning({ id: members.id, status: members.status })
        .execute();

      expect(rows.map((row: any) => row.status)).toEqual([
        'archived',
        'archived',
        'archived',
      ]);
      expect(rows.every((row: any) => typeof row.id === 'string')).toBe(true);
    });
  });

  test('a broken foreign key still fails before any row is patched', async () => {
    const t = convexTest(runtimeSchema);

    await t.run(async (ctx) => {
      const orgId = await seed(ctx, 4);
      const missingOrgId = await ctx.db.insert('ru_orgs', { name: 'Ghost' });
      await ctx.db.delete(missingOrgId);

      const db = orm.db(ctx.db as any) as any;

      await expect(
        db
          .update(members)
          .set({ status: 'archived', orgId: missingOrgId })
          .where(eq(members.status, 'active'))
          .allowFullScan()
          .execute()
      ).rejects.toThrow(FOREIGN_KEY_VIOLATION_RE);

      const survivors = await ctx.db.query('ru_members').collect();
      expect(survivors.every((row: any) => row.orgId === orgId)).toBe(true);
      expect(survivors.every((row: any) => row.status === 'active')).toBe(true);
    });
  });
});

const slugs = convexTable(
  'ru_slugs',
  {
    slug: text().notNull(),
    status: text().notNull(),
  },
  (t) => [
    index('ru_slugs_by_slug').on(t.slug),
    uniqueIndex('ru_slugs_unique_slug').on(t.slug),
  ]
);

const slugRuntimeSchema = defineConvexSchema({
  ru_slugs: defineTable({ slug: v.string(), status: v.string() }).index(
    'ru_slugs_by_slug',
    ['slug']
  ),
});

const slugOrm = createOrm({ schema: defineRelations({ ru_slugs: slugs }) });

describe('ORM update() constraints that must stay per-row', () => {
  test('the unique-index probe still sees rows written earlier in the same loop', async () => {
    const t = convexTest(slugRuntimeSchema);

    await t.run(async (ctx) => {
      await ctx.db.insert('ru_slugs', { slug: 'a', status: 'draft' });
      await ctx.db.insert('ru_slugs', { slug: 'b', status: 'draft' });

      const db = slugOrm.db(ctx.db as any) as any;

      // Row 1 writes `same`; row 2 must still observe it and refuse.
      await expect(
        db
          .update(slugs)
          .set({ slug: 'same' })
          .where(eq(slugs.status, 'draft'))
          .allowFullScan()
          .execute()
      ).rejects.toThrow(UNIQUE_RE);
    });
  });
});

const hookedRows = convexTable('ru_hooked', {
  name: text().notNull(),
  status: text().notNull(),
});

const hookedRuntimeSchema = defineConvexSchema({
  ru_hooked: defineTable({ name: v.string(), status: v.string() }),
});

const hookedOrm = createOrm({
  schema: defineSchema({ ru_hooked: hookedRows }).triggers({
    ru_hooked: {
      update: {
        before: (data: any) => ({ data: { status: `${data.status}-hooked` } }),
      },
    },
  } as any) as any,
});

describe('ORM update() with lifecycle hooks', () => {
  test('returning() reflects a payload rewritten by an update.before hook', async () => {
    const t = convexTest(hookedRuntimeSchema);

    await t.run(async (ctx) => {
      await ctx.db.insert('ru_hooked', { name: 'One', status: 'active' });
      await ctx.db.insert('ru_hooked', { name: 'Two', status: 'active' });

      const db = (hookedOrm.with({ db: ctx.db } as any) as any).orm;

      const rows = await db
        .update(hookedRows)
        .set({ status: 'archived' })
        .where(eq(hookedRows.status, 'active'))
        .allowFullScan()
        .returning()
        .execute();

      expect(rows).toHaveLength(2);
      for (const row of rows) {
        // The hook, not `set()`, decided the stored value.
        expect(row.status).toBe('archived-hooked');
        const fresh: any = await ctx.db.get(row.id);
        expect(fresh.status).toBe('archived-hooked');
      }
    });
  });
});

const nodes = convexTable(
  'ru_nodes',
  {
    code: text().notNull(),
    parentCode: text(),
  },
  (t) => [
    index('ru_nodes_by_code').on(t.code),
    index('ru_nodes_by_parent_code').on(t.parentCode),
  ]
);

const nodesWithFk = convexTable(
  'ru_nodes',
  {
    code: text().notNull(),
    parentCode: text().references(() => nodes.code, { onUpdate: 'cascade' }),
  },
  (t) => [
    index('ru_nodes_by_code').on(t.code),
    index('ru_nodes_by_parent_code').on(t.parentCode),
  ]
);

const nodesRuntimeSchema = defineConvexSchema({
  ru_nodes: defineTable({
    code: v.string(),
    parentCode: v.optional(v.string()),
  })
    .index('ru_nodes_by_code', ['code'])
    .index('ru_nodes_by_parent_code', ['parentCode']),
});

const nodesOrm = createOrm({
  schema: defineRelations({ ru_nodes: nodesWithFk }),
});

describe('ORM update() with a self-referencing cascade', () => {
  test('returning() reflects the cascade write to the same row', async () => {
    const t = convexTest(nodesRuntimeSchema);

    await t.run(async (ctx) => {
      // Self-parent: the cascade rewrites the very row being patched.
      await ctx.db.insert('ru_nodes', { code: 'root', parentCode: 'root' });

      const db = nodesOrm.db(ctx.db as any) as any;

      const rows = await db
        .update(nodesWithFk)
        .set({ code: 'renamed' })
        .where(eq(nodesWithFk.code, 'root'))
        .allowFullScan()
        .returning()
        .execute();

      expect(rows).toHaveLength(1);
      const fresh: any = await ctx.db.get(rows[0].id);
      expect(fresh.code).toBe('renamed');
      expect(rows[0].code).toBe(fresh.code);
      expect(rows[0].parentCode).toBe(fresh.parentCode);
    });
  });
});
