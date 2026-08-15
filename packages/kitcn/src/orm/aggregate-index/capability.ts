import type { OrmCapability } from '../capabilities';
import { createCountBackfillHandlers } from './backfill';
import {
  applyRankIndexesForChange,
  compileRankPlan,
  ensureRankAllowedForRls,
  ensureRankIndexReady,
  readRankAt,
  readRankCount,
  readRankIndexOf,
  readRankMax,
  readRankMin,
  readRankPaginate,
  readRankRandom,
  readRankSum,
} from './rank-runtime';
import {
  applyAggregateIndexesForChange,
  compileAggregateQueryPlan,
  compileCountFieldQueryPlan,
  compileCountQueryPlan,
  ensureAggregateIndexReady,
  ensureCountIndexReady,
  isAggregatePlanZero,
  isIndexCountZero,
  readAverageFromBuckets,
  readCountFieldFromBuckets,
  readCountFromBuckets,
  readExtremaFromBuckets,
  readSumFromBuckets,
} from './runtime';

/**
 * Registers the aggregate-index runtime with `createOrm()`.
 *
 * Required by `aggregateIndex(...)` / `rankIndex(...)` schemas, by
 * `count()` / `aggregate()` / `rank()` queries, and by the backfill handlers
 * exposed through `orm.api()`. Importing this pulls the aggregate btree
 * runtime into the calling Convex module, so only register it where it is
 * actually used.
 */
export const aggregateCapability = (): OrmCapability => ({
  kind: 'aggregate',
  value: {
    applyAggregateIndexesForChange,
    applyRankIndexesForChange,
    compileAggregateQueryPlan,
    compileCountFieldQueryPlan,
    compileCountQueryPlan,
    compileRankPlan,
    createCountBackfillHandlers,
    ensureAggregateIndexReady,
    ensureCountIndexReady,
    ensureRankAllowedForRls,
    ensureRankIndexReady,
    isAggregatePlanZero,
    isIndexCountZero,
    readAverageFromBuckets,
    readCountFieldFromBuckets,
    readCountFromBuckets,
    readExtremaFromBuckets,
    readRankAt,
    readRankCount,
    readRankIndexOf,
    readRankMax,
    readRankMin,
    readRankPaginate,
    readRankRandom,
    readRankSum,
    readSumFromBuckets,
  },
});
