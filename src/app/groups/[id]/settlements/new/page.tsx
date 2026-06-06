'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Member = { id: string; name: string };

export default function NewSettlementPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`)
      .then((r) => r.json())
      .then((group) => {
        const users = group.members.map((m: { user: Member }) => m.user);
        setMembers(users);
        if (users.length >= 2) {
          setFromUserId(users[0].id);
          setToUserId(users[1].id);
        }
      });
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch(`/api/groups/${groupId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        note: note || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === 'string' ? data.error : 'Failed to record payment');
      return;
    }

    router.push(`/groups/${groupId}`);
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/groups/${groupId}`} className="text-sm text-brand-600 hover:underline">
          ← Back to group
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Record payment</h1>
        <p className="mb-6 text-sm text-gray-600">
          Record when one member pays another to settle up.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From (who paid)</label>
              <select
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">To (who received)</label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading || fromUserId === toUserId}>
              {loading ? 'Saving...' : 'Record payment'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
