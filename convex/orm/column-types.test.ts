import { v } from 'convex/values';
import {
  bytes,
  convexTable,
  custom,
  type DatabaseWithMutations,
  defineRelations,
  defineSchema,
  eq,
  extractRelationsConfig,
  text,
  textEnum,
} from 'kitcn/orm';
import { describe, expect, it } from 'vitest';
import { withOrmCtx } from '../setup.testing';

const bytesFiles = convexTable('bytes_files', {
  data: bytes().notNull(),
});

const customConfigs = convexTable('custom_configs', {
  meta: custom(v.object({ key: v.string() })).notNull(),
});

const taggedPosts = convexTable('tagged_posts', {
  title: text().notNull(),
  tags: custom(v.array(v.string())).notNull(),
});

const enumUsers = convexTable('enum_users', {
  status: textEnum(['active', 'inactive'] as const).notNull(),
});

const rawSchema = {
  bytes_files: bytesFiles,
  custom_configs: customConfigs,
  enum_users: enumUsers,
  tagged_posts: taggedPosts,
};

const schema = defineSchema(rawSchema);
const relations = defineRelations(rawSchema);
const edges = extractRelationsConfig(relations);

const withCtx = async <T>(
  fn: (ctx: { orm: DatabaseWithMutations<typeof relations> }) => Promise<T>
) => withOrmCtx(schema, relations, async ({ orm }) => fn({ orm }));

describe('column types', () => {
  it('bytes() stores and returns ArrayBuffer', async () =>
    withCtx(async ({ orm }) => {
      const input = new Uint8Array([1, 2, 3]).buffer;
      const [row] = await orm
        .insert(bytesFiles)
        .values({ data: input })
        .returning();

      expect(Array.from(new Uint8Array(row.data))).toEqual([1, 2, 3]);
    }));

  it('custom() enforces Convex validators', async () =>
    withCtx(async ({ orm }) => {
      await orm
        .insert(customConfigs)
        .values({ meta: { key: 'value' } })
        .returning();

      await expect(
        orm.insert(customConfigs).values({ meta: { key: 123 } as any })
      ).rejects.toThrow();
    }));

  it('textEnum() rejects invalid values', async () =>
    withCtx(async ({ orm }) => {
      await orm.insert(enumUsers).values({ status: 'active' }).returning();

      await expect(
        orm.insert(enumUsers).values({ status: 'other' as any })
      ).rejects.toThrow();
    }));
});

describe('filters on array and object columns', () => {
  it('eq matches an array column by value', async () =>
    withCtx(async ({ orm }) => {
      await orm
        .insert(taggedPosts)
        .values({ title: 'p0', tags: ['x', 'y'] })
        .returning();
      await orm
        .insert(taggedPosts)
        .values({ title: 'p1', tags: ['x'] })
        .returning();

      const rows = await orm.query.tagged_posts.findMany({
        where: { tags: ['x', 'y'] },
        allowFullScan: true,
      });

      expect(rows.map((row) => row.title)).toEqual(['p0']);
    }));

  it('in matches an array column by value', async () =>
    withCtx(async ({ orm }) => {
      await orm
        .insert(taggedPosts)
        .values({ title: 'p0', tags: ['x', 'y'] })
        .returning();
      await orm
        .insert(taggedPosts)
        .values({ title: 'p1', tags: ['z'] })
        .returning();

      const rows = await orm.query.tagged_posts.findMany({
        where: { tags: { in: [['x', 'y'], ['q']] } },
        allowFullScan: true,
      });

      expect(rows.map((row) => row.title)).toEqual(['p0']);
    }));

  it('eq matches an object column by value', async () =>
    withCtx(async ({ orm }) => {
      await orm
        .insert(customConfigs)
        .values({ meta: { key: 'value' } })
        .returning();
      await orm
        .insert(customConfigs)
        .values({ meta: { key: 'other' } })
        .returning();

      const rows = await orm.query.custom_configs.findMany({
        where: (t, { eq }) => eq(t.meta, { key: 'value' }),
        allowFullScan: true,
      });

      expect(rows.map((row) => row.meta)).toEqual([{ key: 'value' }]);
    }));

  it('update where matches an array column by value', async () =>
    withCtx(async ({ orm }) => {
      await orm
        .insert(taggedPosts)
        .values({ title: 'p0', tags: ['x', 'y'] })
        .returning();

      const updated = await orm
        .update(taggedPosts)
        .set({ title: 'renamed' })
        .where(eq(taggedPosts.tags, ['x', 'y']))
        .allowFullScan()
        .returning();

      expect(updated.map((row) => row.title)).toEqual(['renamed']);
    }));
});
