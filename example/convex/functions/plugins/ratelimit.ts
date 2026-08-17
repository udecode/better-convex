import { cleanupRatelimitState } from 'kitcn/ratelimit';
import { z } from 'zod';
import { privateMutation } from '../../lib/crpc';

const DEFAULT_BATCH_SIZE = 500;

export const cleanup = privateMutation
  .input(
    z.object({
      olderThanMs: z.number().positive(),
      limit: z.number().int().min(1).max(1000).optional(),
    })
  )
  .output(
    z.object({
      deleted: z.number(),
      hasMore: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) =>
    cleanupRatelimitState(ctx.db, {
      before: Date.now() - input.olderThanMs,
      limit: input.limit ?? DEFAULT_BATCH_SIZE,
    })
  );
