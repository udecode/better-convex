import type { GenericDatabaseWriter } from 'convex/server';
import { type getOrmContext, getTableName } from './mutation-utils';
import { GelRelationalQuery } from './query';
import type { ConvexTable } from './table';

export type ReturningCountLoader = {
  load(
    row: Record<string, unknown>,
    countSelection: Record<string, unknown>
  ): Promise<Record<string, number>>;
};

/**
 * Builds the `returning({ _count })` reader once per mutation statement.
 *
 * The table config lookup and edge filter are invariant across rows, and — more
 * importantly — the aggregate-index readiness memo lives on the query instance.
 * Constructing a fresh `GelRelationalQuery` per row discarded it, so the
 * readiness probe ran a real indexed collect for every row x counted relation
 * instead of once per (table, index).
 */
export function createReturningCountLoader(
  db: GenericDatabaseWriter<any>,
  table: ConvexTable<any>,
  ormContext: ReturnType<typeof getOrmContext>
): ReturningCountLoader {
  const schema = ormContext?.schema;
  const edgeMetadata = ormContext?.edgeMetadata;
  if (!schema || !edgeMetadata) {
    throw new Error(
      'returning({ _count }) requires orm.db(ctx) configured from createOrm({ schema, ... }).'
    );
  }

  const tableName = getTableName(table);
  const tableConfig = Object.values(schema).find(
    (config) => config.name === tableName
  );
  if (!tableConfig) {
    throw new Error(`Table config for '${tableName}' is not registered.`);
  }
  const tableEdges = edgeMetadata.filter(
    (edge) => edge.sourceTable === tableName
  );
  const countIndexReadiness = new Map<string, Promise<void>>();

  return {
    async load(row, countSelection) {
      const counted = await new GelRelationalQuery(
        schema as any,
        tableConfig as any,
        tableEdges as any,
        db as any,
        {
          where: {
            id: row._id,
          },
          columns: {},
          with: {
            _count: countSelection,
          },
        } as any,
        'first',
        edgeMetadata as any,
        ormContext?.rls,
        ormContext?.relationLoading,
        undefined,
        undefined,
        countIndexReadiness
      ).execute();

      return ((counted as any)?._count ?? {}) as Record<string, number>;
    },
  };
}
