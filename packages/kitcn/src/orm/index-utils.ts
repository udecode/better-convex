import type { ConvexTable } from './table';
import { INTERNAL_CREATION_TIME_FIELD } from './timestamp-mode';

export type TableIndex = { name: string; fields: string[] };
export type TableAggregateIndex = {
  name: string;
  fields: string[];
  countFields: string[];
  sumFields: string[];
  avgFields: string[];
  minFields: string[];
  maxFields: string[];
};
export type TableRankIndex = {
  name: string;
  partitionFields: string[];
  orderFields: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  sumField?: string;
};
export type TableSearchIndex = {
  name: string;
  searchField: string;
  filterFields: string[];
};
export type TableVectorIndex = {
  name: string;
  vectorField: string;
  dimensions: number;
  filterFields: string[];
};

export function getIndexes(
  table: ConvexTable<any>
): { name: string; fields: string[] }[] {
  const indexes = (table as any).getIndexes?.();
  return Array.isArray(indexes) ? indexes : [];
}

export function getAggregateIndexes(
  table: ConvexTable<any>
): TableAggregateIndex[] {
  const indexes = (table as any).getAggregateIndexes?.();
  return Array.isArray(indexes) ? indexes : [];
}

export function getRankIndexes(table: ConvexTable<any>): TableRankIndex[] {
  const indexes = (table as any).getRankIndexes?.();
  return Array.isArray(indexes) ? indexes : [];
}

export function getSearchIndexes(table: ConvexTable<any>): TableSearchIndex[] {
  const indexes = (table as any).getSearchIndexes?.();
  return Array.isArray(indexes) ? indexes : [];
}

export function findSearchIndexByName(
  table: ConvexTable<any>,
  indexName: string
): TableSearchIndex | null {
  return (
    getSearchIndexes(table).find((index) => index.name === indexName) ?? null
  );
}

export function getVectorIndexes(table: ConvexTable<any>): TableVectorIndex[] {
  const indexes = (table as any).getVectorIndexes?.();
  return Array.isArray(indexes) ? indexes : [];
}

export function findVectorIndexByName(
  table: ConvexTable<any>,
  indexName: string
): TableVectorIndex | null {
  return (
    getVectorIndexes(table).find((index) => index.name === indexName) ?? null
  );
}

export function findIndexForColumns(
  indexes: TableIndex[],
  columns: string[]
): string | null {
  for (const index of indexes) {
    if (hasColumnPrefix(index, columns)) {
      return index.name;
    }
  }
  return null;
}

const hasColumnPrefix = (index: TableIndex, columns: readonly string[]) => {
  if (index.fields.length < columns.length) {
    return false;
  }
  for (let i = 0; i < columns.length; i += 1) {
    if (index.fields[i] !== columns[i]) {
      return false;
    }
  }
  return true;
};

export type OrderSpec = { field: string; direction: 'asc' | 'desc' };

/**
 * Answers "does scanning this index already produce the requested order?".
 *
 * Convex walks an index in full key order, so once a leading run of fields is
 * pinned to a single value by `eq`, the remainder of the scan is already sorted
 * by the next index field — and by `_creationTime` once every declared field is
 * pinned, because Convex appends it as the implicit trailing key. When that
 * field is the one the caller asked to sort by, `.order(dir).take(n)` returns
 * the exact page and nothing has to be collected and sorted afterwards.
 *
 * This is the single owner of that decision. The top-level query planner and
 * the relation loader both call it, so a bound one of them can push into the
 * index can never be one the other silently drops.
 *
 * Returns the direction to hand to `.order()`, or null when the sort must run
 * after the fetch.
 */
export function resolveIndexOrderPushdown(params: {
  /** Declared fields of the index being scanned, in key order. */
  indexFields: readonly string[] | null | undefined;
  /** How many leading index fields are pinned to one value by `eq`. */
  pinnedEqCount: number;
  /**
   * Requested sort. `.order()` reverses the whole key tuple rather than one
   * column, so only a single spec is ever servable.
   */
  orderSpecs: readonly OrderSpec[];
}): 'asc' | 'desc' | null {
  const { indexFields, pinnedEqCount, orderSpecs } = params;
  // No index means a `.filter()` scan whose order is the table's, not the
  // partition's, so nothing can be pushed down.
  if (!indexFields || orderSpecs.length !== 1) {
    return null;
  }
  const primary = orderSpecs[0];
  const eqCount = Math.min(Math.max(pinnedEqCount, 0), indexFields.length);

  // An eq-pinned field holds one value for the whole scan, so the rows are
  // trivially in order by it whichever direction was asked for.
  for (let i = 0; i < eqCount; i += 1) {
    if (indexFields[i] === primary.field) {
      return primary.direction;
    }
  }

  // Every declared field pinned means the only key left to walk is the implicit
  // `_creationTime` suffix Convex appends.
  const nativeField =
    eqCount >= indexFields.length
      ? INTERNAL_CREATION_TIME_FIELD
      : indexFields[eqCount];
  return primary.field === nativeField ? primary.direction : null;
}

export function findRelationIndexOrThrow(
  table: ConvexTable<any>,
  columns: string[],
  relationName: string,
  targetTableName: string,
  allowFullScan = false
): string {
  const index = findRelationIndex(
    table,
    columns,
    relationName,
    targetTableName,
    true,
    allowFullScan
  );
  if (!index) {
    throw new Error(
      `Relation ${relationName} requires index on '${targetTableName}(${columns.join(
        ', '
      )})'. Set allowFullScan: true to override.`
    );
  }
  return index;
}

export function findRelationIndex(
  table: ConvexTable<any>,
  columns: string[],
  relationName: string,
  targetTableName: string,
  strict = true,
  allowFullScan = false,
  orderSpecs: readonly OrderSpec[] = []
): string | null {
  const indexes = getIndexes(table);
  const fallbackIndex = findIndexForColumns(indexes, columns);
  const orderedIndex =
    orderSpecs.length === 0
      ? undefined
      : indexes.find(
          (candidate) =>
            hasColumnPrefix(candidate, columns) &&
            resolveIndexOrderPushdown({
              indexFields: candidate.fields,
              pinnedEqCount: columns.length,
              orderSpecs,
            }) !== null
        );
  const index = orderedIndex?.name ?? fallbackIndex;
  if (!index && !allowFullScan) {
    throw new Error(
      `Relation ${relationName} requires index on '${targetTableName}(${columns.join(
        ', '
      )})'. Set allowFullScan: true to override.`
    );
  }
  if (!index && strict) {
    console.warn(
      `Relation ${relationName} running without index (allowFullScan: true).`
    );
  }
  return index;
}
