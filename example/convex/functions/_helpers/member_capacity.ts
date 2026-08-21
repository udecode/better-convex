import type { AuthCtx } from '../../lib/crpc';

type MemberCapacityCtx = Pick<AuthCtx, 'orm'>;

export type OrganizationSeatUsage = {
  members: number;
  pending: number;
  total: number;
};

/**
 * Seats an organization has committed: current members plus the invitations it
 * is still waiting on.
 *
 * Both legs are `aggregateIndex`-backed counts, so the read cost is a handful
 * of bucket reads that do not track organization size. Collecting the rows to
 * read `.length` instead would pull every member and every pending invitation
 * into the transaction's read set — and into the subscription's — to produce
 * two integers.
 */
export const countOrganizationSeats = async (
  ctx: MemberCapacityCtx,
  organizationId: string
): Promise<OrganizationSeatUsage> => {
  const [members, pending] = await Promise.all([
    ctx.orm.query.member.count({ where: { organizationId } }),
    ctx.orm.query.invitation.count({
      where: { organizationId, status: 'pending' },
    }),
  ]);

  return { members, pending, total: members + pending };
};
