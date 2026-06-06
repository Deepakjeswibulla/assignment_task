import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExpenseSchema } from '@/lib/validations';
import { computeSplits } from '@/lib/splits';
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

    const expenses = await prisma.expense.findMany({
      where: { groupId: params.id },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    return NextResponse.json(expenses);
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
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { description, amount, paidById, splitType, expenseDate, participants } =
      parsed.data;

    const memberIds = (
      await prisma.groupMember.findMany({
        where: { groupId: params.id },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    if (!memberIds.includes(paidById)) {
      return errorResponse('Payer must be a group member', 400);
    }

    for (const p of participants) {
      if (!memberIds.includes(p.userId)) {
        return errorResponse('All participants must be group members', 400);
      }
    }

    let computed;
    try {
      computed = computeSplits(splitType, amount, participants, paidById);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Invalid split', 400);
    }

    const expense = await prisma.expense.create({
      data: {
        groupId: params.id,
        paidById,
        description,
        amount,
        splitType,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        splits: {
          create: computed.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            splitValue: s.splitValue,
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
