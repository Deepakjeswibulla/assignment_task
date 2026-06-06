'use client';

import { useEffect, useState } from 'react';

type User = { id: string; name: string; email: string };

type Pair = { userAId: string; userBId: string; amount: number };

export function GroupBalances({ groupId }: { groupId: string }) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/balances`)
      .then((r) => r.json())
      .then((data) => {
        setPairs(data.pairs ?? []);
        setUsers(data.users ?? {});
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <p className="text-sm text-gray-500">Loading balances...</p>;

  if (pairs.length === 0) {
    return <p className="text-sm text-gray-500">Everyone is settled in this group.</p>;
  }

  return (
    <ul className="space-y-2">
      {pairs.map((pair) => {
        const debtor = pair.amount > 0 ? users[pair.userAId] : users[pair.userBId];
        const creditor = pair.amount > 0 ? users[pair.userBId] : users[pair.userAId];
        const amount = Math.abs(pair.amount);

        return (
          <li
            key={`${pair.userAId}-${pair.userBId}`}
            className="rounded-md bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="font-medium">{debtor?.name}</span> owes{' '}
            <span className="font-medium">{creditor?.name}</span>{' '}
            <span className="font-semibold text-brand-700">${amount.toFixed(2)}</span>
          </li>
        );
      })}
    </ul>
  );
}
