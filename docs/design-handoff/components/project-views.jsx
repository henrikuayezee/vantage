// Vantage — project detail views: List, Board, Gantt + task drawer.

const { Icons, Avatar, AvatarStack, PriorityBars, PriorityTag, StatusDot, StatusPill,
        Badge, Button, IconButton, ProgressBar, SectionLabel, Card, TaskRow, formatDate, daysUntil, keyColor } = window;
const PV_D = window.VANTAGE_DATA;

// ── Project detail page (has tabs: List, Board, Gantt) ───────────────
function ProjectDetailPage({ tab = 'list', onChangeTab, onOpenTask, project, focusedTaskId }) {
  return (
    <div className="v-project-page">
      <ProjectHeader project={project} tab={tab} onChangeTab={onChangeTab} />
      {tab === 'list'  && <ListView   project={project} onOpenTask={onOpenTask} focusedTaskId={focusedTaskId} />}
      {tab === 'board' && <BoardView  project={project} onOpenTask={onOpenTask} />}
      {tab === 'gantt' && <GanttView  project={project} onOpenTask={onOpenTask} />}
    </div>
  );
}

function ProjectHeader({ project, tab, onChangeTab }) {
  return (
    <div className="v-project-head">
      <div className="v-project-head-top">
        <div className="v-project-head-title">
          <span className="v-project-mark v-mono" style={{ background: keyColor(project.key) }}>{project.key.slice(0,2)}</span>
          <div>
            <div className="v-project-name">
              {project.name}
              <Badge tone={project.status === 'at-risk' ? 'warning' : 'success'} style={{ marginLeft: 10 }}>
                {project.status === 'at-risk' ? 'At risk' : 'On track'}
              </Badge>
            </div>
            <div className="v-project-meta v-mono">
              {project.id} · {formatDate(project.start)} → {formatDate(project.end)} · lead {PV_D.byId(project.lead).name.split(' ')[0]}
            </div>
          </div>
        </div>
        <div className="v-project-head-actions">
          <AvatarStack users={project.members.map(PV_D.byId)} size={24} max={5} />
          <Button variant="secondary" icon="Mail" size="md">Share</Button>
          <Button variant="primary" icon="Plus" size="md">New task</Button>
        </div>
      </div>
      <div className="v-project-head-bottom">
        <div className="v-project-tabs">
          {[
            { id: 'list',  label: 'List',  icon: 'List' },
            { id: 'board', label: 'Board', icon: 'Board' },
            { id: 'gantt', label: 'Gantt', icon: 'Gantt' },
          ].map(t => {
            const I = Icons[t.icon];
            return (
              <button key={t.id} className={'v-project-tab' + (tab === t.id ? ' is-active' : '')} onClick={() => onChangeTab(t.id)}>
                <I size={14} sw={1.7} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="v-project-toolbar">
          <ToolbarFilter label="Status" value="Any" />
          <ToolbarFilter label="Assignee" value="Anyone" />
          <ToolbarFilter label="Priority" value="Any" />
          <ToolbarFilter label="Sprint" value="Sprint 22" />
          <Button variant="ghost" size="sm" icon="Plus">More filters</Button>
          <span className="v-project-toolbar-spacer" />
          <Button variant="ghost" size="sm" icon="Sort">Group: status</Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarFilter({ label, value }) {
  return (
    <button className="v-toolbar-filter">
      <span className="v-toolbar-filter-label">{label}:</span>
      <span className="v-toolbar-filter-value">{value}</span>
      <Icons.Down size={12} sw={1.8} />
    </button>
  );
}

// ── List view ────────────────────────────────────────────────────────
function ListView({ project, onOpenTask, focusedTaskId }) {
  const tasks = PV_D.tasks.filter(t => t.project === project.id);
  // Group by status, jira-style
  const order = ['IN_PROGRESS', 'REVIEW', 'TODO', 'BACKLOG', 'DONE'];
  const groups = order.map(status => ({ status, items: tasks.filter(t => t.status === status) }));

  return (
    <div className="v-list-view">
      <div className="v-list-table-head">
        <span className="v-list-col-key v-caps">Key</span>
        <span className="v-list-col-title v-caps">Title</span>
        <span className="v-list-col-pri v-caps">Pri</span>
        <span className="v-list-col-assignee v-caps">Owner</span>
        <span className="v-list-col-due v-caps">Due</span>
        <span className="v-list-col-est v-caps">Est</span>
        <span className="v-list-col-comments v-caps">Act</span>
        <span className="v-list-col-status v-caps">Status</span>
      </div>
      {groups.filter(g => g.items.length > 0).map(g => (
        <ListGroup key={g.status} status={g.status} items={g.items} onOpenTask={onOpenTask} focusedTaskId={focusedTaskId} />
      ))}
    </div>
  );
}

function ListGroup({ status, items, onOpenTask, focusedTaskId }) {
  const STATUS = window.STATUS_LABEL[status];
  return (
    <section className="v-list-group">
      <div className="v-list-group-head">
        <button className="v-list-group-toggle"><Icons.Down size={12} sw={2} /></button>
        <StatusDot status={status} size={12} />
        <span className="v-list-group-name">{STATUS.label}</span>
        <span className="v-list-group-count v-mono">{items.length}</span>
        <span className="v-list-group-spacer" />
        <button className="v-list-group-add"><Icons.Plus size={11} sw={2} /> Add task</button>
      </div>
      {items.map(t => <ListRow key={t.id} task={t} onClick={() => onOpenTask(t.id)} active={focusedTaskId === t.id} />)}
    </section>
  );
}

function ListRow({ task, onClick, active }) {
  const u = task.assignee ? PV_D.byId(task.assignee) : null;
  const due = daysUntil(task.due, new Date(2026, 4, 24));
  return (
    <div className={'v-list-row' + (active ? ' is-active' : '')} onClick={onClick}>
      <span className="v-list-col-key v-mono">{task.id}</span>
      <span className="v-list-col-title">
        <span className="v-list-row-title">{task.title}</span>
        {task.milestone && <Icons.Diamond size={10} sw={1.7} fill="var(--accent)" />}
        {task.deps > 0 && <span className="v-list-row-link" title={task.deps + ' dependencies'}><Icons.Link size={10} sw={1.8}/></span>}
        {task.subtasks > 0 && <span className="v-list-row-sub v-mono">{task.done}/{task.subtasks}</span>}
        {task.comments > 0 && <span className="v-list-row-sub v-mono"><Icons.MessageCircle size={10} sw={1.8}/>{task.comments}</span>}
      </span>
      <span className="v-list-col-pri"><PriorityTag priority={task.priority} /></span>
      <span className="v-list-col-assignee">
        {u ? <span className="v-list-assignee"><Avatar user={u} size={18} /><span>{u.name.split(' ')[0]}</span></span> :
             <span className="v-list-assignee is-unassigned"><Icons.Plus size={10} sw={2}/> Assign</span>}
      </span>
      <span className={'v-list-col-due v-mono' + (due < 0 ? ' is-late' : due <= 2 ? ' is-soon' : '')}>
        {formatDate(task.due)}
      </span>
      <span className="v-list-col-est v-mono">{task.est}d</span>
      <span className="v-list-col-comments v-mono">{task.updated}</span>
      <span className="v-list-col-status"><StatusPill status={task.status} compact /></span>
    </div>
  );
}

// ── Board view ───────────────────────────────────────────────────────
function BoardView({ project, onOpenTask }) {
  const cols = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const tasks = PV_D.tasks.filter(t => t.project === project.id);
  return (
    <div className="v-board">
      {cols.map(c => {
        const items = tasks.filter(t => t.status === c);
        return <BoardColumn key={c} status={c} items={items} onOpenTask={onOpenTask} />;
      })}
    </div>
  );
}

function BoardColumn({ status, items, onOpenTask }) {
  const S = window.STATUS_LABEL[status];
  return (
    <div className="v-board-col">
      <div className="v-board-col-head" style={{ '--c': S.color }}>
        <div className="v-board-col-head-left">
          <StatusDot status={status} size={12} />
          <span className="v-board-col-name">{S.label}</span>
          <span className="v-board-col-count v-mono">{items.length}</span>
        </div>
        <div className="v-board-col-head-right">
          <IconButton icon="Plus" label="Add card" />
          <IconButton icon="More" label="More" />
        </div>
      </div>
      <div className="v-board-col-rail" style={{ background: S.color }} />
      <div className="v-board-col-list">
        {items.map(t => <BoardCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />)}
        <button className="v-board-add"><Icons.Plus size={12} sw={2} /> Add</button>
      </div>
    </div>
  );
}

function BoardCard({ task, onClick }) {
  const u = task.assignee ? PV_D.byId(task.assignee) : null;
  const due = daysUntil(task.due, new Date(2026, 4, 24));
  const PRI = window.PRI[task.priority];
  return (
    <div className="v-board-card" onClick={onClick} style={{ '--pri-color': PRI.color }}>
      <div className="v-board-card-head">
        <span className="v-mono v-board-card-key">{task.id}</span>
        {task.milestone && <Icons.Diamond size={10} sw={1.7} fill="var(--accent)" />}
        <span className="v-board-card-spacer" />
        <PriorityTag priority={task.priority} />
      </div>
      <div className="v-board-card-title">{task.title}</div>
      <div className="v-board-card-foot">
        <div className="v-board-card-meta">
          {task.subtasks > 0 && (
            <span className="v-board-card-meta-item v-mono">
              <Icons.Check size={11} sw={1.8} /> {task.done}/{task.subtasks}
            </span>
          )}
          {task.comments > 0 && (
            <span className="v-board-card-meta-item v-mono">
              <Icons.MessageCircle size={11} sw={1.8} /> {task.comments}
            </span>
          )}
          {task.deps > 0 && (
            <span className="v-board-card-meta-item v-mono">
              <Icons.Link size={11} sw={1.8} /> {task.deps}
            </span>
          )}
        </div>
        <div className="v-board-card-foot-right">
          <span className={'v-board-card-due v-mono' + (due < 0 ? ' is-late' : due <= 2 ? ' is-soon' : '')}>
            <Icons.Clock size={10} sw={1.8} /> {formatDate(task.due)}
          </span>
          <Avatar user={u} size={20} />
        </div>
      </div>
    </div>
  );
}

// ── Gantt view ───────────────────────────────────────────────────────
function GanttView({ project, onOpenTask }) {
  // Build a horizontal timeline. We'll fake start/end dates for the AUTH tasks.
  const tasks = PV_D.tasks.filter(t => t.project === project.id);
  // Synthesize start dates based on due - est days
  const items = tasks.map((t, i) => {
    const end = new Date(t.due);
    const start = new Date(end); start.setDate(start.getDate() - Math.max(2, t.est));
    return { ...t, start, end };
  });
  // Determine chart range
  const minDate = new Date(2026, 4, 1);
  const maxDate = new Date(2026, 6, 8);
  const totalDays = Math.round((maxDate - minDate) / 86400000);
  const dayW = 14; // px per day
  const today = new Date(2026, 4, 24);

  const dayToX = (d) => Math.round(((d - minDate) / 86400000) * dayW);

  // Bucket weeks for headers
  const weeks = [];
  const cur = new Date(minDate);
  while (cur < maxDate) {
    weeks.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  const months = [];
  for (let m = minDate.getMonth(); m <= maxDate.getMonth(); m++) {
    const md = new Date(minDate.getFullYear(), m, 1);
    const end = new Date(minDate.getFullYear(), m + 1, 1);
    const start = md < minDate ? minDate : md;
    months.push({
      name: md.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      x: dayToX(start),
      width: dayToX(end > maxDate ? maxDate : end) - dayToX(start),
    });
  }

  // Fake dependencies (just connect a couple)
  const deps = [
    ['AUTH-104', 'AUTH-118'],
    ['AUTH-118', 'AUTH-150'],
    ['AUTH-104', 'AUTH-128'],
  ];
  const taskById = Object.fromEntries(items.map(t => [t.id, t]));

  // Milestones at fixed dates
  const ms = [
    { id: 'm-passkey', label: 'Passkey GA', date: new Date(2026, 4, 30) },
    { id: 'm-mtls',    label: 'mTLS pilot', date: new Date(2026, 5, 10) },
    { id: 'm-rotate',  label: 'Key rotation cutover', date: new Date(2026, 5, 22) },
  ];

  const ROW_H = 30;
  const chartHeight = items.length * ROW_H;

  return (
    <div className="v-gantt">
      <div className="v-gantt-left">
        <div className="v-gantt-left-head"><span className="v-caps" style={{ color: 'var(--text-muted)' }}>Task</span></div>
        {items.map(t => (
          <div key={t.id} className="v-gantt-left-row" onClick={() => onOpenTask(t.id)}>
            <PriorityBars priority={t.priority} />
            <span className="v-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)', flex: '0 0 60px' }}>{t.id}</span>
            <span className="v-gantt-left-title">{t.title}</span>
            <Avatar user={t.assignee ? PV_D.byId(t.assignee) : null} size={18} />
          </div>
        ))}
      </div>
      <div className="v-gantt-right">
        <div className="v-gantt-headers" style={{ width: totalDays * dayW }}>
          <div className="v-gantt-months">
            {months.map((m, i) => (
              <div key={i} className="v-gantt-month" style={{ left: m.x, width: m.width }}>{m.name}</div>
            ))}
          </div>
          <div className="v-gantt-weeks">
            {weeks.map((w, i) => (
              <div key={i} className="v-gantt-week" style={{ left: dayToX(w), width: dayW * 7 }}>
                <span className="v-mono">{w.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="v-gantt-chart" style={{ width: totalDays * dayW, height: chartHeight }}>
          {/* day grid */}
          {Array.from({ length: totalDays + 1 }).map((_, i) => (
            <span key={i} className={'v-gantt-gridline' + (i % 7 === 0 ? ' is-week' : '')}
              style={{ left: i * dayW, height: chartHeight }} />
          ))}
          {/* today line */}
          <div className="v-gantt-today" style={{ left: dayToX(today), height: chartHeight }}>
            <span className="v-gantt-today-label v-mono">TODAY</span>
          </div>

          {/* milestones */}
          {ms.map(m => (
            <div key={m.id} className="v-gantt-milestone" style={{ left: dayToX(m.date) - 7 }}>
              <Icons.Diamond size={14} fill="var(--accent)" sw={1.5} />
              <span className="v-gantt-milestone-label">{m.label}</span>
            </div>
          ))}

          {/* bars */}
          {items.map((t, idx) => {
            const x = dayToX(t.start);
            const w = Math.max(dayW, dayToX(t.end) - x);
            const top = idx * ROW_H + 6;
            const pri = window.PRI[t.priority];
            const progress = t.status === 'DONE' ? 1 : t.status === 'IN_PROGRESS' ? Math.min(1, t.spent / t.est) : t.status === 'REVIEW' ? 0.85 : 0;
            return (
              <div key={t.id} className={'v-gantt-bar' + (t.status === 'DONE' ? ' is-done' : '')} style={{
                left: x, top, width: w, '--pri': pri.color
              }} onClick={() => onOpenTask(t.id)} data-task-id={t.id}>
                <div className="v-gantt-bar-fill" style={{ width: (progress * 100) + '%' }} />
                <span className="v-gantt-bar-label v-mono">{t.id}</span>
              </div>
            );
          })}

          {/* dependency lines */}
          <svg className="v-gantt-deps" width={totalDays * dayW} height={chartHeight} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <marker id="dep-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0 L10 5 L0 10 Z" fill="var(--text-muted)" />
              </marker>
            </defs>
            {deps.map(([a, b], i) => {
              const ta = taskById[a], tb = taskById[b];
              if (!ta || !tb) return null;
              const ia = items.findIndex(t => t.id === a);
              const ib = items.findIndex(t => t.id === b);
              const x1 = dayToX(ta.end);
              const y1 = ia * ROW_H + 6 + 9;
              const x2 = dayToX(tb.start);
              const y2 = ib * ROW_H + 6 + 9;
              const midX = x1 + 8;
              return (
                <path key={i}
                  d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2 - 2} ${y2}`}
                  stroke="var(--text-muted)" strokeWidth="1.25" fill="none" strokeDasharray="3 3"
                  markerEnd="url(#dep-arrow)" opacity="0.6"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Task drawer (slides in from right) ───────────────────────────────
function TaskDrawer({ taskId, onClose }) {
  const task = PV_D.tasks.find(t => t.id === taskId) || PV_D.tasks[0];
  const assignee = task.assignee ? PV_D.byId(task.assignee) : null;
  const reporter = task.reporter ? PV_D.byId(task.reporter) : null;
  const subs = PV_D.subtasks;
  const comments = PV_D.comments;

  return (
    <aside className="v-drawer">
      <header className="v-drawer-head">
        <div className="v-drawer-head-left">
          <span className="v-mono v-drawer-key">{task.id}</span>
          <Icons.Link size={12} sw={1.8} style={{ color: 'var(--text-muted)' }} />
          <StatusPill status={task.status} />
          {task.milestone && <Badge tone="accent"><Icons.Diamond size={10} sw={1.5} fill="var(--accent)" /> Milestone</Badge>}
        </div>
        <div className="v-drawer-head-right">
          <IconButton icon="Eye" label="Watch" />
          <IconButton icon="Paperclip" label="Attach" />
          <IconButton icon="More" label="More" />
          <span className="v-drawer-divider" />
          <IconButton icon="X" label="Close" onClick={onClose} />
        </div>
      </header>

      <div className="v-drawer-body">
        <div className="v-drawer-main">
          <h2 className="v-drawer-title">{task.title}</h2>

          <div className="v-drawer-section">
            <SectionLabel>Description</SectionLabel>
            <p className="v-drawer-desc">
              Replace the in-process HMAC signer with KMS-backed RS256 signing. Add an asymmetric key per
              tenant ring, wire the abstraction through <code>auth/internal/signer</code>, and stage rollout behind
              the <code className="v-code">auth.kms_signing</code> flag. p99 latency budget on <code className="v-code">/token</code>
              is 80&nbsp;ms — measure with the shadow signer before flipping the default.
            </p>
            <div className="v-drawer-meta-grid">
              <div><div className="v-drawer-meta-label v-caps">Acceptance</div><div className="v-drawer-meta-val">Tier-1 customers see p99 ≤ 95&nbsp;ms over 7d.</div></div>
              <div><div className="v-drawer-meta-label v-caps">Branch</div><div className="v-drawer-meta-val v-mono"><Icons.Branch size={11} sw={1.7} /> da/auth-kms-signer-2</div></div>
            </div>
          </div>

          <div className="v-drawer-section">
            <div className="v-drawer-subhead">
              <SectionLabel>Subtasks <span className="v-drawer-pct v-mono"> {subs.filter(s=>s.done).length}/{subs.length}</span></SectionLabel>
              <button className="v-drawer-add"><Icons.Plus size={11} sw={2}/> Add subtask</button>
            </div>
            <ul className="v-drawer-subtasks">
              {subs.map(s => {
                const u = PV_D.byId(s.assignee);
                return (
                  <li key={s.id} className={'v-drawer-sub' + (s.done ? ' is-done' : '')}>
                    <button className={'v-checkbox' + (s.done ? ' is-checked' : '')}>{s.done && <Icons.Check size={10} sw={2.4} />}</button>
                    <span className="v-mono v-drawer-sub-key">{s.id}</span>
                    <span className="v-drawer-sub-title">{s.title}</span>
                    <Avatar user={u} size={18} />
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="v-drawer-section">
            <SectionLabel>Dependencies</SectionLabel>
            <div className="v-drawer-deps">
              <div className="v-drawer-dep v-mono"><Icons.ArrowRight size={11} sw={1.7} /> blocks AUTH-150 Step-up auth for admin actions</div>
              <div className="v-drawer-dep v-mono"><Icons.Link size={11} sw={1.7} /> related to AUTH-118 Migrate session store to Redis cluster</div>
            </div>
          </div>

          <div className="v-drawer-section">
            <SectionLabel>Comments <span className="v-mono"> · {comments.length}</span></SectionLabel>
            <ul className="v-drawer-comments">
              {comments.map(c => {
                const u = PV_D.byId(c.author);
                return (
                  <li key={c.id} className="v-drawer-comment">
                    <Avatar user={u} size={26} />
                    <div className="v-drawer-comment-body">
                      <div className="v-drawer-comment-head">
                        <b>{u.name}</b>
                        <span className="v-mono v-drawer-comment-when">{c.when}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="v-drawer-composer">
              <Avatar user={PV_D.byId('u1')} size={26} />
              <div className="v-drawer-composer-box">
                <textarea placeholder="Add a comment… use @ to mention" rows={2} />
                <div className="v-drawer-composer-foot">
                  <div className="v-drawer-composer-toolbar">
                    <IconButton icon="At" label="Mention" />
                    <IconButton icon="Paperclip" label="Attach" />
                    <IconButton icon="Link" label="Link" />
                  </div>
                  <Button variant="primary" size="sm">Comment</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* side metadata */}
        <aside className="v-drawer-side">
          <DrawerField label="Assignee">
            {assignee ? <span className="v-drawer-field-val"><Avatar user={assignee} size={20} /> {assignee.name}</span>
                      : <span className="v-drawer-field-val is-empty">Unassigned</span>}
          </DrawerField>
          <DrawerField label="Reporter">
            <span className="v-drawer-field-val"><Avatar user={reporter} size={20} /> {reporter.name}</span>
          </DrawerField>
          <DrawerField label="Priority"><PriorityTag priority={task.priority} /></DrawerField>
          <DrawerField label="Status"><StatusPill status={task.status} /></DrawerField>
          <DrawerField label="Due date">
            <span className="v-drawer-field-val v-mono">{new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </DrawerField>
          <DrawerField label="Estimate">
            <span className="v-drawer-field-val v-mono">{task.spent}d / {task.est}d</span>
            <ProgressBar value={Math.min(1, task.spent / task.est)} height={3} />
          </DrawerField>
          <DrawerField label="Sprint">
            <span className="v-drawer-field-val">Sprint 22 <Badge tone="neutral" mono>4d left</Badge></span>
          </DrawerField>
          <DrawerField label="Labels">
            <div className="v-drawer-labels">
              <Badge tone="primary" soft mono>security</Badge>
              <Badge tone="neutral" soft mono>backend</Badge>
              <Badge tone="warning" soft mono>cve</Badge>
            </div>
          </DrawerField>
          <DrawerField label="Created">
            <span className="v-drawer-field-val v-mono">May 14, 2026</span>
          </DrawerField>
        </aside>
      </div>
    </aside>
  );
}

function DrawerField({ label, children }) {
  return (
    <div className="v-drawer-field">
      <div className="v-drawer-field-label v-caps">{label}</div>
      <div className="v-drawer-field-content">{children}</div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const VANTAGE_PROJ_CSS = `
.v-project-page { padding: 0; }
.v-project-head { padding: 18px 28px 0; }
.v-project-head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.v-project-head-title { display: flex; align-items: center; gap: 12px; }
.v-project-mark { width: 38px; height: 38px; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; }
.v-project-name { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); display: flex; align-items: center; }
.v-project-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
.v-project-head-actions { display: flex; align-items: center; gap: 8px; }
.v-project-head-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
.v-project-tabs { display: flex; gap: 2px; padding-bottom: 0; border-bottom: 1px solid transparent; }
.v-project-tab { display: inline-flex; align-items: center; gap: 6px; padding: 9px 12px; border: 0; background: transparent;
  color: var(--text-muted); font: inherit; font-size: 13px; font-weight: 500; cursor: default;
  border-bottom: 2px solid transparent; margin-bottom: -1px; }
.v-project-tab:hover { color: var(--text); }
.v-project-tab.is-active { color: var(--primary); border-bottom-color: var(--primary); }

.v-project-toolbar { display: flex; align-items: center; gap: 6px; padding-bottom: 8px; }
.v-project-toolbar-spacer { flex: 1; }
.v-toolbar-filter { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text);
  font: inherit; font-size: 12px; cursor: default; }
.v-toolbar-filter:hover { background: var(--surface-2); }
.v-toolbar-filter-label { color: var(--text-muted); }

/* List view */
.v-list-view { padding: 0 28px 60px; }
.v-list-table-head, .v-list-row { display: grid; grid-template-columns:
  74px minmax(220px, 1fr) 80px 130px 70px 60px 80px 120px; align-items: center; gap: 12px; font-size: 12.5px; }
.v-list-table-head { padding: 8px 12px; color: var(--text-muted); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  background: var(--surface); position: sticky; top: 0; z-index: 1; }
.v-list-table-head .v-caps { font-size: 10px; }
.v-list-group { display: flex; flex-direction: column; }
.v-list-group-head { display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 14px;
  background: var(--surface-2); border-bottom: 1px solid var(--border); }
.v-list-group-toggle { background: transparent; border: 0; color: var(--text-muted); cursor: default; padding: 2px; }
.v-list-group-name { font-size: 12.5px; font-weight: 600; color: var(--text); }
.v-list-group-count { font-size: 11px; color: var(--text-muted); }
.v-list-group-spacer { flex: 1; }
.v-list-group-add { display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; background: transparent;
  border: 0; color: var(--text-muted); font: inherit; font-size: 11.5px; cursor: default; border-radius: 4px; }
.v-list-group-add:hover { color: var(--primary); background: var(--bg); }

.v-list-row { padding: 0 12px; height: 36px; border-bottom: 1px solid var(--border); cursor: default; }
.v-list-row:hover { background: var(--surface); }
.v-list-row.is-active { background: var(--primary-softer); box-shadow: inset 3px 0 0 var(--primary); }
.v-list-col-key { color: var(--text-muted); font-size: 11px; }
.v-list-col-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.v-list-row-title { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.v-list-row-link { color: var(--text-subtle); }
.v-list-row-sub { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--text-muted); }
.v-list-assignee { display: inline-flex; align-items: center; gap: 6px; color: var(--text); }
.v-list-assignee.is-unassigned { color: var(--text-muted); border: 1px dashed var(--border-strong); padding: 1px 6px; border-radius: 5px; font-size: 11px; }
.v-list-col-due { color: var(--text-muted); font-size: 11.5px; }
.v-list-col-due.is-late { color: var(--error); font-weight: 500; }
.v-list-col-due.is-soon { color: var(--warning); font-weight: 500; }
.v-list-col-est { color: var(--text-muted); font-size: 11px; }
.v-list-col-comments { color: var(--text-muted); font-size: 11px; }

/* Board view */
.v-board { display: grid; grid-template-columns: repeat(5, minmax(240px, 1fr)); gap: 12px;
  padding: 12px 28px 60px; height: calc(100% - 130px); align-items: start; }
.v-board-col { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; display: flex;
  flex-direction: column; max-height: 100%; position: relative; overflow: hidden; }
.v-board-col-rail { height: 2px; background: var(--c); }
.v-board-col-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 6px; gap: 6px; }
.v-board-col-head-left { display: flex; align-items: center; gap: 6px; }
.v-board-col-name { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text); }
.v-board-col-count { font-size: 10.5px; color: var(--text-muted); background: var(--bg); padding: 1px 6px; border-radius: 999px; }
.v-board-col-head-right { display: flex; gap: 2px; }
.v-board-col-list { display: flex; flex-direction: column; gap: 8px; padding: 8px; overflow: auto; flex: 1; }
.v-board-add { padding: 7px; background: transparent; border: 1px dashed var(--border-strong); border-radius: 7px;
  color: var(--text-muted); font: inherit; font-size: 11.5px; cursor: default;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
.v-board-add:hover { color: var(--primary); border-color: var(--primary); }

.v-board-card { padding: 8px 10px 9px; background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
  box-shadow: var(--shadow-xs); border-left: 3px solid var(--pri-color); cursor: default; }
.v-board-card:hover { box-shadow: var(--shadow-sm); border-color: var(--border-strong); border-left-color: var(--pri-color); }
.v-board-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.v-board-card-key { font-size: 10.5px; color: var(--text-muted); }
.v-board-card-spacer { flex: 1; }
.v-board-card-title { font-size: 12.5px; color: var(--text); margin-bottom: 8px; line-height: 1.35; }
.v-board-card-foot { display: flex; align-items: center; justify-content: space-between; }
.v-board-card-meta { display: flex; gap: 8px; }
.v-board-card-meta-item { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--text-muted); }
.v-board-card-foot-right { display: flex; align-items: center; gap: 6px; }
.v-board-card-due { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--text-muted); }
.v-board-card-due.is-late { color: var(--error); }
.v-board-card-due.is-soon { color: var(--warning); }

/* Gantt */
.v-gantt { display: flex; height: calc(100% - 130px); overflow: hidden; border-top: 1px solid var(--border); }
.v-gantt-left { flex: 0 0 280px; border-right: 1px solid var(--border); background: var(--bg); overflow-y: auto; }
.v-gantt-left-head { height: 44px; padding: 0 14px; display: flex; align-items: center; border-bottom: 1px solid var(--border); background: var(--surface); }
.v-gantt-left-row { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 14px; font-size: 12px; border-bottom: 1px solid var(--border); cursor: default; }
.v-gantt-left-row:hover { background: var(--surface); }
.v-gantt-left-title { flex: 1; min-width: 0; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v-gantt-right { flex: 1; overflow: auto; background: var(--bg); position: relative; }
.v-gantt-headers { position: sticky; top: 0; z-index: 2; background: var(--surface); border-bottom: 1px solid var(--border); }
.v-gantt-months { height: 22px; position: relative; border-bottom: 1px solid var(--border); }
.v-gantt-month { position: absolute; top: 0; height: 22px; padding: 0 8px; display: flex; align-items: center; font-size: 10.5px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--text); border-right: 1px solid var(--border); font-family: var(--font-mono); }
.v-gantt-weeks { height: 22px; position: relative; }
.v-gantt-week { position: absolute; top: 0; height: 22px; padding: 0 4px; display: flex; align-items: center;
  font-size: 9.5px; color: var(--text-muted); border-right: 1px solid var(--border); }

.v-gantt-chart { position: relative; }
.v-gantt-gridline { position: absolute; top: 0; width: 1px; background: var(--border); opacity: 0.35; }
.v-gantt-gridline.is-week { opacity: 0.7; }
.v-gantt-today { position: absolute; top: 0; width: 2px; background: var(--accent); opacity: 0.65; }
.v-gantt-today-label { position: absolute; top: -18px; left: -15px; font-size: 9px; font-weight: 700; color: var(--accent);
  background: var(--bg); padding: 1px 4px; border-radius: 3px; border: 1px solid var(--accent); }
.v-gantt-milestone { position: absolute; top: 4px; color: var(--accent); z-index: 3; display: flex; align-items: center; gap: 4px; }
.v-gantt-milestone-label { font-size: 9.5px; font-family: var(--font-mono); color: var(--accent); background: var(--bg); padding: 0 4px; border-radius: 3px;
  white-space: nowrap; }
.v-gantt-bar { position: absolute; height: 18px; background: color-mix(in oklab, var(--pri) 18%, transparent);
  border: 1px solid color-mix(in oklab, var(--pri) 45%, transparent); border-radius: 4px; cursor: default; overflow: hidden;
  display: flex; align-items: center; padding: 0 6px; z-index: 2; }
.v-gantt-bar:hover { border-color: var(--pri); }
.v-gantt-bar.is-done { background: color-mix(in oklab, var(--success) 14%, transparent); border-color: color-mix(in oklab, var(--success) 40%, transparent); }
.v-gantt-bar-fill { position: absolute; inset: 0 auto 0 0; background: var(--pri); opacity: 0.55; border-radius: 3px; }
.v-gantt-bar.is-done .v-gantt-bar-fill { background: var(--success); }
.v-gantt-bar-label { position: relative; font-size: 9.5px; color: var(--text); z-index: 1; white-space: nowrap; }

/* Task drawer */
.v-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 720px; max-width: 70%;
  background: var(--bg); border-left: 1px solid var(--border); box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; z-index: 50; }
.v-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px;
  border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.v-drawer-head-left { display: flex; align-items: center; gap: 10px; }
.v-drawer-key { font-size: 12px; color: var(--text-muted); padding: 2px 8px; background: var(--surface); border-radius: 5px; }
.v-drawer-head-right { display: flex; align-items: center; gap: 2px; }
.v-drawer-divider { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }
.v-drawer-body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 0; overflow: hidden; }
.v-drawer-main { padding: 22px 24px; overflow-y: auto; }
.v-drawer-side { padding: 22px 18px; border-left: 1px solid var(--border); overflow-y: auto; background: var(--surface); }
.v-drawer-title { font-size: 19px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); margin: 0 0 18px; line-height: 1.3; }
.v-drawer-section { margin-bottom: 22px; }
.v-drawer-desc { font-size: 13px; line-height: 1.55; color: var(--text); margin: 0 0 10px; }
.v-drawer-desc code, .v-code { font-family: var(--font-mono); font-size: 12px; background: var(--surface);
  border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; }
.v-drawer-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-top: 12px;
  padding: 10px 12px; background: var(--surface); border-radius: 7px; }
.v-drawer-meta-label { color: var(--text-muted); margin-bottom: 2px; }
.v-drawer-meta-val { font-size: 12.5px; color: var(--text); display: inline-flex; align-items: center; gap: 5px; }
.v-drawer-subhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.v-drawer-add { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: transparent; border: 1px dashed var(--border-strong);
  border-radius: 5px; color: var(--text-muted); font: inherit; font-size: 11.5px; cursor: default; }
.v-drawer-add:hover { color: var(--primary); border-color: var(--primary); }
.v-drawer-pct { font-size: 11px; color: var(--text-muted); margin-left: 4px; }
.v-drawer-subtasks { list-style: none; margin: 0; padding: 0; }
.v-drawer-sub { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 6px; }
.v-drawer-sub:hover { background: var(--surface); }
.v-drawer-sub.is-done .v-drawer-sub-title { color: var(--text-muted); text-decoration: line-through; }
.v-drawer-sub-key { font-size: 10.5px; color: var(--text-muted); flex: 0 0 78px; }
.v-drawer-sub-title { flex: 1; font-size: 12.5px; color: var(--text); }
.v-checkbox { width: 16px; height: 16px; border: 1.5px solid var(--border-strong); background: var(--bg); border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center; color: #fff; cursor: default; flex: 0 0 auto; }
.v-checkbox.is-checked { background: var(--success); border-color: var(--success); }
.v-drawer-deps { display: flex; flex-direction: column; gap: 6px; }
.v-drawer-dep { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted);
  padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); }
.v-drawer-comments { list-style: none; margin: 0 0 14px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.v-drawer-comment { display: flex; gap: 10px; }
.v-drawer-comment-body { flex: 1; padding: 8px 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border); }
.v-drawer-comment-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; font-size: 12px; }
.v-drawer-comment-head b { color: var(--text); font-weight: 600; }
.v-drawer-comment-when { font-size: 10.5px; color: var(--text-muted); }
.v-drawer-comment-body p { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--text); }
.v-drawer-composer { display: flex; gap: 10px; }
.v-drawer-composer-box { flex: 1; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); overflow: hidden; }
.v-drawer-composer-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-softer); }
.v-drawer-composer textarea { width: 100%; resize: none; border: 0; background: transparent; padding: 8px 12px; font: inherit; font-size: 13px; color: var(--text); outline: none; }
.v-drawer-composer textarea::placeholder { color: var(--text-subtle); }
.v-drawer-composer-foot { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; border-top: 1px solid var(--border); background: var(--surface); }
.v-drawer-composer-toolbar { display: flex; gap: 2px; }

.v-drawer-field { padding: 8px 0; border-bottom: 1px solid var(--border); }
.v-drawer-field:last-child { border-bottom: 0; }
.v-drawer-field-label { color: var(--text-muted); margin-bottom: 4px; }
.v-drawer-field-content { font-size: 12.5px; color: var(--text); }
.v-drawer-field-val { display: inline-flex; align-items: center; gap: 6px; }
.v-drawer-field-val.is-empty { color: var(--text-muted); font-style: italic; }
.v-drawer-labels { display: flex; flex-wrap: wrap; gap: 4px; }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-proj-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-proj-styles';
  s.textContent = VANTAGE_PROJ_CSS;
  document.head.appendChild(s);
}

Object.assign(window, { ProjectDetailPage, TaskDrawer });
