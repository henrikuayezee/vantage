'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}
