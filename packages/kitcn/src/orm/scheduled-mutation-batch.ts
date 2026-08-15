import type {
  GenericDatabaseWriter,
  SchedulableFunctionReference,
  Scheduler,
} from 'convex/server';
import { createDatabase } from './database';
import type { EdgeMetadata } from './extractRelationsConfig';
import {
  applyIncomingForeignKeyActionsOnDelete,
  type CascadeMode,
  consumeMutationRowBudget,
  createMutationRowBudget,
  type DeleteMode,
  decodeUndefinedDeep,
  deserializeFilterExpression,
  ensureDefaultColumns,
  ensureNonNullValues,
  ensureNullableColumns,
  getMutationCollectionLimits,
  getOrmContext,
  hardDeleteRow,
  patchReferencingRows,
  type SerializedFilterExpression,
  softDeleteRow,
  takeRowsWithinByteBudget,
} from './mutation-utils';
import type { TablesRelationalConfig } from './relations';
import type { ConvexTableWithColumns } from './table';

export type ScheduledMutationWorkType =
  | 'root-update'
  | 'root-delete'
  | 'cascade-delete'
  | 'cascade-update';

export type ScheduledMutationBatchArgs = {
  workType?: ScheduledMutationWorkType;
  mode?: 'sync' | 'async';
  operation: 'update' | 'delete';
  table: string;
  where?: SerializedFilterExpression;
  allowFullScan?: boolean;
  update?: Record<string, unknown>;
  deleteMode?: DeleteMode;
  cascadeMode?: CascadeMode;
  foreignIndexName?: string;
  foreignSourceColumns?: string[];
  targetValues?: unknown;
  newValues?: unknown;
  foreignAction?:
    | 'cascade'
    | 'set null'
    | 'set default'
    | 'restrict'
    | 'no action';
  cursor: string | null;
  batchSize: number;
  maxBytesPerBatch?: number;
  delayMs: number;
};

/** Column stamped by `softDeleteRow`; see mutation-utils.ts. */
const DELETION_TIME_FIELD = 'deletionTime';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function scheduledMutationBatchFactory<
  TSchema extends TablesRelationalConfig,
>(
  schema: TSchema,
  edgeMetadata: EdgeMetadata[],
  scheduledMutationBatch: SchedulableFunctionReference
) {
  const tableByName = new Map<string, ConvexTableWithColumns<any>>();
  for (const tableConfig of Object.values(schema)) {
    if (tableConfig?.name && tableConfig.table) {
      tableByName.set(
        tableConfig.name,
        tableConfig.table as ConvexTableWithColumns<any>
      );
    }
  }

  return async function scheduledMutationBatchHandler(
    ctx: { db: GenericDatabaseWriter<any>; scheduler: Scheduler },
    args: ScheduledMutationBatchArgs
  ) {
    const workType: ScheduledMutationWorkType =
      args.workType ??
      (args.operation === 'update' ? 'root-update' : 'root-delete');
    const table = tableByName.get(args.table);
    if (!table) {
      throw new Error(`scheduledMutationBatch: unknown table '${args.table}'.`);
    }
    if (!Number.isInteger(args.batchSize) || args.batchSize < 1) {
      throw new Error(
        'scheduledMutationBatch: batchSize must be a positive integer.'
      );
    }
    if (!Number.isFinite(args.delayMs) || args.delayMs < 0) {
      throw new Error(
        'scheduledMutationBatch: delayMs must be a non-negative number.'
      );
    }
    if (
      args.maxBytesPerBatch !== undefined &&
      (!Number.isInteger(args.maxBytesPerBatch) || args.maxBytesPerBatch < 1)
    ) {
      throw new Error(
        'scheduledMutationBatch: maxBytesPerBatch must be a positive integer.'
      );
    }

    const db = createDatabase(ctx.db, schema, edgeMetadata, {
      scheduler: ctx.scheduler,
      scheduledMutationBatch,
    });
    const ormContext = getOrmContext(db as any);
    const foreignKeyGraph = ormContext?.foreignKeyGraph;
    const strict = ormContext?.strict ?? true;
    const { leafBatchSize, maxRows, maxBytesPerBatch, scheduleCallCap } =
      getMutationCollectionLimits(ormContext);
    const where = deserializeFilterExpression(args.where);

    if (workType === 'root-update') {
      if (!isRecord(args.update)) {
        throw new Error(
          'scheduledMutationBatch: update operation requires update values.'
        );
      }
      let builder: any = db
        .update(table)
        .set(decodeUndefinedDeep(args.update) as Record<string, unknown>);
      if (args.mode === 'async') {
        builder.executionModeOverride = 'async';
      }
      if (where) {
        builder = builder.where(where);
      }
      if (args.allowFullScan) {
        builder = builder.allowFullScan();
      }
      const page = await builder.paginate({
        cursor: args.cursor,
        limit: args.batchSize,
      });
      if (!page.isDone && page.continueCursor !== null) {
        await ctx.scheduler.runAfter(args.delayMs, scheduledMutationBatch, {
          ...args,
          workType,
          cursor: page.continueCursor,
          maxBytesPerBatch: args.maxBytesPerBatch ?? maxBytesPerBatch,
        });
      }
      return;
    }

    if (workType === 'root-delete') {
      if (args.deleteMode === 'scheduled') {
        throw new Error(
          'scheduledMutationBatch: deleteMode "scheduled" is not supported.'
        );
      }
      let builder: any = db.delete(table);
      if (args.mode === 'async') {
        builder.executionModeOverride = 'async';
      }
      if (args.deleteMode === 'soft') {
        builder = builder.soft();
      }
      if (args.cascadeMode) {
        builder = builder.cascade({ mode: args.cascadeMode });
      }
      if (where) {
        builder = builder.where(where);
      }
      if (args.allowFullScan) {
        builder = builder.allowFullScan();
      }
      const page = await builder.paginate({
        cursor: args.cursor,
        limit: args.batchSize,
      });
      if (!page.isDone && page.continueCursor !== null) {
        await ctx.scheduler.runAfter(args.delayMs, scheduledMutationBatch, {
          ...args,
          workType,
          cursor: page.continueCursor,
          maxBytesPerBatch: args.maxBytesPerBatch ?? maxBytesPerBatch,
        });
      }
      return;
    }

    const sourceColumns = args.foreignSourceColumns ?? [];
    if (sourceColumns.length === 0) {
      throw new Error(
        'scheduledMutationBatch: foreignSourceColumns are required for cascade work.'
      );
    }
    const targetValues = decodeUndefinedDeep(args.targetValues) as
      | unknown[]
      | undefined;
    if (!targetValues || !Array.isArray(targetValues)) {
      throw new Error(
        'scheduledMutationBatch: targetValues are required for cascade work.'
      );
    }
    if (!args.foreignIndexName) {
      throw new Error(
        'scheduledMutationBatch: foreignIndexName is required for cascade work.'
      );
    }
    const action = args.foreignAction ?? 'no action';
    // Soft cascade only stamps `deletionTime`, which is not part of the index
    // key (foreign key columns, _creationTime, _id), so a processed row stays
    // pinned in this range forever. Every other cascade action removes the row
    // from the range: hard delete deletes it, `set null` / `set default` /
    // cascade update rewrite the indexed columns.
    const isSoftCascade =
      workType === 'cascade-delete' &&
      action === 'cascade' &&
      (args.cascadeMode ?? 'hard') === 'soft';
    const queryWithIndex = () => {
      const indexed = (ctx.db.query(args.table) as any).withIndex(
        args.foreignIndexName,
        (q: any) => {
          let builder = q.eq(sourceColumns[0], targetValues[0]);
          for (let i = 1; i < sourceColumns.length; i += 1) {
            builder = builder.eq(sourceColumns[i], targetValues[i]);
          }
          return builder;
        }
      );
      if (!isSoftCascade) {
        return indexed;
      }
      // Keeps rows soft-deleted before this cascade started out of the work
      // set. With a forwarded cursor it no longer has to re-reject the whole
      // processed prefix on every batch.
      return indexed.filter((q: any) =>
        q.or(
          q.eq(q.field(DELETION_TIME_FIELD), undefined),
          q.eq(q.field(DELETION_TIME_FIELD), null)
        )
      );
    };
    // Soft cascade forwards the page cursor: `deletionTime` is not part of the
    // index key, so the cursor stays valid across the batch and the processed
    // prefix is never re-scanned. Re-querying from null instead makes batch k
    // physically scan every row it already processed — `.filter()` is applied
    // after the read — which is O(N^2/B) and trips Convex's documents-scanned
    // cap a few dozen batches in.
    //
    // The other actions must keep re-querying from null: their processed rows
    // leave the index range, so a forwarded cursor would skip live rows.
    const usesCursorContinuation = isSoftCascade;
    const paged = await queryWithIndex().paginate({
      cursor: usesCursorContinuation ? args.cursor : null,
      numItems: args.batchSize,
    });
    // 'SplitRequired' means `page` may be missing rows that were nonetheless
    // scanned, so `continueCursor` cannot be forwarded past them.
    const pageIncomplete = paged.pageStatus === 'SplitRequired';
    const resolvedMaxBytesPerBatch = args.maxBytesPerBatch ?? maxBytesPerBatch;
    const bounded = takeRowsWithinByteBudget(
      paged.page as Record<string, unknown>[],
      resolvedMaxBytesPerBatch
    );
    const rows = bounded.rows;
    const hitByteLimit = bounded.hitLimit;
    const scheduleState = {
      remainingCalls: scheduleCallCap,
      callCap: scheduleCallCap,
    };
    // Each scheduled batch is its own Convex transaction, so it gets its own
    // `mutationMaxRows` budget shared across every cascade hop it triggers.
    const rowBudget = createMutationRowBudget(maxRows);
    consumeMutationRowBudget(rowBudget, rows.length);

    if (workType === 'cascade-delete') {
      if (action === 'set null') {
        ensureNullableColumns(
          table,
          sourceColumns,
          `Foreign key set null on '${args.table}'`
        );
        const nullPatch: Record<string, unknown> = {};
        for (const columnName of sourceColumns) {
          nullPatch[columnName] = null;
        }
        await patchReferencingRows(ctx.db, args.table, rows, nullPatch);
      } else if (action === 'set default') {
        const defaults = ensureDefaultColumns(
          table,
          sourceColumns,
          `Foreign key set default on '${args.table}'`
        );
        await patchReferencingRows(ctx.db, args.table, rows, defaults);
      } else if (action === 'cascade') {
        if (!foreignKeyGraph) {
          throw new Error(
            'scheduledMutationBatch: foreign key graph is missing from ORM context.'
          );
        }
        for (const row of rows) {
          const visited = new Set<string>([
            `${args.table}:${(row as any)._id}`,
          ]);
          await applyIncomingForeignKeyActionsOnDelete(db as any, table, row, {
            graph: foreignKeyGraph,
            deleteMode: args.deleteMode ?? 'hard',
            cascadeMode: args.cascadeMode ?? 'hard',
            visited,
            batchSize: args.batchSize,
            leafBatchSize,
            maxRows,
            rowBudget,
            maxBytesPerBatch: resolvedMaxBytesPerBatch,
            allowFullScan: args.allowFullScan,
            strict,
            executionMode: 'async',
            scheduler: ctx.scheduler,
            scheduledMutationBatch,
            scheduleState,
            delayMs: args.delayMs,
          });
          if ((args.cascadeMode ?? 'hard') === 'soft') {
            await softDeleteRow(ctx.db, table, row);
          } else {
            await hardDeleteRow(ctx.db, args.table, row);
          }
        }
      }
    } else if (workType === 'cascade-update') {
      if (action === 'set null') {
        ensureNullableColumns(
          table,
          sourceColumns,
          `Foreign key set null on '${args.table}'`
        );
        const nullPatch: Record<string, unknown> = {};
        for (const columnName of sourceColumns) {
          nullPatch[columnName] = null;
        }
        await patchReferencingRows(ctx.db, args.table, rows, nullPatch);
      } else if (action === 'set default') {
        const defaults = ensureDefaultColumns(
          table,
          sourceColumns,
          `Foreign key set default on '${args.table}'`
        );
        await patchReferencingRows(ctx.db, args.table, rows, defaults);
      } else if (action === 'cascade') {
        const newValues = decodeUndefinedDeep(args.newValues) as
          | unknown[]
          | undefined;
        if (!newValues || !Array.isArray(newValues)) {
          throw new Error(
            'scheduledMutationBatch: newValues are required for cascade update.'
          );
        }
        const patchValues: Record<string, unknown> = {};
        for (let i = 0; i < sourceColumns.length; i += 1) {
          patchValues[sourceColumns[i]] = newValues[i];
        }
        ensureNonNullValues(
          table,
          patchValues,
          `Foreign key cascade update on '${args.table}'`
        );
        await patchReferencingRows(ctx.db, args.table, rows, patchValues);
      }
    }

    // The byte budget and a required split both leave rows of this page
    // unprocessed. `paged.isDone` already reports whether the range had more
    // rows at read time, so no second scan of the range is needed.
    const pageTruncated = hitByteLimit || pageIncomplete;

    if (usesCursorContinuation) {
      if (paged.isDone && !pageTruncated) {
        return;
      }
      await ctx.scheduler.runAfter(args.delayMs, scheduledMutationBatch, {
        ...args,
        workType,
        // Never forward past rows this batch did not process. Processed rows
        // are excluded by the `deletionTime` filter, so re-running the same
        // cursor still makes progress; a required split also halves the batch
        // so the retry cannot repeat the same overrun forever.
        batchSize: pageIncomplete
          ? Math.max(1, Math.floor(args.batchSize / 2))
          : args.batchSize,
        cursor: pageTruncated ? args.cursor : paged.continueCursor,
        maxBytesPerBatch: resolvedMaxBytesPerBatch,
      });
      return;
    }

    if (!paged.isDone || pageTruncated) {
      await ctx.scheduler.runAfter(args.delayMs, scheduledMutationBatch, {
        ...args,
        workType,
        cursor: null,
        maxBytesPerBatch: resolvedMaxBytesPerBatch,
      });
    }
  };
}
