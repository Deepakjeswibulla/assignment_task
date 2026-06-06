import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      passwordHash,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      email: 'carol@example.com',
      name: 'Carol',
      passwordHash,
    },
  });

  const existingGroup = await prisma.group.findFirst({
    where: { name: 'Roommates' },
  });

  if (!existingGroup) {
    const group = await prisma.group.create({
      data: {
        name: 'Roommates',
        description: 'Apartment shared expenses',
        createdById: alice.id,
        members: {
          create: [
            { userId: alice.id, role: 'ADMIN' },
            { userId: bob.id, role: 'MEMBER' },
            { userId: carol.id, role: 'MEMBER' },
          ],
        },
      },
    });

    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        paidById: alice.id,
        description: 'Groceries',
        amount: 90,
        splitType: 'EQUAL',
        splits: {
          create: [
            { userId: alice.id, amount: 30 },
            { userId: bob.id, amount: 30 },
            { userId: carol.id, amount: 30 },
          ],
        },
      },
    });

    await prisma.expenseMessage.create({
      data: {
        expenseId: expense.id,
        userId: alice.id,
        content: 'Bought groceries for the week!',
      },
    });
  }

  console.log('Seed complete. Demo users: alice@example.com, bob@example.com, carol@example.com');
  console.log('Password for all: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
