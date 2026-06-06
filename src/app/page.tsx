import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { BalanceSummary } from '@/components/BalanceSummary';
import { CreateGroupForm } from '@/components/CreateGroupForm';

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.user!.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: { _count: { select: { members: true, expenses: true } } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your groups and balances</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Your balance summary">
            <BalanceSummary />
          </Card>

          <Card title="Create a new group">
            <CreateGroupForm />
          </Card>
        </div>

        <Card title="Your groups">
          {memberships.length === 0 ? (
            <p className="text-sm text-gray-500">No groups yet. Create one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {memberships.map(({ group, role }) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between py-4 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{group.name}</p>
                      {group.description && (
                        <p className="text-sm text-gray-500">{group.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{group._count.members} members</p>
                      <p>{group._count.expenses} expenses</p>
                      <span className="text-xs uppercase text-brand-600">{role}</span>
                    </div>
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
