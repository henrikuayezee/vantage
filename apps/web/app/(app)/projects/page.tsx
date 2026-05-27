'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { projectsApi } from '@/lib/projects-api';
import { useAuthStore } from '@/stores/auth-store';
import { Role, ProjectStatus } from '@vantage/types';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'All',       value: 'ALL' },
  { label: 'Upcoming',  value: ProjectStatus.UPCOMING },
  { label: 'Active',    value: ProjectStatus.ACTIVE },
  { label: 'On Hold',   value: ProjectStatus.ON_HOLD },
  { label: 'Completed', value: ProjectStatus.COMPLETED },
  { label: 'Archived',  value: ProjectStatus.ARCHIVED },
] as const;

type FilterValue = (typeof STATUS_FILTERS)[number]['value'];

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('ALL');

  const canCreate = user?.role === Role.ADMIN || user?.role === Role.PROJECT_MANAGER;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  });

  const filtered =
    filter === 'ALL'
      ? projects.filter((p) => p.status !== ProjectStatus.ARCHIVED && p.status !== ProjectStatus.UPCOMING)
      : projects.filter((p) => p.status === filter);

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--text)]">Projects</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isLoading ? '…' : filtered.length}{' '}
            {filter === 'ALL' ? '' : filter.charAt(0) + filter.slice(1).toLowerCase().replace('_', ' ') + ' '}
            project{filtered.length !== 1 ? 's' : ''}{' '}
            {user?.role === Role.DEVELOPER ? "you're a member of" : 'in your organization'}
          </p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            className="h-9 px-4 rounded-xl text-xs gap-1.5 font-semibold"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </Button>
        )}
      </div>

      {/* ── Status filter pills ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'inline-flex items-center h-8 px-3 rounded-xl border text-xs font-medium transition-all',
              filter === f.value
                ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-[var(--border)] animate-pulse"
              style={{ background: 'var(--surface)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--surface-2)' }}
          >
            <FolderKanban className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">
            {filter === 'ALL' ? 'No projects yet' : `No ${filter.toLowerCase().replace('_', ' ')} projects`}
          </p>
          {canCreate && filter === 'ALL' && (
            <>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-xs leading-relaxed">
                Create your first project to start tracking tasks and milestones.
              </p>
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl text-xs gap-1.5 font-semibold"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                New project
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={project.progress}
              showRestore={filter === ProjectStatus.ARCHIVED}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
