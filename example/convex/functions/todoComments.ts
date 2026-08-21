import { eq } from 'kitcn/orm';
import { CRPCError } from 'kitcn/server';
import * as z from 'zod';
import {
  authMutation,
  optionalAuthQuery,
  privateMutation,
  publicQuery,
} from '../lib/crpc';
import {
  buildRepliesWith,
  CommentListItemSchema,
  CommentRowWithRepliesSchema,
  MAX_REPLY_DEPTH,
  toReply,
} from './_helpers/comment_tree';
import type { QueryCtx } from './generated/server';
import { todoCommentsTable } from './schema';

// ============================================
// COMMENT QUERIES
// ============================================

// Get comments for a todo with nested replies
export const getTodoComments = optionalAuthQuery
  .input(
    z.object({
      todoId: z.string(),
      includeReplies: z.boolean().default(true),
      maxReplyDepth: z.number().min(0).max(MAX_REPLY_DEPTH).default(3),
    })
  )
  .paginated({ limit: 20, item: CommentListItemSchema })
  .query(async ({ ctx, input }) => {
    await ctx.orm.query.todos.findFirstOrThrow({
      where: { id: input.todoId },
    });

    const results = await ctx.orm.query.todoComments.findMany({
      where: { todoId: input.todoId, parentId: { isNull: true } },
      orderBy: { createdAt: 'desc' },
      cursor: input.cursor,
      limit: input.limit,
      with: {
        user: true,
        _count: { replies: true },
        ...(input.includeReplies && input.maxReplyDepth > 0
          ? { replies: buildRepliesWith(input.maxReplyDepth) }
          : {}),
      },
    });

    const rows = z.array(CommentRowWithRepliesSchema).parse(results.page);

    return {
      ...results,
      page: rows.map(toReply),
    };
  });

// Get single comment thread
export const getCommentThread = publicQuery
  .input(
    z.object({
      commentId: z.string(),
      maxDepth: z.number().min(0).max(MAX_REPLY_DEPTH).default(MAX_REPLY_DEPTH),
    })
  )
  .output(
    z
      .object({
        comment: z.object({
          id: z.string(),
          content: z.string(),
          createdAt: z.date(),
          todoId: z.string(),
          todo: z.object({
            title: z.string(),
            completed: z.boolean(),
          }),
          user: z
            .object({
              id: z.string(),
              name: z.string().optional(),
              image: z.string().nullish(),
            })
            .nullable(),
          parent: z
            .object({
              id: z.string(),
              content: z.string(),
              user: z
                .object({
                  name: z.string().optional(),
                })
                .nullable(),
            })
            .nullable(),
          replies: z.array(z.any()),
          ancestors: z.array(
            z.object({
              id: z.string(),
              content: z.string(),
              user: z
                .object({
                  name: z.string().optional(),
                })
                .nullable(),
            })
          ),
        }),
      })
      .nullable()
  )
  .query(async ({ ctx, input }) => {
    const comment = await ctx.orm.query.todoComments.findFirst({
      where: { id: input.commentId },
      with: {
        user: true,
        todo: true,
        parent: { with: { user: true } },
        ...(input.maxDepth > 0
          ? { replies: buildRepliesWith(input.maxDepth) }
          : {}),
      },
    });
    if (!comment) {
      return null;
    }

    const todo = comment.todo;
    if (!todo) {
      throw new CRPCError({
        code: 'NOT_FOUND',
        message: 'Todo not found',
      });
    }

    const commentRow = CommentRowWithRepliesSchema.parse(comment);
    const replies = commentRow.replies ?? [];

    const user = comment.user ?? null;
    const parent = comment.parent ?? null;
    const parentUser = parent?.user ?? null;

    // Get ancestors (for context)
    const ancestors: {
      id: string;
      content: string;
      user: { name?: string } | null;
    }[] = [];
    let currentParentId = comment.parentId;
    while (currentParentId && ancestors.length < 5) {
      const currentParent = await ctx.orm.query.todoComments.findFirst({
        where: { id: currentParentId },
        with: { user: true },
      });
      if (!currentParent) {
        break;
      }

      ancestors.unshift({
        id: currentParent.id,
        content: currentParent.content,
        user: currentParent.user?.name
          ? { name: currentParent.user.name }
          : null,
      });
      currentParentId = currentParent.parentId ?? null;
    }

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        todoId: comment.todoId,
        todo: {
          title: todo.title,
          completed: todo.completed,
        },
        user: user
          ? {
              id: user.id,
              name: user.name,
              image: user.image,
            }
          : null,
        parent: parent
          ? {
              id: parent.id,
              content: parent.content,
              user: parentUser?.name ? { name: parentUser.name } : null,
            }
          : null,
        replies: replies.map(toReply),
        ancestors,
      },
    };
  });

// Schema for user comments
const UserCommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  isReply: z.boolean(),
  todo: z
    .object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })
    .nullable()
    .optional(),
  parentPreview: z
    .object({
      content: z.string(),
      userName: z.string().optional(),
    })
    .optional(),
});

// Get user's recent comments
export const getUserComments = optionalAuthQuery
  .input(
    z.object({
      userId: z.string(),
      includeTodo: z.boolean().default(true),
    })
  )
  .paginated({ limit: 20, item: UserCommentSchema })
  .query(async ({ ctx, input }) => {
    const results = await ctx.orm.query.todoComments.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' },
      cursor: input.cursor,
      limit: input.limit,
      with: {
        ...(input.includeTodo
          ? { todo: { columns: { id: true, title: true, completed: true } } }
          : {}),
        parent: {
          columns: { id: true, content: true },
          with: { user: { columns: { name: true } } },
        },
      },
    });

    return {
      ...results,
      page: results.page.map((comment) => {
        const result: z.infer<typeof UserCommentSchema> = {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          isReply: !!comment.parentId,
        };

        if (input.includeTodo && 'todo' in comment) {
          result.todo = comment.todo
            ? {
                id: comment.todo.id,
                title: comment.todo.title,
                completed: comment.todo.completed,
              }
            : null;
        }

        if (comment.parent) {
          result.parentPreview = {
            content:
              comment.parent.content.slice(0, 100) +
              (comment.parent.content.length > 100 ? '...' : ''),
            userName: comment.parent.user?.name,
          };
        }

        return result;
      }),
    };
  });

// ============================================
// COMMENT MUTATIONS
// ============================================

// Add comment to todo
export const addComment = authMutation
  .input(
    z.object({
      todoId: z.string(),
      content: z.string().min(1).max(1000),
      parentId: z.string().optional(),
    })
  )
  .output(z.string())
  .mutation(async ({ ctx, input }) => {
    const todo = await ctx.orm.query.todos.findFirstOrThrow({
      where: { id: input.todoId },
    });

    async function checkTodoAccess(t: NonNullable<typeof todo>) {
      // Owner always has access
      if (t.userId === ctx.userId) {
        return true;
      }

      if (!t.projectId) {
        return false;
      }

      const project = await ctx.orm.query.projects.findFirst({
        where: { id: t.projectId },
      });
      if (!project) {
        return false;
      }

      if (project.isPublic) {
        return true;
      }

      const membership = await ctx.orm.query.projectMembers.findFirst({
        where: { projectId: project.id, userId: ctx.userId },
      });
      return !!membership || project.ownerId === ctx.userId;
    }

    // Check access (todo must be public, owned by user, or user is project member)
    const hasAccess = await checkTodoAccess(todo);
    if (!hasAccess) {
      throw new CRPCError({
        code: 'FORBIDDEN',
        message: 'No access to this todo',
      });
    }

    // Validate parent if provided
    if (input.parentId) {
      const parent = await ctx.orm.query.todoComments
        .findFirstOrThrow({
          where: { id: input.parentId },
        })
        .catch(() => {
          throw new CRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid parent comment',
          });
        });
      if (parent.todoId !== input.todoId) {
        throw new CRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent comment',
        });
      }

      // `getCommentDepth` returns the parent's own level, so this admits a new
      // reply at level MAX_REPLY_DEPTH and no deeper -- exactly what the read
      // queries are willing to return.
      const depth = await getCommentDepth(ctx, input.parentId);
      if (depth >= MAX_REPLY_DEPTH) {
        throw new CRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum reply depth reached',
        });
      }
    }

    const [{ id }] = await ctx.orm
      .insert(todoCommentsTable)
      .values({
        content: input.content,
        todoId: input.todoId,
        userId: ctx.userId,
        parentId: input.parentId,
      })
      .returning({ id: todoCommentsTable.id });
    return id;
  });

// Update comment
export const updateComment = authMutation
  .input(
    z.object({
      commentId: z.string(),
      content: z.string().min(1).max(1000),
    })
  )

  .mutation(async ({ ctx, input }) => {
    const comment = await ctx.orm.query.todoComments.findFirstOrThrow({
      where: { id: input.commentId },
    });

    // Only author can update
    if (comment.userId !== ctx.userId) {
      throw new CRPCError({
        code: 'FORBIDDEN',
        message: 'Only comment author can update',
      });
    }

    // Don't allow editing after 1 hour
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (comment.createdAt.getTime() < hourAgo) {
      throw new CRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot edit comments older than 1 hour',
      });
    }

    await ctx.orm
      .update(todoCommentsTable)
      .set({ content: input.content })
      .where(eq(todoCommentsTable.id, input.commentId));
  });

// Delete comment
export const deleteComment = authMutation
  .input(z.object({ commentId: z.string() }))

  .mutation(async ({ ctx, input }) => {
    const comment = await ctx.orm.query.todoComments.findFirstOrThrow({
      where: { id: input.commentId },
      with: {
        _count: {
          replies: true,
        },
      },
    });

    // Author or todo owner can delete
    const todo = await ctx.orm.query.todos.findFirstOrThrow({
      where: { id: comment.todoId },
    });
    if (comment.userId !== ctx.userId && todo.userId !== ctx.userId) {
      throw new CRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    // If has replies, just mark as deleted
    const hasReplies = (comment._count?.replies ?? 0) > 0;
    if (hasReplies) {
      await ctx.orm
        .update(todoCommentsTable)
        .set({ content: '[deleted]' })
        .where(eq(todoCommentsTable.id, comment.id));
    } else {
      await ctx.orm
        .delete(todoCommentsTable)
        .where(eq(todoCommentsTable.id, comment.id));
    }
  });

// ============================================
// INTERNAL FUNCTIONS
// ============================================

// Clean up orphaned comments
export const cleanupOrphanedComments = privateMutation
  .input(z.object({ batchSize: z.number().default(100) }))
  .output(
    z.object({
      deleted: z.number(),
      hasMore: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Find comments where todo was deleted
    const comments = await ctx.orm.query.todoComments.findMany({
      limit: input.batchSize,
      with: { todo: { columns: { id: true } } },
    });

    let deleted = 0;
    for (const comment of comments) {
      if (!comment.todo) {
        await ctx.orm
          .delete(todoCommentsTable)
          .where(eq(todoCommentsTable.id, comment.id));
        deleted++;
      }
    }

    return {
      deleted,
      hasMore: comments.length === input.batchSize,
    };
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get comment depth in thread
async function getCommentDepth(
  ctx: QueryCtx,
  commentId: string
): Promise<number> {
  let depth = 0;
  let current = await ctx.orm.query.todoComments.findFirst({
    where: { id: commentId },
  });

  while (current?.parentId && depth < 10) {
    depth++;
    current = await ctx.orm.query.todoComments.findFirst({
      where: { id: current.parentId },
    });
  }

  return depth;
}
