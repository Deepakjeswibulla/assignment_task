import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGroupSchema } from '@/lib/validations';
import { getAuthUserId, handleApiError, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, expenses: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      role: m.role,
    }));

    return NextResponse.json(groups);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        createdById: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
