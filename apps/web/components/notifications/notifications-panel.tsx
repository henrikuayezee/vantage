'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, CheckSquare, Clock, MessageSquare, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi, type AppNotification } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';

const TYPE_ICON = {
  TASK_ASSIGNED: CheckSquare,
  TASK_COMMENTED: MessageSquare,
  TASK_DUE_SOON: Clock,
  TASK_MENTIONED: AtSign,
};

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (notification: AppNotification) => void;
}) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;

  return (
    <button
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors',
        !notification.isRead && 'bg-[var(--primary-softer)]',
      )}
      onClick={() => onRead(notification)}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text)] leading-snug">{notification.message}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
      )}
    </button>
  );
}

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
  });

  // Sync badge count when panel opens
  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ['notifications-count'] });
  }, [qc]);

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

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleRead(notification: AppNotification) {
    markRead.mutate(notification.id);
    const projectId = notification.task?.projectId;
    const taskId = notification.task?.id;
    if (projectId && taskId) {
      const focus = notification.type === 'TASK_COMMENTED' ? '&focus=comments' : '';
      router.push(`/projects/${projectId}?task=${taskId}${focus}`);
      onClose();
    } else if (projectId) {
      router.push(`/projects/${projectId}`);
      onClose();
    }
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50 overflow-hidden"
      style={{ maxHeight: '480px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text)]">Notifications</h3>
          {unread > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-medium text-white">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {isLoading ? (
          <div className="space-y-0 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3">
                <div className="h-7 w-7 rounded-full bg-[var(--surface-2)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
                  <div className="h-2 w-20 rounded bg-[var(--surface-2)]" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-8 w-8 text-[var(--text-muted)] mb-2 opacity-40" />
            <p className="text-xs text-[var(--text-muted)]">You're all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {notifications.map((n) => (
              <li key={n.id}>
                <NotificationRow notification={n} onRead={handleRead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
