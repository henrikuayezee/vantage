import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 cursor-default',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:opacity-90',
        secondary:
          'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]',
        ghost: 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        destructive: 'bg-[var(--error)] text-white hover:opacity-90',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-8 px-3 text-sm',
        lg: 'h-9 px-4 text-sm',
        icon: 'h-7 w-7',
        'icon-sm': 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
