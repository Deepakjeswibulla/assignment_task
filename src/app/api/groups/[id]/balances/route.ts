import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildDebtMap, memberBalances, simplifyPairBalances } from '@/lib/balances';
import { getAuthUserId, handleApiError, errorResponse, decimalToNumber } from '@/lib/api-helpers';
import { requireMembership } from '@/lib/group-access';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    await requireMembership(params.id, userId);

    const [expenses, settlements, members] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: params.id },
        include: { splits: true },
      }),
      prisma.settlement.findMany({ where: { groupId: params.id } }),
      prisma.groupMember.findMany({
        where: { groupId: params.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const memberIds = members.map((m) => m.userId);

    const debts = buildDebtMap(
      expenses.map((e) => ({
        paidById: e.paidById,
        splits: e.splits.map((s) => ({
          userId: s.userId,
          amount: decimalToNumber(s.amount),
        })),
      })),
      settlements.map((s) => ({
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: decimalToNumber(s.amount),
      }))
    );

    const pairs = simplifyPairBalances(memberIds, debts);
    const balances = memberBalances(memberIds, debts);

    const users = Object.fromEntries(members.map((m) => [m.userId, m.user]));

    return NextResponse.json({ pairs, balances, users });
  } catch (err) {
    return handleApiError(err);
  }
}
