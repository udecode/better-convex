/**
 * Bounded-concurrency fan-out, shared by the ORM write path, relation loading
 * and the CLI's entry-point analyzer.
 *
 * Deliberately dependency-free: ORM callers reach it from a Convex function
 * entry, and Convex bundles every static import of an entry.
 */

/**
 * Runs `worker` over `items` with at most `limit` in flight. Results keep input
 * order, so callers can rely on a stable mapping back to `items`.
 *
 * Unbounded `Promise.all` is not an option for the ORM caller: a fan-out is
 * bounded only by `mutationMaxRows` (10,000), and that many simultaneous
 * in-flight syscalls is its own failure mode.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const width = Math.max(1, Math.min(limit, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: width }, () => runWorker()));

  return results;
}
