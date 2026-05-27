'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, CheckSquare, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi, type AppNotification } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';

const TYPE_ICON = {
  TASK_ASSIGNED: CheckSquare,
  TASK_COMMENTED: MessageSquare,
  TASK_DUE_SOON: Clock,
};

const TYPE_LABEL = {
  TASK_ASSIGNED: 'Assignment',
  TASK_COMMENTED: 'Comment',
  TASK_DUE_SOON: 'Due soon',
};

export default function NotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.task?.projectId) router.push(`/projects/${n.task.projectId}`);
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-40 rounded bg-[var(--surface-2)]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">Notifications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-[var(--border)] text-center">
          <Bell className="h-10 w-10 text-[var(--text-muted)] mb-3 opacity-30" />
          <p className="text-sm font-medium text-[var(--text)]">You're all caught up!</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <ul className="divide-y divide-[var(--border)]">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <button
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors',
                      !n.isRead && 'bg-[var(--primary-softer)]',
                    )}
                    onClick={() => handleClick(n)}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                          {TYPE_LABEL[n.type]}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text)] leading-snug">{n.message}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
