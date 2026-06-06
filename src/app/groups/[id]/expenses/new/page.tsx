'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Member = { id: string; name: string; email: string };
type SplitType = 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE';

export default function NewExpensePage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`)
      .then((r) => r.json())
      .then((group) => {
        const users = group.members.map((m: { user: Member }) => m.user);
        setMembers(users);
        setPaidById(users[0]?.id ?? '');
        setSelectedMembers(new Set(users.map((u: Member) => u.id)));
      });
  }, [groupId]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const participants = Array.from(selectedMembers).map((userId) => {
      const entry: { userId: string; value?: number } = { userId };
      if (splitType !== 'EQUAL' && splitValues[userId]) {
        entry.value = parseFloat(splitValues[userId]);
      }
      return entry;
    });

    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        amount: parseFloat(amount),
        paidById,
        splitType,
        participants,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === 'string' ? data.error : 'Failed to create expense');
      return;
    }

    const expense = await res.json();
    router.push(`/groups/${groupId}/expenses/${expense.id}`);
  };

  const splitLabel =
    splitType === 'UNEQUAL'
      ? 'Amount ($)'
      : splitType === 'PERCENTAGE'
        ? 'Percentage (%)'
        : splitType === 'SHARE'
          ? 'Shares (integer)'
          : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/groups/${groupId}`} className="text-sm text-brand-600 hover:underline">
          ← Back to group
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Add expense</h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">Paid by</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Split type</label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="EQUAL">Equal</option>
                <option value="UNEQUAL">Unequal (exact amounts)</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="SHARE">Share (ratios)</option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Participants</p>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="flex-1 text-sm">{m.name}</span>
                    {splitType !== 'EQUAL' && selectedMembers.has(m.id) && (
                      <input
                        type="number"
                        step={splitType === 'SHARE' ? '1' : '0.01'}
                        placeholder={splitLabel ?? ''}
                        value={splitValues[m.id] ?? ''}
                        onChange={(e) =>
                          setSplitValues((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
              {splitType === 'PERCENTAGE' && (
                <p className="mt-1 text-xs text-gray-500">Percentages must sum to 100.</p>
              )}
              {splitType === 'UNEQUAL' && (
                <p className="mt-1 text-xs text-gray-500">Amounts must sum to the total expense.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading || selectedMembers.size === 0}>
              {loading ? 'Saving...' : 'Create expense'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
