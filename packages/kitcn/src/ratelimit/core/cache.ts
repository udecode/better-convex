/**
 * Remembers exhausted shards so a request routed to one skips its read.
 *
 * Entries are per shard, never per identifier: a shard runs out while its peers
 * still hold tokens, and an identifier-wide entry would strand their budget for
 * the rest of the window.
 */
export class EphemeralBlockCache {
  constructor(private readonly cache: Map<string, number>) {}

  isBlocked(
    identifier: string,
    shard: number
  ): { blocked: boolean; reset: number } {
    const key = shardKey(identifier, shard);
    const reset = this.cache.get(key);
    if (!reset) {
      return { blocked: false, reset: 0 };
    }
    if (reset <= Date.now()) {
      this.cache.delete(key);
      return { blocked: false, reset: 0 };
    }
    return { blocked: true, reset };
  }

  blockUntil(identifier: string, shard: number, reset: number): void {
    this.cache.set(shardKey(identifier, shard), reset);
  }

  clear(identifier: string, shards: number): void {
    for (let shard = 0; shard < shards; shard++) {
      this.cache.delete(shardKey(identifier, shard));
    }
  }

  size(): number {
    return this.cache.size;
  }
}

function shardKey(identifier: string, shard: number): string {
  return `${identifier}:${shard}`;
}

export type ReadDedupeCache<T> = {
  get: (key: string) => Promise<T | null> | undefined;
  set: (key: string, value: Promise<T | null>) => void;
  delete: (key: string) => void;
  clear: () => void;
};

export function createReadDedupeCache<T>(): ReadDedupeCache<T> {
  const cache = new Map<string, Promise<T | null>>();

  return {
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
    delete: (key) => cache.delete(key),
    clear: () => cache.clear(),
  };
}
