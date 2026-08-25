import * as z from 'zod';

/**
 * How many replies deep a thread may go. `addComment` enforces it on the write
 * side and both read queries cap their requested depth at the same number, so
 * a thread can never be deeper than a single read is willing to return.
 */
export const MAX_REPLY_DEPTH = 5;

export const CommentListItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  user: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      image: z.string().nullish(),
    })
    .nullable(),
  replies: z.array(z.any()),
  replyCount: z.number(),
});
export type Reply = z.infer<typeof CommentListItemSchema>;

const CommentUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  image: z.string().nullish(),
});
type CommentUser = z.infer<typeof CommentUserSchema>;

export type CommentRowWithReplies = {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser | null;
  replies?: CommentRowWithReplies[];
  _count?: { replies: number };
};

export const CommentRowWithRepliesSchema: z.ZodType<CommentRowWithReplies> =
  z.lazy(() =>
    z.object({
      id: z.string(),
      createdAt: z.date(),
      content: z.string(),
      user: CommentUserSchema.nullable(),
      replies: z.array(CommentRowWithRepliesSchema).optional(),
      _count: z.object({ replies: z.number() }).optional(),
    })
  );

type RepliesWith = {
  limit: number;
  orderBy: { createdAt: 'asc' };
  with: {
    user: true;
    _count: { replies: true };
    replies?: RepliesWith;
  };
};

/**
 * The `with` config for a reply tree `maxDepth` levels deep.
 *
 * Every level asks for its own `_count.replies`, including the last one — that
 * node's children are not fetched, so its count is the only thing telling the
 * client the thread continues. Reading the count inline is what keeps the tree
 * to one pass: re-reading each returned node to attach a count would double the
 * query's document reads for nodes the caller already holds.
 */
export function buildRepliesWith(maxDepth: number): RepliesWith | undefined {
  if (maxDepth <= 0) return;

  const childWith = buildRepliesWith(maxDepth - 1);
  return {
    limit: 10,
    orderBy: { createdAt: 'asc' },
    with: {
      user: true,
      _count: { replies: true },
      ...(childWith ? { replies: childWith } : {}),
    },
  };
}

export function toReply(row: CommentRowWithReplies): Reply {
  const user = row.user ?? null;
  const replies = row.replies ?? [];

  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    user: user
      ? {
          id: user.id,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        }
      : null,
    replies: replies.map(toReply),
    replyCount: row._count?.replies ?? 0,
  };
}
