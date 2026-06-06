import { prisma } from './prisma';

export async function getMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: { group: true },
  });
}

export async function requireMembership(groupId: string, userId: string) {
  const membership = await getMembership(groupId, userId);
  if (!membership) {
    throw new Error('FORBIDDEN');
  }
  return membership;
}

export async function requireAdmin(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  if (membership.role !== 'ADMIN') {
    throw new Error('ADMIN_REQUIRED');
  }
  return membership;
}
