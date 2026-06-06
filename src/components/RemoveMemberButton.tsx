'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/Button';

export function RemoveMemberButton({
  groupId,
  userId,
  userName,
}: {
  groupId: string;
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove ${userName} from this group?`)) return;

    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
    setLoading(false);

    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error ?? 'Failed to remove member');
    }
  };

  return (
    <Button variant="danger" onClick={handleRemove} disabled={loading} className="text-xs px-2 py-1">
      Remove
    </Button>
  );
}
