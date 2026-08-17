import { ConvexRatelimitStore } from './store/convex-store';
import type { ConvexRatelimitDbWriter } from './types';

const DEFAULT_CLEANUP_LIMIT = 100;
const MAX_CLEANUP_LIMIT = 1000;

export type CleanupRatelimitStateOptions = {
  before: number;
  limit?: number;
};

export type CleanupRatelimitStateResult = {
  deleted: number;
  hasMore: boolean;
};

/** Deletes one on-demand batch of state older than the caller-owned cutoff. */
export async function cleanupRatelimitState(
  db: ConvexRatelimitDbWriter,
  options: CleanupRatelimitStateOptions
): Promise<CleanupRatelimitStateResult> {
  if (!Number.isFinite(options.before)) {
    throw new Error('before must be a finite timestamp');
  }
  const limit = options.limit ?? DEFAULT_CLEANUP_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLEANUP_LIMIT) {
    throw new Error(`limit must be an integer from 1 to ${MAX_CLEANUP_LIMIT}`);
  }

  return new ConvexRatelimitStore(db).deleteStatesBefore(options.before, limit);
}
