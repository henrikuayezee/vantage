'use client';

import { useState, type ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { isPast, format } from 'date-fns';
import {
  ChevronDown, Plus, CheckSquare,
  Circle, Timer, Eye, CheckCircle2, Clock,
  AlertCircle,
} from 'lucide-react';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { dashboardApi, type AssignedTask } from '@/lib/dashboard-api';
import { cn } from '@/lib/utils';

// ─── Status config (matches task-list-view design system) ─────────────────────

const STATUS_ORDER = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
type StatusKey = (typeof STATUS_ORDER)[number];

interface GroupConfig {
  label: string;
  icon: ElementType;
  color: string;
  bg: string;
}

const GROUP_CONFIG: Record<StatusKey, GroupConfig> = {
  IN_PROGRESS: { label: 'In progress', icon: Timer,        color: 'var(--status-progress)', bg: 'var(--status-progress-bg)' },
  REVIEW:      { label: 'Review',      icon: Eye,          color: 'var(--status-review)',   bg: 'var(--status-review-bg)' },
  TODO:        { label: 'To do',       icon: Circle,       color: 'var(--status-todo)',     bg: 'var(--status-todo-bg)' },
  BACKLOG:     { label: 'Backlog',     icon: Circle,       color: 'var(--status-backlog)',  bg: 'var(--status-backlog-bg)' },
  DONE:        { label: 'Done',        icon: CheckCircle2, color: 'var(--status-done)',     bg: 'var(--status-done-bg)' },
};

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task, statusColor, isSubtask = false, isOrphan = false, onClick,
}: {
  task: AssignedTask;
  statusColor: string;
  isSubtask?: boolean;
  isOrphan?: boolean;
  onClick: () => void;
}) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  const isDone = task.status === 'DONE';

  return (
    <button
      className={cn(
        'group w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
        isSubtask ? 'hover:bg-[var(--surface-2)]' : 'hover:bg-[var(--surface)]',
      )}
      style={{ background: isSubtask ? 'var(--surface)' : undefined }}
      onClick={onClick}
    >
      {/* Status dot */}
      <span
        className="h-[7px] w-[7px] rounded-full shrink-0"
        style={{ background: statusColor, opacity: isDone ? 0.35 : 0.75 }}
      />

      {/* Subtask indent indicator */}
      {isSubtask && (
        <span className="text-[10px] font-mono shrink-0 select-none" style={{ color: 'var(--text-subtle)' }}>
          ↳
        </span>
      )}

      {/* Title */}
      <span
        className={cn(
          'flex-1 min-w-0 text-[13px] font-medium truncate transition-colors group-hover:text-[var(--primary)]',
          isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]',
        )}
      >
        {task.title}
      </span>

      {/* Orphan "subtask of" label */}
      {isOrphan && task.parentTask && (
        <span
          className="shrink-0 text-[9px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          subtask of {task.parentTask.title}
        </span>
      )}

      {/* Priority */}
      <TaskPriorityBadge priority={task.priority} />

      {/* Project badge */}
      <span
        className="shrink-0 text-[10px] font-medium rounded px-2 py-0.5 whitespace-nowrap hidden sm:inline-flex"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        {task.project.name}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span
          className={cn(
            'shrink-0 text-[10px] font-medium v-num inline-flex items-center gap-1',
            isOverdue ? 'text-[var(--error)]' : isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-muted)]',
          )}
        >
          {isOverdue && <Clock className="h-2.5 w-2.5 shrink-0" />}
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </button>
  );
}

// ─── Status group card ────────────────────────────────────────────────────────

function StatusGroup({
  statusKey, tasks, subtasksByParent, orphans, isCollapsed, onToggle, onNavigate,
}: {
  statusKey: StatusKey;
  tasks: AssignedTask[];
  subtasksByParent: Map<string, AssignedTask[]>;
  orphans: AssignedTask[];
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (projectId: string) => void;
}) {
  const cfg = GROUP_CONFIG[statusKey];
  const Icon = cfg.icon;
  // Total items = parent tasks + orphaned subtasks with this status
  const total = tasks.length + orphans.length;

  if (total === 0) return null;

  return (
    <div
      className="rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      {/* Group header */}
      <button
        className="group/hdr w-full flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] select-none text-left transition-colors"
        style={{ background: cfg.bg }}
        onClick={onToggle}
      >
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        />
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: cfg.color }} />
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
        <span className="text-[13px] font-semibold flex-1 text-left" style={{ color: 'var(--text)' }}>
          {cfg.label}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)` }}
        >
          {total}
        </span>
      </button>

      {/* Animated content */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="divide-y divide-[var(--border)]">
            {/* Parent tasks with their subtasks */}
            {tasks.map((task) => (
              <div key={task.id}>
                <TaskRow
                  task={task}
                  statusColor={cfg.color}
                  onClick={() => onNavigate(task.projectId)}
                />
                {(subtasksByParent.get(task.id) ?? []).map((sub) => (
                  <div key={sub.id} className="border-t border-[var(--border)]">
                    <TaskRow
                      task={sub}
                      statusColor={cfg.color}
                      isSubtask
                      onClick={() => onNavigate(sub.projectId)}
                    />
                  </div>
                ))}
              </div>
            ))}
            {/* Orphaned subtasks */}
            {orphans.map((sub) => (
              <TaskRow
                key={sub.id}
                task={sub}
                statusColor={cfg.color}
                isOrphan
                onClick={() => onNavigate(sub.projectId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Partial<Record<StatusKey, boolean>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-developer'],
    queryFn: () => dashboardApi.getDeveloper().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const toggleGroup = (key: StatusKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const navigate = (projectId: string) => router.push(`/projects/${projectId}`);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]" style={{ background: 'var(--surface)' }}>
              <div className="h-3.5 w-3.5 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
            </div>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
                <div className="h-2 w-2 rounded-full animate-pulse shrink-0" style={{ background: 'var(--surface-2)' }} />
                <div className="h-3 flex-1 rounded animate-pulse" style={{ background: 'var(--surface-2)', width: `${60 + j * 15}%` }} />
                <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
                <div className="h-5 w-20 rounded animate-pulse hidden sm:block" style={{ background: 'var(--surface-2)' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const tasks: AssignedTask[] = data?.assignedTasks ?? [];
  const parentTasks = tasks.filter((t) => !t.parentTaskId);
  const subtasks = tasks.filter((t) => !!t.parentTaskId);

  const parentIds = new Set(parentTasks.map((t) => t.id));

  const subtasksByParent = new Map<string, AssignedTask[]>();
  for (const sub of subtasks) {
    if (!sub.parentTaskId) continue;
    const list = subtasksByParent.get(sub.parentTaskId) ?? [];
    list.push(sub);
    subtasksByParent.set(sub.parentTaskId, list);
  }

  const orphanedSubtasks = subtasks.filter(
    (s) => s.parentTaskId && !parentIds.has(s.parentTaskId),
  );

  // Build per-status groupings of top-level items
  const parentsByStatus = new Map<string, AssignedTask[]>();
  const orphansByStatus = new Map<string, AssignedTask[]>();

  for (const task of parentTasks) {
    const list = parentsByStatus.get(task.status) ?? [];
    list.push(task);
    parentsByStatus.set(task.status, list);
  }
  for (const sub of orphanedSubtasks) {
    const list = orphansByStatus.get(sub.status) ?? [];
    list.push(sub);
    orphansByStatus.set(sub.status, list);
  }

  const totalCount = tasks.length;
  const overdueCount = data?.overdueCount ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--text)]">My Tasks</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {totalCount} task{totalCount !== 1 ? 's' : ''} assigned to you
          </p>
        </div>

        {/* Stat chips */}
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--error-soft)', color: 'var(--error)' }}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {overdueCount} overdue
            </span>
          )}
          {(data?.dueThisWeekCount ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
            >
              <Clock className="h-3.5 w-3.5" />
              {data!.dueThisWeekCount} due this week
            </span>
          )}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--status-done-bg)' }}
          >
            <CheckSquare className="h-8 w-8" style={{ color: 'var(--status-done)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">You're all caught up</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            No tasks are currently assigned to you. Check back later or ask your project manager.
          </p>
        </div>
      ) : (
        /* ── Status groups ─────────────────────────────────────────────── */
        <div className="flex flex-col gap-2">
          {STATUS_ORDER.map((statusKey) => (
            <StatusGroup
              key={statusKey}
              statusKey={statusKey}
              tasks={parentsByStatus.get(statusKey) ?? []}
              subtasksByParent={subtasksByParent}
              orphans={orphansByStatus.get(statusKey) ?? []}
              isCollapsed={!!collapsed[statusKey]}
              onToggle={() => toggleGroup(statusKey)}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {totalCount} task{totalCount !== 1 ? 's' : ''} across all projects
        </p>
      )}
    </div>
  );
}
