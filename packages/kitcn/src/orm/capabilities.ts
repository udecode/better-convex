/**
 * ORM capabilities.
 *
 * The aggregate-index and migration runtimes are optional subsystems. Convex
 * bundles everything a function entry statically imports and forbids dynamic
 * `import()`, so the query engine must not name those runtimes at value level
 * or every Convex function pays for them.
 *
 * Capabilities invert that dependency: the runtimes are described here with
 * type-only module queries (fully erased at compile time) and supplied by the
 * app at `createOrm()`:
 *
 * ```ts
 * import { createOrm } from 'kitcn/orm';
 * import { aggregateCapability } from 'kitcn/orm/aggregate-index';
 * import { migrationCapability } from 'kitcn/orm/migrations';
 *
 * export const orm = createOrm({
 *   schema,
 *   capabilities: [aggregateCapability(), migrationCapability()],
 * });
 * ```
 */

type AggregateRuntimeModule = typeof import('./aggregate-index/runtime');
type RankRuntimeModule = typeof import('./aggregate-index/rank-runtime');
type BackfillModule = typeof import('./aggregate-index/backfill');
type MigrationRuntimeModule = typeof import('./migrations/runtime');

/**
 * Everything the query engine, the write-path lifecycle and `orm.api()` need
 * from the aggregate-index runtime: `count()`, `aggregate()`, `rank()`,
 * index maintenance on writes, and the backfill handlers.
 */
export type OrmAggregateCapability = {
  // Metric plans and reads.
  compileAggregateQueryPlan: AggregateRuntimeModule['compileAggregateQueryPlan'];
  compileCountFieldQueryPlan: AggregateRuntimeModule['compileCountFieldQueryPlan'];
  compileCountQueryPlan: AggregateRuntimeModule['compileCountQueryPlan'];
  ensureAggregateIndexReady: AggregateRuntimeModule['ensureAggregateIndexReady'];
  ensureCountIndexReady: AggregateRuntimeModule['ensureCountIndexReady'];
  isAggregatePlanZero: AggregateRuntimeModule['isAggregatePlanZero'];
  isIndexCountZero: AggregateRuntimeModule['isIndexCountZero'];
  readAverageFromBuckets: AggregateRuntimeModule['readAverageFromBuckets'];
  readCountFieldFromBuckets: AggregateRuntimeModule['readCountFieldFromBuckets'];
  readCountFromBuckets: AggregateRuntimeModule['readCountFromBuckets'];
  readExtremaFromBuckets: AggregateRuntimeModule['readExtremaFromBuckets'];
  readSumFromBuckets: AggregateRuntimeModule['readSumFromBuckets'];
  // Rank plans and reads.
  compileRankPlan: RankRuntimeModule['compileRankPlan'];
  ensureRankAllowedForRls: RankRuntimeModule['ensureRankAllowedForRls'];
  ensureRankIndexReady: RankRuntimeModule['ensureRankIndexReady'];
  readRankAt: RankRuntimeModule['readRankAt'];
  readRankCount: RankRuntimeModule['readRankCount'];
  readRankIndexOf: RankRuntimeModule['readRankIndexOf'];
  readRankMax: RankRuntimeModule['readRankMax'];
  readRankMin: RankRuntimeModule['readRankMin'];
  readRankPaginate: RankRuntimeModule['readRankPaginate'];
  readRankRandom: RankRuntimeModule['readRankRandom'];
  readRankSum: RankRuntimeModule['readRankSum'];
  // Write-path index maintenance.
  applyAggregateIndexesForChange: AggregateRuntimeModule['applyAggregateIndexesForChange'];
  applyRankIndexesForChange: RankRuntimeModule['applyRankIndexesForChange'];
  assertAggregateIndexesWritable: AggregateRuntimeModule['assertAggregateIndexesWritable'];
  // `orm.api()` backfill handlers.
  createCountBackfillHandlers: BackfillModule['createCountBackfillHandlers'];
};

/** Everything `orm.api()` needs from the migration runtime. */
export type OrmMigrationCapability = {
  createMigrationHandlers: MigrationRuntimeModule['createMigrationHandlers'];
};

export type OrmCapability =
  | { kind: 'aggregate'; value: OrmAggregateCapability }
  | { kind: 'migrations'; value: OrmMigrationCapability };

export type OrmCapabilities = {
  aggregate?: OrmAggregateCapability;
  migrations?: OrmMigrationCapability;
};

export const resolveOrmCapabilities = (
  capabilities?: readonly OrmCapability[]
): OrmCapabilities => {
  const resolved: OrmCapabilities = {};
  for (const capability of capabilities ?? []) {
    if (capability.kind === 'aggregate') {
      resolved.aggregate = capability.value;
      continue;
    }
    resolved.migrations = capability.value;
  }
  return resolved;
};

// This error is reachable from a stale `<functionsDir>/generated/server.ts`,
// so the hint must not simply say "rerun kitcn codegen" — that is the command
// the reader most likely just ran.
const AGGREGATE_SETUP_HINT =
  "Generated ORM: `kitcn codegen` registers the capability in <functionsDir>/generated/server.ts from the aggregateIndex(...)/rankIndex(...) declarations in your schema — if you are seeing this from that generated file, delete it and run `kitcn codegen` again. Hand-written ORM: import { aggregateCapability } from 'kitcn/orm/aggregate-index' and pass createOrm({ schema, capabilities: [aggregateCapability()] }).";

export const missingAggregateCapabilityError = (usage: string): Error =>
  new Error(
    `${usage} requires the aggregate capability. ${AGGREGATE_SETUP_HINT}`
  );

export const requireAggregateCapability = (
  capabilities: OrmCapabilities | undefined,
  usage: string
): OrmAggregateCapability => {
  const aggregate = capabilities?.aggregate;
  if (!aggregate) {
    throw missingAggregateCapabilityError(usage);
  }
  return aggregate;
};

export const requireMigrationCapability = (
  capabilities: OrmCapabilities | undefined,
  usage: string
): OrmMigrationCapability => {
  const migrations = capabilities?.migrations;
  if (!migrations) {
    throw new Error(
      `${usage} requires the migration capability. Generated ORM: \`kitcn codegen\` registers the capability in <functionsDir>/generated/server.ts once <functionsDir>/migrations/manifest.ts exists — if you are seeing this from that generated file, delete it and run \`kitcn codegen\` again. Hand-written ORM: import { migrationCapability } from 'kitcn/orm/migrations' and pass createOrm({ schema, capabilities: [migrationCapability()] }).`
    );
  }
  return migrations;
};
