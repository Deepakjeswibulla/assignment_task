import { describe, it, expect } from 'vitest';
import {
  buildDebtMap,
  netBetween,
  memberBalances,
  individualSummary,
} from '@/lib/balances';

describe('buildDebtMap', () => {
  it('creates debts from expenses', () => {
    const debts = buildDebtMap([
      {
        paidById: 'alice',
        splits: [
          { userId: 'alice', amount: 50 },
          { userId: 'bob', amount: 50 },
        ],
      },
    ]);

    expect(debts.get('bob->alice')).toBe(50);
    expect(debts.get('alice->bob')).toBeUndefined();
  });

  it('reduces debts with settlements', () => {
    const debts = buildDebtMap(
      [
        {
          paidById: 'alice',
          splits: [
            { userId: 'alice', amount: 0 },
            { userId: 'bob', amount: 100 },
          ],
        },
      ],
      [{ fromUserId: 'bob', toUserId: 'alice', amount: 40 }]
    );

    expect(debts.get('bob->alice')).toBe(60);
  });
});

describe('netBetween', () => {
  it('computes net owed', () => {
    const debts = new Map([
      ['bob->alice', 50],
      ['alice->bob', 20],
    ]);
    expect(netBetween(debts, 'bob', 'alice')).toBe(30);
    expect(netBetween(debts, 'alice', 'bob')).toBe(-30);
  });
});

describe('memberBalances', () => {
  it('summarizes per member', () => {
    const debts = buildDebtMap([
      {
        paidById: 'alice',
        splits: [
          { userId: 'alice', amount: 33.33 },
          { userId: 'bob', amount: 33.33 },
          { userId: 'carol', amount: 33.34 },
        ],
      },
    ]);

    const balances = memberBalances(['alice', 'bob', 'carol'], debts);
    const bob = balances.find((b) => b.userId === 'bob')!;
    expect(bob.owes).toHaveLength(1);
    expect(bob.owes[0].userId).toBe('alice');
  });
});

describe('individualSummary', () => {
  it('aggregates across groups', () => {
    const debts1 = buildDebtMap([
      {
        paidById: 'alice',
        splits: [
          { userId: 'alice', amount: 0 },
          { userId: 'bob', amount: 30 },
        ],
      },
    ]);
    const debts2 = buildDebtMap([
      {
        paidById: 'bob',
        splits: [
          { userId: 'bob', amount: 0 },
          { userId: 'alice', amount: 10 },
        ],
      },
    ]);

    const summary = individualSummary('bob', [
      { groupId: 'g1', debts: debts1, memberIds: ['alice', 'bob'] },
      { groupId: 'g2', debts: debts2, memberIds: ['alice', 'bob'] },
    ]);

    const aliceEntry = summary.find((s) => s.counterpartyId === 'alice');
    expect(aliceEntry?.netAmount).toBe(20);
  });
});
