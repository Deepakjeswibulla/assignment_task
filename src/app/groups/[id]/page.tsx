import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMembership } from '@/lib/group-access';
import { decimalToNumber } from '@/lib/api-helpers';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { GroupBalances } from '@/components/GroupBalances';
import { AddMemberForm } from '@/components/AddMemberForm';
import { RemoveMemberButton } from '@/components/RemoveMemberButton';

export default async function GroupPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  let membership;
  try {
    membership = await requireMembership(params.id, session.user.id);
  } catch {
    notFound();
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      expenses: {
        include: { paidBy: { select: { id: true, name: true } } },
        orderBy: { expenseDate: 'desc' },
      },
    },
  });

  if (!group) notFound();

  const isAdmin = membership.role === 'ADMIN';

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-brand-600 hover:underline">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="text-gray-600">{group.description}</p>}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/groups/${group.id}/expenses/new`}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add expense
            </Link>
            <Link
              href={`/groups/${group.id}/settlements/new`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Record payment
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Group balances">
            <GroupBalances groupId={group.id} />
          </Card>

          <Card title="Members">
            <ul className="mb-4 divide-y divide-gray-100">
              {group.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.user.email} · {member.role}
                    </p>
                  </div>
                  {isAdmin && member.userId !== session.user.id && (
                    <RemoveMemberButton
                      groupId={group.id}
                      userId={member.userId}
                      userName={member.user.name}
                    />
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && <AddMemberForm groupId={group.id} />}
          </Card>
        </div>

        <Card title="Expenses">
          {group.expenses.length === 0 ? (
            <p className="text-sm text-gray-500">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {group.expenses.map((expense) => (
                <li key={expense.id}>
                  <Link
                    href={`/groups/${group.id}/expenses/${expense.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        Paid by {expense.paidBy.name} · {expense.splitType.toLowerCase()} split
                      </p>
                    </div>
                    <span className="font-semibold text-brand-700">
                      ${decimalToNumber(expense.amount).toFixed(2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
