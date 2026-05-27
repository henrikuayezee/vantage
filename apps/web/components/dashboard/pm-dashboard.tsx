'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, AlertTriangle, Users, TrendingUp,
  Flag, ArrowRight, Calendar,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { StatCard } from './stat-card';
import { Progress } from '@/components/ui/progress';
import { dashboardApi, type ProjectMeta, type UpcomingMilestone } from '@/lib/dashboard-api';

// ─── Status visual tokens ─────────────────────────────────────────────────────

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

function ProjectRow({ project, onClick }: { project: ProjectMeta; onClick: () => void }) {
  const accent  = STATUS_ACCENT[project.status] ?? 'var(--border)';
  const soft    = STATUS_SOFT[project.status]   ?? 'var(--surface-2)';
  const label   = STATUS_LABEL[project.status]  ?? project.status;
  const initial = project.name.trim()[0]?.toUpperCase() ?? '?';
  const daysLeft = project.endDate
    ? differenceInDays(new Date(project.endDate), new Date())
    : null;

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
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
            {project.name}
          </p>
          {project.atRisk && (
            <AlertTriangle className="h-3 w-3 shrink-0 text-[var(--warning)]" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={project.progress} className="h-1 w-20" />
          <span className="text-[10px] text-[var(--text-muted)] v-num">{project.progress}%</span>
        </div>
      </div>

      {/* Members */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 text-[10px] text-[var(--text-muted)]">
        <Users className="h-3 w-3" />
        {project.memberCount}
      </div>

      {/* Days left */}
      {daysLeft !== null && (
        <span
          className="hidden sm:block shrink-0 text-[10px] v-num font-medium"
          style={{ color: daysLeft < 0 ? 'var(--error)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--text-muted)' }}
        >
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
        </span>
      )}

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

// ─── Milestone item ───────────────────────────────────────────────────────────

function MilestoneItem({ milestone }: { milestone: UpcomingMilestone }) {
  const daysLeft = differenceInDays(new Date(milestone.dueDate), new Date());
  const isUrgent = daysLeft <= 3;
  const isToday  = daysLeft === 0;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Colored diamond */}
      <span
        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm rotate-45"
        style={{ background: milestone.color ?? 'var(--primary)' }}
      />

      {/* Title + project */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--text)] truncate">{milestone.title}</p>
        <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{milestone.project.name}</p>
      </div>

      {/* Date + urgency */}
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-end">
          <Calendar className="h-2.5 w-2.5" />
          {format(new Date(milestone.dueDate), 'MMM d')}
        </p>
        <span
          className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: isUrgent ? 'var(--warning-soft)' : 'var(--surface-2)',
            color: isUrgent ? 'var(--warning)' : 'var(--text-muted)',
          }}
        >
          {isToday ? 'Today' : `${daysLeft}d`}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PmDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-pm'],
    queryFn: () => dashboardApi.getPm().then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PmSkeleton />;
  if (!data) return null;

  const activeCount = data.projects.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-5">
      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total projects"
          value={data.projects.length}
          icon={FolderKanban}
          sub={`${activeCount} active`}
        />
        <StatCard
          label="At risk"
          value={data.atRiskCount}
          icon={AlertTriangle}
          accent={data.atRiskCount > 0 ? 'danger' : 'default'}
          sub={data.atRiskCount === 0 ? 'All on track' : `Need attention`}
        />
        <StatCard
          label="Unassigned tasks"
          value={data.unassignedCount}
          icon={Users}
          accent={data.unassignedCount > 0 ? 'warning' : 'default'}
          sub={data.unassignedCount === 0 ? 'All assigned' : 'Need owners'}
        />
        <StatCard
          label="Completion rate"
          value={`${data.completionRate}%`}
          icon={TrendingUp}
          accent={data.completionRate >= 70 ? 'success' : data.completionRate >= 40 ? 'warning' : 'danger'}
        />
      </div>

      {/* ── Projects + Milestones ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Projects list */}
        <div
          className="lg:col-span-2 rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-[13px] font-semibold text-[var(--text)]">Projects</h2>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {data.projects.length === 0 ? (
            <div className="py-14 text-center">
              <FolderKanban className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm text-[var(--text-muted)]">No projects yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onClick={() => router.push(`/projects/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming milestones */}
        <div
          className="rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Flag className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
            <h2 className="text-[13px] font-semibold text-[var(--text)]">Upcoming milestones</h2>
          </div>

          {data.upcomingMilestones.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="h-7 w-7 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs text-[var(--text-muted)]">No milestones in the next 14 days.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.upcomingMilestones.map((m) => (
                <MilestoneItem key={m.id} milestone={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PmSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-64 rounded-xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
