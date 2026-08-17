/**
 * Aggregate/count error codes, factories and RLS guards.
 *
 * Leaf module with no runtime dependencies. The query engine throws these
 * codes on `count()` / `aggregate()` misuse, so they must be reachable without
 * pulling the aggregate-index runtime into every Convex function bundle. In
 * particular an unfiltered `count()` served by the native Convex syscall must
 * work without the aggregate capability.
 */

import type { TableRelationalConfig } from '../types';

export const COUNT_ERROR = {
  FILTER_UNSUPPORTED: 'COUNT_FILTER_UNSUPPORTED',
  NOT_INDEXED: 'COUNT_NOT_INDEXED',
  INDEX_BUILDING: 'COUNT_INDEX_BUILDING',
  RLS_UNSUPPORTED: 'COUNT_RLS_UNSUPPORTED',
} as const;

export const AGGREGATE_ERROR = {
  ARGS_UNSUPPORTED: 'AGGREGATE_ARGS_UNSUPPORTED',
  FILTER_UNSUPPORTED: 'AGGREGATE_FILTER_UNSUPPORTED',
  NOT_INDEXED: 'AGGREGATE_NOT_INDEXED',
  INDEX_BUILDING: 'AGGREGATE_INDEX_BUILDING',
  RLS_UNSUPPORTED: 'AGGREGATE_RLS_UNSUPPORTED',
} as const;

export type CountErrorCode = (typeof COUNT_ERROR)[keyof typeof COUNT_ERROR];
export type AggregateErrorCode =
  (typeof AGGREGATE_ERROR)[keyof typeof AGGREGATE_ERROR];

export const createError = (code: string, message: string): Error =>
  new Error(`${code}: ${message}`);

export const createCountError = (
  code: CountErrorCode,
  message: string
): Error => createError(code, message);

export const createAggregateError = (
  code: AggregateErrorCode,
  message: string
): Error => createError(code, message);

const assertAggregateAllowedForRls = (
  tableConfig: TableRelationalConfig,
  rlsMode: 'skip' | 'default' | undefined,
  code: string,
  methodName: string
): void => {
  const enabled =
    typeof (tableConfig.table as any).isRlsEnabled === 'function'
      ? (tableConfig.table as any).isRlsEnabled()
      : false;

  if (enabled && rlsMode !== 'skip') {
    throw createError(
      code,
      `${methodName} is not available for table '${tableConfig.name}' in RLS-restricted contexts in v1.`
    );
  }
};

export const ensureCountAllowedForRls = (
  tableConfig: TableRelationalConfig,
  rlsMode: 'skip' | 'default' | undefined
): void => {
  assertAggregateAllowedForRls(
    tableConfig,
    rlsMode,
    COUNT_ERROR.RLS_UNSUPPORTED,
    'count()'
  );
};

export const ensureAggregateAllowedForRls = (
  tableConfig: TableRelationalConfig,
  rlsMode: 'skip' | 'default' | undefined,
  methodName: string
): void => {
  assertAggregateAllowedForRls(
    tableConfig,
    rlsMode,
    AGGREGATE_ERROR.RLS_UNSUPPORTED,
    methodName
  );
};
