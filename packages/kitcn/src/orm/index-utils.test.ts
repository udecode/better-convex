/** biome-ignore-all lint/performance/useTopLevelRegex: inline regex assertions are intentional in tests. */
import {
  findIndexForColumns,
  findRelationIndex,
  findRelationIndexOrThrow,
  findSearchIndexByName,
  findVectorIndexByName,
  getIndexes,
  getSearchIndexes,
  getVectorIndexes,
  resolveIndexOrderPushdown,
} from './index-utils';

describe('index-utils', () => {
  test('getIndexes reads method output only', () => {
    const fromMethod = {
      getIndexes: () => [{ name: 'by_name', fields: ['name'] }],
    };
    expect(getIndexes(fromMethod as any)).toEqual([
      { name: 'by_name', fields: ['name'] },
    ]);

    expect(getIndexes({ getIndexes: () => null } as any)).toEqual([]);
    expect(
      getIndexes({ indexes: [{ indexDescriptor: 'by_email' }] } as any)
    ).toEqual([]);
  });

  test('getSearchIndexes reads method output only', () => {
    const fromMethod = {
      getSearchIndexes: () => [
        { name: 'text_search', searchField: 'text', filterFields: ['type'] },
      ],
    };
    expect(getSearchIndexes(fromMethod as any)).toEqual([
      { name: 'text_search', searchField: 'text', filterFields: ['type'] },
    ]);

    expect(getSearchIndexes({ getSearchIndexes: () => null } as any)).toEqual(
      []
    );
    expect(
      getSearchIndexes({
        searchIndexes: [
          {
            indexDescriptor: 'text_search',
            searchField: 'text',
            filterFields: undefined,
          },
        ],
      } as any)
    ).toEqual([]);
  });

  test('getVectorIndexes reads method output only', () => {
    const fromMethod = {
      getVectorIndexes: () => [
        {
          name: 'embedding_vec',
          vectorField: 'embedding',
          dimensions: 1536,
          filterFields: ['type'],
        },
      ],
    };
    expect(getVectorIndexes(fromMethod as any)).toEqual([
      {
        name: 'embedding_vec',
        vectorField: 'embedding',
        dimensions: 1536,
        filterFields: ['type'],
      },
    ]);

    expect(getVectorIndexes({ getVectorIndexes: () => null } as any)).toEqual(
      []
    );
    expect(
      getVectorIndexes({
        vectorIndexes: [
          {
            indexDescriptor: 'embedding_vec',
            vectorField: 'embedding',
            dimensions: 1536,
            filterFields: undefined,
          },
        ],
      } as any)
    ).toEqual([]);
  });

  test('findSearchIndexByName and findVectorIndexByName return hit or null', () => {
    const table = {
      getSearchIndexes: () => [
        { name: 'text_search', searchField: 'text', filterFields: [] },
      ],
      getVectorIndexes: () => [
        {
          name: 'embedding_vec',
          vectorField: 'embedding',
          dimensions: 1536,
          filterFields: [],
        },
      ],
    };

    expect(
      findSearchIndexByName(table as any, 'text_search')?.searchField
    ).toBe('text');
    expect(findSearchIndexByName(table as any, 'missing')).toBeNull();

    expect(
      findVectorIndexByName(table as any, 'embedding_vec')?.dimensions
    ).toBe(1536);
    expect(findVectorIndexByName(table as any, 'missing')).toBeNull();
  });

  test('findIndexForColumns matches compound index prefixes', () => {
    const indexes = [
      { name: 'by_name', fields: ['name'] },
      { name: 'by_type_likes', fields: ['type', 'numLikes'] },
    ];

    expect(findIndexForColumns(indexes, ['name'])).toBe('by_name');
    expect(findIndexForColumns(indexes, ['type'])).toBe('by_type_likes');
    expect(findIndexForColumns(indexes, ['type', 'numLikes'])).toBe(
      'by_type_likes'
    );
    expect(findIndexForColumns(indexes, ['numLikes'])).toBeNull();
  });

  test('findRelationIndex throws without index unless allowFullScan', () => {
    const table = { getIndexes: () => [{ name: 'by_name', fields: ['name'] }] };

    expect(() =>
      findRelationIndex(
        table as any,
        ['email'],
        'users.posts',
        'users',
        true,
        false
      )
    ).toThrow(/requires index/i);
  });

  test('findRelationIndex returns null with allowFullScan and warns in strict mode', () => {
    const table = { getIndexes: () => [{ name: 'by_name', fields: ['name'] }] };
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    const strictNull = findRelationIndex(
      table as any,
      ['email'],
      'users.posts',
      'users',
      true,
      true
    );
    expect(strictNull).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockClear();

    const nonStrictNull = findRelationIndex(
      table as any,
      ['email'],
      'users.posts',
      'users',
      false,
      true
    );
    expect(nonStrictNull).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  test('findRelationIndexOrThrow returns index or throws', () => {
    const table = {
      getIndexes: () => [{ name: 'by_author', fields: ['authorId'] }],
    };

    expect(
      findRelationIndexOrThrow(
        table as any,
        ['authorId'],
        'posts.author',
        'posts',
        false
      )
    ).toBe('by_author');

    expect(() =>
      findRelationIndexOrThrow(
        table as any,
        ['missingField'],
        'posts.author',
        'posts',
        false
      )
    ).toThrow(/requires index/i);
  });
});

describe('resolveIndexOrderPushdown', () => {
  const asc = (field: string) => [{ field, direction: 'asc' as const }];
  const desc = (field: string) => [{ field, direction: 'desc' as const }];

  test('serves the first index field left unpinned by eq', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['type', 'numLikes'],
        pinnedEqCount: 1,
        orderSpecs: desc('numLikes'),
      })
    ).toBe('desc');
  });

  test('serves _creationTime only once every index field is pinned', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['authorId'],
        pinnedEqCount: 1,
        orderSpecs: desc('_creationTime'),
      })
    ).toBe('desc');

    // (type, numLikes) with only `type` pinned walks numLikes order, not
    // creation order, so `.order()` would silently sort by the wrong column.
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['type', 'numLikes'],
        pinnedEqCount: 1,
        orderSpecs: desc('_creationTime'),
      })
    ).toBeNull();
  });

  test('serves a pinned field because it is constant across the scan', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['type', 'numLikes'],
        pinnedEqCount: 1,
        orderSpecs: asc('type'),
      })
    ).toBe('asc');
  });

  test('serves the leading field when nothing is pinned', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['publishedAt'],
        pinnedEqCount: 0,
        orderSpecs: desc('publishedAt'),
      })
    ).toBe('desc');
  });

  test('declines a field the index does not sort by next', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['authorId', 'published'],
        pinnedEqCount: 1,
        orderSpecs: asc('numLikes'),
      })
    ).toBeNull();
  });

  test('declines without an index', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: null,
        pinnedEqCount: 0,
        orderSpecs: desc('_creationTime'),
      })
    ).toBeNull();
  });

  test('declines multi-field sorts because .order() reverses the whole key', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['authorId', 'numLikes'],
        pinnedEqCount: 1,
        orderSpecs: [
          { field: 'numLikes', direction: 'desc' },
          { field: 'title', direction: 'asc' },
        ],
      })
    ).toBeNull();
  });

  test('declines when there is no sort at all', () => {
    expect(
      resolveIndexOrderPushdown({
        indexFields: ['authorId'],
        pinnedEqCount: 1,
        orderSpecs: [],
      })
    ).toBeNull();
  });
});
