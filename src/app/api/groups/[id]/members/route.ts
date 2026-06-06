import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMemberSchema } from '@/lib/validations';
import { getAuthUserId, handleApiError, errorResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/group-access';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    await requireAdmin(params.id, userId);

    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!targetUser) {
      return errorResponse('User not found. They must register first.', 404);
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: targetUser.id } },
    });

    if (existing) {
      return errorResponse('User is already a member', 409);
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: params.id,
        userId: targetUser.id,
        role: 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
