import type { AuthCtx } from '../../lib/crpc';

type MemberCapacityCtx = Pick<AuthCtx, 'db' | 'orm'>;

export type OrganizationSeatUsage = {
  members: number;
  pending: number;
  total: number;
};

const isCountIndexBuilding = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith('COUNT_INDEX_BUILDING:');

const countMembers = async (
  ctx: MemberCapacityCtx,
  organizationId: string
): Promise<number> => {
  try {
    return await ctx.orm.query.member.count({ where: { organizationId } });
  } catch (error) {
    if (!isCountIndexBuilding(error)) throw error;

    return (
      await ctx.db
        .query('member')
        .withIndex('organizationId', (query) =>
          query.eq('organizationId', organizationId)
        )
        .collect()
    ).length;
  }
};

const countPendingInvitations = async (
  ctx: MemberCapacityCtx,
  organizationId: string
): Promise<number> => {
  try {
    return await ctx.orm.query.invitation.count({
      where: { organizationId, status: 'pending' },
    });
  } catch (error) {
    if (!isCountIndexBuilding(error)) throw error;

    // Deploys can serve traffic while a newly declared aggregate index backfills.
    return (
      await ctx.db
        .query('invitation')
        .withIndex('organizationId_status', (query) =>
          query.eq('organizationId', organizationId).eq('status', 'pending')
        )
        .collect()
    ).length;
  }
};

/**
 * Seats an organization has committed: current members plus the invitations it
 * is still waiting on.
 *
 * READY aggregate indexes keep the read cost independent of organization size.
 * While either index backfills, its matching native index preserves exact
 * counts without taking the invitation endpoint offline.
 */
export const countOrganizationSeats = async (
  ctx: MemberCapacityCtx,
  organizationId: string
): Promise<OrganizationSeatUsage> => {
  const [members, pending] = await Promise.all([
    countMembers(ctx, organizationId),
    countPendingInvitations(ctx, organizationId),
  ]);

  return { members, pending, total: members + pending };
};
