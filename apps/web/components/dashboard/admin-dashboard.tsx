'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, CheckSquare, AlertTriangle, Users,
  TrendingUp, Activity, ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatCard } from './stat-card';
import { Progress } from '@/components/ui/progress';
import { dashboardApi, type RecentProject } from '@/lib/dashboard-api';

// ─── Status visual tokens (mirrors project-card.tsx) ─────────────────────────

const STATUS_ACCENT: Record<string, string> = {
  ACTIVE:    'var(--status-progress)',
  UPCOMING:  'var(--status-backlog)',
  ON_HOLD:   'var(--status-review)',
  COMPLETED: 'var(--status-done)',
  ARCHIVED:  'var(--text-muted)',
};

const STATUS_SOFT: Record<string, string> = {
  ACTIVE:    'var(--status-progress-bg)',
  UPCOMING:  'var(--status-backlog-bg)',
  ON_HOLD:   'var(--status-review-bg)',
  COMPLETED: 'var(--status-done-bg)',
  ARCHIVED:  'var(--surface-2)',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active', UPCOMING: 'Upcoming', ON_HOLD: 'On Hold',
  COMPLETED: 'Completed', ARCHIVED: 'Archived',
};

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({ project, onClick }: { project: RecentProject; onClick: () => void }) {
  const accent = STATUS_ACCENT[project.status] ?? 'var(--border)';
  const soft   = STATUS_SOFT[project.status]   ?? 'var(--surface-2)';
  const initial = project.name.trim()[0]?.toUpperCase() ?? '?';
  const label  = STATUS_LABEL[project.status] ?? project.status;

  return (
    <button
      className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors"
      onClick={onClick}
    >
      {/* Project icon */}
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold select-none"
        style={{ background: soft, color: accent }}
      >
        {initial}
      </div>

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors" title={project.name}>
          {project.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={project.progress} className="h-1 w-20" />
          <span className="text-[10px] text-[var(--text-muted)] v-num">{project.progress}%</span>
          <span className="text-[10px] text-[var(--text-muted)]">·</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Updated ago */}
      <span className="hidden md:block text-[10px] text-[var(--text-muted)] shrink-0">
        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
      </span>

      {/* Status chip */}
      <span
        className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: soft, color: accent }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => dashboardApi.getAdmin().then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <AdminSkeleton />;
  if (!data) return null;

  const { stats, recentProjects } = data;
  const onTrack = stats.totalTasks - stats.overdueTasks;
  const activeRatio = stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* ── KPI grid (2 rows × 3) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          sub={`${stats.activeProjects} active`}
        />
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={Activity}
          accent="success"
          sub={`${stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}% of total`}
        />
        <StatCard
          label="Total tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          sub={`${onTrack} on track`}
        />
        <StatCard
          label="Overdue tasks"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          accent={stats.overdueTasks > 0 ? 'danger' : 'default'}
          sub={stats.overdueTasks === 0 ? 'All on schedule' : undefined}
        />
        <StatCard
          label="Team members"
          value={stats.totalUsers}
          icon={Users}
          sub={`${stats.activeUsers} active`}
        />
        <StatCard
          label="Completion rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          accent={stats.completionRate >= 70 ? 'success' : stats.completionRate >= 40 ? 'warning' : 'danger'}
        />
      </div>

      {/* ── Org health bar ────────────────────────────────────────────── */}
      <div
        className="rounded-xl border border-[var(--border)] p-4"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[13px] font-semibold text-[var(--text)]">Organization health</span>
            <span className="ml-2 text-[10px] text-[var(--text-muted)]">
              {onTrack} of {stats.totalTasks} tasks on track
            </span>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: stats.completionRate >= 70 ? 'var(--success-soft)' : stats.completionRate >= 40 ? 'var(--warning-soft)' : 'var(--error-soft)',
              color: stats.completionRate >= 70 ? 'var(--success)' : stats.completionRate >= 40 ? 'var(--warning)' : 'var(--error)',
            }}
          >
            {stats.completionRate}%
          </span>
        </div>
        <Progress value={stats.completionRate} className="h-2" />
        <div className="flex items-center gap-4 mt-2.5">
          <span className="text-[10px] text-[var(--text-muted)]">
            {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''}
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="text-[10px] text-[var(--text-muted)]">
            {stats.overdueTasks > 0
              ? `${stats.overdueTasks} overdue task${stats.overdueTasks !== 1 ? 's' : ''}`
              : 'No overdue tasks'}
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="text-[10px] text-[var(--text-muted)]">
            {activeRatio}% team active
          </span>
        </div>
      </div>

      {/* ── Projects + Team ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent projects */}
        <div
          className="lg:col-span-2 rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-[13px] font-semibold text-[var(--text)]">Recent projects</h2>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-14 text-center">
              <FolderKanban className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm text-[var(--text-muted)]">No projects yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentProjects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onClick={() => router.push(`/projects/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Team snapshot */}
        <div
          className="rounded-xl border border-[var(--border)] p-5"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <h2 className="text-[13px] font-semibold text-[var(--text)] mb-4">Team snapshot</h2>

          <div className="flex items-end gap-4 mb-4">
            <div>
              <p
                className="text-4xl font-bold leading-none tracking-tight"
                style={{ color: 'var(--primary)' }}
              >
                {stats.activeUsers}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Active members</p>
            </div>
            <div className="pb-0.5">
              <p className="text-lg font-semibold text-[var(--text-muted)]">/ {stats.totalUsers}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Total</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Active ratio
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: activeRatio >= 70 ? 'var(--success)' : 'var(--warning)' }}
              >
                {activeRatio}%
              </span>
            </div>
            <Progress value={activeRatio} className="h-1.5" />
          </div>

          <div
            className="mt-4 pt-4 grid grid-cols-2 gap-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[11px] text-[var(--text-muted)]">Projects</p>
              <p className="text-lg font-bold text-[var(--text)] leading-tight">{stats.totalProjects}</p>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[11px] text-[var(--text-muted)]">Tasks</p>
              <p className="text-lg font-bold text-[var(--text)] leading-tight">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdminSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="h-20 rounded-xl bg-[var(--surface-2)]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-56 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-56 rounded-xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
