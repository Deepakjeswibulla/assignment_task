'use client';

import { useEffect, useState } from 'react';

type SummaryEntry = {
  counterpartyId: string;
  netAmount: number;
  user: { id: string; name: string; email: string };
};

export function BalanceSummary() {
  const [summary, setSummary] = useState<SummaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/me/balances')
      .then((r) => r.json())
      .then((data) => setSummary(data.summary ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading balances...</p>;

  if (summary.length === 0) {
    return <p className="text-sm text-gray-500">You are all settled up across groups.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {summary.map((entry) => (
        <li key={entry.counterpartyId} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">{entry.user.name}</p>
            <p className="text-xs text-gray-500">{entry.user.email}</p>
          </div>
          <span
            className={`text-sm font-semibold ${
              entry.netAmount > 0 ? 'text-red-600' : 'text-brand-600'
            }`}
          >
            {entry.netAmount > 0
              ? `You owe $${entry.netAmount.toFixed(2)}`
              : `${entry.user.name} owes you $${Math.abs(entry.netAmount).toFixed(2)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
