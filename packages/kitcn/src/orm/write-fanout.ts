/**
 * Shared primitives for fanning out independent writes.
 *
 * Deliberately dependency-free: `mutation-utils`, `lifecycle` and `query` all
 * import it, and Convex bundles every static import of a function entry.
 */

const ORMLIFECYCLE_HOOKED_TABLES = Symbol.for('kitcn:OrmLifecycleHookedTables');

/** Matches the ORM's relation-loading default. */
export const DEFAULT_WRITE_FANOUT_CONCURRENCY = 25;

/**
 * Runs `worker` over `items` with at most `limit` in flight. Results keep input
 * order. Unbounded `Promise.all` is not an option here: a fan-out is bounded
 * only by `mutationMaxRows` (10,000), and that many simultaneous in-flight
 * syscalls is its own failure mode.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
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

/** Anything answering `has(tableName)`: a `Set` or the hook `Map` itself. */
export type LifecycleHookedTables = {
  has(tableName: string): boolean;
};

/**
 * Records which tables the lifecycle writer intercepts, so write fan-out can
 * see it without importing `lifecycle` (which would close an import cycle
 * through `aggregate-index/runtime`).
 */
export const markLifecycleHookedTables = <TDb extends object>(
  db: TDb,
  tableNames: LifecycleHookedTables
): TDb => {
  Object.defineProperty(db, ORMLIFECYCLE_HOOKED_TABLES, {
    configurable: false,
    enumerable: false,
    value: tableNames,
    writable: false,
  });
  return db;
};

/**
 * True when writes to `tableName` run through trigger / aggregate-index hooks.
 * Those writes are serialized by the lifecycle write lock and their hooks fire
 * in write order, so they must keep their sequential loop; everything else is
 * free to fan out.
 */
export const hasLifecycleHooks = (db: unknown, tableName: string): boolean => {
  const tables = (db as Record<PropertyKey, unknown> | null | undefined)?.[
    ORMLIFECYCLE_HOOKED_TABLES
  ] as LifecycleHookedTables | undefined;
  return tables?.has(tableName) ?? false;
};
