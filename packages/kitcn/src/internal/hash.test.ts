import { createHashFn } from './hash';

describe('internal/hash', () => {
  test('createHashFn falls back for non-Convex query keys', () => {
    const fallback = mock(
      (key: readonly unknown[]) => `fallback:${JSON.stringify(key)}`
    );
    const hashFn = createHashFn(fallback);

    const key = ['not-convex', { value: 1 }] as const;
    expect(hashFn(key)).toBe('fallback:["not-convex",{"value":1}]');
    expect(fallback).toHaveBeenCalledWith(key);
  });

  test('hashes Date args in Convex query and action keys', () => {
    const hashFn = createHashFn();
    const at = new Date(1_700_000_000_000);

    const queryHash = hashFn(['convexQuery', 'todos:list', { at }]);
    const actionHash = hashFn(['convexAction', 'ai:analyze', { at }]);

    expect(queryHash).toBe(hashFn(['convexQuery', 'todos:list', { at }]));
    expect(queryHash).not.toBe(
      hashFn(['convexQuery', 'todos:list', { at: new Date(0) }])
    );
    expect(actionHash.startsWith('convexAction|ai:analyze|')).toBe(true);
  });
});
