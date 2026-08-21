import { QueryClient, skipToken } from '@tanstack/react-query';
import { makeFunctionReference } from 'convex/server';
import { createHashFn } from '../internal/hash';
import { createCRPCOptionsProxy } from './proxy';

const api = {
  todos: {
    create: makeFunctionReference<'mutation'>('todos:create'),
    list: makeFunctionReference<'query'>('todos:list'),
  },
  workers: {
    run: makeFunctionReference<'action'>('workers:run'),
  },
};

const meta = {
  todos: {
    create: { auth: 'required', type: 'mutation' },
    list: { auth: 'optional', type: 'query' },
  },
  workers: {
    run: { auth: 'required', type: 'action' },
  },
} as any;

describe('createCRPCOptionsProxy', () => {
  test('builds query keys and filters with proper query prefix', () => {
    const proxy = createCRPCOptionsProxy(api, meta);

    expect(proxy.todos.list.queryKey({ status: 'open' })).toEqual([
      'convexQuery',
      'todos:list',
      { status: 'open' },
    ]);
    expect(proxy.workers.run.queryKey({ id: 'w1' })).toEqual([
      'convexAction',
      'workers:run',
      { id: 'w1' },
    ]);

    expect(
      proxy.todos.list.queryFilter({ status: 'open' }, { stale: true })
    ).toEqual({
      queryKey: ['convexQuery', 'todos:list', { status: 'open' }],
      stale: true,
    });
  });

  test('queryFilter without args builds a prefix key matching every variant', () => {
    const proxy = createCRPCOptionsProxy(api, meta);

    // Omitting args (or passing an empty object) means "every args variant",
    // so the key must stop before the args slot.
    expect(proxy.todos.list.queryFilter()).toEqual({
      queryKey: ['convexQuery', 'todos:list'],
    });
    expect(proxy.todos.list.queryFilter({})).toEqual({
      queryKey: ['convexQuery', 'todos:list'],
    });
    expect(proxy.workers.run.queryFilter(undefined, { stale: true })).toEqual({
      queryKey: ['convexAction', 'workers:run'],
      stale: true,
    });
  });

  test('queryFilter without args matches every cached args variant', () => {
    const proxy = createCRPCOptionsProxy(api, meta);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryKeyHashFn: createHashFn() } },
    });

    queryClient.setQueryData(proxy.todos.list.queryKey({ status: 'open' }), [
      'a',
    ]);
    queryClient.setQueryData(proxy.todos.list.queryKey({ status: 'done' }), [
      'b',
    ]);
    queryClient.setQueryData(proxy.todos.list.queryKey(), ['c']);
    queryClient.setQueryData(proxy.workers.run.queryKey({ id: 'w1' }), 'other');

    const matched = queryClient
      .getQueryCache()
      .findAll(proxy.todos.list.queryFilter());

    expect(matched.map((query) => query.queryKey)).toEqual([
      ['convexQuery', 'todos:list', { status: 'open' }],
      ['convexQuery', 'todos:list', { status: 'done' }],
      ['convexQuery', 'todos:list', {}],
    ]);

    // Narrowing by args still partial-matches only that variant.
    expect(
      queryClient
        .getQueryCache()
        .findAll(proxy.todos.list.queryFilter({ status: 'open' }))
        .map((query) => query.queryKey)
    ).toEqual([['convexQuery', 'todos:list', { status: 'open' }]]);
  });

  test('invalidateQueries with a no-args filter invalidates every variant', async () => {
    const proxy = createCRPCOptionsProxy(api, meta);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryKeyHashFn: createHashFn() } },
    });

    queryClient.setQueryData(proxy.todos.list.queryKey({ status: 'open' }), [
      'a',
    ]);
    queryClient.setQueryData(proxy.todos.list.queryKey({ status: 'done' }), [
      'b',
    ]);
    queryClient.setQueryData(proxy.workers.run.queryKey({ id: 'w1' }), 'other');

    await queryClient.invalidateQueries(proxy.todos.list.queryFilter());

    const invalidated = (key: readonly unknown[]) =>
      queryClient.getQueryCache().find({ queryKey: key, exact: true })?.state
        .isInvalidated;

    expect(invalidated(proxy.todos.list.queryKey({ status: 'open' }))).toBe(
      true
    );
    expect(invalidated(proxy.todos.list.queryKey({ status: 'done' }))).toBe(
      true
    );
    // Scoped to the one function: a different function is untouched.
    expect(invalidated(proxy.workers.run.queryKey({ id: 'w1' }))).toBe(false);
  });

  test('queryFilter prefix key survives skipped entries and exact matching', () => {
    const proxy = createCRPCOptionsProxy(api, meta);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryKeyHashFn: createHashFn() } },
    });

    // Skipped queries park under a 'skip' sentinel instead of an args object,
    // and hold no data — `setQueryData(key, undefined)` is a no-op, so the
    // entry has to be built directly or this proves nothing.
    queryClient
      .getQueryCache()
      .build(queryClient, { queryKey: ['convexQuery', 'todos:list', 'skip'] });
    queryClient.setQueryData(proxy.todos.list.queryKey({ status: 'open' }), [
      'a',
    ]);

    expect(
      queryClient
        .getQueryCache()
        .findAll(proxy.todos.list.queryFilter())
        .map((query) => query.queryKey)
    ).toEqual([
      ['convexQuery', 'todos:list', 'skip'],
      ['convexQuery', 'todos:list', { status: 'open' }],
    ]);

    // The prefix key is not a cache key, so hashing must not treat it as one.
    expect(() =>
      queryClient.invalidateQueries(proxy.todos.list.queryFilter())
    ).not.toThrow();
    expect(() =>
      queryClient.invalidateQueries({
        ...proxy.todos.list.queryFilter({ status: 'open' }),
        exact: true,
      })
    ).not.toThrow();
  });

  test('builds static query options for queries and actions', () => {
    const proxy = createCRPCOptionsProxy(api, meta);
    const queryOpts = proxy.todos.list.staticQueryOptions({ status: 'open' });
    const actionOpts = proxy.workers.run.staticQueryOptions(skipToken);

    expect(queryOpts.queryKey).toEqual([
      'convexQuery',
      'todos:list',
      { status: 'open' },
    ]);
    expect(queryOpts.meta.authType).toBe('optional');
    expect(queryOpts.meta.subscribe).toBe(true);

    expect(actionOpts.queryKey).toEqual(['convexAction', 'workers:run', {}]);
    expect(actionOpts.enabled).toBe(false);
    expect(actionOpts.meta.authType).toBe('required');
    expect(actionOpts.meta.subscribe).toBe(false);
  });

  test('exposes infinite and mutation key helpers and function metadata', () => {
    const proxy = createCRPCOptionsProxy(api, meta);

    expect(proxy.todos.list.infiniteQueryKey({ status: 'open' })).toEqual([
      'convexQuery',
      'todos:list',
      { status: 'open' },
    ]);
    expect(proxy.todos.list.infiniteQueryKey()).toEqual([
      'convexQuery',
      'todos:list',
      {},
    ]);
    expect(proxy.todos.create.mutationKey()).toEqual([
      'convexMutation',
      'todos:create',
    ]);
    expect(proxy.todos.list.meta as any).toEqual({
      auth: 'optional',
      type: 'query',
    } as any);
  });
});
