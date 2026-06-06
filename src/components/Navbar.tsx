'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand-600">
          SplitShare
        </Link>
        {session?.user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
