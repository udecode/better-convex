/**
 * Bounded worker pool over independent async work.
 *
 * Results are gathered by index, so the returned order never depends on
 * completion order. Convex read-set membership is order-independent, so issuing
 * independent reads concurrently produces an identical read set — but the pool
 * is bounded rather than a raw `Promise.all` so large fan-outs do not
 * materialize thousands of in-flight result buffers at once.
 */
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  const workerCount = Math.max(1, Math.min(Math.floor(limit), items.length));
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

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
};
