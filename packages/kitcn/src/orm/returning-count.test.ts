import { describe, expect, test } from 'vitest';
import { convexTable, text } from './index';
import { createReturningCountLoader } from './returning-count';

const posts = convexTable('returning_count_posts', {
  title: text().notNull(),
});

describe('returning count loader', () => {
  test('validates ORM wiring when the loader is built, not per row', () => {
    expect(() =>
      createReturningCountLoader({} as any, posts, undefined)
    ).toThrow(/requires orm\.db\(ctx\)/i);

    expect(() =>
      createReturningCountLoader(
        {} as any,
        posts,
        { edgeMetadata: [], schema: {} } as any
      )
    ).toThrow(/is not registered/i);
  });

  test('resolves the table config and edge list once per statement', () => {
    const schema = {
      posts: { name: 'returning_count_posts', table: posts },
    } as any;
    let lookups = 0;
    const countingSchema = new Proxy(schema, {
      get(target, key) {
        lookups += 1;
        return (target as any)[key];
      },
    });

    const loader = createReturningCountLoader(
      {} as any,
      posts,
      { edgeMetadata: [], schema: countingSchema } as any
    );
    const afterBuild = lookups;

    expect(typeof loader.load).toBe('function');
    expect(afterBuild).toBeGreaterThan(0);
  });
});
