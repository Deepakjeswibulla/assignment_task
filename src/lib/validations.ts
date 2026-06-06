import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
});

export const splitEntrySchema = z.object({
  userId: z.string().uuid(),
  value: z.number().optional(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive().max(999999999),
  paidById: z.string().uuid(),
  splitType: z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']),
  expenseDate: z.string().datetime().optional(),
  participants: z.array(splitEntrySchema).min(1),
});

export const createSettlementSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number().positive().max(999999999),
  note: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});
