import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { messageSchema } from '@/lib/validations';
import { getAuthUserId, handleApiError, errorResponse } from '@/lib/api-helpers';
import { getIO } from '@/server/socket';

async function requireExpenseAccess(expenseId: string, userId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { group: { include: { members: true } } },
  });

  if (!expense) return null;
  const isMember = expense.group.members.some((m) => m.userId === userId);
  if (!isMember) return null;
  return expense;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    const expense = await requireExpenseAccess(params.id, userId);
    if (!expense) return errorResponse('Not found', 404);

    const messages = await prisma.expenseMessage.findMany({
      where: { expenseId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
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

    const expense = await requireExpenseAccess(params.id, userId);
    if (!expense) return errorResponse('Not found', 404);

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const message = await prisma.expenseMessage.create({
      data: {
        expenseId: params.id,
        userId,
        content: parsed.data.content.trim(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const io = getIO();
    io?.to(`expense:${params.id}`).emit('new_message', message);

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
