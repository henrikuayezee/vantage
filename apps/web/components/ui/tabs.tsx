'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex items-center gap-0 border-b border-[var(--border)]',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative px-4 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors',
        'hover:text-[var(--text)]',
        'data-[state=active]:text-[var(--primary)]',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t',
        'data-[state=active]:after:bg-[var(--primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
