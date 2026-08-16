import { eq, type OrmWriter } from 'kitcn/orm';
import { CRPCError } from 'kitcn/server';
import type schema from '../schema';
import { tagsTable, todoTagsTable } from '../schema';

type TagMergeCtx = { orm: OrmWriter<typeof schema> };

const MERGE_MAX_JOINS = 1000;

export const mergeTags = async (
  ctx: TagMergeCtx,
  userId: string,
  input: { sourceTagId: string; targetTagId: string }
): Promise<void> => {
  if (input.sourceTagId === input.targetTagId) {
    throw new CRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot merge a tag with itself',
    });
  }

  await Promise.all([
    ctx.orm.query.tags.findFirstOrThrow({
      where: { id: input.sourceTagId, createdBy: userId },
    }),
    ctx.orm.query.tags.findFirstOrThrow({
      where: { id: input.targetTagId, createdBy: userId },
    }),
  ]);

  // Deleting the source cascades every remaining join. Read one past the
  // transaction budget so a truncated source can never silently lose tags.
  const joins = await ctx.orm.query.todoTags.findMany({
    where: { tagId: input.sourceTagId },
    limit: MERGE_MAX_JOINS + 1,
    columns: { id: true, todoId: true },
  });

  if (joins.length > MERGE_MAX_JOINS) {
    throw new CRPCError({
      code: 'BAD_REQUEST',
      message: `Cannot merge a tag applied to more than ${MERGE_MAX_JOINS} todos in a single transaction`,
    });
  }

  const linkedTodoIds = new Set<string>();

  // Keep writes serial: each row updates the same per-tag aggregate buckets.
  // Probe the compound index per source todo instead of loading the target tag.
  for (const join of joins) {
    if (!linkedTodoIds.has(join.todoId)) {
      const existing = await ctx.orm.query.todoTags.findFirst({
        where: { todoId: join.todoId, tagId: input.targetTagId },
        columns: { id: true },
      });

      if (!existing) {
        await ctx.orm.insert(todoTagsTable).values({
          todoId: join.todoId,
          tagId: input.targetTagId,
        });
      }

      linkedTodoIds.add(join.todoId);
    }

    await ctx.orm.delete(todoTagsTable).where(eq(todoTagsTable.id, join.id));
  }

  await ctx.orm.delete(tagsTable).where(eq(tagsTable.id, input.sourceTagId));
};
