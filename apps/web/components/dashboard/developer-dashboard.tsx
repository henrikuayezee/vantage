'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  Timer, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { StatCard } from './stat-card';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { dashboardApi, type AssignedTask } from '@/lib/dashboard-api';

// ─── Status visual tokens ─────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: 'var(--status-progress)',
  REVIEW:      'var(--status-review)',
  TODO:        'var(--status-todo)',
  BACKLOG:     'var(--status-backlog)',
  DONE:        'var(--status-done)',
};

// ─── Active work card (for IN_PROGRESS tasks) ─────────────────────────────────

function ActiveTaskCard({ task, onClick }: { task: AssignedTask; onClick: () => void }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate));

  return (
    <button
      className="group w-full text-left rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)] transition-all"
      style={{ background: 'var(--status-progress-bg)', boxShadow: 'var(--shadow-xs)' }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 mb-2">
        <Timer className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--status-progress)' }} />
        <p className="text-[13px] font-medium text-[var(--text)] leading-snug group-hover:text-[var(--primary)] transition-colors flex-1 min-w-0">
          {task.title}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap pl-5">
        <TaskPriorityBadge priority={task.priority} compact />
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          {task.project.name}
        </span>
        {task.dueDate && (
          <span
            className="text-[10px] font-medium"
            style={{ color: isOverdue ? 'var(--error)' : 'var(--text-muted)' }}
          >
            {isOverdue ? 'Overdue · ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Compact task row (for "coming up" section) ───────────────────────────────

function UpcomingTaskRow({ task, onClick }: { task: AssignedTask; onClick: () => void }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  const statusColor = STATUS_COLOR[task.status] ?? 'var(--text-muted)';

  return (
    <button
      className="group w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors"
      onClick={onClick}
    >
      <span
        className="h-[7px] w-[7px] rounded-full shrink-0"
        style={{ background: statusColor, opacity: 0.75 }}
      />
      <span className="flex-1 min-w-0 text-[13px] font-medium text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors" title={task.title}>
        {task.title}
      </span>
      <TaskPriorityBadge priority={task.priority} compact />
      <span
        className="shrink-0 text-[10px] font-medium hidden sm:block"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}
      >
        {task.project.name}
      </span>
      {task.dueDate && (
        <span
          className="shrink-0 text-[10px] font-medium v-num"
          style={{ color: overdue ? 'var(--error)' : 'var(--text-muted)' }}
        >
          {overdue && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5" />}
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeveloperDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-developer'],
    queryFn: () => dashboardApi.getDeveloper().then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const tasks = data.assignedTasks;
  const navigate = (projectId: string) => router.push(`/projects/${projectId}`);

  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const upcoming = tasks.filter((t) => {
    if (t.status === 'DONE' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return isPast(due) || isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 7) });
  }).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const total = tasks.length;

  return (
    <div className="space-y-5">
      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Assigned tasks"
          value={total}
          icon={CheckSquare}
          sub={`${inProgress.length} in progress`}
        />
        <StatCard
          label="Overdue"
          value={data.overdueCount}
          icon={AlertTriangle}
          accent={data.overdueCount > 0 ? 'danger' : 'default'}
          sub={data.overdueCount === 0 ? 'All on schedule' : 'Need attention'}
        />
        <StatCard
          label="Due this week"
          value={data.dueThisWeekCount}
          icon={Clock}
          accent={data.dueThisWeekCount > 0 ? 'warning' : 'default'}
          sub={data.dueThisWeekCount === 0 ? 'Nothing due' : 'This week'}
        />
        <StatCard
          label="Completed"
          value={data.completedThisWeek}
          icon={TrendingUp}
          accent="success"
          sub="This week"
        />
      </div>

      {/* ── Active work + Coming up ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Active work */}
        <div
          className="rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5" style={{ color: 'var(--status-progress)' }} />
              <h2 className="text-[13px] font-semibold text-[var(--text)]">Active work</h2>
              {inProgress.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--status-progress-bg)',
                    color: 'var(--status-progress)',
                  }}
                >
                  {inProgress.length}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/my-tasks')}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              All tasks
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {inProgress.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--status-done)' }} />
              <p className="text-sm font-medium text-[var(--text)] mb-0.5">Nothing in progress</p>
              <p className="text-xs text-[var(--text-muted)]">Pick up a task to get started.</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {inProgress.slice(0, 5).map((task) => (
                <ActiveTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate(task.projectId)}
                />
              ))}
              {inProgress.length > 5 && (
                <button
                  className="w-full text-xs text-[var(--primary)] hover:underline py-1"
                  onClick={() => router.push('/my-tasks')}
                >
                  +{inProgress.length - 5} more in progress
                </button>
              )}
            </div>
          )}
        </div>

        {/* Coming up */}
        <div
          className="rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--warning)' }} />
              <h2 className="text-[13px] font-semibold text-[var(--text)]">Coming up</h2>
              {upcoming.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
                >
                  {upcoming.length}
                </span>
              )}
            </div>
            {data.overdueCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
                style={{ background: 'var(--error-soft)', color: 'var(--error)' }}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {data.overdueCount} overdue
              </span>
            )}
          </div>

          {upcoming.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--status-done)' }} />
              <p className="text-sm font-medium text-[var(--text)] mb-0.5">You're all caught up</p>
              <p className="text-xs text-[var(--text-muted)]">Nothing due in the next 7 days.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {upcoming.slice(0, 8).map((task) => (
                <UpcomingTaskRow
                  key={task.id}
                  task={task}
                  onClick={() => navigate(task.projectId)}
                />
              ))}
              {upcoming.length > 8 && (
                <div className="px-4 py-2.5">
                  <button
                    className="text-xs text-[var(--primary)] hover:underline"
                    onClick={() => router.push('/my-tasks')}
                  >
                    +{upcoming.length - 8} more upcoming
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-64 rounded-xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
