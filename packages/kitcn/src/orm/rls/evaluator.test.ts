import { describe, expect, test } from 'vitest';
import { convexTable, eq, rlsPolicy, text } from '../index';
import { createRlsPolicyResolutionCache, filterSelectRows } from './evaluator';

let usingCalls = 0;

const secrets = convexTable(
  'rls_evaluator_secrets',
  {
    ownerId: text().notNull(),
    value: text().notNull(),
  },
  (t) => [
    rlsPolicy('secrets_read', {
      for: 'select',
      using: async (ctx: any) => {
        usingCalls += 1;
        return eq(t.ownerId, await Promise.resolve(ctx.viewerId));
      },
    }),
  ]
);

const rls = { ctx: { viewerId: 'u1' } } as any;

const buildRows = (count: number) =>
  Array.from({ length: count }, (_unused, i) => ({
    _id: `s${i}`,
    ownerId: i % 2 === 0 ? 'u1' : 'u2',
    value: 'v',
  }));

describe('rls policy resolution', () => {
  test('resolves each policy once per execution in the per-row streaming shape', async () => {
    usingCalls = 0;
    // Mirrors query.ts: an RLS-enabled root query installs a `filterWith` that
    // hands `filterSelectRows` one row at a time.
    const cache = createRlsPolicyResolutionCache();
    const visible: Record<string, unknown>[] = [];
    for (const row of buildRows(25)) {
      const passed = await filterSelectRows({
        cache,
        rls,
        rows: [row],
        table: secrets as any,
      });
      visible.push(...passed);
    }

    expect(visible).toHaveLength(13);
    expect(usingCalls).toBe(1);
  });

  test('resolves each policy once per execution in the batch shape', async () => {
    usingCalls = 0;
    const visible = await filterSelectRows({
      rls,
      rows: buildRows(25),
      table: secrets as any,
    });

    expect(visible).toHaveLength(13);
    expect(usingCalls).toBe(1);
  });

  test('permissive short-circuit still skips later policies', async () => {
    const shortCircuit = convexTable(
      'rls_evaluator_short_circuit',
      { value: text().notNull() },
      (t) => [
        rlsPolicy('allows', {
          for: 'select',
          using: () => eq(t.value, 'ok'),
        }),
        rlsPolicy('never_resolved', {
          for: 'select',
          using: () => {
            throw new Error('later permissive policy must not be resolved');
          },
        }),
      ]
    );

    const visible = await filterSelectRows({
      rls,
      rows: [{ _id: 'a', value: 'ok' }],
      table: shortCircuit as any,
    });

    expect(visible).toHaveLength(1);
  });

  test('a zero-row read never invokes a policy callback', async () => {
    usingCalls = 0;
    const visible = await filterSelectRows({
      rls,
      rows: [],
      table: secrets as any,
    });

    expect(visible).toEqual([]);
    expect(usingCalls).toBe(0);
  });
});
