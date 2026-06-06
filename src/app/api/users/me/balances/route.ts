import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildDebtMap, individualSummary } from '@/lib/balances';
import { getAuthUserId, handleApiError, errorResponse, decimalToNumber } from '@/lib/api-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return errorResponse('Unauthorized', 401);

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    const groupBalances = await Promise.all(
      groupIds.map(async (groupId) => {
        const [expenses, settlements, members] = await Promise.all([
          prisma.expense.findMany({
            where: { groupId },
            include: { splits: true },
          }),
          prisma.settlement.findMany({ where: { groupId } }),
          prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } }),
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

        return { groupId, debts, memberIds };
      })
    );

    const summary = individualSummary(userId, groupBalances);

    const counterpartyIds = summary.map((s) => s.counterpartyId);
    const users = await prisma.user.findMany({
      where: { id: { in: counterpartyIds } },
      select: { id: true, name: true, email: true },
    });

    const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return NextResponse.json({
      summary: summary.map((s) => ({
        ...s,
        user: usersMap[s.counterpartyId],
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
