'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@vantage/types';
import { DeveloperDashboard } from '@/components/dashboard/developer-dashboard';
import { PmDashboard } from '@/components/dashboard/pm-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

function getGreeting(firstName?: string): string {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return firstName ? `${salutation}, ${firstName}` : salutation;
}

const ROLE_SUBTITLE: Record<Role, string> = {
  [Role.ADMIN]:           "Here's an overview of your organization.",
  [Role.PROJECT_MANAGER]: "Here's what needs your attention today.",
  [Role.DEVELOPER]:       "Here's what's on your plate.",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role as Role | undefined;

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[17px] font-semibold text-[var(--text)]">
          {getGreeting(user?.firstName)}
        </h1>
        {role && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {ROLE_SUBTITLE[role]}
          </p>
        )}
      </div>

      {/* ── Role dashboard ───────────────────────────────────────────── */}
      {!user ? (
        <LoadingSkeleton />
      ) : (
        <>
          {role === Role.ADMIN          && <AdminDashboard />}
          {role === Role.PROJECT_MANAGER && <PmDashboard />}
          {role === Role.DEVELOPER       && <DeveloperDashboard />}
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-56 rounded-xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
