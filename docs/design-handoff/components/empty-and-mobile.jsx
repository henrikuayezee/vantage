// Vantage — empty states, loading skeletons, and mobile/tablet references.

const { Icons, PeakMark, Avatar, AvatarStack, PriorityBars, PriorityTag, StatusPill, StatusDot,
        Badge, Button, IconButton, ProgressBar, Card, TopoPattern, Kbd } = window;
const EX_D = window.VANTAGE_DATA;

// ── Empty states ─────────────────────────────────────────────────────
// A consistent shell with a 96px hero glyph (topo + icon overlay).
function EmptyState({ icon, title, body, cta, secondary, accent = 'primary', children }) {
  const I = Icons[icon];
  return (
    <div className="v-empty">
      <div className={'v-empty-glyph v-empty-glyph-' + accent}>
        <div className="v-empty-glyph-bg">
          <TopoPattern width={180} height={120} opacity={0.6} color="currentColor" />
        </div>
        <div className="v-empty-glyph-icon">
          <I size={26} sw={1.5} />
        </div>
      </div>
      <h3 className="v-empty-title">{title}</h3>
      <p className="v-empty-body">{body}</p>
      {children}
      {cta && (
        <div className="v-empty-actions">
          {cta}
          {secondary}
        </div>
      )}
    </div>
  );
}

// 1) No projects — fresh workspace
function EmptyProjects() {
  return (
    <EmptyState
      icon="Folder"
      title="No projects yet"
      body="Projects are how you group work, milestones, and people. Spin one up to see it on your dashboard and start tracking tasks."
      cta={<Button variant="primary" icon="Plus">Create your first project</Button>}
      secondary={<Button variant="secondary" icon="Mail">Browse templates</Button>}
    >
      <div className="v-empty-cards">
        {[
          { name: 'Sprint cadence',     desc: '2-week sprints, backlog → done',   icon: 'List' },
          { name: 'Shipping milestone', desc: 'Date-driven, milestone-first',    icon: 'Diamond' },
          { name: 'Blank',              desc: 'Start from scratch',              icon: 'Plus' },
        ].map(t => {
          const I = Icons[t.icon];
          return (
            <button key={t.name} className="v-empty-template">
              <span className="v-empty-template-icon"><I size={14} sw={1.6} /></span>
              <span>
                <div className="v-empty-template-name">{t.name}</div>
                <div className="v-empty-template-desc">{t.desc}</div>
              </span>
              <Icons.ArrowRight size={12} sw={1.7} style={{ color: 'var(--text-subtle)' }} />
            </button>
          );
        })}
      </div>
    </EmptyState>
  );
}

// 2) No tasks in a project — board context
function EmptyTasks() {
  return (
    <div className="v-board">
      {['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => {
        const SL = window.STATUS_LABEL[s];
        return (
          <div key={s} className="v-board-col v-board-col-empty">
            <div className="v-board-col-head" style={{ '--c': SL.color }}>
              <div className="v-board-col-head-left">
                <StatusDot status={s} size={12} />
                <span className="v-board-col-name">{SL.label}</span>
                <span className="v-board-col-count v-mono">0</span>
              </div>
            </div>
            <div className="v-board-col-rail" style={{ background: SL.color }} />
            <div className="v-board-col-list">
              {[0,1,2].map(i => <div key={i} className="v-ghost-card" style={{ opacity: 1 - i * 0.28 }} />)}
            </div>
          </div>
        );
      })}
      <div className="v-empty-overlay">
        <EmptyState
          icon="Lightning"
          title="No tasks yet — let's draft one"
          body="Tasks live in these columns. Add the first one to start mapping the work, or paste a list from your last tool to bulk-create."
          cta={<Button variant="primary" icon="Plus">Add first task</Button>}
          secondary={<Button variant="secondary" icon="Paperclip">Paste from CSV</Button>}
        />
      </div>
    </div>
  );
}

// 3) No notifications — caught up
function EmptyNotifications() {
  return (
    <EmptyState
      icon="Inbox"
      title="You're all caught up"
      body="No new mentions, assignments, or due-soon tasks. We'll ping you here when something needs your eyes."
      accent="success"
    >
      <div className="v-empty-stats v-mono">
        <div className="v-empty-stat"><span>0</span><span className="v-caps">UNREAD</span></div>
        <div className="v-empty-stat"><span>14</span><span className="v-caps">CLEARED TODAY</span></div>
        <div className="v-empty-stat"><span>3.2h</span><span className="v-caps">AVG RESPONSE</span></div>
      </div>
    </EmptyState>
  );
}

// 4) No search results
function EmptySearch({ q = "kafka-replication" }) {
  return (
    <EmptyState
      icon="Search"
      title={<span>No matches for "<span className="v-mono" style={{ color: 'var(--text)' }}>{q}</span>"</span>}
      body={<>Try a shorter query, check spelling, or jump to a section directly.</>}
      accent="neutral"
    >
      <div className="v-empty-chips">
        <button className="v-empty-chip"><Icons.Folder size={11} sw={1.7} /> Browse all projects</button>
        <button className="v-empty-chip"><Icons.My size={11} sw={1.7} /> My assigned tasks</button>
        <button className="v-empty-chip"><Icons.Calendar size={11} sw={1.7} /> This week</button>
        <button className="v-empty-chip"><Icons.Diamond size={11} sw={1.7} /> Upcoming milestones</button>
      </div>
      <p className="v-empty-tip">
        <Kbd>?</Kbd> for search syntax · try <code className="v-code">assignee:me status:in-progress</code>
      </p>
    </EmptyState>
  );
}

// ── Skeleton patterns ────────────────────────────────────────────────
function SkBlock({ w, h = 12, r = 4, style }) {
  return <span className="v-sk" style={{ width: w, height: h, borderRadius: r, display: 'inline-block', ...style }} />;
}

function SkeletonDashboard() {
  return (
    <div className="v-page">
      <header className="v-page-head">
        <div>
          <SkBlock w={220} h={22} style={{ marginBottom: 8 }} />
          <SkBlock w={360} h={12} />
        </div>
        <div className="v-page-actions">
          <SkBlock w={120} h={32} r={7} />
          <SkBlock w={110} h={32} r={7} />
        </div>
      </header>
      <div className="v-kpi-row">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="v-kpi">
            <SkBlock w={70} h={9} style={{ marginBottom: 12 }} />
            <SkBlock w={50} h={22} style={{ marginBottom: 8 }} />
            <SkBlock w="100%" h={3} r={3} />
          </div>
        ))}
      </div>
      <div className="v-grid v-grid-pm">
        <div className="v-col">
          <div className="v-widget">
            <div className="v-widget-head">
              <div><SkBlock w={140} h={14} /><SkBlock w={180} h={10} style={{ marginTop: 6 }} /></div>
              <SkBlock w={140} h={26} r={6} />
            </div>
            <div style={{ padding: '0 0 12px' }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <SkBlock w={24} h={24} r={6} />
                  <div style={{ flex: 1 }}>
                    <SkBlock w={`${50 + (i*7)%30}%`} h={11} style={{ marginBottom: 4 }} />
                    <SkBlock w="40%" h={9} />
                  </div>
                  <SkBlock w={60} h={6} r={3} />
                  <SkBlock w={36} h={20} r={4} />
                  <SkBlock w={20} h={20} r={999} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="v-col">
          {[0,1,2].map(i => (
            <div key={i} className="v-widget">
              <div className="v-widget-head"><SkBlock w={100} h={13} /><SkBlock w={40} h={20} r={4} /></div>
              <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SkBlock w={20} h={20} r={999} />
                    <SkBlock w="60%" h={10} />
                    <SkBlock w={30} h={9} style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="v-list-view">
      <div className="v-list-table-head">
        {['Key','Title','Pri','Owner','Due','Est','Act','Status'].map((c, i) => (
          <span key={c} style={{ gridColumn: i + 1 }}><SkBlock w={36} h={8} /></span>
        ))}
      </div>
      {[0,1].map(g => (
        <section key={g} className="v-list-group">
          <div className="v-list-group-head">
            <SkBlock w={10} h={10} r={999} />
            <SkBlock w={90} h={11} />
            <SkBlock w={20} h={8} />
          </div>
          {[0,1,2,3,4].map(r => (
            <div key={r} className="v-list-row">
              <SkBlock w={56} h={10} />
              <div><SkBlock w={`${50 + (r*8) % 40}%`} h={11} /></div>
              <SkBlock w={50} h={12} r={3} />
              <SkBlock w={80} h={18} r={9} />
              <SkBlock w={44} h={10} />
              <SkBlock w={28} h={10} />
              <SkBlock w={56} h={10} />
              <SkBlock w={70} h={16} r={999} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function SkeletonBoard() {
  return (
    <div className="v-board">
      {['BACKLOG','TODO','IN_PROGRESS','REVIEW','DONE'].map(s => {
        const SL = window.STATUS_LABEL[s];
        return (
          <div key={s} className="v-board-col">
            <div className="v-board-col-head">
              <div className="v-board-col-head-left">
                <StatusDot status={s} size={12} />
                <span className="v-board-col-name">{SL.label}</span>
                <SkBlock w={16} h={14} r={999} />
              </div>
            </div>
            <div className="v-board-col-rail" style={{ background: SL.color }} />
            <div className="v-board-col-list">
              {[0,1,2,3].slice(0, 5 - 'IN_PROGRESS'.length % 4).map(i => (
                <div key={i} className="v-board-card v-board-card-sk">
                  <div className="v-board-card-head"><SkBlock w={56} h={9} /><span className="v-board-card-spacer" /><SkBlock w={36} h={10} /></div>
                  <SkBlock w="92%" h={11} style={{ display: 'block', marginBottom: 4 }} />
                  <SkBlock w="64%" h={11} style={{ display: 'block', marginBottom: 10 }} />
                  <div className="v-board-card-foot">
                    <SkBlock w={70} h={10} />
                    <SkBlock w={20} h={20} r={999} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mobile / tablet references ───────────────────────────────────────
function MobileBoard() {
  // Phone-sized (390 × 844)
  const tasks = EX_D.tasks.filter(t => t.project === 'VG-AUTH' && t.status === 'IN_PROGRESS');
  return (
    <div className="vantage-app v-mobile" style={{ width: 390, height: 844 }}>
      <div className="v-mobile-statusbar">
        <span className="v-mono">9:42</span>
        <span style={{ display: 'inline-flex', gap: 6, fontFamily: 'var(--font-mono)' }}>
          <span>●●●●</span>
          <span>5G</span>
          <span>96%</span>
        </span>
      </div>
      <header className="v-mobile-header">
        <button className="v-iconbtn v-iconbtn-bordered"><Icons.Chevron size={14} sw={1.8} style={{ transform: 'rotate(180deg)' }}/></button>
        <div className="v-mobile-header-title">
          <span className="v-mono v-mobile-header-key" style={{ background: window.keyColor('AUTH') }}>AU</span>
          <span>Auth refactor</span>
        </div>
        <button className="v-iconbtn v-iconbtn-bordered"><Icons.More size={14} sw={1.8} /></button>
      </header>
      <div className="v-mobile-tabs">
        <button>List</button>
        <button className="is-active">Board</button>
        <button>Gantt</button>
      </div>
      <div className="v-mobile-board-pager">
        <div className="v-mobile-col">
          <div className="v-mobile-col-head">
            <StatusDot status="IN_PROGRESS" size={11} />
            <span>In progress</span>
            <span className="v-mono">{tasks.length}</span>
          </div>
          {tasks.slice(0, 4).map(t => (
            <div key={t.id} className="v-board-card" style={{ '--pri-color': window.PRI[t.priority].color, padding: 10 }}>
              <div className="v-board-card-head">
                <span className="v-mono v-board-card-key">{t.id}</span>
                <span className="v-board-card-spacer" />
                <PriorityTag priority={t.priority} />
              </div>
              <div className="v-board-card-title" style={{ fontSize: 13 }}>{t.title}</div>
              <div className="v-board-card-foot">
                <span className="v-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  <Icons.Clock size={10} sw={1.7} /> {window.formatDate(t.due)}
                </span>
                <Avatar user={t.assignee ? EX_D.byId(t.assignee) : null} size={20} />
              </div>
            </div>
          ))}
        </div>
        <div className="v-mobile-col-peek" />
      </div>
      <nav className="v-mobile-bottom-nav">
        {[
          { icon: 'Home', label: 'Home' },
          { icon: 'Inbox', label: 'Inbox', count: 3 },
          { icon: 'Plus', label: '', primary: true },
          { icon: 'Projects', label: 'Projects', active: true },
          { icon: 'My', label: 'Me' },
        ].map((t, i) => {
          const I = Icons[t.icon];
          return (
            <button key={i} className={'v-mobile-nav-btn' + (t.active ? ' is-active' : '') + (t.primary ? ' is-primary' : '')}>
              <I size={t.primary ? 18 : 18} sw={t.primary ? 2 : 1.6} />
              {t.label && <span>{t.label}</span>}
              {t.count && <span className="v-mobile-nav-count v-mono">{t.count}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TabletDashboard() {
  // Tablet portrait (834 × 1112) — collapsed sidebar by default
  return (
    <div className={'vantage-app v-frame'} style={{ width: 834, height: 1112, fontSize: 13 }}>
      <window.Sidebar collapsed={true} role="PROJECT_MANAGER" currentRoute="home" onNavigate={() => {}} theme="light" onToggleTheme={() => {}}
        user={EX_D.users[0]} onToggleCollapse={() => {}} />
      <div className="v-main">
        <window.Topbar crumbs={['Dashboard']} onOpenSearch={() => {}} onOpenNotifs={() => {}} unread={3} />
        <div className="v-main-scroll">
          <TabletDashContent />
        </div>
      </div>
    </div>
  );
}

function TabletDashContent() {
  const today = new Date(2026, 4, 24);
  return (
    <div className="v-page" style={{ padding: '18px 22px 40px' }}>
      <header className="v-page-head">
        <div>
          <h1 className="v-page-title" style={{ fontSize: 20 }}>Welcome back, Maya</h1>
          <p className="v-page-sub"><span className="v-mono v-caps">Sun · May 24</span> · 14 teammates active</p>
        </div>
        <div className="v-page-actions">
          <Button variant="primary" icon="Plus">New project</Button>
        </div>
      </header>
      <div className="v-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Active', value: 8, delta: '+1', trend: 'up' },
          { label: 'On track', value: 5, pct: 62, tone: 'success' },
          { label: 'At risk', value: 2, pct: 25, tone: 'warning' },
        ].map((k, i) => <window.PMKPI key={i} {...k} />)}
      </div>
      <div className="v-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="v-widget">
          <div className="v-widget-head"><div><div className="v-widget-title">Project portfolio</div><div className="v-widget-sub">8 active</div></div></div>
          <div style={{ padding: 0 }}>
            <table className="v-table">
              <thead><tr><th>Project</th><th>Team</th><th>Progress</th><th>Due</th></tr></thead>
              <tbody>
                {EX_D.projects.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="v-portfolio-name">
                        <span className="v-portfolio-key v-mono" style={{ background: window.keyColor(p.key), width: 22, height: 22, fontSize: 9 }}>{p.key.slice(0, 2)}</span>
                        <div>
                          <div className="v-portfolio-title">{p.name}</div>
                          <div className="v-portfolio-meta"><Badge tone={p.status === 'at-risk' ? 'warning' : 'success'}>{p.status === 'at-risk' ? 'At risk' : 'On track'}</Badge><span className="v-mono">{p.id}</span></div>
                        </div>
                      </div>
                    </td>
                    <td><AvatarStack users={p.members.map(EX_D.byId)} size={18} max={3} /></td>
                    <td style={{ minWidth: 120 }}><div className="v-portfolio-progress"><ProgressBar value={p.progress} height={5} tone={p.health === 'at-risk' ? 'warning' : 'primary'} /><span className="v-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(p.progress*100)}%</span></div></td>
                    <td><span className="v-mono" style={{ color: 'var(--text-muted)' }}>{window.formatDate(p.end)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="v-widget">
          <div className="v-widget-head"><div className="v-widget-title">Upcoming milestones</div></div>
          <div style={{ padding: '0 14px 12px' }}>
            <ol className="v-milestone-rail">
              {EX_D.milestones.slice(0,4).map(m => (
                <li key={m.id} className="v-milestone">
                  <span className={'v-milestone-diamond' + (m.status === 'at-risk' ? ' is-risk' : '')}>
                    <Icons.Diamond size={12} sw={2} fill={m.status === 'at-risk' ? 'var(--warning)' : 'var(--primary)'} />
                  </span>
                  <div className="v-milestone-text">
                    <div className="v-milestone-title">{m.title}</div>
                    <div className="v-milestone-meta v-mono"><span>{m.project}</span><span>·</span><span>{window.formatDate(m.date)}</span></div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// alias so TabletDashContent doesn't crash
window.PMKPI = function ({ label, value, delta, trend, pct, tone, sparkline }) {
  return (
    <div className="v-kpi">
      <div className="v-kpi-label v-caps">{label}</div>
      <div className="v-kpi-value-row">
        <span className="v-kpi-value v-num">{value}</span>
        {delta && <span className={'v-kpi-delta v-mono' + (trend === 'down' ? ' is-down' : '')}>
          {trend === 'up' ? <Icons.Up size={10} sw={2.4}/> : <Icons.Down size={10} sw={2.4}/>}{delta}</span>}
        {pct != null && <span className={'v-kpi-pct v-mono v-badge v-badge-' + (tone || 'neutral') + ' v-badge-soft'}>{pct}%</span>}
      </div>
      {pct != null && <ProgressBar value={pct / 100} height={3} tone={tone === 'success' ? 'success' : 'warning'} />}
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────
const VANTAGE_EMPTY_CSS = `
.v-empty { padding: 56px 24px 64px; max-width: 480px; margin: 0 auto; text-align: center; }
.v-empty-glyph { position: relative; width: 96px; height: 96px; margin: 0 auto 22px; display: flex; align-items: center; justify-content: center;
  border-radius: 18px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
.v-empty-glyph-bg { position: absolute; inset: 0; opacity: 0.7; color: var(--primary); display: flex; align-items: center; justify-content: center; }
.v-empty-glyph-bg svg { transform: translateY(-6%) scale(1.15); }
.v-empty-glyph-icon { position: relative; z-index: 1; width: 48px; height: 48px; border-radius: 12px; background: var(--bg);
  border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: var(--shadow-sm); }
.v-empty-glyph-success .v-empty-glyph-icon { color: var(--success); }
.v-empty-glyph-success .v-empty-glyph-bg { color: var(--success); }
.v-empty-glyph-neutral .v-empty-glyph-icon { color: var(--text-muted); }
.v-empty-glyph-neutral .v-empty-glyph-bg  { color: var(--text-subtle); }
.v-empty-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); margin: 0 0 6px; }
.v-empty-body  { font-size: 13px; line-height: 1.55; color: var(--text-muted); margin: 0 0 22px; }
.v-empty-actions { display: flex; gap: 8px; justify-content: center; margin-top: 4px; }
.v-empty-cards { display: flex; flex-direction: column; gap: 6px; margin: 22px 0 4px; text-align: left; }
.v-empty-template { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--bg); cursor: default; font: inherit; }
.v-empty-template:hover { background: var(--surface); border-color: var(--primary); }
.v-empty-template-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--primary-softer); color: var(--primary);
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.v-empty-template > span:nth-child(2) { flex: 1; }
.v-empty-template-name { font-size: 12.5px; color: var(--text); font-weight: 500; }
.v-empty-template-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.v-empty-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.v-empty-stat { padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg);
  display: flex; flex-direction: column; gap: 4px; align-items: center; }
.v-empty-stat > span:first-child { font-size: 20px; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
.v-empty-stat > span:last-child { font-size: 9.5px; color: var(--text-muted); }
.v-empty-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin: 4px 0 14px; }
.v-empty-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text); font: inherit; font-size: 12px; cursor: default; }
.v-empty-chip:hover { background: var(--bg); border-color: var(--primary); color: var(--primary); }
.v-empty-tip { font-size: 11.5px; color: var(--text-muted); margin: 8px 0 0; }
.v-empty-tip code { font-family: var(--font-mono); }

/* Ghost cards for empty board */
.v-board-col-empty { position: relative; }
.v-ghost-card { height: 64px; background: var(--bg); border: 1px dashed var(--border-strong); border-radius: 7px; }
.v-empty-overlay { position: absolute; inset: 24px; display: flex; align-items: center; justify-content: center; pointer-events: none;
  background: linear-gradient(180deg, transparent 0, var(--bg) 70%); border-radius: 12px; }
.v-empty-overlay > .v-empty { pointer-events: auto; background: var(--bg); border-radius: 14px; max-width: 460px;
  border: 1px solid var(--border); box-shadow: var(--shadow-lg); padding: 32px 28px; }

/* Skeletons — shimmer */
@keyframes v-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.v-sk { background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 50%, var(--surface-2) 100%);
  background-size: 200% 100%; animation: v-shimmer 1.6s linear infinite; }
.theme-dark .v-sk { background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); background-size: 200% 100%; }

.v-board-card-sk { cursor: default; }
.v-board-card-sk:hover { box-shadow: var(--shadow-xs); }

/* Mobile reference */
.v-mobile { background: var(--bg); color: var(--text); border-radius: 32px; border: 6px solid #1a1a1a;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-lg); }
.v-mobile-statusbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 22px 4px; font-size: 12px; color: var(--text); }
.v-mobile-header { display: flex; align-items: center; gap: 10px; padding: 8px 14px 6px; }
.v-mobile-header-title { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--text); }
.v-mobile-header-key { width: 22px; height: 22px; border-radius: 5px; color: #fff; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; }
.v-mobile-tabs { display: flex; gap: 4px; padding: 8px 14px; }
.v-mobile-tabs button { padding: 6px 12px; border: 0; background: var(--surface); color: var(--text-muted); font: inherit; font-size: 12px; border-radius: 6px; cursor: default; }
.v-mobile-tabs button.is-active { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.v-mobile-board-pager { flex: 1; display: flex; gap: 12px; padding: 0 14px; overflow: hidden; }
.v-mobile-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.v-mobile-col-head { display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 12px; color: var(--text); }
.v-mobile-col-head .v-mono { margin-left: auto; color: var(--text-muted); font-size: 10.5px; }
.v-mobile-col-peek { flex: 0 0 16px; }
.v-mobile-bottom-nav { display: grid; grid-template-columns: repeat(5, 1fr); align-items: center; justify-items: center;
  padding: 8px 8px 14px; border-top: 1px solid var(--border); background: var(--bg); }
.v-mobile-nav-btn { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 4px 6px; border: 0; background: transparent; color: var(--text-muted); font: inherit; font-size: 10px; cursor: default; border-radius: 8px; }
.v-mobile-nav-btn.is-active { color: var(--primary); }
.v-mobile-nav-btn.is-primary { background: var(--primary); color: #fff; width: 44px; height: 44px; border-radius: 14px; }
.v-mobile-nav-count { position: absolute; top: -2px; right: 4px; background: var(--error); color: #fff; font-size: 9px; padding: 0 4px; border-radius: 999px; min-width: 14px; text-align: center; }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-empty-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-empty-styles';
  s.textContent = VANTAGE_EMPTY_CSS;
  document.head.appendChild(s);
}

Object.assign(window, {
  EmptyState, EmptyProjects, EmptyTasks, EmptyNotifications, EmptySearch,
  SkBlock, SkeletonDashboard, SkeletonList, SkeletonBoard,
  MobileBoard, TabletDashboard,
});
