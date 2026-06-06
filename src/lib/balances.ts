export type DebtEdge = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type ExpenseForBalance = {
  paidById: string;
  splits: { userId: string; amount: number }[];
};

export type SettlementForBalance = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type PairBalance = {
  userAId: string;
  userBId: string;
  /** Positive means userA owes userB */
  amount: number;
};

export type MemberBalance = {
  userId: string;
  netBalance: number;
  owes: { userId: string; amount: number }[];
  owedBy: { userId: string; amount: number }[];
};

function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

export function buildDebtMap(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[] = []
): Map<string, number> {
  const debts = new Map<string, number>();

  const addDebt = (from: string, to: string, amount: number) => {
    if (from === to || amount <= 0) return;
    const key = edgeKey(from, to);
    debts.set(key, roundMoney((debts.get(key) ?? 0) + amount));
  };

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.userId !== expense.paidById) {
        addDebt(split.userId, expense.paidById, split.amount);
      }
    }
  }

  for (const settlement of settlements) {
    const { fromUserId, toUserId, amount } = settlement;
    const key = edgeKey(fromUserId, toUserId);
    const reverseKey = edgeKey(toUserId, fromUserId);
    let debt = roundMoney((debts.get(key) ?? 0) - amount);

    if (debt <= 0) {
      debts.delete(key);
      if (debt < 0) {
        debts.set(reverseKey, roundMoney((debts.get(reverseKey) ?? 0) + Math.abs(debt)));
      }
    } else {
      debts.set(key, debt);
    }
  }

  return debts;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function netBetween(
  debts: Map<string, number>,
  userAId: string,
  userBId: string
): number {
  const aOwesB = debts.get(edgeKey(userAId, userBId)) ?? 0;
  const bOwesA = debts.get(edgeKey(userBId, userAId)) ?? 0;
  return roundMoney(aOwesB - bOwesA);
}

export function simplifyPairBalances(
  memberIds: string[],
  debts: Map<string, number>
): PairBalance[] {
  const pairs: PairBalance[] = [];

  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const a = memberIds[i];
      const b = memberIds[j];
      const net = netBetween(debts, a, b);
      if (net !== 0) {
        pairs.push({ userAId: a, userBId: b, amount: net });
      }
    }
  }

  return pairs;
}

export function memberBalances(
  memberIds: string[],
  debts: Map<string, number>
): MemberBalance[] {
  return memberIds.map((userId) => {
    const owes: { userId: string; amount: number }[] = [];
    const owedBy: { userId: string; amount: number }[] = [];

    for (const otherId of memberIds) {
      if (otherId === userId) continue;
      const net = netBetween(debts, userId, otherId);
      if (net > 0) {
        owes.push({ userId: otherId, amount: net });
      } else if (net < 0) {
        owedBy.push({ userId: otherId, amount: Math.abs(net) });
      }
    }

    const totalOwed = owes.reduce((s, o) => s + o.amount, 0);
    const totalOwing = owedBy.reduce((s, o) => s + o.amount, 0);

    return {
      userId,
      netBalance: roundMoney(totalOwing - totalOwed),
      owes,
      owedBy,
    };
  });
}

export type IndividualSummaryEntry = {
  counterpartyId: string;
  /** Positive = current user owes counterparty */
  netAmount: number;
};

export function individualSummary(
  currentUserId: string,
  groupBalances: { groupId: string; debts: Map<string, number>; memberIds: string[] }[]
): IndividualSummaryEntry[] {
  const totals = new Map<string, number>();

  for (const group of groupBalances) {
    if (!group.memberIds.includes(currentUserId)) continue;

    for (const memberId of group.memberIds) {
      if (memberId === currentUserId) continue;
      const net = netBetween(group.debts, currentUserId, memberId);
      if (net !== 0) {
        totals.set(memberId, roundMoney((totals.get(memberId) ?? 0) + net));
      }
    }
  }

  return Array.from(totals.entries())
    .map(([counterpartyId, netAmount]) => ({ counterpartyId, netAmount }))
    .filter((e) => e.netAmount !== 0)
    .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount));
}
