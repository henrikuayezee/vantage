import { type ElementType } from 'react';
import { Minus, ArrowUp, ChevronsUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Priority } from '@vantage/types';

interface PriorityConfig {
  label: string;
  icon: ElementType;
  color: string;
  bg: string;
}

const CONFIG: Record<Priority, PriorityConfig> = {
  [Priority.LOW]: {
    label: 'Low',
    icon: Minus,
    color: 'var(--p-low)',
    bg: 'rgba(100, 116, 139, 0.1)',
  },
  [Priority.MEDIUM]: {
    label: 'Medium',
    icon: ArrowUp,
    color: 'var(--p-medium)',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  [Priority.HIGH]: {
    label: 'High',
    icon: ChevronsUp,
    color: 'var(--p-high)',
    bg: 'rgba(249, 115, 22, 0.12)',
  },
  [Priority.CRITICAL]: {
    label: 'Critical',
    icon: Zap,
    color: 'var(--p-critical)',
    bg: 'rgba(220, 38, 38, 0.12)',
  },
};

export function TaskPriorityBadge({
  priority,
  compact = false,
  className,
}: {
  priority: string;
  compact?: boolean;
  className?: string;
}) {
  const cfg = CONFIG[priority as Priority] ?? {
    label: priority,
    icon: Minus,
    color: 'var(--text-muted)',
    bg: 'transparent',
  };
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        className,
      )}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className={compact ? 'h-2 w-2 shrink-0' : 'h-2.5 w-2.5 shrink-0'} />
      {!compact && cfg.label}
    </span>
  );
}

/* Dot-only variant for kanban cards / compact contexts */
export function PriorityDot({ priority, className }: { priority: string; className?: string }) {
  const cfg = CONFIG[priority as Priority];
  if (!cfg) return null;
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full shrink-0', className)}
      style={{ background: cfg.color }}
      title={cfg.label}
    />
  );
}

export const PRIORITY_DOT: Record<string, string> = {
  [Priority.LOW]:      'bg-[var(--p-low)]',
  [Priority.MEDIUM]:   'bg-[var(--p-medium)]',
  [Priority.HIGH]:     'bg-[var(--p-high)]',
  [Priority.CRITICAL]: 'bg-[var(--p-critical)]',
};
