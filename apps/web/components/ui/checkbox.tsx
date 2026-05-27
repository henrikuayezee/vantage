'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border border-[var(--border)] bg-[var(--bg)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        'data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
