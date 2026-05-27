'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authApi } from '@/lib/auth-api';
import { Role } from '@vantage/types';

interface NavItemDef {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: Role[];
}

const navItems: NavItemDef[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/reports', icon: BarChart2, label: 'Reports', roles: [Role.ADMIN, Role.PROJECT_MANAGER] },
  { href: '/admin/users', icon: Users, label: 'Users', roles: [Role.ADMIN] },
];

const bottomItems: NavItemDef[] = [
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings/profile', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'VU';

  const userRole = user?.role as Role | undefined;
  const visibleNav = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole)),
  );

  const handleLogout = async () => {
    await authApi.logout().catch(() => null);
    clearAuth();
    router.replace('/login');
  };

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
      className="relative flex h-full flex-col border-r border-[var(--border)] bg-[var(--bg)] transition-all duration-200"
    >
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center px-3 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold text-[var(--text)] truncate">Vantage</span>
          )}
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-1.5 py-2 space-y-0.5">
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <NavItem
              key={href}
              href={href}
              icon={Icon}
              label={label}
              active={active}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-[var(--border)] px-1.5 py-2 space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            active={pathname === href}
            collapsed={collapsed}
          />
        ))}

        {/* Logout */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                'group flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--error)] transition-colors',
                collapsed && 'justify-center px-0 w-9 mx-auto',
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Log out</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Log out</TooltipContent>}
        </Tooltip>

        {/* User */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded px-2 py-1.5 mt-1',
            collapsed && 'justify-center px-0',
          )}
        >
          <Avatar className="h-6 w-6 shrink-0">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={initials} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text)] truncate">
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[calc(var(--topbar-height)/2-12px)] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-sm)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon: Icon, label, active, collapsed }: NavItemProps) {
  const link = (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors',
        collapsed && 'justify-center px-0 w-9 mx-auto',
        active
          ? 'bg-[var(--primary-softer)] text-[var(--primary)] font-medium'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-[var(--primary)]" />
      )}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
