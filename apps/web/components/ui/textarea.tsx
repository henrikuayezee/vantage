import { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ref, ...props }: ComponentPropsWithRef<'textarea'>) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
