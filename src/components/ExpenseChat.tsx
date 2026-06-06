'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

type Message = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
};

export function ExpenseChat({ expenseId, currentUserId }: { expenseId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/expenses/${expenseId}/messages`)
      .then((r) => r.json())
      .then(setMessages);
  }, [expenseId]);

  useEffect(() => {
    const socket = io({ path: '/api/socket' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_expense', { expenseId });
    });

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave_expense', { expenseId });
      socket.disconnect();
    };
  }, [expenseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('send_message', { expenseId, content: content.trim() });
      } else {
        const res = await fetch(`/api/expenses/${expenseId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages((prev) => [...prev, msg]);
        }
      }
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-96 flex-col rounded-lg border border-gray-200">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">No messages yet. Start the discussion.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.user.id === currentUserId ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-gray-500">{msg.user.name}</span>
            <div
              className={`mt-0.5 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.user.id === currentUserId
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 p-3">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Discuss this expense..."
          className="flex-1"
        />
        <Button type="submit" disabled={sending}>
          Send
        </Button>
      </form>
    </div>
  );
}
