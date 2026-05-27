'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  Calendar,
  Users,
  LayoutList,
  LayoutGrid,
  GanttChart as GanttChartIcon,
  Flag,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDestructiveItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectMembersPanel } from '@/components/projects/project-members-panel';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { TaskListView } from '@/components/tasks/task-list-view';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { GanttChart } from '@/components/tasks/gantt-chart';
import { MilestonesPanel } from '@/components/tasks/milestones-panel';
import { projectsApi } from '@/lib/projects-api';
import { useAuthStore } from '@/stores/auth-store';
import { Role, ProjectStatus } from '@vantage/types';

const STATUS_BADGE: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'muted' }
> = {
  [ProjectStatus.UPCOMING]:  { label: 'Upcoming',  variant: 'muted' },
  [ProjectStatus.ACTIVE]:    { label: 'Active',    variant: 'default' },
  [ProjectStatus.ON_HOLD]:   { label: 'On Hold',   variant: 'warning' },
  [ProjectStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [ProjectStatus.ARCHIVED]:  { label: 'Archived',  variant: 'muted' },
};

const SETABLE_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: ProjectStatus.UPCOMING,  label: 'Upcoming' },
  { value: ProjectStatus.ACTIVE,    label: 'Active' },
  { value: ProjectStatus.ON_HOLD,   label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const initialTaskId = searchParams.get('task') ?? undefined;
  const focusComments = searchParams.get('focus') === 'comments';
  const currentUser = useAuthStore((s) => s.user);

  const [showEdit, setShowEdit] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canManage =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.PROJECT_MANAGER;
  const isAdmin = currentUser?.role === Role.ADMIN;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.getStats(id).then((r) => r.data),
    enabled: !!project,
  });

  const archive = useMutation({
    mutationFn: () => projectsApi.archive(id),
    onSuccess: () => {
      setShowArchiveConfirm(false);
      void qc.invalidateQueries({ queryKey: ['project', id] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const setStatus = useMutation({
    mutationFn: (status: ProjectStatus) => projectsApi.update(id, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['project', id] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      router.replace('/projects');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-[var(--surface-2)]" />
        <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
        <div className="h-2 w-full rounded bg-[var(--surface-2)] mt-4" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-[var(--text-muted)]">Project not found.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[project.status as ProjectStatus] ?? {
    label: project.status,
    variant: 'muted' as const,
  };

  // Status → accent color mapping (mirrors project-card.tsx)
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

  const accentColor = STATUS_ACCENT[project.status] ?? 'var(--text-muted)';
  const softBg = STATUS_SOFT[project.status] ?? 'var(--surface-2)';
  const projectInitial = project.name.trim()[0]?.toUpperCase() ?? '?';
  const hasMetadata = !!(project.startDate || project.endDate || project.members.length > 0 || (stats && stats.total > 0));

  return (
    <div>
      {/* ── Back button ───────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="group inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Projects
      </button>

      {/* ── Project header ────────────────────────────────────────────── */}
      <div
        className="rounded-xl border border-[var(--border)] p-5 mb-5"
        style={{ background: 'var(--bg)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div className="flex items-start gap-4">
          {/* Project icon */}
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold select-none"
            style={{ background: softBg, color: accentColor }}
          >
            {projectInitial}
          </div>

          {/* Title + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-[17px] font-semibold text-[var(--text)]">{project.name}</h1>
              {project.key && (
                <span className="v-mono text-[11px] px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  {project.key}
                </span>
              )}
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            {project.description && (
              <p className="text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Actions */}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" title="Project options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set status</DropdownMenuLabel>
                {SETABLE_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    disabled={project.status === s.value || setStatus.isPending}
                    onClick={() => setStatus.mutate(s.value)}
                  >
                    {project.status === s.value && <span className="mr-1">✓</span>}
                    {s.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {project.status !== ProjectStatus.ARCHIVED && (
                  <DropdownMenuItem onClick={() => setShowArchiveConfirm(true)}>
                    <Archive className="h-3.5 w-3.5" />
                    Archive project
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuDestructiveItem onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete project
                    </DropdownMenuDestructiveItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* ── Metadata strip ─────────────────────────────────────────── */}
        {hasMetadata && (
          <div
            className="flex items-center gap-4 flex-wrap mt-4 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {(project.startDate || project.endDate) && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : '—'}
                {project.endDate && (
                  <> — {format(new Date(project.endDate), 'MMM d, yyyy')}</>
                )}
              </span>
            )}

            {project.members.length > 0 && (
              <>
                {(project.startDate || project.endDate) && (
                  <div className="h-3.5 w-px" style={{ background: 'var(--border)' }} />
                )}
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </span>
              </>
            )}

            {stats && stats.total > 0 && (
              <>
                <div className="h-3.5 w-px" style={{ background: 'var(--border)' }} />
                <div className="flex items-center gap-2.5">
                  <Progress value={stats.progress} className="h-1.5 w-28" />
                  <span className="text-xs font-medium v-num" style={{ color: 'var(--text-muted)' }}>
                    {stats.counts['DONE'] ?? 0}/{stats.total} tasks · {stats.progress}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">
            <span className="flex items-center gap-1.5">
              <LayoutList className="h-3.5 w-3.5" />
              Tasks
            </span>
          </TabsTrigger>
          <TabsTrigger value="board">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </span>
          </TabsTrigger>
          <TabsTrigger value="gantt">
            <span className="flex items-center gap-1.5">
              <GanttChartIcon className="h-3.5 w-3.5" />
              Gantt
            </span>
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <span className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" />
              Milestones
            </span>
          </TabsTrigger>
          <TabsTrigger value="members">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Members
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="pt-5">
          <TaskListView projectId={id} members={project.members} initialTaskId={initialTaskId} focusComments={focusComments} />
        </TabsContent>

        <TabsContent value="board" className="pt-5">
          <KanbanBoard projectId={id} members={project.members} />
        </TabsContent>

        <TabsContent value="gantt" className="pt-5">
          <GanttChart projectId={id} />
        </TabsContent>

        <TabsContent value="milestones" className="pt-5">
          <MilestonesPanel projectId={id} />
        </TabsContent>

        <TabsContent value="members" className="pt-5">
          <ProjectMembersPanel project={project} />
        </TabsContent>
      </Tabs>

      {/* Edit modal */}
      {showEdit && <EditProjectModal project={project} onClose={() => setShowEdit(false)} />}

      {/* Archive confirm */}
      {showArchiveConfirm && (
        <Dialog open onOpenChange={(open) => !open && setShowArchiveConfirm(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Archive project?</DialogTitle>
              <DialogDescription>
                Archiving will mark the project as inactive. You can restore it later by editing
                the project status.
              </DialogDescription>
            </DialogHeader>
            <DialogBody />
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setShowArchiveConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={archive.isPending}
                onClick={() => archive.mutate()}
              >
                {archive.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{project.name}</strong> and all its tasks,
                comments, and attachments. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogBody />
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteProject.isPending}
                onClick={() => deleteProject.mutate()}
              >
                {deleteProject.isPending ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ComingSoonPlaceholder({ label, phase }: { label: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-[var(--border)]">
      <p className="text-sm font-medium text-[var(--text)]">{label}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">Coming in {phase}</p>
    </div>
  );
}
