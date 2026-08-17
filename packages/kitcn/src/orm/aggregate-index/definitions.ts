/**
 * Aggregate/rank index definition extractors.
 *
 * Leaf module with no runtime dependencies. The ORM lifecycle needs to know
 * whether a table declares aggregate or rank indexes before it can require the
 * aggregate capability, and that check must not drag the aggregate-index
 * runtime into the module graph.
 */

import type { TableRelationalConfig } from '../types';

export type CountIndexDefinition = {
  name: string;
  fields: string[];
};

export type AggregateIndexDefinition = {
  name: string;
  fields: string[];
  countFields: string[];
  sumFields: string[];
  avgFields: string[];
  minFields: string[];
  maxFields: string[];
};

export type RankOrderField = {
  field: string;
  direction: 'asc' | 'desc';
};

export type RankIndexDefinition = {
  name: string;
  partitionFields: string[];
  orderFields: RankOrderField[];
  sumField?: string;
};

export const getAggregateIndexDefinitions = (
  tableConfig: TableRelationalConfig
): AggregateIndexDefinition[] => {
  const aggregateIndexes = (tableConfig.table as any).getAggregateIndexes?.();
  if (!Array.isArray(aggregateIndexes)) {
    return [];
  }
  return aggregateIndexes.map((entry) => ({
    name: entry.name,
    fields: entry.fields ?? [],
    countFields: entry.countFields ?? [],
    sumFields: entry.sumFields ?? [],
    avgFields: entry.avgFields ?? [],
    minFields: entry.minFields ?? [],
    maxFields: entry.maxFields ?? [],
  }));
};

export const getCountIndexDefinitions = (
  tableConfig: TableRelationalConfig
): CountIndexDefinition[] =>
  getAggregateIndexDefinitions(tableConfig).map((entry) => ({
    name: entry.name,
    fields: entry.fields,
  }));

export const getRankIndexDefinitions = (
  tableConfig: TableRelationalConfig
): RankIndexDefinition[] => {
  const rankIndexes = (tableConfig.table as any).getRankIndexes?.();
  if (!Array.isArray(rankIndexes)) {
    return [];
  }
  return rankIndexes.map((entry) => ({
    name: entry.name,
    partitionFields: entry.partitionFields ?? [],
    orderFields: entry.orderFields ?? [],
    sumField: entry.sumField,
  }));
};
