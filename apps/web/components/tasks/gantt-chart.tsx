'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  parseISO,
  differenceInDays,
  format,
  addDays,
  subDays,
  startOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
  isWeekend,
  min,
  max,
} from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDrawer } from './task-drawer';
import { PRIORITY_DOT } from './task-priority-badge';
import { tasksApi, type GanttTask } from '@/lib/tasks-api';
import { TaskStatus } from '@vantage/types';
import { cn } from '@/lib/utils';

type Zoom = 'day' | 'week' | 'month';

const DAY_PX: Record<Zoom, number> = { day: 40, week: 10, month: 3 };
const PAD_DAYS: Record<Zoom, number> = { day: 3, week: 7, month: 21 };
const ROW_H = 44;
const HDR_H = 50;
const NAME_COL = 264;
const BAR_H = 22;
const BAR_TOP = (ROW_H - BAR_H) / 2;

const BAR_COLOR: Record<string, string> = {
  [TaskStatus.BACKLOG]:     '#94a3b8',
  [TaskStatus.TODO]:        '#64748b',
  [TaskStatus.IN_PROGRESS]: '#0D7A75',
  [TaskStatus.REVIEW]:      '#f59e0b',
  [TaskStatus.DONE]:        '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  [TaskStatus.BACKLOG]:     'Backlog',
  [TaskStatus.TODO]:        'To do',
  [TaskStatus.IN_PROGRESS]: 'In progress',
  [TaskStatus.REVIEW]:      'Review',
  [TaskStatus.DONE]:        'Done',
};

const STATUS_PILL_STYLE: Record<string, React.CSSProperties> = {
  [TaskStatus.BACKLOG]:     { background: 'var(--surface-2)',            color: '#64748b' },
  [TaskStatus.TODO]:        { background: 'var(--surface-2)',            color: '#475569' },
  [TaskStatus.IN_PROGRESS]: { background: 'var(--status-progress-bg)',   color: 'var(--status-progress)' },
  [TaskStatus.REVIEW]:      { background: 'var(--status-review-bg)',     color: 'var(--status-review)' },
  [TaskStatus.DONE]:        { background: 'var(--status-done-bg)',       color: 'var(--status-done)' },
};

function getBarStyle(status: string): React.CSSProperties {
  const color = BAR_COLOR[status] ?? BAR_COLOR[TaskStatus.TODO];
  return { background: color, color: '#fff', borderRadius: 6 };
}

interface Props {
  projectId: string;
}

export function GanttChart({ projectId }: Props) {
  const qc = useQueryClient();
  const [zoom, setZoom] = useState<Zoom>('week');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['gantt', projectId],
    queryFn: () => tasksApi.getGanttData(projectId).then((r) => r.data),
  });

  const tasks = data?.tasks ?? [];
  const milestones = data?.milestones ?? [];
  const dayPx = DAY_PX[zoom];
  const pad = PAD_DAYS[zoom];

  const { chartStart, chartEnd, totalDays } = useMemo(() => {
    const allDates: Date[] = [];
    tasks.forEach((t) => {
      if (t.startDate) allDates.push(parseISO(t.startDate));
      if (t.dueDate) allDates.push(parseISO(t.dueDate));
    });
    milestones.forEach((m) => allDates.push(parseISO(m.dueDate)));

    if (allDates.length === 0) {
      const today = new Date();
      const s = subDays(today, 30);
      const e = addDays(today, 60);
      return { chartStart: s, chartEnd: e, totalDays: differenceInDays(e, s) + 1 };
    }

    const s = subDays(min(allDates), pad);
    const e = addDays(max(allDates), pad);
    return { chartStart: s, chartEnd: e, totalDays: differenceInDays(e, s) + 1 };
  }, [tasks, milestones, pad]);

  const timelineWidth = totalDays * dayPx;

  function getX(date: Date) {
    return Math.max(0, differenceInDays(date, chartStart)) * dayPx;
  }

  function getBarGeo(task: GanttTask) {
    const s = task.startDate ? parseISO(task.startDate) : task.dueDate ? parseISO(task.dueDate) : null;
    const e = task.dueDate ? parseISO(task.dueDate) : task.startDate ? parseISO(task.startDate) : null;
    if (!s) return null;
    const x = getX(s);
    const w = Math.max(dayPx, (differenceInDays(e ?? s, s) + 1) * dayPx);
    return { x, w };
  }

  const scrollToToday = () => {
    const x = getX(new Date());
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = x - scrollRef.current.clientWidth / 2 + NAME_COL;
    }
  };

  // Build header cells
  const { groupCells, unitCells } = useMemo(() => {
    const days = eachDayOfInterval({ start: chartStart, end: chartEnd });

    // Unit cells
    let unitCells: Array<{ label: string; x: number; w: number; isToday?: boolean; isWeekend?: boolean }> = [];
    if (zoom === 'day') {
      unitCells = days.map((d) => ({
        label: format(d, 'd'),
        x: getX(d),
        w: dayPx,
        isToday: isToday(d),
        isWeekend: isWeekend(d),
      }));
    } else if (zoom === 'week') {
      const weeks = eachWeekOfInterval({ start: chartStart, end: chartEnd }, { weekStartsOn: 1 });
      unitCells = weeks.map((w) => ({ label: format(w, 'MMM d'), x: getX(w), w: 7 * dayPx }));
    } else {
      const months = eachMonthOfInterval({ start: chartStart, end: chartEnd });
      unitCells = months.map((m) => {
        // Clip cell to chart boundaries so labels never overlap
        const xStart = Math.max(0, differenceInDays(startOfMonth(m), chartStart) * dayPx);
        const xEnd = Math.max(0, (differenceInDays(endOfMonth(m), chartStart) + 1) * dayPx);
        return { label: format(m, 'MMM'), x: xStart, w: xEnd - xStart };
      });
    }

    // Group cells (months for day/week, years for month)
    const groupCells: Array<{ label: string; x: number; w: number }> = [];
    if (zoom === 'month') {
      const months = eachMonthOfInterval({ start: chartStart, end: chartEnd });
      let yr = '';
      months.forEach((m) => {
        const y = format(m, 'yyyy');
        const xStart = Math.max(0, differenceInDays(startOfMonth(m), chartStart) * dayPx);
        const xEnd = Math.max(0, (differenceInDays(endOfMonth(m), chartStart) + 1) * dayPx);
        const mw = xEnd - xStart;
        const last = groupCells[groupCells.length - 1];
        if (y !== yr) { yr = y; groupCells.push({ label: y, x: xStart, w: mw }); }
        else if (last) last.w += mw;
      });
    } else {
      let mo = '';
      days.forEach((d) => {
        const m = format(d, 'MMM yyyy');
        const last = groupCells[groupCells.length - 1];
        if (m !== mo) { mo = m; groupCells.push({ label: m, x: getX(d), w: dayPx }); }
        else if (last) last.w += dayPx;
      });
    }

    return { groupCells, unitCells };
  }, [zoom, chartStart, chartEnd, dayPx]);

  const taskIndex = useMemo(() => {
    const m: Record<string, number> = {};
    tasks.forEach((t, i) => { m[t.id] = i; });
    return m;
  }, [tasks]);

  const now = new Date();
  const todayX = getX(startOfDay(now)) + ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * dayPx;
  const hasDates = tasks.length > 0 || milestones.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-52 rounded bg-[var(--surface-2)]" />
        <div className="h-72 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  if (!hasDates) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-[var(--border)] text-center">
        <CalendarDays className="h-8 w-8 text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--text)]">No tasks with dates</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
          Add start or due dates to tasks to see them on the Gantt chart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          {(['day', 'week', 'month'] as Zoom[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                zoom === z
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
              )}
            >
              {z}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={scrollToToday}>
          Today
        </Button>

        {/* Status legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {(Object.entries(STATUS_LABEL) as [string, string][]).map(([status, label]) => (
            <span key={status} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ background: BAR_COLOR[status] }}
              />
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </span>
          ))}
        </div>

        <span className="ml-auto text-[10px] text-[var(--text-muted)] hidden sm:block">
          Read-only · click a bar to open task
        </span>
      </div>

      {/* Chart */}
      <div
        ref={scrollRef}
        className="overflow-auto border border-[var(--border)] rounded-xl"
        style={{ maxHeight: 'calc(100vh - 320px)', minHeight: 280 }}
      >
        <div style={{ minWidth: NAME_COL + timelineWidth, position: 'relative' }}>
          {/* ── Header ── */}
          <div
            className="flex sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)]"
            style={{ height: HDR_H }}
          >
            {/* Name header cell (sticky left + top) */}
            <div
              className="sticky left-0 z-30 bg-[var(--surface)] border-r border-[var(--border)] flex items-end px-3 pb-1.5 shrink-0"
              style={{ width: NAME_COL }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Task
              </span>
            </div>

            {/* Timeline header */}
            <div className="relative overflow-hidden" style={{ width: timelineWidth }}>
              {/* Group row */}
              <div className="absolute top-0 left-0" style={{ height: 22, width: timelineWidth }}>
                {groupCells.map((g, i) => (
                  <div
                    key={i}
                    className="absolute top-0 border-r border-[var(--border)] flex items-center px-2 overflow-hidden"
                    style={{ left: g.x, width: g.w, height: 22 }}
                  >
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] truncate">
                      {g.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Unit row */}
              <div
                className="absolute left-0 border-t border-[var(--border)]"
                style={{ top: 22, height: HDR_H - 22, width: timelineWidth }}
              >
                {unitCells.map((cell, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute top-0 border-r border-[var(--border)] flex items-center justify-center overflow-hidden',
                      cell.isToday && 'bg-[var(--primary-softer)]',
                    )}
                    style={{ left: cell.x, width: cell.w, height: HDR_H - 22 }}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        cell.isToday ? 'text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)]',
                      )}
                    >
                      {cell.w >= 18 ? cell.label : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Rows ── */}
          <div className="relative">
            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{
                left: NAME_COL + todayX,
                width: 2,
                background: 'var(--primary)',
                opacity: 0.7,
              }}
            />

            {/* Dependency arrows SVG */}
            <svg
              className="absolute pointer-events-none z-10"
              style={{ left: NAME_COL, top: 0, width: timelineWidth, height: (tasks.length + milestones.length) * ROW_H }}
            >
              <defs>
                <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" />
                </marker>
              </defs>
              {tasks.flatMap((task) =>
                task.dependencies.map(({ dependsOnTaskId }) => {
                  const fromIdx = taskIndex[dependsOnTaskId];
                  const toIdx = taskIndex[task.id];
                  const fromTask = tasks[fromIdx];
                  if (fromIdx === undefined || !fromTask) return null;
                  const from = getBarGeo(fromTask);
                  const to = getBarGeo(task);
                  if (!from || !to) return null;
                  const x1 = from.x + from.w;
                  const y1 = fromIdx * ROW_H + BAR_TOP + BAR_H / 2;
                  const x2 = to.x;
                  const y2 = toIdx * ROW_H + BAR_TOP + BAR_H / 2;
                  const mx = x1 + Math.max(10, (x2 - x1) / 3);
                  return (
                    <path
                      key={`${dependsOnTaskId}-${task.id}`}
                      d={`M${x1},${y1} H${mx} V${y2} H${x2}`}
                      fill="none"
                      stroke="var(--text-muted)"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      markerEnd="url(#gantt-arrow)"
                    />
                  );
                }),
              )}
            </svg>

            {/* Task rows */}
            {tasks.map((task) => {
              const geo = getBarGeo(task);
              return (
                <div
                  key={task.id}
                  className="flex border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                  style={{ height: ROW_H }}
                >
                  {/* Name cell */}
                  <div
                    className="sticky left-0 z-10 bg-[var(--bg)] border-r border-[var(--border)] flex items-center gap-2 px-3 shrink-0 hover:bg-[var(--surface)] transition-colors"
                    style={{ width: NAME_COL }}
                  >
                    <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])} />
                    <span className="text-xs text-[var(--text)] truncate flex-1 min-w-0">{task.title}</span>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold leading-tight uppercase tracking-wide"
                      style={STATUS_PILL_STYLE[task.status] ?? STATUS_PILL_STYLE[TaskStatus.TODO]}
                    >
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>
                  </div>

                  {/* Timeline cell */}
                  <div className="relative overflow-hidden" style={{ width: timelineWidth, height: ROW_H }}>
                    {/* Weekend shading (day view only) */}
                    {zoom === 'day' &&
                      unitCells.map((cell, ci) =>
                        cell.isWeekend ? (
                          <div
                            key={ci}
                            className="absolute top-0 bottom-0 bg-[var(--surface-2)] opacity-50"
                            style={{ left: cell.x, width: cell.w }}
                          />
                        ) : null,
                      )}

                    {/* Column grid lines */}
                    {unitCells.map((cell, ci) => (
                      <div
                        key={ci}
                        className="absolute top-0 bottom-0 border-r border-[var(--border)] opacity-40"
                        style={{ left: cell.x + cell.w - 1, width: 1 }}
                      />
                    ))}

                    {/* Bar */}
                    {geo && (
                      <button
                        className="absolute overflow-hidden transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/50"
                        style={{
                          left: geo.x,
                          width: geo.w,
                          top: BAR_TOP,
                          height: BAR_H,
                          ...getBarStyle(task.status),
                        }}
                        onClick={() => setSelectedTaskId(task.id)}
                        title={task.title}
                      >
                        {geo.w > 50 && (
                          <span className="block px-2 text-[10px] font-medium text-white truncate leading-[22px]">
                            {task.title}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Milestone rows */}
            {milestones.map((ms) => {
              const x = getX(parseISO(ms.dueDate));
              return (
                <div
                  key={ms.id}
                  className="flex border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                  style={{ height: ROW_H }}
                >
                  {/* Name */}
                  <div
                    className="sticky left-0 z-10 bg-[var(--bg)] border-r border-[var(--border)] flex items-center gap-2 px-3 shrink-0"
                    style={{ width: NAME_COL }}
                  >
                    <span className="text-xs" style={{ color: ms.color ?? 'var(--primary)' }}>◆</span>
                    <span className="text-xs text-[var(--text-muted)] italic truncate">{ms.title}</span>
                  </div>

                  {/* Diamond */}
                  <div className="relative overflow-hidden" style={{ width: timelineWidth, height: ROW_H }}>
                    <div
                      className="absolute"
                      style={{
                        left: x - 9,
                        top: BAR_TOP + 3,
                        width: 16,
                        height: 16,
                        transform: 'rotate(45deg)',
                        background: ms.color ?? 'var(--primary)',
                        border: '2px solid var(--bg)',
                        boxShadow: `0 0 0 1.5px ${ms.color ?? 'var(--primary)'}`,
                      }}
                    />
                    {/* Date label */}
                    <span
                      className="absolute text-[9px] font-medium"
                      style={{ left: x + 12, top: BAR_TOP + 4, color: ms.color ?? 'var(--primary)' }}
                    >
                      {format(parseISO(ms.dueDate), 'MMM d')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDrawer
          projectId={projectId}
          taskId={selectedTaskId}
          onClose={() => {
            setSelectedTaskId(null);
            void qc.invalidateQueries({ queryKey: ['gantt', projectId] });
          }}
        />
      )}
    </div>
  );
}
