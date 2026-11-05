// Vantage — dashboards (PM primary, Dev, Admin).

const { Icons, PeakMark, Avatar, AvatarStack, PriorityBars, PriorityTag, StatusPill, StatusDot,
        Badge, Button, IconButton, ProgressBar, SectionLabel, Card } = window;
const D = window.VANTAGE_DATA;

// ── Shared widget shell ──────────────────────────────────────────────
function Widget({ title, subtitle, action, children, padded = true, className = '', style }) {
  return (
    <div className={'v-widget ' + className} style={style}>
      <div className="v-widget-head">
        <div>
          <div className="v-widget-title">{title}</div>
          {subtitle && <div className="v-widget-sub">{subtitle}</div>}
        </div>
        <div className="v-widget-action">{action}</div>
      </div>
      <div className={'v-widget-body' + (padded ? '' : ' v-widget-body-flush')}>{children}</div>
    </div>
  );
}

// ── PM Dashboard ─────────────────────────────────────────────────────
function PMDashboard({ user }) {
  // KPI band
  const kpis = [
    { label: 'Active projects',   value: 8,  delta: '+1',  trend: 'up' },
    { label: 'On track',          value: 5,  pct: 62,      tone: 'success' },
    { label: 'At risk',           value: 2,  pct: 25,      tone: 'warning' },
    { label: 'Overdue tasks',     value: 14, delta: '−3',  trend: 'down', tone: 'error' },
    { label: 'Avg cycle time',    value: '3.2d', sparkline: [4,3.5,4.2,3.8,3.4,3.6,3.2] },
  ];

  const today = new Date(2026, 4, 24);
  const upcoming14 = D.milestones.slice(0, 5);
  const unassigned = D.tasks.filter(t => !t.assignee).slice(0, 4);
  // Use most recent activity items for the feed
  const feed = D.activity;

  return (
    <div className="v-page">
      {/* Page header */}
      <header className="v-page-head">
        <div>
          <h1 className="v-page-title">Welcome back, Maya</h1>
          <p className="v-page-sub">
            <span className="v-mono v-caps" style={{ color: 'var(--text-muted)' }}>Sun · May 24 · 09:42</span>
            <span style={{ margin: '0 8px', color: 'var(--text-subtle)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>Acme · Platform workspace · 14 teammates active</span>
          </p>
        </div>
        <div className="v-page-actions">
          <Button variant="secondary" icon="Filter" size="md">Last 14 days</Button>
          <Button variant="primary" icon="Plus" size="md">New project</Button>
        </div>
      </header>

      {/* KPI band */}
      <div className="v-kpi-row">
        {kpis.map((k, i) => <KPI key={i} {...k} />)}
      </div>

      {/* Main grid: portfolio left, milestones + activity right */}
      <div className="v-grid v-grid-pm">
        <div className="v-col v-col-main">
          <Widget title="Project portfolio" subtitle="8 active · grouped by health"
            action={
              <div className="v-tabs-mini">
                <button className="is-active">Active</button>
                <button>All</button>
                <button>Archived</button>
              </div>
            }
            padded={false}
          >
            <PortfolioTable projects={D.projects} />
          </Widget>

          <Widget title="Unassigned tasks" subtitle={`${unassigned.length} task${unassigned.length===1?'':'s'} need an owner`}
            action={<Button variant="ghost" size="sm" iconRight="ArrowRight">Triage all</Button>}>
            <div className="v-task-mini-list">
              {unassigned.map(t => (
                <div key={t.id} className="v-task-mini">
                  <PriorityBars priority={t.priority} />
                  <StatusDot status={t.status} size={10} />
                  <span className="v-task-mini-key v-mono">{t.id}</span>
                  <span className="v-task-mini-title">{t.title}</span>
                  <span className="v-task-mini-due v-mono">{relDay(t.due, today)}</span>
                  <button className="v-task-mini-assign"><Icons.Plus size={11} sw={2} /> Assign</button>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        <div className="v-col v-col-side">
          <Widget title="At risk" subtitle="Needs your attention"
            action={<span className="v-mono v-caps" style={{ color: 'var(--error)' }}>2 PROJECTS</span>}>
            <AtRiskList />
          </Widget>

          <Widget title="Upcoming milestones" subtitle="Next 14 days"
            action={<Button variant="ghost" size="sm" iconRight="ArrowRight">Calendar</Button>}>
            <MilestoneRail items={upcoming14} today={today} />
          </Widget>

          <Widget title="Team activity"
            action={<Button variant="ghost" size="sm">All</Button>}>
            <ActivityFeed items={feed} />
          </Widget>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, trend, pct, tone, sparkline }) {
  return (
    <div className="v-kpi">
      <div className="v-kpi-label v-caps">{label}</div>
      <div className="v-kpi-value-row">
        <span className="v-kpi-value v-num">{value}</span>
        {delta && (
          <span className={'v-kpi-delta v-mono' + (trend === 'down' ? ' is-down' : '') + (tone === 'error' ? ' is-error' : '')}>
            {trend === 'up' ? <Icons.Up size={10} sw={2.4}/> : <Icons.Down size={10} sw={2.4}/>}
            {delta}
          </span>
        )}
        {pct != null && (
          <span className={'v-kpi-pct v-mono v-badge v-badge-' + (tone || 'neutral') + ' v-badge-soft'}>
            {pct}%
          </span>
        )}
      </div>
      {sparkline && <Spark values={sparkline} />}
      {pct != null && !sparkline && <ProgressBar value={pct / 100} tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'primary'} height={3} />}
    </div>
  );
}

function Spark({ values }) {
  const w = 100, h = 24;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} className="v-spark" style={{ marginTop: 6 }}>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="var(--primary-soft)" />
      <path d={d} stroke="var(--primary)" strokeWidth="1.5" fill="none" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill="var(--primary)" />
    </svg>
  );
}

function PortfolioTable({ projects }) {
  return (
    <table className="v-table v-table-portfolio">
      <thead>
        <tr>
          <th>Project</th>
          <th>Lead</th>
          <th>Team</th>
          <th>Progress</th>
          <th>Open</th>
          <th>Due</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {projects.slice(0, 6).map(p => (
          <tr key={p.id}>
            <td>
              <div className="v-portfolio-name">
                <span className="v-portfolio-key v-mono" style={{ background: keyColor(p.key) }}>{p.key.slice(0, 2)}</span>
                <span>
                  <div className="v-portfolio-title">{p.name}</div>
                  <div className="v-portfolio-meta">
                    <Badge tone={p.status === 'at-risk' ? 'warning' : p.status === 'planning' ? 'neutral' : 'success'}>
                      {p.status === 'at-risk' ? 'At risk' : p.status === 'planning' ? 'Planning' : 'On track'}
                    </Badge>
                    <span className="v-mono">{p.id}</span>
                  </div>
                </span>
              </div>
            </td>
            <td><Avatar user={D.byId(p.lead)} size={20} /></td>
            <td><AvatarStack users={p.members.map(D.byId)} size={20} max={4} /></td>
            <td style={{ minWidth: 140 }}>
              <div className="v-portfolio-progress">
                <ProgressBar value={p.progress} tone={p.health === 'at-risk' ? 'warning' : 'primary'} height={5} />
                <span className="v-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(p.progress * 100)}%</span>
              </div>
            </td>
            <td><span className="v-mono">{p.open}</span></td>
            <td><span className="v-mono" style={{ color: 'var(--text-muted)' }}>{formatDate(p.end)}</span></td>
            <td><IconButton icon="ArrowRight" label="Open" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AtRiskList() {
  const at = D.projects.filter(p => p.status === 'at-risk');
  return (
    <div className="v-atrisk-list">
      {at.map(p => (
        <div key={p.id} className="v-atrisk-card">
          <div className="v-atrisk-head">
            <span className="v-atrisk-mark v-mono" style={{ background: keyColor(p.key) }}>{p.key.slice(0, 2)}</span>
            <div className="v-atrisk-text">
              <div className="v-atrisk-title">{p.name}</div>
              <div className="v-atrisk-sub v-mono">{p.id} · due {formatDate(p.end)}</div>
            </div>
            <Badge tone="warning" soft>At risk</Badge>
          </div>
          <div className="v-atrisk-bar">
            <ProgressBar value={p.progress} tone="warning" height={4} />
          </div>
          <div className="v-atrisk-reasons">
            <div className="v-atrisk-reason"><Icons.Alert size={11} sw={1.8} /> 4 overdue tasks block milestone</div>
            <div className="v-atrisk-reason"><Icons.Alert size={11} sw={1.8} /> Velocity ↓ 28% this sprint</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MilestoneRail({ items, today }) {
  return (
    <ol className="v-milestone-rail">
      {items.map((m, i) => {
        const days = daysUntil(m.date, today);
        return (
          <li key={m.id} className="v-milestone">
            <span className={'v-milestone-diamond' + (m.status === 'at-risk' ? ' is-risk' : '')}>
              <Icons.Diamond size={12} sw={2} fill={m.status === 'at-risk' ? 'var(--warning)' : 'var(--primary)'} />
            </span>
            <div className="v-milestone-text">
              <div className="v-milestone-title">{m.title}</div>
              <div className="v-milestone-meta v-mono">
                <span>{m.project}</span><span>·</span><span>{formatDate(m.date)}</span>
              </div>
            </div>
            <span className={'v-milestone-eta v-mono' + (days <= 3 ? ' is-soon' : '')}>
              {days === 0 ? 'today' : days < 0 ? `${-days}d late` : `${days}d`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityFeed({ items }) {
  return (
    <ol className="v-activity">
      {items.map(a => {
        const u = D.byId(a.actor);
        return (
          <li key={a.id} className="v-activity-row">
            <Avatar user={u} size={20} />
            <span className="v-activity-text">
              <b>{u.name.split(' ')[0]}</b> {a.verb}{' '}
              <span className="v-mono v-activity-target">{a.target}</span>{a.extra ? ' ' + a.extra : ''}
            </span>
            <span className="v-activity-when v-mono">{a.when}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Developer dashboard ──────────────────────────────────────────────
function DevDashboard({ user }) {
  const today = new Date(2026, 4, 24);
  const due = D.tasks.filter(t => t.assignee === 'u2' && t.status !== 'DONE');
  const dueToday = due.filter(t => daysUntil(t.due, today) === 0);
  const overdue  = due.filter(t => daysUntil(t.due, today) < 0);
  const week     = due.filter(t => daysUntil(t.due, today) > 0 && daysUntil(t.due, today) <= 7);

  return (
    <div className="v-page">
      <header className="v-page-head">
        <div>
          <h1 className="v-page-title">Good morning, Diego</h1>
          <p className="v-page-sub">
            <span className="v-mono v-caps" style={{ color: 'var(--text-muted)' }}>Sun · May 24 · 09:42</span>
            <span style={{ margin: '0 8px', color: 'var(--text-subtle)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>4 due today · 2 overdue · 3 awaiting review</span>
          </p>
        </div>
        <div className="v-page-actions">
          <Button variant="secondary" icon="Calendar">This week</Button>
          <Button variant="primary" icon="Plus">New task</Button>
        </div>
      </header>

      <div className="v-grid v-grid-dev">
        <div className="v-col v-col-main">
          <Widget title="Due today" subtitle={dueToday.length + ' tasks'}
            action={<Badge tone="warning">{dueToday.length} open</Badge>}
            padded={false}>
            <TaskList tasks={dueToday.length ? dueToday : [D.tasks[1], D.tasks[0], D.tasks[10]]} dense />
          </Widget>

          <Widget title="Overdue" subtitle="Catch up before standup"
            action={<Badge tone="error">{overdue.length || 2} late</Badge>}
            padded={false}>
            <TaskList tasks={overdue.length ? overdue : [D.tasks[3], D.tasks[5]]} dense />
          </Widget>

          <Widget title="Upcoming this week" subtitle="Mon–Fri"
            padded={false}>
            <TaskList tasks={week.length ? week : [D.tasks[2], D.tasks[10], D.tasks[14], D.tasks[7]]} dense />
          </Widget>
        </div>

        <div className="v-col v-col-side">
          <Widget title="My projects">
            <div className="v-mini-projects">
              {[D.projects[0], D.projects[1], D.projects[4]].map(p => (
                <div key={p.id} className="v-mini-project">
                  <span className="v-mini-project-mark v-mono" style={{ background: keyColor(p.key) }}>{p.key.slice(0,2)}</span>
                  <div className="v-mini-project-text">
                    <div className="v-mini-project-title">{p.name}</div>
                    <div className="v-mini-project-meta v-mono">{p.open} open · {Math.round(p.progress*100)}%</div>
                  </div>
                  <ProgressBar value={p.progress} height={3} />
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Recently updated" subtitle="Last 24h">
            <ol className="v-activity">
              {D.activity.slice(0, 5).map(a => {
                const u = D.byId(a.actor);
                return (
                  <li key={a.id} className="v-activity-row">
                    <Avatar user={u} size={20} />
                    <span className="v-activity-text">
                      <b>{u.name.split(' ')[0]}</b> {a.verb} <span className="v-mono v-activity-target">{a.target}</span>{a.extra ? ' ' + a.extra : ''}
                    </span>
                    <span className="v-activity-when v-mono">{a.when}</span>
                  </li>
                );
              })}
            </ol>
          </Widget>

          <Widget title="Focus" subtitle="Suggested next">
            <div className="v-focus-card">
              <div className="v-focus-head">
                <PriorityBars priority="CRITICAL" />
                <span className="v-mono">{D.tasks[0].id}</span>
                <StatusPill status="IN_PROGRESS" compact />
              </div>
              <div className="v-focus-title">{D.tasks[0].title}</div>
              <div className="v-focus-meta">
                <span className="v-mono"><Icons.Clock size={11} sw={1.8} /> 2.5h left</span>
                <span className="v-mono"><Icons.MessageCircle size={11} sw={1.8} /> {D.tasks[0].comments}</span>
              </div>
              <button className="v-focus-go">Start timer  <Icons.ArrowRight size={13} sw={2}/></button>
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}

// ── Admin dashboard ──────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const orgStats = [
    { label: 'Workspace seats', value: 142, delta: '+6 this mo', tone: 'success' },
    { label: 'Active projects',  value: 23 },
    { label: 'On-time delivery',value: '87%', delta: '+4pp QoQ', tone: 'success' },
    { label: 'Avg lead time',    value: '6.4d', delta: '−0.8d',  tone: 'success' },
    { label: 'Pending invites',  value: 4 },
    { label: 'Storage used',     value: '38GB', pct: 47 },
  ];
  return (
    <div className="v-page">
      <header className="v-page-head">
        <div>
          <h1 className="v-page-title">Acme · Platform</h1>
          <p className="v-page-sub">
            <span className="v-mono v-caps" style={{ color: 'var(--text-muted)' }}>WORKSPACE OVERVIEW</span>
            <span style={{ margin: '0 8px', color: 'var(--text-subtle)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>14 active sessions · last audit log entry 4m ago</span>
          </p>
        </div>
        <div className="v-page-actions">
          <Button variant="secondary" icon="Mail">Invite people</Button>
          <Button variant="primary" icon="Settings">Workspace settings</Button>
        </div>
      </header>

      <div className="v-admin-stats">
        {orgStats.map((s, i) => <KPI key={i} {...s} />)}
      </div>

      <div className="v-grid v-grid-admin">
        <div className="v-col v-col-main">
          <Widget title="All projects" subtitle="23 active across 4 squads" padded={false}
            action={
              <div className="v-tabs-mini">
                <button className="is-active">Active</button>
                <button>Overdue</button>
                <button>Archived</button>
              </div>
            }>
            <PortfolioTable projects={D.projects} />
          </Widget>

          <Widget title="Delivery performance" subtitle="Last 90 days">
            <DeliveryChart />
          </Widget>
        </div>

        <div className="v-col v-col-side">
          <Widget title="Overdue projects" action={<Badge tone="error">2</Badge>}>
            <AtRiskList />
          </Widget>

          <Widget title="People" subtitle="Manage workspace" action={<Button variant="ghost" size="sm" iconRight="ArrowRight">All</Button>}>
            <div className="v-people-mini">
              {D.users.slice(0, 6).map(u => (
                <div key={u.id} className="v-people-row">
                  <Avatar user={u} size={22} />
                  <div className="v-people-text">
                    <div className="v-people-name">{u.name}</div>
                    <div className="v-people-role v-mono">{u.role}</div>
                  </div>
                  <span className="v-people-dot" />
                </div>
              ))}
              <button className="v-people-invite"><Icons.Plus size={12} sw={2} /> Invite teammates</button>
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function DeliveryChart() {
  // Two-series bar chart: shipped (teal) vs planned (gray)
  const weeks = [
    [22, 25], [28, 28], [31, 30], [24, 28], [29, 30], [33, 31], [27, 30],
    [26, 28], [30, 30], [35, 32], [30, 30], [32, 33], [38, 35], [34, 34],
  ];
  const max = Math.max(...weeks.flat());
  return (
    <div className="v-delivery">
      <div className="v-delivery-legend">
        <span className="v-delivery-legend-item"><span className="v-delivery-swatch v-delivery-swatch-1" /> Shipped</span>
        <span className="v-delivery-legend-item"><span className="v-delivery-swatch v-delivery-swatch-2" /> Planned</span>
        <span className="v-delivery-legend-item" style={{ marginLeft: 'auto' }}>
          <span className="v-mono" style={{ color: 'var(--text-muted)' }}>Throughput per week</span>
        </span>
      </div>
      <div className="v-delivery-bars">
        {weeks.map(([shipped, planned], i) => (
          <div key={i} className="v-delivery-col">
            <div className="v-delivery-col-stack">
              <div className="v-delivery-bar v-delivery-bar-planned" style={{ height: (planned / max) * 100 + '%' }} />
              <div className="v-delivery-bar v-delivery-bar-shipped" style={{ height: (shipped / max) * 100 + '%' }} />
            </div>
            <div className="v-delivery-x v-mono">{(i + 1) % 4 === 0 ? 'W' + (i + 1) : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compact task list (used in widgets + project list view) ──────────
function TaskList({ tasks, dense = false, showProject = false }) {
  return (
    <ul className={'v-tasklist' + (dense ? ' is-dense' : '')}>
      {tasks.map(t => <TaskRow key={t.id} task={t} showProject={showProject} />)}
    </ul>
  );
}

function TaskRow({ task, showProject = false, onClick }) {
  const u = task.assignee ? D.byId(task.assignee) : null;
  return (
    <li className="v-task-row" onClick={onClick}>
      <span className="v-task-row-left">
        <PriorityBars priority={task.priority} />
        <StatusDot status={task.status} size={12} />
        <span className="v-task-row-key v-mono">{task.id}</span>
        <span className="v-task-row-title">{task.title}</span>
        {task.milestone && <Icons.Diamond size={11} sw={1.6} fill="var(--accent)" />}
      </span>
      <span className="v-task-row-right">
        {task.subtasks > 0 && (
          <span className="v-task-row-meta v-mono">
            <Icons.Check size={11} sw={1.8} />
            {task.done}/{task.subtasks}
          </span>
        )}
        {task.comments > 0 && (
          <span className="v-task-row-meta v-mono">
            <Icons.MessageCircle size={11} sw={1.8} />
            {task.comments}
          </span>
        )}
        <span className="v-task-row-due v-mono">{formatDate(task.due)}</span>
        <Avatar user={u} size={20} />
      </span>
    </li>
  );
}

// ── helpers ──────────────────────────────────────────────────────────
function keyColor(key) {
  const m = { AUTH: '#0D7A75', KAFKA: '#7C3AED', BILL: '#DB2777', MOB: '#0891B2', OBS: '#CA8A04', SOC2: '#16A34A', LATAM: '#EA580C', DOC: '#475569' };
  return m[key] || '#64748B';
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function daysUntil(iso, today) {
  const a = new Date(iso); const b = today || new Date();
  return Math.round((a - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000);
}
function relDay(iso, today) {
  const d = daysUntil(iso, today);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d < 0) return Math.abs(d) + 'd late';
  if (d <= 7) return 'in ' + d + 'd';
  return formatDate(iso);
}

// ── Widget + dashboard styles ────────────────────────────────────────
const VANTAGE_DASH_CSS = `
.v-page { padding: 22px 28px 60px; max-width: 1400px; margin: 0 auto; }
.v-page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.v-page-title { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; color: var(--text); margin: 0 0 4px; }
.v-page-sub { font-size: 12.5px; color: var(--text-muted); margin: 0; display: flex; align-items: center; flex-wrap: wrap; }
.v-page-actions { display: flex; gap: 8px; flex: 0 0 auto; }

.v-kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
.v-admin-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
.v-kpi { padding: 12px 14px; border: 1px solid var(--border); border-radius: 9px; background: var(--bg); }
.v-kpi-label { color: var(--text-muted); margin-bottom: 8px; }
.v-kpi-value-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.v-kpi-value { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--text); line-height: 1; }
.v-kpi-delta { font-size: 11px; color: var(--success); display: inline-flex; align-items: center; gap: 1px; }
.v-kpi-delta.is-down { color: var(--text-muted); }
.v-kpi-delta.is-error { color: var(--error); }
.v-kpi-pct { font-size: 10.5px; }

.v-spark { display: block; }

/* Grid layout */
.v-grid { display: grid; gap: 16px; }
.v-grid-pm,
.v-grid-admin { grid-template-columns: minmax(0, 1fr) 360px; }
.v-grid-dev { grid-template-columns: minmax(0, 1fr) 320px; }
.v-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

/* Widget */
.v-widget { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.v-widget-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 16px 10px; gap: 10px; }
.v-widget-title { font-size: 13.5px; font-weight: 600; color: var(--text); letter-spacing: -0.005em; }
.v-widget-sub   { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
.v-widget-action { flex: 0 0 auto; }
.v-widget-body { padding: 0 16px 16px; }
.v-widget-body-flush { padding: 0; }

.v-tabs-mini { display: flex; padding: 2px; background: var(--surface); border-radius: 6px; }
.v-tabs-mini button { padding: 3px 8px; font-size: 11.5px; border: 0; background: transparent; color: var(--text-muted); border-radius: 4px; font: inherit; font-weight: 500; cursor: default; }
.v-tabs-mini button.is-active { background: var(--bg); color: var(--text); box-shadow: var(--shadow-xs); }

/* Table */
.v-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; }
.v-table thead th { text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--text-muted); padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--surface); }
.v-table tbody td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.v-table tbody tr:hover td { background: var(--surface); }
.v-table tbody tr:last-child td { border-bottom: 0; }

.v-portfolio-name { display: flex; align-items: center; gap: 10px; }
.v-portfolio-key { width: 24px; height: 24px; color: #fff; font-size: 10px; font-weight: 600; border-radius: 5px;
  display: inline-flex; align-items: center; justify-content: center; }
.v-portfolio-title { font-weight: 500; color: var(--text); }
.v-portfolio-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.v-portfolio-progress { display: flex; align-items: center; gap: 8px; }

/* Task mini list */
.v-task-mini-list { display: flex; flex-direction: column; }
.v-task-mini { display: flex; align-items: center; gap: 10px; height: 34px; padding: 0 12px; border-bottom: 1px solid var(--border);
  font-size: 12.5px; }
.v-task-mini:last-child { border-bottom: 0; }
.v-task-mini:hover { background: var(--surface); }
.v-task-mini-key { font-size: 11px; color: var(--text-muted); flex: 0 0 70px; }
.v-task-mini-title { flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v-task-mini-due { font-size: 11px; color: var(--text-muted); }
.v-task-mini-assign { display: inline-flex; align-items: center; gap: 4px; font: inherit; font-size: 11px; color: var(--primary);
  background: var(--primary-soft); border: 0; border-radius: 5px; padding: 3px 7px; cursor: default; }
.v-task-mini-assign:hover { background: var(--primary); color: #fff; }

/* At risk */
.v-atrisk-list { display: flex; flex-direction: column; gap: 10px; }
.v-atrisk-card { padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  border-left: 3px solid var(--warning); }
.v-atrisk-head { display: flex; align-items: center; gap: 8px; }
.v-atrisk-mark { width: 22px; height: 22px; border-radius: 5px; color: #fff; font-size: 10px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.v-atrisk-text { flex: 1; min-width: 0; }
.v-atrisk-title { font-size: 12.5px; font-weight: 500; color: var(--text); }
.v-atrisk-sub { font-size: 10.5px; color: var(--text-muted); margin-top: 1px; }
.v-atrisk-bar { margin: 8px 0 8px; }
.v-atrisk-reasons { display: flex; flex-direction: column; gap: 3px; }
.v-atrisk-reason { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.v-atrisk-reason svg { color: var(--warning); }

/* Milestones */
.v-milestone-rail { list-style: none; margin: 0; padding: 0; position: relative; }
.v-milestone-rail::before { content: ""; position: absolute; left: 9px; top: 12px; bottom: 12px; width: 1.5px;
  background: linear-gradient(180deg, var(--border) 0%, var(--border) 100%); }
.v-milestone { position: relative; display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.v-milestone-diamond { position: relative; z-index: 1; width: 20px; height: 20px; background: var(--bg); display: inline-flex;
  align-items: center; justify-content: center; color: var(--primary); }
.v-milestone-diamond.is-risk { color: var(--warning); }
.v-milestone-text { flex: 1; min-width: 0; }
.v-milestone-title { font-size: 12.5px; font-weight: 500; color: var(--text); }
.v-milestone-meta { font-size: 10.5px; color: var(--text-muted); display: flex; gap: 5px; margin-top: 1px; }
.v-milestone-eta { flex: 0 0 auto; font-size: 11px; color: var(--text-muted); background: var(--surface-2); padding: 2px 6px; border-radius: 4px; }
.v-milestone-eta.is-soon { background: var(--warning-soft); color: var(--warning); }

/* Activity */
.v-activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.v-activity-row { display: flex; align-items: center; gap: 8px; padding: 6px 4px; border-radius: 6px; font-size: 12px; color: var(--text-muted); }
.v-activity-row:hover { background: var(--surface); }
.v-activity-text { flex: 1; min-width: 0; line-height: 1.35; }
.v-activity-text b { color: var(--text); font-weight: 500; }
.v-activity-target { color: var(--primary); }
.v-activity-when { flex: 0 0 auto; font-size: 10.5px; color: var(--text-subtle); }

/* Task row (used in widgets + list view) */
.v-tasklist { list-style: none; margin: 0; padding: 0; }
.v-task-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 36px;
  padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 12.5px; cursor: default; }
.v-tasklist.is-dense .v-task-row { height: 32px; }
.v-tasklist .v-task-row:last-child { border-bottom: 0; }
.v-task-row:hover { background: var(--surface); }
.v-task-row-left { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; }
.v-task-row-key { font-size: 11px; color: var(--text-muted); flex: 0 0 70px; }
.v-task-row-title { color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v-task-row-right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.v-task-row-meta { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-muted); }
.v-task-row-due { font-size: 11px; color: var(--text-muted); }

/* Mini projects */
.v-mini-projects { display: flex; flex-direction: column; gap: 10px; }
.v-mini-project { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 7px; border: 1px solid var(--border);
  flex-wrap: wrap; }
.v-mini-project:hover { background: var(--surface); }
.v-mini-project-mark { width: 22px; height: 22px; color: #fff; font-size: 9.5px; font-weight: 600; border-radius: 5px;
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.v-mini-project-text { flex: 1; min-width: 0; }
.v-mini-project-title { font-size: 12.5px; font-weight: 500; color: var(--text); }
.v-mini-project-meta { font-size: 10.5px; color: var(--text-muted); margin-top: 1px; }
.v-mini-project .v-bar { flex-basis: 100%; }

/* Focus card */
.v-focus-card { padding: 12px; border: 1px solid var(--border); border-radius: 8px;
  background: linear-gradient(135deg, var(--primary-softer), transparent); }
.v-focus-head { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.v-focus-title { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 8px; }
.v-focus-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
.v-focus-meta span { display: inline-flex; align-items: center; gap: 4px; }
.v-focus-go { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 30px; background: var(--primary); color: #fff; border: 0; border-radius: 6px; font: inherit; font-weight: 500;
  font-size: 12px; cursor: default; }
.v-focus-go:hover { background: var(--primary-hover); }

/* People mini */
.v-people-mini { display: flex; flex-direction: column; gap: 2px; }
.v-people-row { display: flex; align-items: center; gap: 9px; padding: 6px 4px; border-radius: 6px; font-size: 12px; }
.v-people-row:hover { background: var(--surface); }
.v-people-text { flex: 1; min-width: 0; }
.v-people-name { font-size: 12.5px; color: var(--text); font-weight: 500; }
.v-people-role { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.v-people-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--success); }
.v-people-invite { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 7px 10px;
  background: var(--surface); border: 1px dashed var(--border-strong); color: var(--text-muted); border-radius: 7px;
  font: inherit; font-size: 12px; cursor: default; }
.v-people-invite:hover { color: var(--text); border-color: var(--text-muted); background: var(--bg); }

/* Delivery chart */
.v-delivery { display: flex; flex-direction: column; gap: 12px; }
.v-delivery-legend { display: flex; gap: 14px; font-size: 11px; color: var(--text-muted); }
.v-delivery-legend-item { display: inline-flex; align-items: center; gap: 5px; }
.v-delivery-swatch { width: 10px; height: 10px; border-radius: 2px; }
.v-delivery-swatch-1 { background: var(--primary); }
.v-delivery-swatch-2 { background: var(--surface-2); border: 1px solid var(--border); }
.v-delivery-bars { display: grid; grid-template-columns: repeat(14, 1fr); gap: 6px; height: 140px; align-items: end; }
.v-delivery-col { display: flex; flex-direction: column; align-items: center; height: 100%; }
.v-delivery-col-stack { position: relative; flex: 1; width: 100%; display: flex; align-items: flex-end; }
.v-delivery-bar { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 3px 3px 0 0; }
.v-delivery-bar-planned { background: var(--surface-2); border: 1px solid var(--border); border-bottom: 0; }
.v-delivery-bar-shipped { background: var(--primary); width: 70%; left: 15%; right: 15%; }
.v-delivery-col:hover .v-delivery-bar-shipped { background: var(--primary-hover); }
.v-delivery-x { height: 16px; font-size: 10px; color: var(--text-muted); padding-top: 4px; }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-dash-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-dash-styles';
  s.textContent = VANTAGE_DASH_CSS;
  document.head.appendChild(s);
}

Object.assign(window, { PMDashboard, DevDashboard, AdminDashboard, TaskList, TaskRow, Widget, keyColor, formatDate, relDay, daysUntil });
