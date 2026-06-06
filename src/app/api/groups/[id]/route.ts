import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId, handleApiError, errorResponse } from '@/lib/api-helpers';
import { requireMembership } from '@/lib/group-access';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    await requireMembership(params.id, userId);

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true } },
            splits: { include: { user: { select: { id: true, name: true } } } },
          },
          orderBy: { expenseDate: 'desc' },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!group) return errorResponse('Group not found', 404);

    return NextResponse.json(group);
  } catch (err) {
    return handleApiError(err);
  }
}
