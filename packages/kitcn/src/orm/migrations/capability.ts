import type { OrmCapability } from '../capabilities';
import { createMigrationHandlers } from './runtime';

/**
 * Registers the migration runtime with `createOrm()`.
 *
 * Required by the migration handlers exposed through `orm.api()`. Importing
 * this pulls the migration runtime into the calling Convex module, so only
 * register it where it is actually used.
 */
export const migrationCapability = (): OrmCapability => ({
  kind: 'migrations',
  value: { createMigrationHandlers },
});
