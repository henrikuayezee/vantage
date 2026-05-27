'use client';

import Link from 'next/link';
import { Calendar, Users, ArchiveRestore } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { projectsApi, type Project } from '@/lib/projects-api';
import { ProjectStatus } from '@vantage/types';

// ─── Status → visual tokens ───────────────────────────────────────────────────

const STATUS_BADGE: Record<ProjectStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'muted' }> = {
  [ProjectStatus.UPCOMING]:  { label: 'Upcoming',  variant: 'muted' },
  [ProjectStatus.ACTIVE]:    { label: 'Active',    variant: 'default' },
  [ProjectStatus.ON_HOLD]:   { label: 'On Hold',   variant: 'warning' },
  [ProjectStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [ProjectStatus.ARCHIVED]:  { label: 'Archived',  variant: 'muted' },
};

const STATUS_ACCENT: Record<string, string> = {
  [ProjectStatus.ACTIVE]:    'var(--status-progress)',
  [ProjectStatus.UPCOMING]:  'var(--status-backlog)',
  [ProjectStatus.ON_HOLD]:   'var(--status-review)',
  [ProjectStatus.COMPLETED]: 'var(--status-done)',
  [ProjectStatus.ARCHIVED]:  'var(--text-muted)',
};

const STATUS_SOFT: Record<string, string> = {
  [ProjectStatus.ACTIVE]:    'var(--status-progress-bg)',
  [ProjectStatus.UPCOMING]:  'var(--status-backlog-bg)',
  [ProjectStatus.ON_HOLD]:   'var(--status-review-bg)',
  [ProjectStatus.COMPLETED]: 'var(--status-done-bg)',
  [ProjectStatus.ARCHIVED]:  'var(--surface-2)',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  progress?: number;
  showRestore?: boolean;
}

export function ProjectCard({ project, progress = 0, showRestore = false }: ProjectCardProps) {
  const qc = useQueryClient();

  const restore = useMutation({
    mutationFn: () => projectsApi.update(project.id, { status: ProjectStatus.ACTIVE }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const statusCfg = STATUS_BADGE[project.status as ProjectStatus] ?? { label: project.status, variant: 'muted' as const };
  const accentColor = STATUS_ACCENT[project.status] ?? 'var(--border)';
  const softBg = STATUS_SOFT[project.status] ?? 'var(--surface-2)';
  const initial = project.name.trim()[0]?.toUpperCase() ?? '?';

  const visibleMembers = project.members.slice(0, 4);
  const extraMembers = project.members.length - visibleMembers.length;

  return (
    <Link
      href={`/projects/${project.id}`}
      data-testid="project-card"
      className="group flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition-all duration-150 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      {/* Header: icon + name + status badge */}
      <div className="flex items-start gap-3">
        {/* Project icon */}
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold select-none"
          style={{ background: softBg, color: accentColor }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {project.name}
          </h3>
          {project.key && (
            <span className="v-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-px rounded">
              {project.key}
            </span>
          )}
        </div>

        <Badge variant={statusCfg.variant} className="shrink-0 text-[10px]">
          {statusCfg.label}
        </Badge>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed -mt-1">
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Progress</span>
          <span className="text-[10px] font-semibold v-num" style={{ color: progress === 100 ? 'var(--status-done)' : 'var(--text)' }}>
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Footer: members + due date */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {visibleMembers.map((m) => {
              const initials = `${m.user.firstName[0] ?? ''}${m.user.lastName[0] ?? ''}`.toUpperCase();
              return (
                <Avatar key={m.id} className="h-6 w-6 ring-2 ring-[var(--bg)]">
                  {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} alt={initials} />}
                  <AvatarFallback
                    className="text-[8px] font-bold"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
          {extraMembers > 0 && (
            <span className="text-[10px] font-medium text-[var(--text-muted)]">+{extraMembers}</span>
          )}
          {project.members.length === 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Users className="h-3 w-3" />
              No members
            </span>
          )}
        </div>

        {project.endDate && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] v-num">
            <Calendar className="h-3 w-3" />
            {format(new Date(project.endDate), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Restore action */}
      {showRestore && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-1"
          disabled={restore.isPending}
          onClick={(e) => { e.preventDefault(); restore.mutate(); }}
        >
          <ArchiveRestore className="h-3.5 w-3.5" />
          {restore.isPending ? 'Restoring…' : 'Restore project'}
        </Button>
      )}
    </Link>
  );
}
