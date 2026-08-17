import { describe, expect, test } from 'vitest';
import { mapWithConcurrency } from '../internal/concurrency';
import { patchReferencingRows } from './mutation-utils';
import { hasLifecycleHooks, markLifecycleHookedTables } from './write-fanout';

const createPatchSpy = () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const patched: string[] = [];
  return {
    maxInFlight: () => maxInFlight,
    patch: async (_table: string, id: string, _value: unknown) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      patched.push(String(id));
      inFlight -= 1;
    },
    patched,
  };
};

const rows = (count: number) =>
  Array.from({ length: count }, (_unused, i) => ({ _id: `r${i}` }));

describe('write fan-out', () => {
  test('mapWithConcurrency preserves order and never exceeds the limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const out = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6, 7],
      3,
      async (n) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return n * 2;
      }
    );

    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
    expect(maxInFlight).toBe(3);
  });

  test('hasLifecycleHooks resolves through the ORM prototype chain', () => {
    const wrapped = markLifecycleHookedTables({}, new Set(['hooked_table']));
    const baseDb = Object.create(wrapped);

    expect(hasLifecycleHooks(baseDb, 'hooked_table')).toBe(true);
    expect(hasLifecycleHooks(baseDb, 'plain_table')).toBe(false);
    expect(hasLifecycleHooks({}, 'hooked_table')).toBe(false);
    expect(hasLifecycleHooks(undefined, 'hooked_table')).toBe(false);
  });

  test('foreign key fan-out is pooled on a table without lifecycle hooks', async () => {
    const spy = createPatchSpy();
    await patchReferencingRows(
      { patch: spy.patch } as any,
      'plain_table',
      rows(30),
      {
        parentId: null,
      }
    );

    expect(spy.patched).toHaveLength(30);
    expect(spy.maxInFlight()).toBeGreaterThan(1);
  });

  test('foreign key fan-out stays sequential on a hooked table', async () => {
    const spy = createPatchSpy();
    const db = markLifecycleHookedTables(
      { patch: spy.patch },
      new Set(['hooked_table'])
    );

    await patchReferencingRows(db as any, 'hooked_table', rows(30), {
      parentId: null,
    });

    // Hooked writes are serialized by the lifecycle write lock anyway, and
    // their hooks must fire in write order.
    expect(spy.maxInFlight()).toBe(1);
    expect(spy.patched).toEqual(rows(30).map((row) => row._id));
  });
});
