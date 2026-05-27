'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus } from '@vantage/types';
import { cn } from '@/lib/utils';

export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  [TaskStatus.BACKLOG]:     { label: 'Backlog',     className: 'text-[var(--status-backlog)]' },
  [TaskStatus.TODO]:        { label: 'To Do',       className: 'text-[var(--status-todo)]' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', className: 'text-[var(--status-progress)]' },
  [TaskStatus.REVIEW]:      { label: 'In Review',   className: 'text-[var(--status-review)]' },
  [TaskStatus.DONE]:        { label: 'Done',        className: 'text-[var(--status-done)]' },
};

export function TaskStatusSelect({
  value,
  onChange,
  className,
}: {
  value: TaskStatus;
  onChange: (v: TaskStatus) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaskStatus)}>
      <SelectTrigger className={cn('h-7 text-xs', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <SelectItem key={k} value={k}>
            <span className={v.className}>{v.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
