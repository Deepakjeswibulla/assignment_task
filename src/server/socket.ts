import { Server as HttpServer, IncomingMessage } from 'http';
import { Server, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = await getToken({
        req: socket.request as IncomingMessage & {
          cookies: Partial<Record<string, string>>;
        },
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
      });

      if (!token?.id) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = token.id as string;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join_expense', async ({ expenseId }: { expenseId: string }) => {
      try {
        const userId = socket.data.userId as string;
        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: { group: { include: { members: true } } },
        });

        if (!expense) return;
        const isMember = expense.group.members.some((m) => m.userId === userId);
        if (!isMember) return;

        socket.join(`expense:${expenseId}`);
      } catch {
        // ignore invalid join
      }
    });

    socket.on('leave_expense', ({ expenseId }: { expenseId: string }) => {
      socket.leave(`expense:${expenseId}`);
    });

    socket.on(
      'send_message',
      async ({ expenseId, content }: { expenseId: string; content: string }) => {
        try {
          const userId = socket.data.userId as string;
          if (!content?.trim() || content.length > 2000) return;

          const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: { group: { include: { members: true } } },
          });

          if (!expense) return;
          const isMember = expense.group.members.some((m) => m.userId === userId);
          if (!isMember) return;

          const message = await prisma.expenseMessage.create({
            data: {
              expenseId,
              userId,
              content: content.trim(),
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          });

          io?.to(`expense:${expenseId}`).emit('new_message', message);
        } catch {
          // ignore send errors
        }
      }
    );
  });

  return io;
}
