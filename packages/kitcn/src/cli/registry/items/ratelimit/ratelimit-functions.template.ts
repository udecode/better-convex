const PROJECT_CRPC_IMPORT_PLACEHOLDER = '__KITCN_PROJECT_CRPC_IMPORT__';

export const RATELIMIT_FUNCTIONS_TEMPLATE = `import { cleanupRatelimitState } from "kitcn/ratelimit";
import * as z from "zod";
import { privateMutation } from "${PROJECT_CRPC_IMPORT_PLACEHOLDER}";

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
`;
