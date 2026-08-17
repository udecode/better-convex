/**
 * kitcn/orm/aggregate-index — aggregate-index runtime entry.
 *
 * `kitcn/orm` deliberately does not reach this module. Import it only from the
 * Convex modules that declare `aggregateIndex(...)` / `rankIndex(...)`, run
 * `count()` / `aggregate()` / `rank()` queries, or expose `orm.api()`.
 */

export type {
  CountBackfillChunkArgs,
  CountBackfillKickoffArgs,
  CountBackfillMode,
  CountBackfillStatusArgs,
} from './backfill';
export { aggregateCapability } from './capability';
export type {
  AggregateIndexDefinition,
  CountIndexDefinition,
  RankIndexDefinition,
  RankOrderField,
} from './definitions';
export type { AggregateQueryPlan, CountQueryPlan } from './runtime';
