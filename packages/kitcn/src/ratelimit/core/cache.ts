/**
 * Remembers exhausted shards so a request routed to one skips its read.
 *
 * Entries are per shard, requested count, and reservation mode, never per
 * identifier: a shard can reject a large or ordinary request while still
 * serving a smaller or reserved one, and its peers may still hold tokens.
 */
const MAX_BLOCK_VARIANTS_PER_IDENTIFIER = 32;

export class EphemeralBlockCache {
  constructor(private readonly cache: Map<string, number>) {}

  isBlocked(
    identifier: string,
    shard: number,
    count: number,
    reserve: boolean
  ): { blocked: boolean; reset: number } {
    const key = shardKey(identifier, shard, count, reserve);
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

  blockUntil(
    identifier: string,
    shard: number,
    count: number,
    reserve: boolean,
    reset: number
  ): void {
    if (!Number.isFinite(reset)) {
      return;
    }
    this.pruneExpired();
    const key = shardKey(identifier, shard, count, reserve);
    if (!this.cache.has(key)) {
      this.evictOldestVariant(identifier);
    }
    this.cache.set(key, reset);
  }

  clear(identifier: string): void {
    const prefix = identifierPrefix(identifier);
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clearAll(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, reset] of this.cache) {
      if (reset <= now) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldestVariant(identifier: string): void {
    const prefix = identifierPrefix(identifier);
    let variants = 0;
    let oldest: string | undefined;
    for (const key of this.cache.keys()) {
      if (!key.startsWith(prefix)) {
        continue;
      }
      oldest ??= key;
      variants += 1;
    }
    if (variants >= MAX_BLOCK_VARIANTS_PER_IDENTIFIER && oldest) {
      this.cache.delete(oldest);
    }
  }
}

function shardKey(
  identifier: string,
  shard: number,
  count: number,
  reserve: boolean
): string {
  return `${identifierPrefix(identifier)}${shard}:${count}:${reserve ? 1 : 0}`;
}

function identifierPrefix(identifier: string): string {
  return `${identifier.length}:${identifier}:`;
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
