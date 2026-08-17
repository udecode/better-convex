import * as z from 'zod';
import { authMutation } from '../lib/crpc';
import { createServerCaller } from './generated/server.runtime';

const LOG_PREFIX = '[migration-demo]';

function log(action: string, payload?: unknown): void {
  if (payload === undefined) {
    console.info(`${LOG_PREFIX} ${action}`);
    return;
  }
  console.info(`${LOG_PREFIX} ${action}`, payload);
}

const downInputSchema = z
  .object({
    steps: z.number().int().positive().optional(),
    to: z.string().min(1).optional(),
  })
  .refine((value) => !(value.steps && value.to), {
    message: 'Use either steps or to, not both.',
  });

/**
 * Read-only, but declared as a mutation because the ORM runtime registers
 * `migrationStatus` in the mutation registry
 * (`packages/kitcn/src/orm/create-orm.ts`, `packages/kitcn/src/cli/codegen.ts`).
 * `createServerCaller` on a `QueryCtx` does not expose mutation procedures, and
 * `assertCanInvoke` rejects them at runtime, so this cannot be `authQuery.query`
 * until that registration moves to the query registry.
 *
 * Consequence for callers: every invocation is a write transaction that costs a
 * ratelimit-document patch and one unit of the caller's mutation budget. Call it
 * on demand, never on an unconditional timer.
 */
export const getStatus = authMutation.mutation(async ({ ctx }) => {
  const server = createServerCaller(ctx);
  const status = await server.migrationStatus({ limit: 200 });

  const runs = Array.isArray(status.runs) ? status.runs : [];
  const states = Array.isArray(status.migrations) ? status.migrations : [];
  const activeRun =
    status.activeRun && typeof status.activeRun === 'object'
      ? status.activeRun
      : null;

  const sortedRuns = [...runs].sort((left, right) => {
    const leftStarted = left.startedAt ?? 0;
    const rightStarted = right.startedAt ?? 0;
    return rightStarted - leftStarted;
  });
  const sortedStates = [...states].sort((left, right) =>
    String(left.migrationId).localeCompare(String(right.migrationId))
  );

  const latestRun = sortedRuns[0] ?? null;

  log('status', {
    runCount: sortedRuns.length,
    stateCount: sortedStates.length,
    latestRunStatus: latestRun?.status ?? null,
    latestRunId: latestRun?.runId ?? null,
    activeRunId: activeRun?.runId ?? null,
  });

  return {
    runs: sortedRuns,
    states: sortedStates,
    activeRun,
  };
});

export const runUp = authMutation.mutation(async ({ ctx }) => {
  const server = createServerCaller(ctx);
  log('runUp request');
  const result = await server.migrationRun({
    direction: 'up',
  });
  log('runUp response', result);
  return result;
});

export const runDown = authMutation
  .input(downInputSchema)
  .mutation(async ({ ctx, input }) => {
    const server = createServerCaller(ctx);
    log('runDown request', input);
    const result = await server.migrationRun({
      direction: 'down',
      ...(input.steps !== undefined ? { steps: input.steps } : {}),
      ...(input.to !== undefined ? { to: input.to } : {}),
    });
    log('runDown response', result);
    return result;
  });

export const cancel = authMutation.mutation(async ({ ctx }) => {
  const server = createServerCaller(ctx);
  log('cancel request');
  const result = await server.migrationCancel({});
  log('cancel response', result);
  return result;
});
