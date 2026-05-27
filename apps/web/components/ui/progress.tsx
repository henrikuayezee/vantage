'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--primary)] transition-all duration-300"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
