'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { KanbanCard, KanbanCardInner } from './kanban-card';
import { CreateTaskModal } from './create-task-modal';
import { TaskDrawer } from './task-drawer';
import { STATUS_CONFIG } from './task-status-select';
import { tasksApi, type Task } from '@/lib/tasks-api';
import { useAuthStore } from '@/stores/auth-store';
import { TaskStatus, Role } from '@vantage/types';
import { cn } from '@/lib/utils';
import type { ProjectMember } from '@/lib/projects-api';

const COLUMNS: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];

interface Props {
  projectId: string;
  members: ProjectMember[];
}

export function KanbanBoard({ projectId, members }: Props) {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const canCreate = currentUser?.role === Role.ADMIN || currentUser?.role === Role.PROJECT_MANAGER;
  const snapshotRef = useRef<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createInColumn, setCreateInColumn] = useState<TaskStatus | null>(null);

  const { data: fetchedTasks = [], isLoading } = useQuery({
    queryKey: ['tasks-board', projectId],
    queryFn: () =>
      tasksApi.list(projectId, {}).then((r) =>
        r.data.filter((t) => !t.parentTaskId),
      ),
    refetchInterval: 30_000,
  });

  const displayedTasks = localTasks ?? fetchedTasks;

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((col) => { map[col] = []; });
    displayedTasks.forEach((task) => {
      if (map[task.status]) map[task.status].push(task);
    });
    COLUMNS.forEach((col) => {
      map[col].sort((a, b) => a.position - b.position);
    });
    return map;
  }, [displayedTasks]);

  const findColumn = (id: string): string | undefined => {
    if ((COLUMNS as string[]).includes(id)) return id;
    return displayedTasks.find((t) => t.id === id)?.status;
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const base = [...fetchedTasks];
    snapshotRef.current = base;
    setLocalTasks(base);
    setActiveTask(base.find((t) => t.id === String(active.id)) ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setLocalTasks((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((t) => t.id === activeId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], status: overCol as TaskStatus };
      return updated;
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);

    if (!over) {
      setLocalTasks(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const snapshot = snapshotRef.current;
    const originalTask = snapshot.find((t) => t.id === activeId);
    if (!originalTask) { setLocalTasks(null); return; }

    const newStatus = (findColumn(overId) ?? originalTask.status) as TaskStatus;
    const statusChanged = newStatus !== originalTask.status;
    const committed = localTasks ?? snapshot;

    setLocalTasks(null);

    if (statusChanged) {
      qc.setQueryData(['tasks-board', projectId], (old: Task[] | undefined) =>
        old ? old.map((t) => t.id === activeId ? { ...t, status: newStatus } : t) : old,
      );
      tasksApi.updateStatus(projectId, activeId, newStatus).then(() => {
        void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
        void qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
        void qc.invalidateQueries({ queryKey: ['project', projectId] });
      }).catch(() => {
        qc.setQueryData(['tasks-board', projectId], snapshot);
        toast.error('Failed to move task — changes reverted.');
      });
    } else {
      // Within-column reorder
      const colTasks = committed
        .filter((t) => t.status === newStatus)
        .sort((a, b) => a.position - b.position);
      const activeIdx = colTasks.findIndex((t) => t.id === activeId);
      const overIdx = colTasks.findIndex((t) => t.id === overId);

      if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
        const reordered = arrayMove(colTasks, activeIdx, overIdx);
        const above = reordered[overIdx - 1];
        const below = reordered[overIdx + 1];
        let newPos: number;
        if (!above && !below) newPos = 1000;
        else if (!above) newPos = below!.position > 1000 ? below!.position - 1000 : below!.position / 2;
        else if (!below) newPos = above.position + 1000;
        else newPos = Math.round((above.position + below.position) / 2);

        qc.setQueryData(['tasks-board', projectId], (old: Task[] | undefined) =>
          old ? old.map((t) => t.id === activeId ? { ...t, position: newPos } : t) : old,
        );
        tasksApi.updatePosition(projectId, activeId, newPos).catch(() => {
          qc.setQueryData(['tasks-board', projectId], snapshot);
          toast.error('Failed to reorder task — changes reverted.');
        });
      }
    }
  }

  const handleMarkDone = (taskId: string) => {
    const task = displayedTasks.find((t) => t.id === taskId);
    if (!task || task.status === TaskStatus.DONE) return;

    qc.setQueryData(['tasks-board', projectId], (old: Task[] | undefined) =>
      old ? old.map((t) => t.id === taskId ? { ...t, status: TaskStatus.DONE } : t) : old,
    );
    tasksApi.updateStatus(projectId, taskId, TaskStatus.DONE).then(() => {
      void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      void qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
      void qc.invalidateQueries({ queryKey: ['project', projectId] });
    }).catch(() => {
      void qc.invalidateQueries({ queryKey: ['tasks-board', projectId] });
      toast.error('Failed to mark task as done.');
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col} className="w-60 shrink-0 space-y-2">
            <div className="h-5 w-24 rounded animate-pulse bg-[var(--surface-2)]" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg animate-pulse bg-[var(--surface-2)]" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 min-h-[400px]">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] ?? []}
              onCardClick={setSelectedTaskId}
              onMarkDone={handleMarkDone}
              onAddTask={() => setCreateInColumn(status)}
              canCreate={canCreate}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTask && (
            <div className="w-60 bg-[var(--bg)] border border-[var(--primary-soft)] rounded-lg p-3 shadow-[var(--shadow-lg)] rotate-1 cursor-grabbing">
              <KanbanCardInner task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTaskId && (
        <TaskDrawer
          projectId={projectId}
          taskId={selectedTaskId}
          onClose={() => {
            setSelectedTaskId(null);
            void qc.invalidateQueries({ queryKey: ['tasks-board', projectId] });
          }}
        />
      )}

      {createInColumn && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => {
            setCreateInColumn(null);
            void qc.invalidateQueries({ queryKey: ['tasks-board', projectId] });
            void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
          }}
        />
      )}
    </>
  );
}

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick: (id: string) => void;
  onMarkDone: (id: string) => void;
  onAddTask: () => void;
  canCreate: boolean;
}

function KanbanColumn({ status, tasks, onCardClick, onMarkDone, onAddTask, canCreate }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];
  const itemIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-60 shrink-0" data-testid={`kanban-column-${status}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-semibold', config.className)}>
            {config.label}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] rounded-full px-1.5 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        {canCreate && (
          <button
            onClick={onAddTask}
            aria-label="New task"
            className="h-5 w-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            title={`Add to ${config.label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 space-y-2 transition-colors duration-150',
          isOver
            ? 'bg-[var(--primary-softer)] ring-1 ring-[var(--primary-soft)]'
            : 'bg-[var(--surface)]',
        )}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task.id)}
              onMarkDone={onMarkDone}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)]">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
