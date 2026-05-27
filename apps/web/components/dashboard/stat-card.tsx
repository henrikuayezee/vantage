import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: 'default' | 'success' | 'warning' | 'danger';
  sub?: string;
  trend?: { label: string; positive?: boolean };
}

const ACCENT = {
  default: { bg: 'var(--primary-soft)',          color: 'var(--primary)' },
  success: { bg: 'var(--success-soft)',           color: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)',           color: 'var(--warning)' },
  danger:  { bg: 'var(--error-soft)',             color: 'var(--error)' },
};

export function StatCard({ label, value, icon: Icon, accent = 'default', sub, trend }: StatCardProps) {
  const cfg = ACCENT[accent];
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 transition-shadow hover:shadow-[var(--shadow-sm)]"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--text-muted)] leading-tight">{label}</p>
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: cfg.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-[var(--text)] leading-none tracking-tight">{value}</p>

        {trend ? (
          <span
            className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold"
            style={{ color: trend.positive ? 'var(--success)' : 'var(--error)' }}
          >
            {trend.positive
              ? <TrendingUp className="h-2.5 w-2.5" />
              : <TrendingDown className="h-2.5 w-2.5" />}
            {trend.label}
          </span>
        ) : sub ? (
          <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}
