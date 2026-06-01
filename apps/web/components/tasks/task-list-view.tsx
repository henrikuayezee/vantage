'use client';

import { useState, type ElementType } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import {
  Plus, Search, ChevronDown, Filter, X, Clock,
  Circle, Timer, Eye, CheckCircle2,
  ArrowUp, ArrowDown, ChevronsUpDown,
  MessageSquare, GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskDrawer } from './task-drawer';
import { CreateTaskModal } from './create-task-modal';
import { TaskPriorityBadge } from './task-priority-badge';
import { STATUS_CONFIG } from './task-status-select';
import { tasksApi, formatTaskId, type Task, type TaskFilters } from '@/lib/tasks-api';
import type { ProjectMember } from '@/lib/projects-api';
import { useAuthStore } from '@/stores/auth-store';
import { TaskStatus, Priority, Role } from '@vantage/types';
import { cn } from '@/lib/utils';

// ─── Types & constants ────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  members: ProjectMember[];
  initialTaskId?: string;
  focusComments?: boolean;
}

// [status-dot] [key] [title] [priority] [owner] [due]
const GRID_COLS = '20px 88px 1fr 84px 32px 72px';

const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];

interface GroupConfig {
  label: string;
  icon: ElementType;
  color: string;   // CSS variable reference
  bg: string;      // CSS variable reference for soft background
}

const GROUP_CONFIG: Record<TaskStatus, GroupConfig> = {
  [TaskStatus.IN_PROGRESS]: {
    label: 'In progress',
    icon: Timer,
    color: 'var(--status-progress)',
    bg: 'var(--status-progress-bg)',
  },
  [TaskStatus.REVIEW]: {
    label: 'Review',
    icon: Eye,
    color: 'var(--status-review)',
    bg: 'var(--status-review-bg)',
  },
  [TaskStatus.TODO]: {
    label: 'To do',
    icon: Circle,
    color: 'var(--status-todo)',
    bg: 'var(--status-todo-bg)',
  },
  [TaskStatus.BACKLOG]: {
    label: 'Backlog',
    icon: Circle,
    color: 'var(--status-backlog)',
    bg: 'var(--status-backlog-bg)',
  },
  [TaskStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'var(--status-done)',
    bg: 'var(--status-done-bg)',
  },
};

type SortField = 'number' | 'priority' | 'title' | 'dueDate';

// ─── Small reusable pieces ────────────────────────────────────────────────────

function ColHeader({
  field, label, sortBy, sortDir, onSort, align = 'left',
}: {
  field: SortField; label: string; sortBy: string; sortDir: 'asc' | 'desc';
  onSort: (f: SortField) => void; align?: 'left' | 'right';
}) {
  const isActive = sortBy === field;
  const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'group flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors',
        isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
        align === 'right' ? 'justify-end' : 'justify-start',
      )}
    >
      {label}
      <Icon className={cn(
        'h-3 w-3 shrink-0 transition-opacity',
        isActive ? 'opacity-100 text-[var(--primary)]' : 'opacity-0 group-hover:opacity-60',
      )} />
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {([TaskStatus.IN_PROGRESS, TaskStatus.TODO, TaskStatus.BACKLOG] as TaskStatus[]).map((s) => (
        <div key={s} className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
          {/* header skeleton */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]" style={{ background: 'var(--surface)' }}>
            <div className="h-3.5 w-3.5 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
            <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
          </div>
          {/* row skeletons */}
          {[0.65, 0.85, 0.5].map((w, i) => (
            <div
              key={i}
              className="grid items-center gap-x-3 px-4 py-3 border-t border-[var(--border)]"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3 w-14 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3 rounded animate-pulse" style={{ background: 'var(--surface-2)', width: `${w * 100}%` }} />
              <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-6 w-6 rounded-full animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="h-3 w-12 rounded animate-pulse ml-auto" style={{ background: 'var(--surface-2)' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--surface-2)' }}
      >
        <Filter className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>No matching tasks</p>
      <p className="text-xs mb-5 max-w-[240px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Try adjusting or clearing your active filters.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
        style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}
      >
        <X className="h-3.5 w-3.5" />
        Clear filters
      </button>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task, statusColor, onClick, isSubtask = false,
}: {
  task: Task; statusColor: string; onClick: () => void; isSubtask?: boolean;
}) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== TaskStatus.DONE;
  const isDone = task.status === TaskStatus.DONE;
  const taskId = formatTaskId(task);

  return (
    <button
      className={cn(
        'group grid w-full items-center gap-x-3 px-4 py-2.5 text-left',
        'transition-colors duration-100',
        isSubtask
          ? 'hover:bg-[var(--surface-2)]'
          : 'hover:bg-[var(--surface)]',
      )}
      style={{
        gridTemplateColumns: GRID_COLS,
        background: isSubtask ? 'var(--surface)' : undefined,
      }}
      onClick={onClick}
    >
      {/* Status dot */}
      <div className="flex justify-center">
        <span
          className="h-[7px] w-[7px] rounded-full shrink-0 transition-opacity"
          style={{ background: statusColor, opacity: isDone ? 0.35 : 0.75 }}
        />
      </div>

      {/* KEY */}
      <span
        className={cn(
          'v-mono text-[10px] truncate transition-colors',
          isSubtask ? 'pl-4 text-[var(--text-subtle)]' : 'text-[var(--text-muted)]',
        )}
      >
        {taskId ?? '—'}
      </span>

      {/* TITLE + inline badges */}
      <div className="min-w-0 flex items-center gap-2">
        {isSubtask && (
          <span className="shrink-0 text-[10px] font-mono select-none" style={{ color: 'var(--text-subtle)' }}>
            ↳
          </span>
        )}
        <span
          className={cn(
            'text-[13px] font-medium truncate transition-colors group-hover:text-[var(--primary)]',
            isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]',
          )}
          title={task.title}
        >
          {task.title}
        </span>

        {!isSubtask && task._count.subTasks > 0 && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold rounded px-1.5 py-0.5"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
          >
            <GitBranch className="h-2.5 w-2.5" />
            {task._count.subTasks}
          </span>
        )}

        {task._count.comments > 0 && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold rounded px-1.5 py-0.5"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
          >
            <MessageSquare className="h-2.5 w-2.5" />
            {task._count.comments}
          </span>
        )}
      </div>

      {/* PRIORITY pill */}
      <div>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* OWNER avatar */}
      <div className="flex justify-center">
        {task.assignee ? (
          <Avatar
            className="h-6 w-6 ring-1 ring-[var(--border)]"
            title={`${task.assignee.firstName} ${task.assignee.lastName}`}
          >
            {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} />}
            <AvatarFallback
              className="text-[8px] font-bold"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            >
              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center border border-dashed transition-colors group-hover:border-[var(--border-strong)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <Plus className="h-2.5 w-2.5" style={{ color: 'var(--text-subtle)' }} />
          </div>
        )}
      </div>

      {/* DUE DATE */}
      <div className="flex justify-end">
        {task.dueDate ? (
          <span
            className={cn(
              'text-[10px] font-medium v-num inline-flex items-center gap-1',
              isOverdue
                ? 'text-[var(--error)]'
                : isDone
                  ? 'line-through text-[var(--text-muted)]'
                  : 'text-[var(--text-muted)]',
            )}
          >
            {isOverdue && <Clock className="h-2.5 w-2.5 shrink-0" />}
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>—</span>
        )}
      </div>
    </button>
  );
}

// ─── Subtask rows (fetched on demand) ────────────────────────────────────────

function SubtaskRows({
  projectId, parentTask, statusColor, onTaskClick,
}: {
  projectId: string; parentTask: Task; statusColor: string; onTaskClick: (id: string) => void;
}) {
  const { data: subtasks = [] } = useQuery({
    queryKey: ['tasks', projectId, parentTask.id],
    queryFn: () => tasksApi.getSubTasks(projectId, parentTask.id).then((r) => r.data),
  });

  return (
    <>
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="border-t border-[var(--border)]">
          <TaskRow
            task={subtask}
            statusColor={statusColor}
            onClick={() => onTaskClick(subtask.id)}
            isSubtask
          />
        </div>
      ))}
    </>
  );
}

function TaskRowGroup({
  task, projectId, statusColor, onTaskClick,
}: {
  task: Task; projectId: string; statusColor: string; onTaskClick: (id: string) => void;
}) {
  return (
    <div>
      <TaskRow task={task} statusColor={statusColor} onClick={() => onTaskClick(task.id)} />
      {task._count.subTasks > 0 && (
        <SubtaskRows
          projectId={projectId}
          parentTask={task}
          statusColor={statusColor}
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  );
}

// ─── Status group card ────────────────────────────────────────────────────────

function StatusGroup({
  status, tasks, projectId, isCollapsed, onToggle, onAddTask, onTaskClick, canCreate,
}: {
  status: TaskStatus;
  tasks: Task[];
  projectId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddTask: () => void;
  onTaskClick: (id: string) => void;
  canCreate: boolean;
}) {
  const cfg = GROUP_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      {/* ── Group header ── */}
      <div
        className="group/hdr flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] select-none"
        style={{ background: cfg.bg }}
      >
        {/* Toggle + status identity */}
        <button
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={onToggle}
        >
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--text-muted)',
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          />
          {/* Colored identity dot */}
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: cfg.color }}
          />
          <Icon
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: cfg.color }}
          />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            {cfg.label}
          </span>
          {/* Task count pill */}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)` }}
          >
            {tasks.length}
          </span>
        </button>

        {/* Add task — appears on hover, only for Admins & PMs */}
        {canCreate && (
          <button
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg
                       opacity-0 group-hover/hdr:opacity-100 focus:opacity-100
                       transition-all duration-150
                       hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
            style={{ color: 'var(--text-muted)' }}
            onClick={(e) => { e.stopPropagation(); onAddTask(); }}
          >
            <Plus className="h-3 w-3" />
            Add task
          </button>
        )}
      </div>

      {/* ── Collapsible content — CSS grid-template-rows trick for smooth animation ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {tasks.length === 0 ? (
            <div className="px-4 py-4 text-xs italic" style={{ color: 'var(--text-muted)' }}>
              {canCreate ? (
                <>
                  Nothing here —{' '}
                  <button
                    className="underline hover:no-underline transition-colors"
                    style={{ color: 'var(--primary)' }}
                    onClick={onAddTask}
                  >
                    add a task
                  </button>
                </>
              ) : (
                'Nothing here yet.'
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {tasks.map((task) => (
                <TaskRowGroup
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  statusColor={cfg.color}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TaskListView({ projectId, members, initialTaskId, focusComments }: Props) {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const canCreate = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PROJECT_MANAGER;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId ?? null);
  const [createForStatus, setCreateForStatus] = useState<TaskStatus | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('number');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [collapsed, setCollapsed] = useState<Partial<Record<TaskStatus, boolean>>>({});

  const filters: TaskFilters = {
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
    ...(assigneeFilter && { assigneeId: assigneeFilter }),
    ...(overdueOnly && { overdue: true }),
    ...(search && { search }),
    sortBy,
    sortDir,
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => tasksApi.list(projectId, filters).then((r) => r.data),
  });

  const hasFilters = !!(statusFilter || priorityFilter || assigneeFilter || overdueOnly || search);
  const activeFilterCount = [statusFilter, priorityFilter, assigneeFilter, overdueOnly ? 'x' : ''].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setPriorityFilter('');
    setAssigneeFilter(''); setOverdueOnly(false);
  };

  const handleColSort = (field: SortField) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  };

  // Open the correct group when creating a task for a specific status
  const handleAddTaskForStatus = (status: TaskStatus) => {
    setCreateForStatus(status);
    setCollapsed((prev) => ({ ...prev, [status]: false }));
  };

  const groups = STATUS_ORDER
    .map((status) => ({ status, tasks: tasks.filter((t) => t.status === status) }))
    .filter((g) => g.tasks.length > 0 || !hasFilters);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <Input
            className="pl-9 h-9 text-sm rounded-xl border-[var(--border)] bg-[var(--surface)]"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className={cn(
            'h-9 text-xs rounded-xl px-3 w-auto min-w-[108px] transition-all',
            statusFilter
              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-semibold'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
          )}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select value={priorityFilter || '_all'} onValueChange={(v) => setPriorityFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className={cn(
            'h-9 text-xs rounded-xl px-3 w-auto min-w-[108px] transition-all',
            priorityFilter
              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-semibold'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
          )}>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All priorities</SelectItem>
            {Object.values(Priority).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Assignee filter */}
        <Select value={assigneeFilter || '_all'} onValueChange={(v) => setAssigneeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className={cn(
            'h-9 text-xs rounded-xl px-3 w-auto min-w-[108px] transition-all',
            assigneeFilter
              ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-semibold'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
          )}>
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All members</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.user.firstName} {m.user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Overdue toggle */}
        <button
          onClick={() => setOverdueOnly((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-all shrink-0',
            overdueOnly
              ? 'bg-[var(--error-soft)] border-[var(--error)] text-[var(--error)]'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]',
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Overdue
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-3 w-3" />
            Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        )}

        {/* New task CTA — Admins & PMs only */}
        {canCreate && (
          <Button
            size="sm"
            className="h-9 px-4 rounded-xl text-xs gap-1.5 ml-auto shrink-0 font-semibold"
            onClick={() => handleAddTaskForStatus(TaskStatus.TODO)}
          >
            <Plus className="h-3.5 w-3.5" />
            New task
          </Button>
        )}
      </div>

      {/* ── Column headers ───────────────────────────────────────────────── */}
      {!isLoading && tasks.length > 0 && (
        <div
          className="grid items-center gap-x-3 px-4"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <span /> {/* dot column — no label */}
          <ColHeader field="number"   label="Key"      sortBy={sortBy} sortDir={sortDir} onSort={handleColSort} />
          <ColHeader field="title"    label="Title"    sortBy={sortBy} sortDir={sortDir} onSort={handleColSort} />
          <ColHeader field="priority" label="Priority" sortBy={sortBy} sortDir={sortDir} onSort={handleColSort} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
            Owner
          </span>
          <ColHeader field="dueDate" label="Due" sortBy={sortBy} sortDir={sortDir} onSort={handleColSort} align="right" />
        </div>
      )}

      {/* ── Status groups / loading / empty ──────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : groups.length === 0 ? (
        <EmptyFiltered onClear={clearFilters} />
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map(({ status, tasks: groupTasks }) => (
            <StatusGroup
              key={status}
              status={status}
              tasks={groupTasks}
              projectId={projectId}
              isCollapsed={!!collapsed[status]}
              onToggle={() => setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))}
              onAddTask={() => handleAddTaskForStatus(status)}
              onTaskClick={setSelectedTaskId}
              canCreate={canCreate}
            />
          ))}
        </div>
      )}

      {/* Task count footer */}
      {!isLoading && tasks.length > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}{hasFilters && ' matching filters'}
        </p>
      )}

      {/* ── Panels ───────────────────────────────────────────────────────── */}
      {selectedTaskId && (
        <TaskDrawer
          projectId={projectId}
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          scrollToComments={focusComments}
        />
      )}

      {createForStatus !== null && (
        <CreateTaskModal
          projectId={projectId}
          defaultStatus={createForStatus}
          onClose={() => {
            setCreateForStatus(null);
            void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
          }}
        />
      )}
    </div>
  );
}
