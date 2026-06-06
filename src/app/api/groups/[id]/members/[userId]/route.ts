import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId, handleApiError, errorResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/group-access';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUserId = await getAuthUserId();
    if (!currentUserId) return errorResponse('Unauthorized', 401);

    await requireAdmin(params.id, currentUserId);

    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: params.userId } },
    });

    if (!targetMember) {
      return errorResponse('Member not found', 404);
    }

    if (targetMember.role === 'ADMIN') {
      const adminCount = await prisma.groupMember.count({
        where: { groupId: params.id, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return errorResponse('Cannot remove the only admin', 400);
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: params.id, userId: params.userId } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
