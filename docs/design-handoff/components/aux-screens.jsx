// Vantage — auxiliary surfaces: search modal, notifications dropdown, settings,
// auth screens.

const { Icons, PeakMark, Avatar, AvatarStack, PriorityBars, PriorityTag, StatusPill, StatusDot,
        Badge, Button, IconButton, Card, Kbd, TopoPattern } = window;
const AX_D = window.VANTAGE_DATA;

// ── Search modal ─────────────────────────────────────────────────────
function SearchModal({ onClose }) {
  const groups = [
    {
      label: 'Projects',
      kind: 'projects',
      items: [
        { id: 'VG-AUTH',  key: 'AUTH',  name: 'Auth service refactor',     meta: '18 open · lead Maya' },
        { id: 'VG-KAFKA', key: 'KAFKA', name: 'Kafka → Pub/Sub migration', meta: '51 open · at risk' },
      ],
    },
    {
      label: 'Tasks',
      kind: 'tasks',
      items: [
        AX_D.tasks[1],
        AX_D.tasks[0],
        AX_D.tasks[5],
      ],
    },
    {
      label: 'People',
      kind: 'people',
      items: [AX_D.users[0], AX_D.users[1]],
    },
  ];

  return (
    <div className="v-modal-veil" onClick={onClose}>
      <div className="v-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="v-search-input-row">
          <Icons.Search size={16} sw={1.7} />
          <input className="v-search-input" defaultValue="auth" placeholder="Search projects, tasks, people…" autoFocus />
          <Kbd>esc</Kbd>
        </div>
        <div className="v-search-results">
          {groups.map(g => (
            <section key={g.label} className="v-search-group">
              <div className="v-search-group-head v-caps">{g.label}</div>
              <ul>
                {g.kind === 'projects' && g.items.map((p, i) => (
                  <li key={p.id} className={'v-search-item' + (i === 0 && g.label === 'Projects' ? ' is-active' : '')}>
                    <span className="v-portfolio-key v-mono" style={{ width: 22, height: 22, background: window.keyColor(p.key) }}>{p.key.slice(0,2)}</span>
                    <span className="v-search-item-text">
                      <div className="v-search-item-title"><HL text={p.name} q="auth" /></div>
                      <div className="v-search-item-sub v-mono">{p.id} · {p.meta}</div>
                    </span>
                    <Icons.ArrowRight size={12} sw={1.7} style={{ color: 'var(--text-muted)' }} />
                  </li>
                ))}
                {g.kind === 'tasks' && g.items.map(t => (
                  <li key={t.id} className="v-search-item">
                    <PriorityBars priority={t.priority} />
                    <StatusDot status={t.status} size={12} />
                    <span className="v-mono v-search-item-key">{t.id}</span>
                    <span className="v-search-item-text">
                      <div className="v-search-item-title"><HL text={t.title} q="auth" /></div>
                      <div className="v-search-item-sub v-mono">in AUTH · due {window.formatDate(t.due)}</div>
                    </span>
                  </li>
                ))}
                {g.kind === 'people' && g.items.map(u => (
                  <li key={u.id} className="v-search-item">
                    <Avatar user={u} size={22} />
                    <span className="v-search-item-text">
                      <div className="v-search-item-title">{u.name}</div>
                      <div className="v-search-item-sub v-mono">{u.email}</div>
                    </span>
                    <Badge tone="neutral" mono>{u.role.replace('_', ' ')}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer className="v-search-foot">
          <span><Kbd>↑↓</Kbd> Navigate</span>
          <span><Kbd>↵</Kbd> Open</span>
          <span><Kbd>⌘⏎</Kbd> Open in new tab</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-subtle)' }}>3 of 47 results</span>
        </footer>
      </div>
    </div>
  );
}

function HL({ text, q }) {
  if (!q) return text;
  const re = new RegExp('(' + q + ')', 'ig');
  const parts = text.split(re);
  return <>{parts.map((p, i) => re.test(p) ? <mark key={i} className="v-hl">{p}</mark> : <span key={i}>{p}</span>)}</>;
}

// ── Notifications dropdown ───────────────────────────────────────────
function NotificationsPanel({ onClose, anchor = 'topbar' }) {
  const groups = [
    { label: 'New', items: AX_D.notifications.filter(n => !n.read) },
    { label: 'Earlier', items: AX_D.notifications.filter(n => n.read) },
  ];
  return (
    <div className={'v-notifs ' + 'v-notifs-' + anchor}>
      <div className="v-notifs-head">
        <div>
          <div className="v-notifs-title">Inbox</div>
          <div className="v-notifs-sub v-mono">3 unread</div>
        </div>
        <div className="v-notifs-tabs">
          <button className="is-active">All</button>
          <button>Mentions</button>
          <button>Watching</button>
        </div>
        <button className="v-notifs-mark">Mark all read</button>
      </div>
      <div className="v-notifs-body">
        {groups.map(g => g.items.length > 0 && (
          <section key={g.label}>
            <div className="v-notifs-section v-caps">{g.label}</div>
            <ul className="v-notifs-list">
              {g.items.map(n => <NotifRow key={n.id} n={n} />)}
            </ul>
          </section>
        ))}
      </div>
      <div className="v-notifs-foot">
        <a className="v-link">Open full inbox</a>
        <a className="v-link" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Notification settings</a>
      </div>
    </div>
  );
}

function NotifRow({ n }) {
  const actor = n.actor ? AX_D.byId(n.actor) : null;
  const ICONS = { assigned: 'My', comment: 'MessageCircle', mention: 'At', due: 'Clock', review: 'Eye' };
  const I = Icons[ICONS[n.kind] || 'Bell'];
  return (
    <li className={'v-notif-row' + (!n.read ? ' is-unread' : '')}>
      <span className="v-notif-icon" data-kind={n.kind}><I size={11} sw={1.8} /></span>
      {actor && <Avatar user={actor} size={22} />}
      {!actor && <span className="v-notif-syst"><Icons.Bell size={12} sw={1.7} /></span>}
      <span className="v-notif-text">
        {actor && <><b>{actor.name.split(' ')[0]}</b> </>}
        {n.text} <span className="v-mono v-notif-target">{n.target}</span>
      </span>
      <span className="v-notif-when v-mono">{n.when}</span>
      {!n.read && <span className="v-notif-dot" />}
    </li>
  );
}

// ── Settings · Users page ────────────────────────────────────────────
function SettingsUsers() {
  const groups = [
    { label: 'Account',      items: [{ id: 'profile', label: 'Profile' }, { id: 'security', label: 'Security' }, { id: 'notifications', label: 'Notifications' }, { id: 'integrations', label: 'Integrations' }] },
    { label: 'Workspace',    items: [{ id: 'general', label: 'General' }, { id: 'users', label: 'People', active: true }, { id: 'roles', label: 'Roles & permissions' }, { id: 'billing', label: 'Billing' }, { id: 'audit', label: 'Audit log' }] },
    { label: 'Developers',   items: [{ id: 'api', label: 'API keys' }, { id: 'webhooks', label: 'Webhooks' }] },
  ];
  return (
    <div className="v-settings">
      <aside className="v-settings-side">
        <div className="v-settings-side-head">
          <Icons.Settings size={14} sw={1.7} />
          <span>Settings</span>
        </div>
        {groups.map(g => (
          <div key={g.label} className="v-settings-side-group">
            <div className="v-caps v-settings-side-label">{g.label}</div>
            {g.items.map(it => (
              <a key={it.id} className={'v-settings-side-item' + (it.active ? ' is-active' : '')}>
                {it.label}
              </a>
            ))}
          </div>
        ))}
      </aside>
      <div className="v-settings-main">
        <div className="v-settings-head">
          <div>
            <h2 className="v-settings-title">People</h2>
            <p className="v-settings-sub">Invite teammates and manage their roles. {AX_D.users.length} active · 4 pending</p>
          </div>
          <div className="v-settings-actions">
            <Button variant="secondary" icon="Mail">Bulk invite</Button>
            <Button variant="primary" icon="Plus">Invite people</Button>
          </div>
        </div>

        <div className="v-settings-search">
          <Icons.Search size={14} sw={1.7} />
          <input className="v-settings-search-input" placeholder="Filter by name, email, role…" />
          <button className="v-toolbar-filter">Role: any <Icons.Down size={12} sw={1.7} /></button>
          <button className="v-toolbar-filter">Status: any <Icons.Down size={12} sw={1.7} /></button>
        </div>

        <table className="v-table v-table-users">
          <thead>
            <tr>
              <th>User</th><th>Role</th><th>Projects</th><th>Last active</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {AX_D.users.map((u, i) => (
              <tr key={u.id}>
                <td>
                  <div className="v-portfolio-name">
                    <Avatar user={u} size={28} />
                    <div>
                      <div className="v-portfolio-title">{u.name}</div>
                      <div className="v-portfolio-meta v-mono">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={u.role === 'ADMIN' ? 'accent' : u.role === 'PROJECT_MANAGER' ? 'primary' : 'neutral'} mono>
                    {u.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td><span className="v-mono">{2 + (i % 4)}</span></td>
                <td><span className="v-mono v-table-when">{['2m ago','14m ago','1h ago','3h ago','yesterday','yesterday','2d ago','5d ago'][i]}</span></td>
                <td>
                  {i === 6 ? <Badge tone="warning">Pending</Badge> : <Badge tone="success" soft><span className="v-people-dot" style={{ marginRight: 4 }} /> Active</Badge>}
                </td>
                <td><IconButton icon="More" label="More" /></td>
              </tr>
            ))}
            <tr className="v-table-pending">
              <td>
                <div className="v-portfolio-name">
                  <span className="v-avatar v-avatar-empty" style={{ width: 28, height: 28 }}><Icons.Mail size={14} sw={1.7} /></span>
                  <div>
                    <div className="v-portfolio-title">tomas@acme.dev</div>
                    <div className="v-portfolio-meta v-mono">invited by Aria · 3d ago</div>
                  </div>
                </div>
              </td>
              <td><Badge tone="neutral" mono>DEVELOPER</Badge></td>
              <td><span className="v-mono">—</span></td>
              <td><span className="v-mono v-table-when">—</span></td>
              <td><Badge tone="warning">Pending</Badge></td>
              <td><div className="v-row-actions"><Button variant="ghost" size="sm">Resend</Button><Button variant="ghost" size="sm">Revoke</Button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Auth: Login ──────────────────────────────────────────────────────
function LoginScreen({ theme = 'light' }) {
  return (
    <div className={'vantage-app v-auth ' + (theme === 'dark' ? 'theme-dark' : 'theme-light')}>
      <div className="v-auth-bg">
        <TopoPattern width={760} height={760} opacity={0.5} color="var(--primary)" />
      </div>
      <div className="v-auth-left">
        <div className="v-auth-brand">
          <PeakMark size={28} />
          <span className="v-auth-brand-name">Vantage</span>
        </div>
        <div className="v-auth-quote">
          <div className="v-auth-quote-mark">“</div>
          <p>Ship from the high ground.</p>
          <div className="v-auth-quote-meta v-mono">PROJECTS · PEOPLE · DELIVERY · ONE PLACE</div>
        </div>
        <div className="v-auth-foot v-mono">
          <span>v2.4.1</span><span>·</span><span>SOC 2 Type II</span><span>·</span><span>status</span>
        </div>
      </div>
      <div className="v-auth-right">
        <div className="v-auth-card">
          <h1 className="v-auth-title">Welcome back</h1>
          <p className="v-auth-sub">Sign in to your workspace.</p>
          <form className="v-auth-form" onSubmit={(e) => e.preventDefault()}>
            <label className="v-label">Work email</label>
            <input className="v-input" type="email" defaultValue="maya@acme.dev" />
            <div className="v-auth-pwd">
              <label className="v-label">Password</label>
              <a className="v-link" style={{ fontSize: 12 }}>Forgot?</a>
            </div>
            <div className="v-input-wrap">
              <input className="v-input" type="password" defaultValue="••••••••••" />
              <button className="v-input-eye"><Icons.Eye size={14} sw={1.7} /></button>
            </div>
            <label className="v-auth-check">
              <input type="checkbox" defaultChecked />
              <span>Keep me signed in for 14 days</span>
            </label>
            <Button variant="primary" size="md" iconRight="ArrowRight" style={{ width: '100%', justifyContent: 'center', height: 38 }}>Continue</Button>
          </form>
          <div className="v-auth-divider"><span>or</span></div>
          <div className="v-auth-sso">
            <button className="v-auth-sso-btn"><span className="v-mono">SAML</span> SSO with Acme</button>
            <button className="v-auth-sso-btn"><Icons.Lock size={13} sw={1.7} /> Passkey</button>
          </div>
          <p className="v-auth-footer">Don't have an account? <a className="v-link">Talk to your admin →</a></p>
        </div>
      </div>
    </div>
  );
}

// ── Auth: Reset password ─────────────────────────────────────────────
function ResetPasswordScreen({ theme = 'light' }) {
  return (
    <div className={'vantage-app v-auth ' + (theme === 'dark' ? 'theme-dark' : 'theme-light')}>
      <div className="v-auth-bg">
        <TopoPattern width={760} height={760} opacity={0.5} color="var(--primary)" />
      </div>
      <div className="v-auth-left">
        <div className="v-auth-brand"><PeakMark size={28} /><span className="v-auth-brand-name">Vantage</span></div>
        <div className="v-auth-quote">
          <p>Reset your password.</p>
          <div className="v-auth-quote-meta v-mono">WE'LL EMAIL YOU A SECURE LINK</div>
        </div>
      </div>
      <div className="v-auth-right">
        <div className="v-auth-card">
          <button className="v-auth-back"><Icons.Chevron size={12} sw={2} style={{ transform: 'rotate(180deg)' }}/> Back to sign in</button>
          <h1 className="v-auth-title">Forgot your password?</h1>
          <p className="v-auth-sub">Enter the email you use for Vantage and we'll send a reset link valid for 30 minutes.</p>
          <form className="v-auth-form" onSubmit={(e) => e.preventDefault()}>
            <label className="v-label">Work email</label>
            <input className="v-input" type="email" placeholder="you@company.com" />
            <Button variant="primary" iconRight="Mail" style={{ width: '100%', justifyContent: 'center', height: 38, marginTop: 8 }}>Send reset link</Button>
          </form>
          <div className="v-auth-info">
            <Icons.Lock size={13} sw={1.7} />
            <span>If you signed in with SAML SSO, contact your workspace admin instead.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth: Accept invite ──────────────────────────────────────────────
function AcceptInviteScreen({ theme = 'light' }) {
  return (
    <div className={'vantage-app v-auth ' + (theme === 'dark' ? 'theme-dark' : 'theme-light')}>
      <div className="v-auth-bg">
        <TopoPattern width={760} height={760} opacity={0.5} color="var(--primary)" />
      </div>
      <div className="v-auth-left">
        <div className="v-auth-brand"><PeakMark size={28} /><span className="v-auth-brand-name">Vantage</span></div>
        <div className="v-auth-quote">
          <p>One last step — set a password.</p>
          <div className="v-auth-quote-meta v-mono">YOU'LL LAND IN ACME · PLATFORM AS A DEVELOPER</div>
        </div>
      </div>
      <div className="v-auth-right">
        <div className="v-auth-card">
          <div className="v-auth-invite-banner">
            <Avatar user={AX_D.users[6]} size={32} />
            <div>
              <div style={{ fontSize: 13 }}><b>Aria Nakamura</b> invited you to</div>
              <div className="v-mono v-auth-invite-org">ACME · PLATFORM</div>
            </div>
          </div>
          <h1 className="v-auth-title">Welcome to Vantage</h1>
          <p className="v-auth-sub">Set a password for <b>tomas@acme.dev</b> and you're in.</p>
          <form className="v-auth-form" onSubmit={(e) => e.preventDefault()}>
            <label className="v-label">Full name</label>
            <input className="v-input" defaultValue="Tomas Lindqvist" />
            <label className="v-label">Password</label>
            <div className="v-input-wrap">
              <input className="v-input" type="password" defaultValue="••••••••••••" />
              <button className="v-input-eye"><Icons.Eye size={14} sw={1.7} /></button>
            </div>
            <PasswordMeter strength={3} />
            <Button variant="primary" iconRight="ArrowRight" style={{ width: '100%', justifyContent: 'center', height: 38, marginTop: 10 }}>Create account</Button>
          </form>
          <p className="v-auth-footer">By continuing you agree to the <a className="v-link">terms</a> and <a className="v-link">privacy policy</a>.</p>
        </div>
      </div>
    </div>
  );
}

function PasswordMeter({ strength = 2 }) {
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Excellent'];
  const colors = ['var(--error)', 'var(--error)', 'var(--warning)', 'var(--primary)', 'var(--success)'];
  return (
    <div className="v-pwd-meter">
      <div className="v-pwd-bars">
        {[0,1,2,3].map(i => (
          <span key={i} className="v-pwd-bar" style={{ background: i < strength ? colors[strength] : 'var(--surface-2)' }} />
        ))}
      </div>
      <span className="v-mono" style={{ fontSize: 11, color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const VANTAGE_AUX_CSS = `
/* Search modal */
.v-modal-veil { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center; padding-top: 92px; z-index: 100; }
.theme-dark .v-modal-veil { background: rgba(0, 0, 0, 0.6); }
.v-search-modal { width: 580px; max-width: 92%; background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; }
.v-search-input-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); }
.v-search-input { flex: 1; border: 0; background: transparent; font: inherit; font-size: 15px; color: var(--text); outline: none; }
.v-search-input::placeholder { color: var(--text-subtle); }
.v-search-results { max-height: 400px; overflow-y: auto; padding: 8px 0; }
.v-search-group { padding: 4px 0 8px; }
.v-search-group-head { padding: 4px 16px; color: var(--text-muted); }
.v-search-group ul { list-style: none; margin: 0; padding: 0; }
.v-search-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; cursor: default; }
.v-search-item.is-active, .v-search-item:hover { background: var(--surface); }
.v-search-item-key { font-size: 11px; color: var(--text-muted); flex: 0 0 70px; }
.v-search-item-text { flex: 1; min-width: 0; }
.v-search-item-title { font-size: 13px; color: var(--text); }
.v-search-item-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.v-hl { background: var(--primary-soft); color: var(--primary); border-radius: 2px; padding: 0 1px; font-weight: 600; }
.v-search-foot { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-top: 1px solid var(--border);
  font-size: 11px; color: var(--text-muted); background: var(--surface); }
.v-search-foot span { display: inline-flex; align-items: center; gap: 4px; }

/* Notifications */
.v-notifs { width: 380px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: var(--shadow-lg); overflow: hidden; }
.v-notifs-topbar { position: absolute; top: 50px; right: 14px; z-index: 60; }
.v-notifs-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px 10px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.v-notifs-title { font-size: 14px; font-weight: 600; color: var(--text); }
.v-notifs-sub { font-size: 10.5px; color: var(--text-muted); margin-top: 1px; }
.v-notifs-tabs { display: flex; gap: 2px; padding: 2px; background: var(--surface); border-radius: 6px; margin-left: auto; }
.v-notifs-tabs button { padding: 3px 8px; font-size: 11px; border: 0; background: transparent; color: var(--text-muted); border-radius: 4px; font: inherit; font-weight: 500; cursor: default; }
.v-notifs-tabs button.is-active { background: var(--bg); color: var(--text); box-shadow: var(--shadow-xs); }
.v-notifs-mark { background: transparent; border: 0; color: var(--text-muted); font: inherit; font-size: 11px; cursor: default; padding: 3px 6px; border-radius: 4px; flex: 1 0 auto; text-align: right; }
.v-notifs-mark:hover { color: var(--primary); }
.v-notifs-body { max-height: 460px; overflow-y: auto; }
.v-notifs-section { padding: 8px 14px 4px; color: var(--text-muted); }
.v-notifs-list { list-style: none; margin: 0; padding: 0 0 4px; }
.v-notif-row { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 0; cursor: default; }
.v-notif-row.is-unread { background: var(--primary-softer); }
.v-notif-row:hover { background: var(--surface); }
.v-notif-icon { width: 20px; height: 20px; flex: 0 0 auto; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface-2); color: var(--text-muted); }
.v-notif-icon[data-kind="assigned"] { background: var(--primary-soft); color: var(--primary); }
.v-notif-icon[data-kind="mention"]  { background: var(--accent-soft);  color: var(--accent); }
.v-notif-icon[data-kind="review"]   { background: var(--warning-soft); color: var(--warning); }
.v-notif-icon[data-kind="due"]      { background: var(--error-soft);   color: var(--error); }
.v-notif-syst { width: 22px; height: 22px; border-radius: 999px; background: var(--surface-2); display: inline-flex; align-items: center; justify-content: center; color: var(--text-muted); }
.v-notif-text { flex: 1; font-size: 12.5px; color: var(--text); line-height: 1.4; min-width: 0; }
.v-notif-text b { font-weight: 600; }
.v-notif-target { color: var(--primary); }
.v-notif-when { font-size: 10.5px; color: var(--text-muted); flex: 0 0 auto; }
.v-notif-dot { position: absolute; top: 50%; right: 6px; transform: translateY(-50%); width: 6px; height: 6px; border-radius: 999px; background: var(--primary); }
.v-notifs-foot { display: flex; align-items: center; padding: 10px 14px; border-top: 1px solid var(--border); background: var(--surface); font-size: 12px; gap: 10px; }

/* Settings */
.v-settings { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100% - 0px); }
.v-settings-side { padding: 18px 14px; border-right: 1px solid var(--border); background: var(--bg); }
.v-settings-side-head { display: flex; align-items: center; gap: 7px; padding: 0 6px 14px; color: var(--text); font-size: 13px; font-weight: 600; }
.v-settings-side-group { margin-bottom: 16px; }
.v-settings-side-label { color: var(--text-muted); padding: 6px 6px 4px; }
.v-settings-side-item { display: block; padding: 6px 10px; border-radius: 5px; color: var(--text-muted); font-size: 12.5px; cursor: default; }
.v-settings-side-item:hover { background: var(--surface); color: var(--text); }
.v-settings-side-item.is-active { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.v-settings-main { padding: 24px 32px 60px; }
.v-settings-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.v-settings-title { font-size: 20px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; color: var(--text); }
.v-settings-sub { font-size: 12.5px; color: var(--text-muted); margin: 0; }
.v-settings-actions { display: flex; gap: 8px; }
.v-settings-search { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; background: var(--bg);
  border: 1px solid var(--border); border-radius: 7px; color: var(--text-muted); margin-bottom: 14px; }
.v-settings-search-input { flex: 1; border: 0; background: transparent; font: inherit; font-size: 13px; color: var(--text); outline: none; }

.v-table-users { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.v-table-when { color: var(--text-muted); font-size: 11px; }
.v-table-pending { background: var(--warning-soft); }
.v-row-actions { display: flex; gap: 4px; justify-content: flex-end; }

/* Auth screens */
.v-auth { display: grid; grid-template-columns: minmax(0, 1fr) 460px; height: 100%; background: var(--bg); color: var(--text);
  font-family: var(--font-sans); border-radius: 6px; border: 1px solid var(--border); overflow: hidden; position: relative; }
.v-auth-bg { position: absolute; inset: 0; pointer-events: none; color: var(--primary);
  display: flex; align-items: center; justify-content: flex-start; overflow: hidden; opacity: 0.5; }
.v-auth-bg svg { transform: translate(-20%, 12%) scale(1.4); }
.v-auth-left { position: relative; padding: 40px 48px; display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(135deg, var(--surface), var(--bg)); border-right: 1px solid var(--border); }
.v-auth-brand { display: flex; align-items: center; gap: 9px; }
.v-auth-brand-name { font-size: 18px; font-weight: 600; letter-spacing: -0.015em; color: var(--text); }
.v-auth-quote { position: relative; max-width: 380px; }
.v-auth-quote-mark { font-size: 64px; line-height: 0.6; color: var(--primary); opacity: 0.5; font-family: Georgia, serif; margin-bottom: 10px; }
.v-auth-quote p { font-size: 26px; line-height: 1.3; font-weight: 600; letter-spacing: -0.02em; color: var(--text); margin: 0 0 16px; }
.v-auth-quote-meta { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.08em; }
.v-auth-foot { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); }

.v-auth-right { padding: 60px 48px; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.v-auth-card { width: 100%; max-width: 360px; }
.v-auth-back { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 0; background: transparent;
  color: var(--text-muted); font: inherit; font-size: 12px; cursor: default; border-radius: 4px; margin-bottom: 12px; margin-left: -8px; }
.v-auth-back:hover { color: var(--text); background: var(--surface); }
.v-auth-title { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; margin: 0 0 6px; color: var(--text); }
.v-auth-sub { font-size: 13px; color: var(--text-muted); margin: 0 0 22px; }
.v-auth-form { display: flex; flex-direction: column; gap: 8px; }
.v-auth-form .v-label { margin-top: 4px; margin-bottom: 4px; }
.v-auth-pwd { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.v-input-wrap { position: relative; }
.v-input-eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 26px; height: 26px; border: 0;
  background: transparent; color: var(--text-muted); cursor: default; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; }
.v-input-eye:hover { background: var(--surface); color: var(--text); }
.v-auth-check { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-muted); margin: 4px 0 10px; }
.v-auth-check input { accent-color: var(--primary); }
.v-auth-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0 14px; font-size: 11px; color: var(--text-subtle); }
.v-auth-divider::before, .v-auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.v-auth-sso { display: flex; flex-direction: column; gap: 6px; }
.v-auth-sso-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 7px; color: var(--text); font: inherit; font-size: 13px; cursor: default;
  box-shadow: var(--shadow-xs); }
.v-auth-sso-btn:hover { background: var(--surface); border-color: var(--border-strong); }
.v-auth-sso-btn .v-mono { font-size: 11px; padding: 1px 6px; background: var(--primary-soft); color: var(--primary); border-radius: 3px; font-weight: 600; }
.v-auth-footer { margin-top: 22px; font-size: 12px; color: var(--text-muted); text-align: center; }
.v-auth-info { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--surface); font-size: 12px; color: var(--text-muted); margin-top: 14px; }
.v-auth-info svg { flex: 0 0 auto; margin-top: 2px; color: var(--primary); }

.v-auth-invite-banner { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--surface); margin-bottom: 22px; }
.v-auth-invite-org { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.06em; margin-top: 2px; }

.v-pwd-meter { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.v-pwd-bars { display: flex; gap: 3px; flex: 1; }
.v-pwd-bar { flex: 1; height: 3px; border-radius: 3px; background: var(--surface-2); transition: background .2s; }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-aux-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-aux-styles';
  s.textContent = VANTAGE_AUX_CSS;
  document.head.appendChild(s);
}

Object.assign(window, {
  SearchModal, NotificationsPanel, NotifRow, SettingsUsers,
  LoginScreen, ResetPasswordScreen, AcceptInviteScreen,
});
