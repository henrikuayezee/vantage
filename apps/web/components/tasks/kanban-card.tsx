'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';
import { AlertCircle, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PRIORITY_DOT } from './task-priority-badge';
import { formatTaskId, type Task } from '@/lib/tasks-api';
import { TaskStatus } from '@vantage/types';
import { cn } from '@/lib/utils';

interface CardProps {
  task: Task;
  onClick: () => void;
  onMarkDone?: (taskId: string) => void;
}

export function KanbanCard({ task, onClick, onMarkDone }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="kanban-card"
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick()}
      className={cn(
        'group relative bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3',
        'cursor-grab active:cursor-grabbing select-none',
        'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
        'hover:border-[var(--primary-soft)] transition-all duration-150',
        isDragging && 'opacity-40',
      )}
    >
      {/* Quick-done button — appears on hover, only for non-done tasks */}
      {task.status !== TaskStatus.DONE && onMarkDone && (
        <button
          className="absolute top-2 right-2 h-5 w-5 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-[var(--success)] hover:bg-[var(--success)] hover:text-white transition-all z-10"
          title="Mark as done"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onMarkDone(task.id); }}
        >
          <Check className="h-3 w-3" />
        </button>
      )}

      <KanbanCardInner task={task} />
    </div>
  );
}

export function KanbanCardInner({ task }: { task: Task }) {
  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    task.status !== TaskStatus.DONE;

  return (
    <div className="space-y-2">
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 pr-4">
        <span
          className={cn('mt-[3px] h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])}
        />
        <p
          data-testid="task-title"
          className={cn(
            'text-xs font-medium text-[var(--text)] leading-snug min-w-0',
            task.status === TaskStatus.DONE && 'line-through text-[var(--text-muted)]',
          )}
        >
          {task.title}
        </p>
      </div>

      {/* Milestone badge */}
      {task.milestone && (
        <Badge variant="muted" className="text-[9px] h-4 px-1.5 ml-4">
          {task.milestone.title}
        </Badge>
      )}

      {/* Task ID */}
      {formatTaskId(task) && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] ml-4">
          {formatTaskId(task)}
        </span>
      )}

      {/* Footer: due/overdue + subtask count + assignee */}
      <div className="flex items-center justify-between gap-2 ml-4">
        <div className="flex items-center gap-1.5 min-w-0">
          {isOverdue ? (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--error)] font-medium shrink-0">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          ) : task.dueDate ? (
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          ) : null}

          {task._count.subTasks > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">
              · {task._count.subTasks} sub
            </span>
          )}
        </div>

        {task.assignee && (
          <Avatar
            className="h-5 w-5 shrink-0"
            title={`${task.assignee.firstName} ${task.assignee.lastName}`}
          >
            {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} />}
            <AvatarFallback className="text-[8px]">
              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
