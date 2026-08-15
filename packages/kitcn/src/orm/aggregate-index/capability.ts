import type { OrmCapability } from '../capabilities';
import * as backfill from './backfill';
import * as rankRuntime from './rank-runtime';
import * as runtime from './runtime';

/**
 * Registers the aggregate-index runtime with `createOrm()`.
 *
 * Required by `aggregateIndex(...)` / `rankIndex(...)` schemas, by
 * `count()` / `aggregate()` / `rank()` queries, and by the backfill handlers
 * exposed through `orm.api()`. Importing this pulls the aggregate btree
 * runtime into the calling Convex module, so only register it where it is
 * actually used.
 *
 * Each entry forwards through the module namespace rather than capturing the
 * binding, so the resolved implementation is read per call. Snapshotting the
 * bindings here would freeze the capability at construction time and make the
 * runtime unobservable to anything that wraps a module export.
 */
export const aggregateCapability = (): OrmCapability => ({
  kind: 'aggregate',
  value: {
    applyAggregateIndexesForChange: (...args) =>
      runtime.applyAggregateIndexesForChange(...args),
    applyRankIndexesForChange: (...args) =>
      rankRuntime.applyRankIndexesForChange(...args),
    compileAggregateQueryPlan: (...args) =>
      runtime.compileAggregateQueryPlan(...args),
    compileCountFieldQueryPlan: (...args) =>
      runtime.compileCountFieldQueryPlan(...args),
    compileCountQueryPlan: (...args) => runtime.compileCountQueryPlan(...args),
    compileRankPlan: (...args) => rankRuntime.compileRankPlan(...args),
    createCountBackfillHandlers: (...args) =>
      backfill.createCountBackfillHandlers(...args),
    ensureAggregateIndexReady: (...args) =>
      runtime.ensureAggregateIndexReady(...args),
    ensureCountIndexReady: (...args) => runtime.ensureCountIndexReady(...args),
    ensureRankAllowedForRls: (...args) =>
      rankRuntime.ensureRankAllowedForRls(...args),
    ensureRankIndexReady: (...args) =>
      rankRuntime.ensureRankIndexReady(...args),
    isAggregatePlanZero: (...args) => runtime.isAggregatePlanZero(...args),
    isIndexCountZero: (...args) => runtime.isIndexCountZero(...args),
    readAverageFromBuckets: (...args) =>
      runtime.readAverageFromBuckets(...args),
    readCountFieldFromBuckets: (...args) =>
      runtime.readCountFieldFromBuckets(...args),
    readCountFromBuckets: (...args) => runtime.readCountFromBuckets(...args),
    readExtremaFromBuckets: (...args) =>
      runtime.readExtremaFromBuckets(...args),
    readRankAt: (...args) => rankRuntime.readRankAt(...args),
    readRankCount: (...args) => rankRuntime.readRankCount(...args),
    readRankIndexOf: (...args) => rankRuntime.readRankIndexOf(...args),
    readRankMax: (...args) => rankRuntime.readRankMax(...args),
    readRankMin: (...args) => rankRuntime.readRankMin(...args),
    readRankPaginate: (...args) => rankRuntime.readRankPaginate(...args),
    readRankRandom: (...args) => rankRuntime.readRankRandom(...args),
    readRankSum: (...args) => rankRuntime.readRankSum(...args),
    readSumFromBuckets: (...args) => runtime.readSumFromBuckets(...args),
  },
});
