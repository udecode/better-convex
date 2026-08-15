import { eq } from 'kitcn/orm';
import { CRPCError } from 'kitcn/server';
import { z } from 'zod';
import { authMutation, authQuery } from '../lib/crpc';
import { tagsTable, todoTagsTable } from './schema';

/**
 * Largest number of todoTags rows `merge` will move in one transaction.
 *
 * Every insert and delete below read-modify-writes the `by_tag` aggregate
 * bucket document for its tag, so the loop is ~6-8 sequential db ops per row
 * against two hot documents. Above this budget the merge is refused instead of
 * silently truncated.
 */
const MERGE_MAX_JOINS = 1000;

// List user's tags with usage count
export const list = authQuery
  .output(
    z.array(
      z.object({
        id: z.string(),
        createdAt: z.date(),
        name: z.string(),
        color: z.string(),
        usageCount: z.number(),
      })
    )
  )
  .query(async ({ ctx }) => {
    const tags = await ctx.orm.query.tags.findMany({
      where: { createdBy: ctx.userId },
      orderBy: { createdAt: 'asc' },
      with: {
        _count: {
          todos: true,
        },
      },
    });

    if (!tags.length) return [];

    return tags.map((tag) => ({
      ...tag,
      usageCount: tag._count?.todos ?? 0,
    }));
  });

// Create a new tag
export const create = authMutation
  .input(
    z.object({
      name: z.string().min(1).max(50),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    })
  )
  .output(z.string())
  .mutation(async ({ ctx, input }) => {
    // Check if tag with same name already exists for this user
    const existingTag = await ctx.orm.query.tags.findFirst({
      where: { createdBy: ctx.userId, name: input.name },
    });

    if (existingTag) {
      throw new CRPCError({
        code: 'CONFLICT',
        message: 'A tag with this name already exists',
      });
    }

    const [tag] = await ctx.orm
      .insert(tagsTable)
      .values({
        name: input.name,
        color: input.color || generateRandomColor(),
        createdBy: ctx.userId,
      })
      .returning();

    return tag.id;
  });

// Update tag name or color
export const update = authMutation
  .input(
    z.object({
      tagId: z.string(),
      name: z.string().min(1).max(50).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    })
  )

  .mutation(async ({ ctx, input }) => {
    const tag = await ctx.orm.query.tags.findFirstOrThrow({
      where: { id: input.tagId, createdBy: ctx.userId },
    });

    // Check for duplicate name if updating name
    if (input.name && input.name !== tag.name) {
      const existingTag = await ctx.orm.query.tags.findFirst({
        where: { createdBy: ctx.userId, name: input.name },
      });

      if (existingTag && existingTag.id !== input.tagId) {
        throw new CRPCError({
          code: 'CONFLICT',
          message: 'A tag with this name already exists',
        });
      }
    }

    await ctx.orm
      .update(tagsTable)
      .set({ name: input.name, color: input.color })
      .where(eq(tagsTable.id, input.tagId));
  });

// Delete a tag (removes from all todos)
export const deleteTag = authMutation
  .input(
    z.object({
      tagId: z.string(),
    })
  )

  .mutation(async ({ ctx, input }) => {
    await ctx.orm.query.tags.findFirstOrThrow({
      where: { id: input.tagId, createdBy: ctx.userId },
    });

    await ctx.orm.delete(tagsTable).where(eq(tagsTable.id, input.tagId));
  });

// Merge two tags
export const merge = authMutation
  .input(
    z.object({
      sourceTagId: z.string(),
      targetTagId: z.string(),
    })
  )

  .mutation(async ({ ctx, input }) => {
    if (input.sourceTagId === input.targetTagId) {
      throw new CRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot merge a tag with itself',
      });
    }

    await Promise.all([
      ctx.orm.query.tags.findFirstOrThrow({
        where: { id: input.sourceTagId, createdBy: ctx.userId },
      }),
      ctx.orm.query.tags.findFirstOrThrow({
        where: { id: input.targetTagId, createdBy: ctx.userId },
      }),
    ]);

    // Both reads must be complete or the merge corrupts data, so read one row
    // past the budget and refuse rather than truncate. An unsized read here
    // resolved to the schema-wide defaultLimit (1000) and silently dropped the
    // excess: those todos lost the source tag (cascaded away by the delete
    // below) without ever gaining the target tag. A truncated targetJoins is
    // just as bad -- the dedupe set goes stale and duplicate join rows get
    // inserted, since todoId_tagId is a plain index, not a unique constraint.
    // Convex mutations are atomic, so throwing before any write leaves the
    // tags untouched.
    const [joins, targetJoins] = await Promise.all([
      ctx.orm.query.todoTags.findMany({
        where: { tagId: input.sourceTagId },
        limit: MERGE_MAX_JOINS + 1,
        columns: { id: true, todoId: true },
      }),
      ctx.orm.query.todoTags.findMany({
        where: { tagId: input.targetTagId },
        limit: MERGE_MAX_JOINS + 1,
        columns: { todoId: true },
      }),
    ]);

    if (
      joins.length > MERGE_MAX_JOINS ||
      targetJoins.length > MERGE_MAX_JOINS
    ) {
      throw new CRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot merge tags applied to more than ${MERGE_MAX_JOINS} todos in a single transaction`,
      });
    }

    const targetTodoIds = new Set(targetJoins.map((j) => j.todoId));

    // Keep this loop sequential. Promise.all here would interleave
    // read-modify-writes of the same `by_tag` bucket document (lost updates in
    // the `_count` that tags.list reads) and would race the targetTodoIds
    // dedupe set, inserting duplicate join rows.
    for (const join of joins) {
      if (!targetTodoIds.has(join.todoId)) {
        await ctx.orm.insert(todoTagsTable).values({
          todoId: join.todoId,
          tagId: input.targetTagId,
        });
        targetTodoIds.add(join.todoId);
      }

      await ctx.orm.delete(todoTagsTable).where(eq(todoTagsTable.id, join.id));
    }

    // Delete source tag
    await ctx.orm.delete(tagsTable).where(eq(tagsTable.id, input.sourceTagId));
  });

// Get most popular tags across all users
export const popular = authQuery
  .input(
    z.object({
      limit: z.number().min(1).max(50).optional(),
    })
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        usageCount: z.number(),
        isOwn: z.boolean(),
      })
    )
  )
  .query(async ({ ctx, input }) => {
    const limit = input.limit || 10;

    // Get all tags with usage counts
    const allTags = await ctx.orm.query.tags.findMany({
      limit: 100,
      with: {
        _count: {
          todos: true,
        },
      },
    });

    if (!allTags.length) return [];

    const tagsWithCounts = allTags.map((tag) => ({
      ...tag,
      usageCount: tag._count?.todos ?? 0,
      isOwn: tag.createdBy === ctx.userId,
    }));

    // Sort by usage count and return top N
    return tagsWithCounts
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  });

// Helper function to generate random hex color
function generateRandomColor(): string {
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#84CC16', // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
