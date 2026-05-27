'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { reportsApi } from '@/lib/reports-api';

// ── Colour maps ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  BACKLOG:     '#94a3b8',
  TODO:        '#64748b',
  IN_PROGRESS: '#0D7A75',
  REVIEW:      '#f59e0b',
  DONE:        '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog', TODO: 'To Do', IN_PROGRESS: 'In Progress',
  REVIEW: 'Review', DONE: 'Done',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444',
};

const PROJECT_STATUS_VARIANT: Record<string, 'default' | 'success' | 'muted'> = {
  ACTIVE: 'default', COMPLETED: 'success', ARCHIVED: 'muted',
};

// ── Shared skeleton ──────────────────────────────────────────────────────────
function ChartSkeleton({ h = 220 }: { h?: number }) {
  return <div className="animate-pulse rounded-xl bg-[var(--surface-2)]" style={{ height: h }} />;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      {children}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-medium text-[var(--text)] mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-[var(--text-muted)]">{p.name}: <span className="font-medium text-[var(--text)]">{p.value}</span></p>
      ))}
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: () => reportsApi.getOverview().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const statusData = data?.tasksByStatus.map((r) => ({
    name: STATUS_LABEL[r.status] ?? r.status,
    value: r.count,
    color: STATUS_COLOR[r.status] ?? '#94a3b8',
  })) ?? [];

  const priorityData = data?.tasksByPriority.map((r) => ({
    name: r.priority.charAt(0) + r.priority.slice(1).toLowerCase(),
    value: r.count,
    color: PRIORITY_COLOR[r.priority] ?? '#94a3b8',
  })) ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Completion trend */}
      <div className="lg:col-span-2">
        <SectionCard title="Tasks completed — last 8 weeks">
          {isLoading ? <ChartSkeleton h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.completionTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Status distribution */}
      <SectionCard title="Tasks by status">
        {isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Priority distribution */}
      <SectionCard title="Tasks by priority">
        {isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  );
}

// ── Team tab ──────────────────────────────────────────────────────────────────
function TeamTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports-team'],
    queryFn: () => reportsApi.getTeam().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = data.map((m) => ({
    name: m.name.split(' ')[0],
    Open: m.open,
    Completed: m.completed,
  }));

  return (
    <div className="space-y-5">
      <SectionCard title="Open vs completed tasks per member">
        {isLoading ? <ChartSkeleton h={240} /> : data.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">No team members yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, data.length * 48)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="Open" fill="#64748b" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="Completed" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Member table */}
      <SectionCard title="Member breakdown">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-[var(--surface-2)]" />)}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  {m.avatarUrl && <AvatarImage src={m.avatarUrl} />}
                  <AvatarFallback className="text-[10px]">
                    {m.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{m.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] capitalize">{m.role.toLowerCase().replace('_', ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{m.open}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">open</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[var(--success)]">{m.completed}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">done</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Projects tab ──────────────────────────────────────────────────────────────
function ProjectsTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports-projects'],
    queryFn: () => reportsApi.getProjects().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = data.map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
    Progress: p.progress,
    Overdue: p.overdue,
  }));

  return (
    <div className="space-y-5">
      <SectionCard title="Completion % by project">
        {isLoading ? <ChartSkeleton h={240} /> : data.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">No projects yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, data.length * 48)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="Progress" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Project table */}
      <SectionCard title="Project breakdown">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded bg-[var(--surface-2)]" />)}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.map((p) => (
              <div key={p.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--text)] truncate">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.overdue > 0 && (
                      <span className="text-[10px] font-medium text-[var(--error)]">
                        {p.overdue} overdue
                      </span>
                    )}
                    <Badge variant={PROJECT_STATUS_VARIANT[p.status] ?? 'muted'}>
                      {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 tabular-nums w-16 text-right">
                    {p.done}/{p.total} · {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text)]">Reports</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Delivery metrics, team workload, and project health.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-5">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="team" className="pt-5">
          <TeamTab />
        </TabsContent>
        <TabsContent value="projects" className="pt-5">
          <ProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
