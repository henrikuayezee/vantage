'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import {
  X, Pencil, Trash2, Plus, Link2, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatusSelect, STATUS_CONFIG } from './task-status-select';
import { TaskComments } from './task-comments';
import { CreateTaskModal } from './create-task-modal';
import { tasksApi, milestonesApi, formatTaskId, type Task } from '@/lib/tasks-api';
import { projectsApi } from '@/lib/projects-api';
import { Priority, Role, TaskStatus } from '@vantage/types';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Low',
  [Priority.MEDIUM]: 'Medium',
  [Priority.HIGH]: 'High',
  [Priority.CRITICAL]: 'Critical',
};

interface Props {
  projectId: string;
  taskId: string;
  onClose: () => void;
  scrollToComments?: boolean;
}

export function TaskDrawer({ projectId, taskId: rootTaskId, onClose, scrollToComments }: Props) {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isDeveloper = currentUser?.role === Role.DEVELOPER;

  const commentsRef = useRef<HTMLDivElement>(null);

  const [taskStack, setTaskStack] = useState<string[]>([rootTaskId]);
  const taskId = taskStack[taskStack.length - 1];
  const canGoBack = taskStack.length > 1;

  const [editing, setEditing] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [addingDep, setAddingDep] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getById(projectId, taskId).then((r) => r.data),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.getById(projectId).then((r) => r.data.members),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.list(projectId).then((r) => r.data),
  });

  // All project tasks — used for the dependency picker
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId).then((r) => r.data),
    enabled: addingDep,
  });

  const update = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[2]) =>
      tasksApi.update(projectId, taskId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['task', taskId] });
      void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      void qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
      void qc.invalidateQueries({ queryKey: ['project', projectId] });
      setEditing(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: () => tasksApi.delete(projectId, taskId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      void qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
      if (canGoBack) {
        void qc.invalidateQueries({ queryKey: ['task', taskStack[taskStack.length - 2]] });
        setTaskStack((s) => s.slice(0, -1));
      } else {
        onClose();
      }
    },
  });

  const removeDep = useMutation({
    mutationFn: (depId: string) => tasksApi.removeDependency(projectId, taskId, depId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  const addDep = useMutation({
    mutationFn: (dependsOnTaskId: string) =>
      tasksApi.addDependency(projectId, taskId, dependsOnTaskId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['task', taskId] });
      setAddingDep(false);
    },
  });

  const navigateTo = (id: string) => {
    setEditing(false);
    setAddingDep(false);
    setTaskStack((s) => [...s, id]);
  };

  const goBack = () => {
    setEditing(false);
    setAddingDep(false);
    setTaskStack((s) => s.slice(0, -1));
  };

  const startEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    update.mutate({ title: editTitle, description: editDesc });
  };

  const isOverdue = task?.dueDate && isPast(new Date(task.dueDate)) && task.status !== TaskStatus.DONE;

  useEffect(() => {
    if (scrollToComments && task && commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToComments, task]);

  // Tasks eligible to be added as a dependency: exclude self, existing deps, and own subtasks
  const existingDepIds = new Set(task?.dependencies?.map((d) => d.dependsOn.id) ?? []);
  const eligibleTasks = allTasks.filter(
    (t) => t.id !== taskId && !existingDepIds.has(t.id),
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div data-testid="task-drawer" className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[var(--bg)] border-l border-[var(--border)] shadow-[var(--shadow-lg)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="ghost" size="icon-sm" onClick={goBack} title="Back">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {task && (
              <TaskStatusSelect
                value={task.status}
                onChange={(s) => update.mutate({ status: s })}
                className="w-32"
              />
            )}
            {task && formatTaskId(task) && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                {formatTaskId(task)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isDeveloper && !editing && (
              <Button variant="ghost" size="icon-sm" onClick={startEdit} title="Edit title & description">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {!isDeveloper && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteTask.mutate()}
                title="Delete task"
                disabled={deleteTask.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-[var(--error)]" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-3/4 rounded bg-[var(--surface-2)]" />
              <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
              <div className="h-4 w-2/3 rounded bg-[var(--surface-2)]" />
            </div>
          ) : task ? (
            <>
              {/* Title + description */}
              {editing && !isDeveloper ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-base font-semibold"
                  />
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    placeholder="Description…"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={update.isPending} onClick={saveEdit}>
                      {update.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)] mb-1">
                    {task.title}
                  </h2>
                  {task.description ? (
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">No description</p>
                  )}
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Priority */}
                <MetaField label="Priority">
                  {isDeveloper ? (
                    <span className="text-[var(--text)] px-2 h-7 flex items-center">
                      {PRIORITY_LABELS[task.priority as Priority] ?? task.priority}
                    </span>
                  ) : (
                    <Select
                      value={task.priority}
                      onValueChange={(v) => update.mutate({ priority: v as Priority })}
                    >
                      <SelectTrigger className="h-7 text-xs px-2 border-transparent hover:border-[var(--border)] focus:border-[var(--border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </MetaField>

                {/* Assignee */}
                <MetaField label="Assignee">
                  {isDeveloper ? (
                    <span className="flex items-center gap-1.5 px-2 h-7">
                      {task.assignee ? (
                        <>
                          <Avatar className="h-4 w-4">
                            {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} />}
                            <AvatarFallback className="text-[8px]">
                              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[var(--text)]">{task.assignee.firstName} {task.assignee.lastName}</span>
                        </>
                      ) : (
                        <span className="text-[var(--text-muted)]">Unassigned</span>
                      )}
                    </span>
                  ) : (
                    <Select
                      value={task.assigneeId ?? '__none__'}
                      onValueChange={(v) =>
                        update.mutate({ assigneeId: v === '__none__' ? null : v })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs px-2 border-transparent hover:border-[var(--border)] focus:border-[var(--border)]">
                        <SelectValue placeholder="Unassigned">
                          {task.assignee ? (
                            <span className="flex items-center gap-1.5">
                              <Avatar className="h-4 w-4">
                                {task.assignee.avatarUrl && (
                                  <AvatarImage src={task.assignee.avatarUrl} />
                                )}
                                <AvatarFallback className="text-[8px]">
                                  {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">Unassigned</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs text-[var(--text-muted)]">
                          Unassigned
                        </SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.userId} value={m.userId} className="text-xs">
                            {m.user.firstName} {m.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </MetaField>

                {/* Due date */}
                <MetaField label="Due date">
                  {isDeveloper ? (
                    <span className={cn('px-2 h-7 flex items-center', isOverdue ? 'text-[var(--error)] font-medium' : 'text-[var(--text-muted)]')}>
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                    </span>
                  ) : (
                    <input
                      type="date"
                      className={cn(
                        'h-7 w-full rounded border border-transparent hover:border-[var(--border)] bg-transparent px-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]',
                        isOverdue && 'text-[var(--error)] font-medium',
                      )}
                      value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                      onChange={(e) => update.mutate({ dueDate: e.target.value || null })}
                    />
                  )}
                </MetaField>

                {/* Milestone */}
                <MetaField label="Milestone">
                  {isDeveloper ? (
                    <span className="px-2 h-7 flex items-center">
                      {task.milestone ? (
                        <Badge variant="default" className="text-[9px]">{task.milestone.title}</Badge>
                      ) : (
                        <span className="text-[var(--text-muted)]">None</span>
                      )}
                    </span>
                  ) : (
                    <Select
                      value={task.milestoneId ?? '__none__'}
                      onValueChange={(v) =>
                        update.mutate({ milestoneId: v === '__none__' ? null : v })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs px-2 border-transparent hover:border-[var(--border)] focus:border-[var(--border)]">
                        <SelectValue placeholder="None">
                          {task.milestone ? (
                            <Badge variant="default" className="text-[9px]">
                              {task.milestone.title}
                            </Badge>
                          ) : (
                            <span className="text-[var(--text-muted)]">None</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs text-[var(--text-muted)]">
                          None
                        </SelectItem>
                        {milestones.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </MetaField>

                <MetaField label="Created">
                  <span className="text-[var(--text-muted)]">
                    {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </span>
                </MetaField>

                {!canGoBack && (
                  <MetaField label="Subtasks">
                    <span className="text-[var(--text-muted)]">
                      {task._count.subTasks} task{task._count.subTasks !== 1 ? 's' : ''}
                    </span>
                  </MetaField>
                )}
              </div>

              {/* Subtasks — hidden when viewing a subtask */}
              {!canGoBack && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-[var(--text)]">Subtasks</h3>
                    {!isDeveloper && (
                      <Button variant="ghost" size="sm" onClick={() => setShowAddSubtask(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    )}
                  </div>
                  {task.subTasks && task.subTasks.length > 0 ? (
                    <div className="space-y-1">
                      {task.subTasks.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateTo(sub.id)}
                          className="w-full flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[var(--surface)] text-left cursor-pointer"
                        >
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              sub.status === TaskStatus.DONE
                                ? 'bg-[var(--success)]'
                                : 'bg-[var(--surface-2)] border border-[var(--border)]',
                            )}
                          />
                          <span
                            className={cn(
                              'flex-1 text-[var(--text)] text-xs',
                              sub.status === TaskStatus.DONE && 'line-through text-[var(--text-muted)]',
                            )}
                          >
                            {sub.title}
                          </span>
                          <span
                            className={cn(
                              'text-[10px]',
                              STATUS_CONFIG[sub.status as TaskStatus]?.className,
                            )}
                          >
                            {STATUS_CONFIG[sub.status as TaskStatus]?.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">No subtasks yet.</p>
                  )}
                </div>
              )}

              {/* Dependencies — tasks this task is blocked by */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[var(--text)]">
                    Blocked by
                    <span className="ml-1.5 font-normal text-[var(--text-muted)]">
                      (dependencies)
                    </span>
                  </h3>
                  {!isDeveloper && !addingDep && (
                    <Button variant="ghost" size="sm" onClick={() => setAddingDep(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  )}
                </div>

                {addingDep && (
                  <div className="flex gap-2 mb-2">
                    <Select
                      onValueChange={(v) => addDep.mutate(v)}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Select a task that blocks this one…" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleTasks.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-[var(--text-muted)]">
                            No other tasks available
                          </div>
                        ) : (
                          eligibleTasks.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                              {t.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingDep(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {task.dependencies && task.dependencies.length > 0 ? (
                  <div className="space-y-1">
                    {task.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 bg-[var(--surface)] text-xs"
                      >
                        <Link2 className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                        <span className="flex-1 text-[var(--text)]">{dep.dependsOn.title}</span>
                        <span
                          className={cn(
                            'text-[10px]',
                            STATUS_CONFIG[dep.dependsOn.status as TaskStatus]?.className,
                          )}
                        >
                          {STATUS_CONFIG[dep.dependsOn.status as TaskStatus]?.label}
                        </span>
                        {!isDeveloper && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeDep.mutate(dep.dependsOn.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !addingDep && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {isDeveloper ? 'No dependencies.' : 'No dependencies. Use “Add” to mark tasks that must finish before this one.'}
                    </p>
                  )
                )}
              </div>

              <div ref={commentsRef}>
                <div className="border-t border-[var(--border)]" />
                <TaskComments taskId={taskId} projectId={projectId} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showAddSubtask && (
        <CreateTaskModal
          projectId={projectId}
          parentTaskId={taskId}
          onClose={() => {
            setShowAddSubtask(false);
            void qc.invalidateQueries({ queryKey: ['task', taskId] });
          }}
        />
      )}
    </>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <div className="text-xs">{children}</div>
    </div>
  );
}
