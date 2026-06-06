import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSettlementSchema } from '@/lib/validations';
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

    const settlements = await prisma.settlement.findMany({
      where: { groupId: params.id },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(settlements);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    await requireMembership(params.id, userId);

    const body = await request.json();
    const parsed = createSettlementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { fromUserId, toUserId, amount, note } = parsed.data;

    if (fromUserId === toUserId) {
      return errorResponse('Cannot settle with yourself', 400);
    }

    const memberIds = (
      await prisma.groupMember.findMany({
        where: { groupId: params.id },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
      return errorResponse('Both users must be group members', 400);
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId: params.id,
        fromUserId,
        toUserId,
        amount,
        note,
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
