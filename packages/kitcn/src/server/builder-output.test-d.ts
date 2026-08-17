import { actionGeneric, mutationGeneric, queryGeneric } from 'convex/server';
import { expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { initCRPC } from './builder';

test('output transforms type handlers by input and clients by output', () => {
  const c = initCRPC.create({
    action: actionGeneric,
    mutation: mutationGeneric,
    query: queryGeneric,
  } as any);
  const output = z.string().transform((value) => new Date(value));

  const queryFn = c.query
    .output(output)
    .query(async () => '2024-01-01T00:00:00.000Z');
  const mutationFn = c.mutation
    .output(output)
    .mutation(async () => '2024-01-01T00:00:00.000Z');
  const actionFn = c.action
    .output(output)
    .action(async () => '2024-01-01T00:00:00.000Z');

  expectTypeOf(queryFn.__kitcnTypeHint?.returns).toEqualTypeOf<
    Date | undefined
  >();
  expectTypeOf(mutationFn.__kitcnTypeHint?.returns).toEqualTypeOf<
    Date | undefined
  >();
  expectTypeOf(actionFn.__kitcnTypeHint?.returns).toEqualTypeOf<
    Date | undefined
  >();
});
