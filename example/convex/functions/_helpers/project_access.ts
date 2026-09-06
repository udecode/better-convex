import { and, eq, type OrmWriter } from 'kitcn/orm';
import type { AuthCtx } from '../../lib/crpc';
import type { Insert, Select } from '../../shared/api';
import type schema from '../schema';
import { projectAccessTable } from '../schema';

type ProjectAccessCtx = Pick<AuthCtx, 'orm'>;
/**
 * Any context that can write through the ORM.
 *
 * Exported because the backfill migration has to bridge to it: the migration
 * runner types its `ctx.orm` off the resolved relations config rather than the
 * schema chain, so the two describe the same runtime object under different
 * type arguments.
 */
export type ProjectAccessWriteCtx = { orm: OrmWriter<typeof schema> };
type ProjectRow = Select<'projects'>;

/**
 * Canonical owner of "which projects can this user see".
 *
 * Ownership lives on `projects.ownerId`, membership on `projectMembers`, and no
 * index spans both. Answering the union by scanning `projects` and
 * post-filtering in JS costs O(table) reads per page and puts every scanned row
 * into the subscription's read set. Instead, every grant and revoke writes a
 * `projectAccess` row here, and every read walks the
 * `userId_archived_projectCreatedAt` index.
 *
 * Writes go through this module rather than through schema triggers on
 * `projects`/`projectMembers`: async cascade continuation batches build their
 * ORM from the raw `ctx.db` and drop triggers past the first batch, so a
 * trigger-maintained copy would silently drift. Deletion is the one case that
 * needs neither -- `projectAccess` cascades from both `projects` and `user`, and
 * foreign-key cascades do still run in those batches.
 */

/**
 * The project's creation time as the number `projectAccess` sorts on.
 *
 * `Select<'projects'>.createdAt` is a `Date` hydrated from `_creationTime`, and
 * `_creationTime` carries a sub-millisecond fraction that a `Date` cannot hold,
 * so this key is millisecond-resolution. Two projects created in the same
 * millisecond share a key and fall back to the access row's own creation order.
 * That is one stable total order across pages; it only decides which of two
 * same-millisecond projects sorts first.
 */
const sortKeyFor = (project: Pick<ProjectRow, 'createdAt'>): number =>
  project.createdAt.getTime();

/**
 * Grant `userId` access to `project`, or refresh the row if it already exists.
 *
 * `isOwner` is derived from `project.ownerId` rather than passed in, so a caller
 * cannot mislabel a row -- granting membership to the owner keeps them the owner
 * instead of silently demoting them. Callers that grant during an ownership
 * change must therefore pass the project as it will be after the change.
 */
export const grantProjectAccess = async (
  ctx: ProjectAccessWriteCtx,
  input: {
    project: Pick<ProjectRow, 'id' | 'createdAt' | 'archived' | 'ownerId'>;
    userId: string;
  }
): Promise<void> => {
  const values: Insert<'projectAccess'> = {
    userId: input.userId,
    projectId: input.project.id,
    projectCreatedAt: sortKeyFor(input.project),
    archived: input.project.archived,
    isOwner: input.project.ownerId === input.userId,
  };

  const existing = await ctx.orm.query.projectAccess.findFirst({
    where: { userId: input.userId, projectId: input.project.id },
    columns: { id: true },
  });

  if (existing) {
    await ctx.orm
      .update(projectAccessTable)
      .set(values)
      .where(eq(projectAccessTable.id, existing.id));
    return;
  }

  await ctx.orm.insert(projectAccessTable).values(values);
};

/**
 * Drop `userId`'s access row for `projectId` unless they are still entitled.
 *
 * Re-derives entitlement from `projects.ownerId` and `projectMembers` instead of
 * deleting unconditionally, so it stays correct whatever order a caller runs its
 * steps in, and so a user who is both owner and member does not lose the project
 * when only one of those two is taken away. A no-op when there is no row.
 */
export const revokeProjectAccess = async (
  ctx: ProjectAccessWriteCtx,
  input: { projectId: string; userId: string }
): Promise<void> => {
  const project = await ctx.orm.query.projects.findFirst({
    where: { id: input.projectId },
  });

  if (project) {
    if (project.ownerId === input.userId) {
      await grantProjectAccess(ctx, { project, userId: input.userId });
      return;
    }

    const membership = await ctx.orm.query.projectMembers.findFirst({
      where: { projectId: input.projectId, userId: input.userId },
      columns: { id: true },
    });
    if (membership) {
      await grantProjectAccess(ctx, { project, userId: input.userId });
      return;
    }
  }

  await ctx.orm
    .delete(projectAccessTable)
    .where(
      and(
        eq(projectAccessTable.projectId, input.projectId),
        eq(projectAccessTable.userId, input.userId)
      )!
    );
};

/**
 * Mirror `projects.archived` onto every access row for the project.
 *
 * Bounded by the project's member count, which `addMember` already gates.
 */
export const syncProjectArchived = async (
  ctx: ProjectAccessWriteCtx,
  input: { projectId: string; archived: boolean }
): Promise<void> => {
  await ctx.orm
    .update(projectAccessTable)
    .set({ archived: input.archived })
    .where(eq(projectAccessTable.projectId, input.projectId));
};

/**
 * Does this user have at least one non-archived project?
 *
 * The app-shell nav asks this on every route, so it must stay a single indexed
 * read that cannot grow with the table.
 */
export const hasAnyProject = async (
  ctx: ProjectAccessCtx,
  userId: string
): Promise<boolean> => {
  const access = await ctx.orm.query.projectAccess.findFirst({
    where: { userId, archived: false },
    columns: { id: true },
  });

  return access !== null;
};

/** Every project the user can see, newest first, one index walk. */
export const listAccessibleProjects = async (
  ctx: ProjectAccessCtx,
  input: {
    userId: string;
    archived: boolean;
    cursor: string | null;
    limit: number;
  }
) => {
  const access = await ctx.orm.query.projectAccess.findMany({
    where: { userId: input.userId, archived: input.archived },
    orderBy: { projectCreatedAt: 'desc' },
    cursor: input.cursor,
    limit: input.limit,
    with: { project: true },
  });

  const page = access.page
    .map((row) => row.project)
    .filter((project): project is ProjectRow => project !== null);

  return {
    continueCursor: access.continueCursor,
    isDone: access.isDone,
    page,
  };
};

/** Non-archived projects the user can see, for the todo-form dropdown. */
export const listProjectsForDropdown = async (
  ctx: ProjectAccessCtx,
  input: { userId: string; limit: number }
): Promise<{ id: string; isOwner: boolean; name: string }[]> => {
  const access = await ctx.orm.query.projectAccess.findMany({
    where: { userId: input.userId, archived: false },
    orderBy: { projectCreatedAt: 'desc' },
    limit: input.limit,
    columns: { isOwner: true },
    with: { project: { columns: { id: true, name: true } } },
  });

  return access
    .map((row) =>
      row.project
        ? { id: row.project.id, isOwner: row.isOwner, name: row.project.name }
        : null
    )
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
};

/** Drop every access row for a project, without re-deriving. */
export const clearProjectAccess = async (
  ctx: ProjectAccessWriteCtx,
  input: { projectId: string }
): Promise<void> => {
  await ctx.orm
    .delete(projectAccessTable)
    .where(eq(projectAccessTable.projectId, input.projectId));
};

/**
 * Rebuild one project's access rows from `projects.ownerId` and its members.
 *
 * The single owner of "what should this project's access rows look like".
 * Both the backfill migration and `backfillProjectAccess` go through it, so a
 * deployment repaired by the migration and one rebuilt in a test cannot drift
 * apart. Bounded by the project's member count.
 */
export const syncProjectAccessForProject = async (
  ctx: ProjectAccessWriteCtx,
  project: Pick<ProjectRow, 'id' | 'createdAt' | 'archived' | 'ownerId'>,
  options?: { limit?: number }
): Promise<number> => {
  await grantProjectAccess(ctx, { project, userId: project.ownerId });
  let written = 1;

  const members = await ctx.orm.query.projectMembers.findMany({
    where: { projectId: project.id },
    limit: options?.limit ?? 1000,
    columns: { userId: true },
  });

  for (const member of members) {
    if (member.userId === project.ownerId) {
      continue;
    }
    await grantProjectAccess(ctx, { project, userId: member.userId });
    written += 1;
  }

  return written;
};

/**
 * Rebuild every access row in the deployment.
 *
 * Deliberately a full scan of `projects`: it exists so a test can assert the
 * derived rows match their sources. The deploy path is the backfill migration,
 * which walks the same table in bounded batches and calls the same per-project
 * sync. Never call this from a request path.
 */
export const backfillProjectAccess = async (
  ctx: ProjectAccessWriteCtx,
  options?: { limit?: number }
): Promise<number> => {
  const limit = options?.limit ?? 1000;
  const projects = await ctx.orm.query.projects.findMany({ limit });

  let written = 0;
  for (const project of projects) {
    written += await syncProjectAccessForProject(ctx, project, { limit });
  }

  return written;
};
