import { partialMatchKey } from '@tanstack/query-core';
import { buildConvexFilterKey, hasQueryFilterArgs } from './query-filter';

describe('hasQueryFilterArgs', () => {
  test('treats nullish args and empty objects as "no args"', () => {
    expect(hasQueryFilterArgs(undefined)).toBe(false);
    expect(hasQueryFilterArgs({})).toBe(false);
    // `null` in the args slot matches nothing, which is the #386 failure mode.
    expect(hasQueryFilterArgs(null)).toBe(false);
  });

  test('treats any populated value as args', () => {
    expect(hasQueryFilterArgs({ id: '1' })).toBe(true);
    expect(hasQueryFilterArgs('skip')).toBe(true);
    expect(hasQueryFilterArgs(0)).toBe(true);
    expect(hasQueryFilterArgs(false)).toBe(true);
  });
});

describe('buildConvexFilterKey', () => {
  test('drops the args slot when no args narrow the filter', () => {
    expect(buildConvexFilterKey('convexQuery', 'todos:list')).toEqual([
      'convexQuery',
      'todos:list',
    ]);
    expect(buildConvexFilterKey('convexAction', 'workers:run', {})).toEqual([
      'convexAction',
      'workers:run',
    ]);
  });

  test('keeps the args slot when args narrow the filter', () => {
    expect(
      buildConvexFilterKey('convexQuery', 'todos:list', { status: 'open' })
    ).toEqual(['convexQuery', 'todos:list', { status: 'open' }]);
  });

  test('prefix key partial-matches every args variant', () => {
    const prefix = buildConvexFilterKey('convexQuery', 'todos:list');
    const variants = [
      ['convexQuery', 'todos:list', {}],
      ['convexQuery', 'todos:list', { status: 'open' }],
      ['convexQuery', 'todos:list', { cursor: null, limit: 10 }],
      ['convexQuery', 'todos:list', 'skip'],
    ];

    for (const key of variants) {
      expect(partialMatchKey(key, prefix)).toBe(true);
    }

    // Still scoped to one function.
    expect(partialMatchKey(['convexQuery', 'todos:other', {}], prefix)).toBe(
      false
    );
    expect(partialMatchKey(['convexAction', 'todos:list', {}], prefix)).toBe(
      false
    );
  });

  test('the unfixed 3-slot key is what matched nothing', () => {
    // Regression guard for #386: an args slot holding `undefined` fails
    // `partialMatchKey` against every entry that carries real args.
    const broken = ['convexQuery', 'todos:list', undefined];

    expect(
      partialMatchKey(['convexQuery', 'todos:list', { status: 'open' }], broken)
    ).toBe(false);
    expect(partialMatchKey(['convexQuery', 'todos:list', {}], broken)).toBe(
      false
    );
  });
});
