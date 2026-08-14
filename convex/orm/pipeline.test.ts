import { expect, test } from 'vitest';
import schema from '../schema';
import { convexTest, countDocumentReads, runCtx } from '../setup.testing';

test('select chain union can interleave indexed streams', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    await baseCtx.db.insert('users', {
      name: 'Aaron',
      email: 'aaron@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'Bella',
      email: 'bella@example.com',
      status: 'pending',
    });
    await baseCtx.db.insert('users', {
      name: 'Chris',
      email: 'chris@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'Diana',
      email: 'diana@example.com',
      status: 'pending',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .withIndex('by_name')
      .select()
      .union([
        { where: { status: 'active' } },
        { where: { status: 'pending' } },
      ])
      .interleaveBy(['name'])
      .paginate({ cursor: null, limit: 10 });

    expect(result.page.map((u) => u.name)).toEqual([
      'Aaron',
      'Bella',
      'Chris',
      'Diana',
    ]);
  });
});

test('select map/filter runs before pagination and supports maxScan metadata', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    for (let i = 0; i < 20; i++) {
      await baseCtx.db.insert('users', {
        name: `User ${String(i).padStart(2, '0')}`,
        email: `pipeline-${i}@example.com`,
      });
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .select()
      .map(async (row) => ({ ...row, slug: row.name.toLowerCase() }))
      .filter(async (row) => row.slug.endsWith('0'))
      .paginate({ cursor: null, limit: 5, maxScan: 2 });

    expect(result.page.every((u) => u.name.endsWith('0'))).toBe(true);
    expect(result.page.every((u) => typeof u.slug === 'string')).toBe(true);
    expect(result.pageStatus).toBeDefined();
    expect(result.splitCursor).toBeDefined();
  });
});

test('select distinct supports pagination', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    await baseCtx.db.insert('users', {
      name: 'A',
      email: 'a@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'B',
      email: 'b@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'C',
      email: 'c@example.com',
      status: 'pending',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .select()
      .orderBy({ status: 'asc' })
      .distinct({ fields: ['status'] })
      .paginate({ cursor: null, limit: 10 });

    expect(result.page.map((u) => u.status)).toEqual(['active', 'pending']);
  });
});

test('findMany distinct is removed and throws deterministic error', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    await baseCtx.db.insert('users', {
      name: 'A',
      email: 'a-findmany@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'B',
      email: 'b-findmany@example.com',
      status: 'active',
    });
    await baseCtx.db.insert('users', {
      name: 'C',
      email: 'c-findmany@example.com',
      status: 'pending',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    await expect(
      (ctx.orm.query.users.findMany as any)({
        orderBy: { status: 'asc' },
        distinct: ['status'],
        limit: 10,
        columns: { status: true },
      })
    ).rejects.toThrow(/DISTINCT_UNSUPPORTED/);
  });
});

test('select flatMap includeParent=true returns parent/child rows', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const user1 = await baseCtx.db.insert('users', {
      name: 'Alice',
      email: 'alice@example.com',
    });
    const user2 = await baseCtx.db.insert('users', {
      name: 'Bob',
      email: 'bob@example.com',
    });

    await baseCtx.db.insert('posts', {
      text: 'hello',
      numLikes: 1,
      type: 'note',
      authorId: user1,
    });
    await baseCtx.db.insert('posts', {
      text: 'world',
      numLikes: 2,
      type: 'note',
      authorId: user1,
    });
    await baseCtx.db.insert('posts', {
      text: 'skip',
      numLikes: 3,
      type: 'note',
      authorId: user2,
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .select()
      .where({ name: 'Alice' })
      .flatMap('posts', { includeParent: true })
      .paginate({ cursor: null, limit: 10 });

    expect(result.page).toHaveLength(2);
    expect(result.page.every((row) => row.parent.name === 'Alice')).toBe(true);
    expect(result.page.map((row) => row.child.text)).toEqual([
      'hello',
      'world',
    ]);
  });
});

test('select flatMap includeParent=false returns child rows', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const user = await baseCtx.db.insert('users', {
      name: 'Alice',
      email: 'alice-child@example.com',
    });

    await baseCtx.db.insert('posts', {
      text: 'child-1',
      numLikes: 1,
      type: 'note',
      authorId: user,
    });
    await baseCtx.db.insert('posts', {
      text: 'child-2',
      numLikes: 2,
      type: 'note',
      authorId: user,
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .select()
      .where({ name: 'Alice' })
      .flatMap('posts', { includeParent: false })
      .paginate({ cursor: null, limit: 10 });

    expect(result.page).toHaveLength(2);
    expect(result.page.map((row) => row.text)).toEqual(['child-1', 'child-2']);
  });
});

test('select paginate supports endCursor boundary pinning', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    await baseCtx.db.insert('users', {
      name: 'A',
      email: 'a@boundary.example.com',
    });
    await baseCtx.db.insert('users', {
      name: 'B',
      email: 'b@boundary.example.com',
    });
    await baseCtx.db.insert('users', {
      name: 'C',
      email: 'c@boundary.example.com',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);

    const first = await ctx.orm.query.users
      .select()
      .orderBy({ name: 'asc' })
      // Keep both queries on stream-backed pagination cursors.
      .map((row) => row)
      .paginate({ cursor: null, limit: 2 });

    await baseCtx.db.insert('users', {
      name: 'AB',
      email: 'ab@boundary.example.com',
    });

    const refreshed = await ctx.orm.query.users
      .select()
      .orderBy({ name: 'asc' })
      .map((row) => row)
      .paginate({
        cursor: null,
        endCursor: first.continueCursor,
        limit: 2,
      });

    expect(refreshed.page.map((u) => u.name)).toEqual(['A', 'AB', 'B']);
    expect(refreshed.continueCursor).toBe(first.continueCursor);
  });
});

test('findMany pageByKey returns page, indexKeys and hasMore', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    await baseCtx.db.insert('users', {
      name: 'A',
      email: 'a@key.example.com',
    });
    await baseCtx.db.insert('users', {
      name: 'B',
      email: 'b@key.example.com',
    });
    await baseCtx.db.insert('users', {
      name: 'C',
      email: 'c@key.example.com',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const first = await ctx.orm.query.users.findMany({
      pageByKey: {
        index: 'by_name',
        targetMaxRows: 2,
      },
    });

    expect(first.page).toHaveLength(2);
    expect(first.indexKeys).toHaveLength(2);
    expect(first.hasMore).toBe(true);
  });
});

test('findMany pipeline mode is removed', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);

    expect(() =>
      ctx.orm.query.users.findMany({
        cursor: null,
        limit: 1,
        // Runtime-only check for legacy callers
        pipeline: { stages: [] },
      } as any)
    ).toThrow(/findmany\(\{ pipeline \}\) is removed/i);

    expect(() =>
      ctx.orm.query.users.findFirst({
        // Runtime-only check for legacy callers
        pipeline: { stages: [] },
      } as any)
    ).toThrow(/findmany\(\{ pipeline \}\) is removed/i);

    expect(() =>
      ctx.orm.query.users.findFirstOrThrow({
        // Runtime-only check for legacy callers
        pipeline: { stages: [] },
      } as any)
    ).toThrow(/findmany\(\{ pipeline \}\) is removed/i);
  });
});

test('select flatMap pagination walks every child exactly once', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    // Insert in reverse name order so `_id` order differs from `name` order.
    // The cursor's inner-key bound then belongs to a parent that is not first.
    for (const name of ['Cara', 'Bob', 'Alice']) {
      const user = await baseCtx.db.insert('users', {
        name,
        email: `${name.toLowerCase()}-flatmap@example.com`,
      });
      for (const suffix of [1, 2]) {
        await baseCtx.db.insert('posts', {
          text: `${name}-${suffix}`,
          numLikes: suffix,
          type: 'note',
          authorId: user,
        });
      }
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const buildQuery = () =>
      ctx.orm.query.users
        .select()
        .orderBy({ name: 'asc' })
        .flatMap('posts', { includeParent: false });

    const singlePage = await buildQuery().paginate({
      cursor: null,
      limit: 100,
    });
    expect(singlePage.page.map((row) => row.text)).toEqual([
      'Alice-1',
      'Alice-2',
      'Bob-1',
      'Bob-2',
      'Cara-1',
      'Cara-2',
    ]);

    // Walking the same stream three rows at a time must yield the same rows,
    // in the same order, with no duplicates and nothing dropped.
    const walked: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 10; page += 1) {
      const result = await buildQuery().paginate({ cursor, limit: 3 });
      walked.push(...result.page.map((row) => row.text));
      cursor = result.continueCursor;
      if (result.isDone) {
        break;
      }
    }

    expect(walked).toEqual(singlePage.page.map((row) => row.text));
  });
});

test('flatMap limit counts matches, not skipped rows', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const author = await baseCtx.db.insert('users', {
      name: 'A',
      email: 'flatmap-limit@example.com',
    });
    // The non-matching children sort first, so a limit that counted scanned
    // rows would be exhausted before reaching a single note.
    for (const [index, type] of [
      'other',
      'other',
      'note',
      'note',
      'note',
    ].entries()) {
      await baseCtx.db.insert('posts', {
        text: `${type}-${index}`,
        numLikes: 0,
        type,
        authorId: author,
      });
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const result = await ctx.orm.query.users
      .select()
      .flatMap('posts', {
        includeParent: false,
        where: { type: 'note' },
        limit: 2,
      })
      .paginate({ cursor: null, limit: 50 });

    expect(result.page.map((row) => row.text)).toEqual(['note-2', 'note-3']);
  });
});

test('flatMap limit stays per parent across pages', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    for (const name of ['A', 'B']) {
      const author = await baseCtx.db.insert('users', {
        name,
        email: `flatmap-pages-${name}@example.com`,
      });
      for (let i = 0; i < 5; i += 1) {
        await baseCtx.db.insert('posts', {
          text: `${name}${i}`,
          numLikes: 0,
          type: 'note',
          authorId: author,
        });
      }
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const walked: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 10; page += 1) {
      const result = await ctx.orm.query.users
        .select()
        .flatMap('posts', { includeParent: false, limit: 3 })
        .paginate({ cursor, limit: 2 });
      walked.push(...result.page.map((row) => row.text));
      cursor = result.continueCursor;
      if (result.isDone) {
        break;
      }
    }

    expect(walked).toEqual(['A0', 'A1', 'A2', 'B0', 'B1', 'B2']);
  });
});

test('flatMap limit reads each child once and stays under maxScan', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const author = await baseCtx.db.insert('users', {
      name: 'A',
      email: 'flatmap-reads@example.com',
    });
    // Only 2 of 30 children match, so maxScan must cap the physical walk.
    for (let i = 0; i < 30; i += 1) {
      await baseCtx.db.insert('posts', {
        text: `p${i}`,
        numLikes: 0,
        type: i === 10 || i === 20 ? 'note' : 'other',
        authorId: author,
      });
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const reads = countDocumentReads(baseCtx);

    const result = await ctx.orm.query.users
      .select()
      .flatMap('posts', {
        includeParent: false,
        where: { type: 'note' },
        limit: 5,
      })
      .paginate({ cursor: null, limit: 5, maxScan: 6 });

    // 1 parent + at most 6 child reads for maxScan: 6.
    expect(reads.documents).toBeLessThanOrEqual(7);
    // And that walk has to be visible to maxScan, not happen behind it.
    expect(result.pageStatus).toBe('SplitRequired');
  });
});

test('flatMap limit stops on the limit-th child, not one past it', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    const author = await baseCtx.db.insert('users', {
      name: 'A',
      email: 'flatmap-limit-stop@example.com',
    });
    for (let i = 0; i < 10; i += 1) {
      await baseCtx.db.insert('posts', {
        text: `p${i}`,
        numLikes: 0,
        type: 'note',
        authorId: author,
      });
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const reads = countDocumentReads(baseCtx);

    const rows = await ctx.orm.query.users
      .select()
      .flatMap('posts', { includeParent: false, limit: 2 })
      .limit(10);

    expect(rows.map((row) => row.text)).toEqual(['p0', 'p1']);
    // 1 parent + exactly 2 children. A third child read would be a document
    // nothing can emit and maxScan never sees, since only replayed rows count.
    expect(reads.documents).toBe(3);
  });
});

test('flatMap limit holds under desc order and a stage where', async () => {
  const t = convexTest(schema);

  await t.run(async (baseCtx) => {
    for (const name of ['A', 'B']) {
      const author = await baseCtx.db.insert('users', {
        name,
        email: `flatmap-desc-${name}@example.com`,
      });
      for (let i = 0; i < 6; i += 1) {
        await baseCtx.db.insert('posts', {
          text: `${name}${i}`,
          numLikes: 0,
          type: i % 2 === 0 ? 'note' : 'other',
          authorId: author,
        });
      }
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const walked: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 12; page += 1) {
      const result = await ctx.orm.query.users
        .select()
        .orderBy({ createdAt: 'desc' })
        .flatMap('posts', {
          includeParent: false,
          where: { type: 'note' },
          limit: 2,
        })
        .paginate({ cursor, limit: 1 });
      walked.push(...result.page.map((row) => row.text));
      cursor = result.continueCursor;
      if (result.isDone) {
        break;
      }
    }

    expect(walked).toEqual(['B4', 'B2', 'A4', 'A2']);
  });
});

test('select() pipeline stages run for an id-only where', async () => {
  const t = convexTest(schema);
  let postId = '';

  await t.run(async (baseCtx) => {
    postId = await baseCtx.db.insert('posts', {
      text: 'test',
      numLikes: 0,
      type: 'text',
      title: 'hello',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);

    const filtered = await ctx.orm.query.posts
      .select()
      .where({ id: postId })
      .filter(() => false)
      .limit(10);
    expect(filtered).toEqual([]);

    const mapped = await ctx.orm.query.posts
      .select()
      .where({ id: postId })
      .map((row) => ({ onlyTitle: row.title }))
      .limit(10);
    expect(mapped).toEqual([{ onlyTitle: 'hello' }]);
  });
});

test('select() pipeline reads an id-only where by key, not by scan', async () => {
  const t = convexTest(schema);
  const ids: string[] = [];

  await t.run(async (baseCtx) => {
    for (let i = 0; i < 40; i += 1) {
      ids.push(
        await baseCtx.db.insert('posts', {
          text: `t${i}`,
          numLikes: 0,
          type: 'text',
          title: `title-${i}`,
        })
      );
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const reads = countDocumentReads(baseCtx);

    // The last row inserted: a creation-time scan would have to read all 40.
    const mapped = await ctx.orm.query.posts
      .select()
      .where({ id: ids.at(-1) as string })
      .map((row) => ({ onlyTitle: row.title }))
      .limit(10);

    expect(mapped).toEqual([{ onlyTitle: 'title-39' }]);
    expect(reads.documents).toBe(1);
  });
});

test('select() pipeline reads an id `in` where by key, in creation order', async () => {
  const t = convexTest(schema);
  const ids: string[] = [];

  await t.run(async (baseCtx) => {
    for (let i = 0; i < 40; i += 1) {
      ids.push(
        await baseCtx.db.insert('posts', {
          text: `t${i}`,
          numLikes: 0,
          type: 'text',
          title: `title-${i}`,
        })
      );
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const reads = countDocumentReads(baseCtx);

    const mapped = await ctx.orm.query.posts
      .select()
      // Out of order, and with a duplicate, to pin both the de-dupe and the
      // stream order the scan would have produced.
      .where({ id: { in: [ids[30], ids[5], ids[30]] as string[] } })
      .map((row) => ({ onlyTitle: row.title }))
      .limit(10);

    expect(mapped).toEqual([
      { onlyTitle: 'title-5' },
      { onlyTitle: 'title-30' },
    ]);
    expect(reads.documents).toBe(2);
  });
});

test('select() pipeline pages an id-only where without scanning', async () => {
  const t = convexTest(schema);
  const ids: string[] = [];

  await t.run(async (baseCtx) => {
    for (let i = 0; i < 40; i += 1) {
      ids.push(
        await baseCtx.db.insert('posts', {
          text: `t${i}`,
          numLikes: 0,
          type: 'text',
          title: `title-${i}`,
        })
      );
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const walked: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 5; page += 1) {
      const result = await ctx.orm.query.posts
        .select()
        .where({ id: { in: [ids[30], ids[5], ids[12]] as string[] } })
        .map((row) => ({ onlyTitle: row.title }))
        .paginate({ cursor, limit: 2 });
      walked.push(...result.page.map((row) => row.onlyTitle as string));
      cursor = result.continueCursor;
      if (result.isDone) {
        break;
      }
    }

    expect(walked).toEqual(['title-5', 'title-12', 'title-30']);
  });
});

test('select() flatMap runs off an id-only where without scanning', async () => {
  const t = convexTest(schema);
  let authorId = '';

  await t.run(async (baseCtx) => {
    for (const name of ['Ada', 'Bo']) {
      const author = await baseCtx.db.insert('users', {
        name,
        email: `${name}@flatmap-id.example.com`,
      });
      if (name === 'Bo') {
        authorId = author;
      }
      for (let i = 0; i < 3; i += 1) {
        await baseCtx.db.insert('posts', {
          text: `${name}${i}`,
          numLikes: 0,
          type: 'note',
          authorId: author,
        });
      }
    }
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const reads = countDocumentReads(baseCtx);

    const rows = await ctx.orm.query.users
      .select()
      .where({ id: authorId })
      .flatMap('posts', { includeParent: false })
      .limit(10);

    expect(rows.map((row) => row.text)).toEqual(['Bo0', 'Bo1', 'Bo2']);
    // 1 parent read by key + its 3 children. Ada is never touched.
    expect(reads.documents).toBe(4);
  });
});

test('pageByKey keeps its shape for an id-only where', async () => {
  const t = convexTest(schema);
  let userId = '';

  await t.run(async (baseCtx) => {
    userId = await baseCtx.db.insert('users', {
      name: 'A',
      email: 'a@idkey.example.com',
    });
  });

  await t.run(async (baseCtx) => {
    const ctx = await runCtx(baseCtx);
    const page = await ctx.orm.query.users.findMany({
      where: { id: userId },
      pageByKey: { index: 'by_name', targetMaxRows: 5 },
    });

    expect(page.page.map((row) => row.name)).toEqual(['A']);
    expect(page.indexKeys).toHaveLength(1);
    expect(page.hasMore).toBe(false);
  });
});
