import { renderHook } from '@testing-library/react';
import * as convexReact from 'convex/react';
import type { RatelimitSnapshot } from '../types';
import { useRatelimit } from './use-rate-limit';

describe('useRatelimit', () => {
  let useQuerySpy: ReturnType<typeof spyOn>;
  let useConvexSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    useQuerySpy = spyOn(convexReact, 'useQuery');
    useConvexSpy = spyOn(convexReact, 'useConvex').mockReturnValue({
      mutation: mock(async () => Date.now()),
    } as any);
  });

  afterEach(() => {
    useQuerySpy.mockRestore();
    useConvexSpy.mockRestore();
  });

  test('sliding-window checks recover as time advances without a fresh snapshot', () => {
    const start = Math.floor(Date.now() / 1000) * 1000;
    const snapshot: RatelimitSnapshot = {
      value: 0,
      ts: start,
      shard: 0,
      state: { value: 10, ts: start },
      config: {
        kind: 'slidingWindow',
        limit: 10,
        window: 1000,
        shards: 1,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 1 })
    );

    const immediate = result.current.check(start, 1);
    const recovered = result.current.check(start + 1500, 1);

    expect(immediate?.ok).toBe(false);
    expect(recovered?.ok).toBe(true);
  });

  test('sliding-window retryAt uses remaining window time, not a full new window', () => {
    const start = Math.floor(Date.now() / 1000) * 1000;
    const snapshot: RatelimitSnapshot = {
      value: 0,
      ts: start,
      shard: 0,
      state: { value: 10, ts: start },
      config: {
        kind: 'slidingWindow',
        limit: 10,
        window: 1000,
        shards: 1,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 1 })
    );

    const blockedNearBoundary = result.current.check(start + 900, 1);

    expect(blockedNearBoundary?.ok).toBe(false);
    expect(blockedNearBoundary?.retryAt).toBeDefined();
    expect(blockedNearBoundary!.retryAt!).toBeLessThan(start + 1200);
  });

  test('sliding-window snapshots retain previous-window decay state', () => {
    const start = Math.floor(Date.now() / 1000) * 1000;
    const snapshot: RatelimitSnapshot = {
      value: 5,
      ts: start + 1000,
      shard: 0,
      state: {
        value: 0,
        ts: start + 1000,
        auxValue: 10,
        auxTs: start,
      },
      config: {
        kind: 'slidingWindow',
        limit: 10,
        window: 1000,
        shards: 1,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 0 })
    );

    const projected = result.current.check(start + 2000, 0);

    expect(projected?.value).toBe(10);
  });

  test('all-shard snapshots preserve independent capacity saturation', () => {
    const start = Math.floor(Date.now() / 60_000) * 60_000;
    const snapshot: RatelimitSnapshot = {
      value: 5,
      ts: start,
      shard: 0,
      state: {
        value: 5,
        ts: start,
        shards: [
          { shard: 0, state: { value: 5, ts: start } },
          { shard: 1, state: { value: 0, ts: start } },
        ],
      },
      config: {
        kind: 'fixedWindow',
        limit: 2,
        window: 60_000,
        capacity: 10,
        shards: 2,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 0 })
    );

    const projected = result.current.check(start + 60_000, 0);

    expect(projected?.value).toBe(6);
  });

  test('all-shard snapshots deny permanently oversized checks', () => {
    const start = Math.floor(Date.now() / 1000) * 1000;
    const snapshot: RatelimitSnapshot = {
      value: 5,
      ts: start,
      shard: 0,
      state: {
        value: 5,
        ts: start,
        shards: [
          { shard: 0, state: { value: 3, ts: start } },
          { shard: 1, state: { value: 2, ts: start } },
        ],
      },
      config: {
        kind: 'fixedWindow',
        limit: 5,
        window: 1000,
        capacity: 5,
        shards: 2,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 4 })
    );

    expect(result.current.status?.ok).toBe(false);
    expect(result.current.check(start, 4)?.retryAt).toBe(
      Number.POSITIVE_INFINITY
    );
  });

  test('partial snapshots deny counts that no shard can serve', () => {
    const start = Math.floor(Date.now() / 1000) * 1000;
    const snapshot: RatelimitSnapshot = {
      value: 10,
      ts: start,
      shard: 0,
      state: {
        value: 10,
        ts: start,
        shards: [{ shard: 0, state: { value: 5, ts: start } }],
      },
      config: {
        kind: 'fixedWindow',
        limit: 10,
        window: 1000,
        capacity: 10,
        shards: 2,
      },
    };
    useQuerySpy.mockReturnValue(snapshot as any);

    const { result } = renderHook(() =>
      useRatelimit('ratelimit/getRatelimit', { count: 6 })
    );

    expect(result.current.status?.ok).toBe(false);
    expect(result.current.check(start, 6)?.retryAt).toBe(
      Number.POSITIVE_INFINITY
    );
  });
});
