/**
 * M5 String Operators - Comprehensive Test Suite
 *
 * Tests string matching operators:
 * - like() with % wildcards (prefix/suffix/substring)
 * - ilike() case-insensitive
 * - notLike() and notIlike() negation
 */

import { test as baseTest, describe, expect } from 'vitest';
import schema from '../schema';
import { convexTest, runCtx, type TestCtx } from '../setup.testing';

// ============================================================================
// Test Setup
// ============================================================================

const test = baseTest.extend<{ ctx: TestCtx }>({
  ctx: async ({}, use) => {
    const t = convexTest(schema);
    await t.run(async (baseCtx) => {
      const ctx = await runCtx(baseCtx);
      await use(ctx);
    });
  },
});

// ============================================================================
// LIKE Operator Tests
// ============================================================================

describe('M5: like() operator', () => {
  test('like with %prefix% pattern matches substring', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Advanced JavaScript',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts with 'JavaScript' in title
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%JavaScript%' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('Advanced JavaScript');
  });

  test('like with prefix% pattern matches prefix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Java Basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts starting with 'Java'
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: 'Java%' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('Java Basics');
  });

  test('like with %suffix pattern matches suffix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Beginner Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Advanced Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Quick Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts ending with 'Guide'
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%Guide' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('Beginner Guide');
    expect(posts.map((p: any) => p.title)).toContain('Quick Guide');
  });

  test('like without wildcards matches exact', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Exact Title',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Exact',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    // Find exact match
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: 'Exact Title' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Exact Title');
  });

  test('notLike excludes pattern matches', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { notLike: '%JavaScript%' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Python Tutorial');
  });
});

// ============================================================================
// ILIKE Operator Tests (Case-Insensitive)
// ============================================================================

describe('M5: ilike() operator', () => {
  test('ilike is case-insensitive', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JAVASCRIPT Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'javascript basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts with 'javascript' (any case)
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { ilike: '%javascript%' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JAVASCRIPT Guide');
    expect(posts.map((p: any) => p.title)).toContain('javascript basics');
  });

  test('notIlike excludes case-insensitive matches', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { notIlike: '%javascript%' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Python Tutorial');
  });
});

// ============================================================================
// LIKE Prefix Pattern Tests
// ============================================================================

describe('M5: like() prefix pattern', () => {
  test('like matches prefix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Java Basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts with prefix 'Java'
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: 'Java%' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('Java Basics');
  });

  test('like is case-sensitive', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'javascript basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    // Find posts with prefix 'Java' (case-sensitive)
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: 'Java%' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('JavaScript Guide');
  });
});

// ============================================================================
// LIKE Suffix Pattern Tests
// ============================================================================

describe('M5: like() suffix pattern', () => {
  test('like matches suffix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Beginner Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Advanced Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Quick Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts ending with 'Guide'
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%Guide' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('Beginner Guide');
    expect(posts.map((p: any) => p.title)).toContain('Quick Guide');
  });

  test('like is case-sensitive', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Quick Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Quick guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    // Find posts ending with 'Guide' (case-sensitive)
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%Guide' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Quick Guide');
  });
});

// ============================================================================
// LIKE Substring Pattern Tests
// ============================================================================

describe('M5: like() substring pattern', () => {
  test('like matches substring', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Advanced JavaScript',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    // Find posts containing 'JavaScript'
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%JavaScript%' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('Advanced JavaScript');
  });

  test('like is case-sensitive', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'javascript basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });

    // Find posts containing 'JavaScript' (case-sensitive)
    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { like: '%JavaScript%' } },
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('JavaScript Guide');
  });
});

// ============================================================================
// STARTSWITH / ENDSWITH / CONTAINS Operator Tests
// ============================================================================

describe('M5: startsWith operator', () => {
  test('startsWith matches prefix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Java Basics',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { startsWith: 'Java' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('Java Basics');
  });
});

describe('M5: endsWith operator', () => {
  test('endsWith matches suffix', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Beginner Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Advanced Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Quick Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { endsWith: 'Guide' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('Beginner Guide');
    expect(posts.map((p: any) => p.title)).toContain('Quick Guide');
  });
});

describe('M5: contains operator', () => {
  test('contains matches substring', async ({ ctx }) => {
    const db = ctx.orm;

    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });

    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'JavaScript Guide',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 1000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'TypeScript Handbook',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 2000,
    });
    await ctx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'Python Tutorial',
      content: 'Content',
      published: true,
      authorId: user,
      publishedAt: 3000,
    });

    const posts = await db.query.posts.withIndex('by_title').findMany({
      where: { title: { contains: 'Script' } },
    });

    expect(posts).toHaveLength(2);
    expect(posts.map((p: any) => p.title)).toContain('JavaScript Guide');
    expect(posts.map((p: any) => p.title)).toContain('TypeScript Handbook');
  });
});

// ============================================================================
// Limit interaction
// ============================================================================

describe('M5: post-fetch operators combined with limit', () => {
  const seed = async (ctx: TestCtx) => {
    const user = await ctx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });
    // 15 non-matching titles sort before the 5 matching ones, so a `limit`
    // pushed down to Convex consumes the whole budget on non-matches.
    for (let i = 0; i < 15; i += 1) {
      await ctx.db.insert('posts', {
        text: 'test',
        numLikes: 0,
        type: 'text',
        title: `AAA Python ${String(i).padStart(2, '0')}`,
        content: 'Content',
        published: true,
        authorId: user,
        publishedAt: 1000 + i,
      });
    }
    for (let i = 15; i < 20; i += 1) {
      await ctx.db.insert('posts', {
        text: 'test',
        numLikes: 0,
        type: 'text',
        title: `ZZZ Java ${String(i).padStart(2, '0')}`,
        content: 'Content',
        published: true,
        authorId: user,
        publishedAt: 1000 + i,
      });
    }
  };

  test('like with a limit returns matches, not the first limit rows', async ({
    ctx,
  }) => {
    await seed(ctx);

    const posts = await ctx.orm.query.posts.findMany({
      where: { title: { like: '%Java%' } },
      limit: 5,
    });

    expect(posts).toHaveLength(5);
    for (const post of posts) {
      expect(post.title).toContain('Java');
    }
  });

  test('like with a limit smaller than the match count truncates matches', async ({
    ctx,
  }) => {
    await seed(ctx);

    const posts = await ctx.orm.query.posts.findMany({
      where: { title: { like: '%Java%' } },
      limit: 3,
    });

    expect(posts).toHaveLength(3);
    for (const post of posts) {
      expect(post.title).toContain('Java');
    }
  });

  test('contains and endsWith honor limit', async ({ ctx }) => {
    await seed(ctx);

    const contains = await ctx.orm.query.posts.withIndex('by_title').findMany({
      where: { title: { contains: 'Java' } },
      limit: 5,
    });
    const endsWith = await ctx.orm.query.posts.withIndex('by_title').findMany({
      where: { title: { endsWith: '19' } },
      limit: 5,
    });

    expect(contains).toHaveLength(5);
    expect(endsWith).toHaveLength(1);
    expect(endsWith[0].title).toBe('ZZZ Java 19');
  });

  test('explicit withIndex + ilike + limit returns matches', async ({
    ctx,
  }) => {
    await seed(ctx);

    const posts = await ctx.orm.query.posts.withIndex('by_title').findMany({
      where: { title: { ilike: '%java%' } },
      limit: 5,
    });

    expect(posts).toHaveLength(5);
    for (const post of posts) {
      expect(post.title).toContain('Java');
    }
  });

  test('NOT around a post-fetch operator negates instead of matching nothing', async ({
    ctx,
  }) => {
    await seed(ctx);

    const posts = await ctx.orm.query.posts.withIndex('by_title').findMany({
      where: { title: { NOT: { like: '%Java%' } } },
    });

    expect(posts).toHaveLength(15);
    for (const post of posts) {
      expect(post.title).not.toContain('Java');
    }
  });

  test('offset with a post-fetch operator skips matches, not scanned rows', async ({
    ctx,
  }) => {
    await seed(ctx);

    const posts = await ctx.orm.query.posts.findMany({
      where: { title: { like: '%Java%' } },
      offset: 2,
      limit: 5,
    });

    expect(posts).toHaveLength(3);
    for (const post of posts) {
      expect(post.title).toContain('Java');
    }
  });
});
