'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { usersApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { SearchModal } from '@/components/search/search-modal';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function AppShell({ children, breadcrumb }: AppShellProps) {
  const router = useRouter();

  useEffect(() => {
    // Access token is in-memory only — lost on every page load/refresh.
    // Re-fetch the user profile on mount so role-gated UI renders correctly.
    // The API client's 401 interceptor will automatically refresh the token first.
    if (useAuthStore.getState().user) return;
    usersApi.me()
      .then(({ data }) => useAuthStore.getState().setUser(data))
      .catch(() => {
        useAuthStore.getState().clearAuth();
        router.replace('/login');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeProvider>
      <TooltipProvider>
        <SearchModal />
        <div className="flex h-full w-full overflow-hidden bg-[var(--bg)]">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <Topbar breadcrumb={breadcrumb} />
            <main className="flex-1 overflow-y-auto bg-[var(--surface)] p-4 md:p-6">
              <div className="mx-auto w-full max-w-[72rem]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
