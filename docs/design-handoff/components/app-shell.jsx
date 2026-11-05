// Vantage — app shell. Sidebar + topbar + frame.

const { useState, useMemo } = React;
const { Icons, PeakMark, Avatar, AvatarStack, IconButton, Button, Kbd } = window;

// ── Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggleCollapse, role, onChangeRole, currentRoute, onNavigate, theme, onToggleTheme, user }) {
  const W = collapsed ? 56 : 240;
  const navItems = [
    { id: 'home',     label: role === 'DEVELOPER' ? 'My work' : 'Dashboard', icon: 'Home',     count: null },
    { id: 'inbox',    label: 'Inbox',          icon: 'Inbox',    count: 3 },
    { id: 'projects', label: 'Projects',       icon: 'Projects', count: 8 },
    { id: 'team',     label: 'Team',           icon: 'Team',     count: null },
    { id: 'reports',  label: 'Reports',        icon: 'Reports',  count: null },
    { id: 'calendar', label: 'Calendar',       icon: 'Calendar', count: null },
  ];
  const pinned = [
    { key: 'AUTH',  name: 'Auth service refactor',  color: '#0D7A75' },
    { key: 'KAFKA', name: 'Kafka migration',         color: '#7C3AED' },
    { key: 'BILL',  name: 'Billing v3 rollout',      color: '#DB2777' },
    { key: 'OBS',   name: 'Observability v2',        color: '#0891B2' },
  ];

  return (
    <aside className="v-sidebar" style={{ width: W }}>
      {/* brand */}
      <div className="v-sidebar-brand">
        <div className="v-sidebar-mark"><PeakMark size={22} /></div>
        {!collapsed && (
          <div className="v-sidebar-brand-text">
            <div className="v-sidebar-brand-name">Vantage</div>
            <div className="v-sidebar-brand-org" title="Switch workspace">
              <span>Acme · Platform</span>
              <Icons.Down size={12} sw={2} />
            </div>
          </div>
        )}
        {!collapsed && <IconButton icon="Sliders" label="Collapse" onClick={onToggleCollapse} />}
      </div>

      {/* quick: search + new */}
      <div className="v-sidebar-quick">
        {collapsed ? (
          <>
            <button className="v-sidebar-icon" title="Search ⌘K"><Icons.Search size={16} sw={1.8} /></button>
            <button className="v-sidebar-icon v-sidebar-new" title="New task"><Icons.Plus size={16} sw={2} /></button>
          </>
        ) : (
          <>
            <button className="v-sidebar-search">
              <Icons.Search size={14} sw={1.7} />
              <span>Search…</span>
              <Kbd>⌘K</Kbd>
            </button>
            <button className="v-sidebar-new-btn" title="Create"><Icons.Plus size={14} sw={2} /></button>
          </>
        )}
      </div>

      {/* primary nav */}
      <nav className="v-sidebar-nav">
        {navItems.map(item => (
          <SidebarItem key={item.id} item={item} active={currentRoute === item.id}
                       collapsed={collapsed} onClick={() => onNavigate(item.id)} />
        ))}
      </nav>

      {/* pinned projects */}
      {!collapsed && (
        <div className="v-sidebar-section">
          <div className="v-sidebar-section-head">
            <span className="v-caps">Projects</span>
            <IconButton icon="Plus" size={12} label="Add project" />
          </div>
          {pinned.map(p => (
            <a key={p.key} className={'v-sidebar-pin' + (currentRoute === 'project-' + p.key ? ' is-active' : '')}
               onClick={() => onNavigate('project-' + p.key)}>
              <span className="v-sidebar-pin-mark" style={{ background: p.color }}>{p.key.slice(0, 1)}</span>
              <span className="v-sidebar-pin-name">{p.name}</span>
            </a>
          ))}
        </div>
      )}

      {/* footer */}
      <div className="v-sidebar-footer">
        {!collapsed ? (
          <>
            <div className="v-sidebar-user">
              <Avatar user={user} size={26} />
              <div className="v-sidebar-user-text">
                <div className="v-sidebar-user-name">{user.name}</div>
                <div className="v-sidebar-user-role">{role === 'PROJECT_MANAGER' ? 'Project Manager' : role === 'ADMIN' ? 'Admin' : 'Developer'}</div>
              </div>
              <IconButton icon="MoreH" label="Account" />
            </div>
            <div className="v-sidebar-theme-row">
              <button className={'v-theme-btn' + (theme === 'light' ? ' is-active' : '')} onClick={() => onToggleTheme('light')}>
                <Icons.Sun size={13} sw={1.7} /><span>Light</span>
              </button>
              <button className={'v-theme-btn' + (theme === 'dark' ? ' is-active' : '')} onClick={() => onToggleTheme('dark')}>
                <Icons.Moon size={13} sw={1.7} /><span>Dark</span>
              </button>
            </div>
          </>
        ) : (
          <div className="v-sidebar-footer-collapsed">
            <Avatar user={user} size={26} />
            <button className="v-sidebar-icon" onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Icons.Sun size={15} sw={1.7} /> : <Icons.Moon size={15} sw={1.7} />}
            </button>
          </div>
        )}
      </div>

      {/* collapse handle */}
      {collapsed && (
        <button className="v-sidebar-collapse-handle" onClick={onToggleCollapse} title="Expand">
          <Icons.Chevron size={12} sw={2} />
        </button>
      )}
    </aside>
  );
}

function SidebarItem({ item, active, collapsed, onClick }) {
  const I = Icons[item.icon];
  return (
    <a className={'v-sidebar-item' + (active ? ' is-active' : '') + (collapsed ? ' is-collapsed' : '')}
       onClick={onClick} title={collapsed ? item.label : null}>
      <span className="v-sidebar-item-rail" />
      <I size={16} sw={1.7} />
      {!collapsed && <span className="v-sidebar-item-label">{item.label}</span>}
      {!collapsed && item.count != null && <span className="v-sidebar-item-count">{item.count}</span>}
    </a>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────
function Topbar({ crumbs, onOpenSearch, onOpenNotifs, unread, contextActions }) {
  return (
    <header className="v-topbar">
      <div className="v-topbar-left">
        <nav className="v-crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="v-crumb-sep">/</span>}
              <a className={'v-crumb' + (i === crumbs.length - 1 ? ' is-current' : '')}>{c}</a>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <button className="v-topbar-search" onClick={onOpenSearch}>
        <Icons.Search size={14} sw={1.7} />
        <span>Search projects, tasks, people…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="v-topbar-right">
        {contextActions}
        <IconButton icon="Bell" label="Notifications" onClick={onOpenNotifs} style={{ position: 'relative' }}>
        </IconButton>
        {unread > 0 && <span className="v-bell-badge"><span>{unread}</span></span>}
      </div>
    </header>
  );
}

// ── App frame: sidebar + topbar + main content ───────────────────────
function AppFrame({ children, theme = 'light', sidebarCollapsed = false, role = 'PROJECT_MANAGER',
                   currentRoute = 'home', crumbs = ['Home'], onNavigate = () => {}, onOpenSearch = () => {},
                   onOpenNotifs = () => {}, onToggleCollapse = () => {}, onToggleTheme = () => {}, user,
                   unread = 3, contextActions, width = 1440, height = 900, scale = 1 }) {
  return (
    <div className={'vantage-app v-frame ' + (theme === 'dark' ? 'theme-dark' : 'theme-light')}
         style={{ width, height, transform: scale === 1 ? null : `scale(${scale})`, transformOrigin: 'top left' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={onToggleCollapse}
        role={role} currentRoute={currentRoute} onNavigate={onNavigate}
        theme={theme} onToggleTheme={onToggleTheme} user={user} />
      <div className="v-main">
        <Topbar crumbs={crumbs} onOpenSearch={onOpenSearch} onOpenNotifs={onOpenNotifs} unread={unread} contextActions={contextActions} />
        <div className="v-main-scroll">{children}</div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const VANTAGE_SHELL_CSS = `
.v-frame { display: flex; height: 100%; background: var(--bg); color: var(--text); overflow: hidden;
  border-radius: 6px; border: 1px solid var(--border); }

/* Sidebar — Notion-style light bg, subtle right border, no heavy shadow */
.v-sidebar { display: flex; flex-direction: column; flex: 0 0 auto; background: var(--bg);
  border-right: 1px solid var(--border); transition: width .18s ease; position: relative; overflow: hidden; }
.theme-dark .v-sidebar { background: var(--bg); }
.v-sidebar-brand { display: flex; align-items: center; gap: 8px; padding: 14px 12px 10px; }
.v-sidebar-mark { flex: 0 0 auto; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 7px; background: var(--primary-softer); }
.v-sidebar-brand-text { flex: 1; min-width: 0; }
.v-sidebar-brand-name { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); }
.v-sidebar-brand-org  { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-muted); margin-top: 1px; }

.v-sidebar-quick { display: flex; align-items: center; gap: 6px; padding: 0 10px 10px; }
.v-sidebar-search { flex: 1; display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 9px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 7px; color: var(--text-muted);
  font: inherit; font-size: 12.5px; cursor: default; }
.v-sidebar-search:hover { background: var(--surface-2); }
.v-sidebar-search span { flex: 1; text-align: left; }
.v-sidebar-new-btn { width: 30px; height: 30px; border-radius: 7px; background: var(--primary); color: #fff; border: 0;
  display: inline-flex; align-items: center; justify-content: center; cursor: default; }
.v-sidebar-new-btn:hover { background: var(--primary-hover); }
.v-sidebar-icon { width: 36px; height: 30px; border-radius: 7px; background: transparent; color: var(--text-muted);
  border: 0; display: flex; align-items: center; justify-content: center; cursor: default; margin: 0 auto; }
.v-sidebar-icon:hover { background: var(--surface); color: var(--text); }
.v-sidebar-new { background: var(--primary); color: #fff; }
.v-sidebar-new:hover { background: var(--primary-hover); }

/* Primary nav — Notion-style 32px row height, 3px teal left border on active */
.v-sidebar-nav { padding: 4px 8px; display: flex; flex-direction: column; gap: 1px; }
.v-sidebar-item { position: relative; display: flex; align-items: center; gap: 9px; height: 32px;
  padding: 0 10px; border-radius: 6px; color: var(--text-muted); cursor: default; font-size: 13px;
  transition: background .1s, color .1s; }
.v-sidebar-item.is-collapsed { justify-content: center; padding: 0; margin: 0 auto; width: 36px; }
.v-sidebar-item:hover { background: var(--surface); color: var(--text); }
.v-sidebar-item.is-active { background: var(--primary-soft); color: var(--primary); font-weight: 500; }
.v-sidebar-item.is-active .v-sidebar-item-rail { position: absolute; left: -8px; top: 6px; bottom: 6px; width: 3px;
  background: var(--primary); border-radius: 0 3px 3px 0; }
.v-sidebar-item.is-collapsed.is-active .v-sidebar-item-rail { left: -10px; }
.v-sidebar-item-label { flex: 1; }
.v-sidebar-item-count { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-muted);
  background: var(--surface-2); padding: 1px 6px; border-radius: 4px; min-width: 22px; text-align: center; }
.v-sidebar-item.is-active .v-sidebar-item-count { background: var(--primary-soft); color: var(--primary); }

/* Pinned projects */
.v-sidebar-section { margin-top: 16px; padding: 0 16px 0 18px; overflow: hidden; }
.v-sidebar-section-head { display: flex; align-items: center; justify-content: space-between; height: 22px;
  margin-bottom: 4px; color: var(--text-muted); }
.v-sidebar-pin { display: flex; align-items: center; gap: 9px; height: 28px; padding: 0 6px; border-radius: 5px;
  color: var(--text-muted); font-size: 12.5px; cursor: default; }
.v-sidebar-pin:hover { background: var(--surface); color: var(--text); }
.v-sidebar-pin.is-active { background: var(--primary-soft); color: var(--primary); }
.v-sidebar-pin-mark { width: 18px; height: 18px; border-radius: 4px; color: #fff; font-size: 10px;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-family: var(--font-mono); }
.v-sidebar-pin-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Footer */
.v-sidebar-footer { margin-top: auto; padding: 10px; border-top: 1px solid var(--border); }
.v-sidebar-user { display: flex; align-items: center; gap: 9px; padding: 4px 6px; border-radius: 6px; }
.v-sidebar-user:hover { background: var(--surface); }
.v-sidebar-user-text { flex: 1; min-width: 0; }
.v-sidebar-user-name { font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v-sidebar-user-role { font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.04em; }
.v-sidebar-theme-row { display: flex; gap: 4px; margin-top: 8px; padding: 3px; background: var(--surface); border-radius: 7px; }
.v-theme-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 24px; border-radius: 5px; border: 0; background: transparent; color: var(--text-muted); font: inherit; font-size: 11.5px; cursor: default; }
.v-theme-btn.is-active { background: var(--bg); color: var(--text); box-shadow: var(--shadow-xs); }
.v-sidebar-footer-collapsed { display: flex; flex-direction: column; align-items: center; gap: 6px; }

.v-sidebar-collapse-handle { position: absolute; right: -1px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 36px; background: var(--bg); border: 1px solid var(--border); border-left: 0;
  border-radius: 0 4px 4px 0; color: var(--text-muted); cursor: default; display: flex; align-items: center; justify-content: center; }

/* Topbar */
.v-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--bg); }
.v-topbar { display: flex; align-items: center; gap: 12px; padding: 0 18px; height: 52px;
  border-bottom: 1px solid var(--border); background: var(--bg); flex: 0 0 auto; position: relative; }
.v-topbar::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-softer) 30%, var(--primary-softer) 70%, transparent); }
.v-topbar-left { flex: 0 0 auto; min-width: 0; }
.v-crumbs { display: flex; align-items: center; gap: 7px; font-size: 13px; }
.v-crumb { color: var(--text-muted); cursor: default; }
.v-crumb:hover { color: var(--text); }
.v-crumb.is-current { color: var(--text); font-weight: 500; }
.v-crumb-sep { color: var(--text-subtle); }
.v-topbar-search { flex: 1; max-width: 420px; display: flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text-muted); font: inherit; font-size: 12.5px; cursor: default; }
.v-topbar-search:hover { background: var(--surface-2); }
.v-topbar-search span { flex: 1; text-align: left; }
.v-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 4px; position: relative; }
.v-bell-badge { position: absolute; right: 26px; top: 2px; min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--error); color: #fff; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; border: 2px solid var(--bg); }

/* Main scroll area */
.v-main-scroll { flex: 1; overflow: auto; background: var(--bg); }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-shell-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-shell-styles';
  s.textContent = VANTAGE_SHELL_CSS;
  document.head.appendChild(s);
}

Object.assign(window, { Sidebar, Topbar, AppFrame });
