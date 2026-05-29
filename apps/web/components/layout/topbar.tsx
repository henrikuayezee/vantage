'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Sun, Moon, User, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDestructiveItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { notificationsApi } from '@/lib/notifications-api';
import { authApi } from '@/lib/auth-api';

interface TopbarProps {
  breadcrumb?: React.ReactNode;
}

export function Topbar({ breadcrumb }: TopbarProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    clearAuth();
    router.replace('/login');
  };

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Vantage User';

  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });

  const unreadCount = countData?.count ?? 0;

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'VU';

  return (
    <header
      className="relative flex h-[var(--topbar-height)] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-4"
      style={{ zIndex: 20 }}
    >
      {/* Decorative teal gradient bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 60%, transparent 100%)',
          opacity: 0.5,
        }}
      />

      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {breadcrumb ?? (
          <span className="text-sm font-medium text-[var(--text-muted)]">Vantage</span>
        )}
      </div>

      {/* Center — search trigger */}
      <div className="flex-1 flex justify-center max-w-xs">
        <button
          className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors w-full max-w-[220px]"
          aria-label="Open search"
          onClick={() => window.dispatchEvent(new Event('open-search'))}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Search…</span>
          <kbd className="text-[10px] text-[var(--text-subtle)] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Right — actions */}
      <div className="flex-1 flex items-center justify-end gap-1">
        {/* Theme toggle */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <div className="relative">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                onClick={() => setShowNotifications((v) => !v)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-0.5 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User avatar + account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-7 w-7 cursor-pointer" aria-label="Account menu">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={initials} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuLabel className="normal-case">
              <span className="block truncate text-sm font-medium text-[var(--text)]">
                {fullName}
              </span>
              {user?.email && (
                <span className="block truncate text-xs font-normal text-[var(--text-muted)]">
                  {user.email}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/settings/profile')}>
              <User className="h-4 w-4 text-[var(--text-muted)]" />
              Profile settings
            </DropdownMenuItem>
            <DropdownMenuDestructiveItem onSelect={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuDestructiveItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
