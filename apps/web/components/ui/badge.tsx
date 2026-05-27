import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'muted';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        {
          default: 'bg-[var(--primary-softer)] text-[var(--primary)]',
          success: 'bg-[var(--success-soft)] text-[var(--success)]',
          warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
          error: 'bg-[var(--error-soft)] text-[var(--error)]',
          muted: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
