import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMembership } from '@/lib/group-access';
import { decimalToNumber } from '@/lib/api-helpers';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { ExpenseChat } from '@/components/ExpenseChat';

export default async function ExpenseDetailPage({
  params,
}: {
  params: { id: string; expenseId: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  try {
    await requireMembership(params.id, session.user.id);
  } catch {
    notFound();
  }

  const expense = await prisma.expense.findFirst({
    where: { id: params.expenseId, groupId: params.id },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { amount: 'desc' },
      },
      group: { select: { name: true } },
    },
  });

  if (!expense) notFound();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Link href={`/groups/${params.id}`} className="text-sm text-brand-600 hover:underline">
          ← Back to {expense.group.name}
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{expense.description}</h1>
          <p className="text-gray-600">
            ${decimalToNumber(expense.amount).toFixed(2)} · Paid by {expense.paidBy.name} ·{' '}
            {expense.splitType.toLowerCase()} split
          </p>
        </div>

        <Card title="Split breakdown">
          <ul className="divide-y divide-gray-100">
            {expense.splits.map((split) => (
              <li key={split.id} className="flex justify-between py-2 text-sm">
                <span>{split.user.name}</span>
                <span className="font-medium">${decimalToNumber(split.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Discussion">
          <ExpenseChat expenseId={expense.id} currentUserId={session.user.id} />
        </Card>
      </main>
    </div>
  );
}
