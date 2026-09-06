import {
  clearProjectAccess,
  type ProjectAccessWriteCtx,
  syncProjectAccessForProject,
} from '../_helpers/project_access';
import { defineMigration } from '../generated/migrations.gen';

/**
 * The migration runner types `ctx.orm` off the resolved relations config, while
 * the helpers type theirs off the schema chain. Same runtime object, different
 * type argument, so bridge it once here instead of widening the helpers.
 */
const writeCtx = (ctx: { orm: unknown }): ProjectAccessWriteCtx =>
  ctx as ProjectAccessWriteCtx;

/**
 * Populate `projectAccess` for data that predates it.
 *
 * `projects.list`, `listForDropdown` and `hasAny` all read the derived table, so
 * on a deployment that already holds projects it starts empty and every one of
 * them returns nothing until this runs.
 *
 * Walks `projects` in batches and re-derives each project's rows from
 * `ownerId` plus its memberships. `grantProjectAccess` updates an existing row
 * rather than inserting a second one, so re-running is safe.
 */
export const migration = defineMigration({
  id: '20260906_022807_backfill_project_access',
  description: 'backfill project access',
  up: {
    table: 'projects',
    migrateOne: async (ctx, doc) => {
      // The runner pages `ctx.db.query(table)`, so `doc` is the raw Convex
      // document: it carries `_id`, not the public `id`, and `_creationTime`,
      // not a hydrated `createdAt`. Read the row back through the ORM rather
      // than handing this shape to a helper that expects the public one.
      const projectId = (doc as { _id?: string })._id;
      if (!projectId) {
        return;
      }

      const project = await ctx.orm.query.projects.findFirst({
        where: { id: projectId },
      });
      if (!project) {
        return;
      }

      await syncProjectAccessForProject(writeCtx(ctx), project);
    },
  },
  down: {
    table: 'projects',
    migrateOne: async (ctx, doc) => {
      const projectId = (doc as { _id?: string })._id;
      if (!projectId) {
        return;
      }

      await clearProjectAccess(writeCtx(ctx), { projectId });
    },
  },
});
