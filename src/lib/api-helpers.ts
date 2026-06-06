import { NextResponse } from 'next/server';
import { getSession } from './auth';

export async function getAuthUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    if (err.message === 'FORBIDDEN') return errorResponse('Forbidden', 403);
    if (err.message === 'ADMIN_REQUIRED') return errorResponse('Admin access required', 403);
  }
  return errorResponse('Internal server error', 500);
}

export function decimalToNumber(value: { toNumber?: () => number } | number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}
