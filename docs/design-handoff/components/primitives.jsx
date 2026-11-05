// Vantage — UI primitives. Avatars, priority + status indicators, badges, buttons.

const { Icons } = window;

// ── Avatar ────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 22, ring = false, style }) => {
  if (!user) return (
    <span className="v-avatar v-avatar-empty" style={{ width: size, height: size, ...style }}>
      <Icons.My size={Math.round(size * 0.62)} sw={1.5} />
    </span>
  );
  return (
    <span
      className={'v-avatar' + (ring ? ' v-avatar-ring' : '')}
      style={{
        width: size, height: size, background: user.color,
        fontSize: Math.round(size * 0.42),
        ...style,
      }}
      title={user.name}
    >{user.initials}</span>
  );
};

const AvatarStack = ({ users, size = 22, max = 4 }) => {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="v-avatar-stack" style={{ '--av-size': size + 'px' }}>
      {shown.map((u, i) => <Avatar key={u.id} user={u} size={size} ring />)}
      {extra > 0 && <span className="v-avatar v-avatar-ring v-avatar-extra"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>+{extra}</span>}
    </span>
  );
};

// ── Priority indicator (always color + label/icon — accessibility) ────
// Renders as a colored 3-bar bracket icon plus a small caps label
const PRI = {
  CRITICAL: { color: 'var(--p-critical)', bars: 4, label: 'CRIT' },
  HIGH:     { color: 'var(--p-high)',     bars: 3, label: 'HIGH' },
  MEDIUM:   { color: 'var(--p-medium)',   bars: 2, label: 'MED'  },
  LOW:      { color: 'var(--p-low)',      bars: 1, label: 'LOW'  },
};
const PriorityBars = ({ priority, size = 12 }) => {
  const p = PRI[priority] || PRI.MEDIUM;
  // Draw 4 bars; the first `p.bars` are filled with priority color.
  return (
    <span className="v-pri-bars" aria-label={'Priority: ' + p.label} style={{ width: size + 2, height: size + 2 }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="v-pri-bar" style={{
          height: 3 + i * 1.5 + 'px',
          background: i < p.bars ? p.color : 'currentColor',
          opacity: i < p.bars ? 1 : 0.18,
        }} />
      ))}
    </span>
  );
};
const PriorityTag = ({ priority }) => {
  const p = PRI[priority] || PRI.MEDIUM;
  return (
    <span className="v-pri-tag" style={{ color: p.color }}>
      <PriorityBars priority={priority} />
      <span className="v-caps" style={{ fontFamily: 'var(--font-mono)' }}>{p.label}</span>
    </span>
  );
};

// ── Status pill ───────────────────────────────────────────────────────
const STATUS_LABEL = {
  BACKLOG:     { label: 'Backlog',     color: 'var(--status-backlog)', icon: 'Circle'    },
  TODO:        { label: 'To do',       color: 'var(--status-todo)',    icon: 'CircleDot' },
  IN_PROGRESS: { label: 'In progress', color: 'var(--status-progress)',icon: 'CircleHalf'},
  REVIEW:      { label: 'Review',      color: 'var(--status-review)',  icon: 'Eye'       },
  DONE:        { label: 'Done',        color: 'var(--status-done)',    icon: 'Check'     },
};
const StatusDot = ({ status, size = 12 }) => {
  const s = STATUS_LABEL[status]; if (!s) return null;
  const I = Icons[s.icon];
  return <span style={{ color: s.color, display: 'inline-flex' }}><I size={size} sw={2} /></span>;
};
const StatusPill = ({ status, compact = false }) => {
  const s = STATUS_LABEL[status]; if (!s) return null;
  return (
    <span className={'v-status-pill' + (compact ? ' v-status-pill-compact' : '')}
      style={{ '--c': s.color }}>
      <StatusDot status={status} size={10} />
      <span>{s.label}</span>
    </span>
  );
};

// ── Generic small badge ───────────────────────────────────────────────
const Badge = ({ tone = 'neutral', children, soft = true, mono = false, style }) => (
  <span className={'v-badge v-badge-' + tone + (soft ? ' v-badge-soft' : '')}
        style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', ...style }}>
    {children}
  </span>
);

// ── Button ────────────────────────────────────────────────────────────
const Button = ({ variant = 'secondary', size = 'md', icon, iconRight, children, kbd, onClick, style, className = '' }) => {
  const I = icon ? (typeof icon === 'string' ? Icons[icon] : icon) : null;
  const IR = iconRight ? (typeof iconRight === 'string' ? Icons[iconRight] : iconRight) : null;
  return (
    <button className={`v-btn v-btn-${variant} v-btn-${size} ${className}`} onClick={onClick} style={style}>
      {I && <I size={size === 'sm' ? 12 : 14} sw={1.8} />}
      {children && <span>{children}</span>}
      {IR && <IR size={size === 'sm' ? 12 : 14} sw={1.8} />}
      {kbd && <kbd className="v-kbd">{kbd}</kbd>}
    </button>
  );
};
const IconButton = ({ icon, size = 14, onClick, active, label, tone = 'ghost', style }) => {
  const I = typeof icon === 'string' ? Icons[icon] : icon;
  return (
    <button className={`v-iconbtn v-iconbtn-${tone}` + (active ? ' is-active' : '')} title={label} onClick={onClick} aria-label={label} style={style}>
      <I size={size} sw={1.7} />
    </button>
  );
};

// ── Bar (used for progress) ───────────────────────────────────────────
const ProgressBar = ({ value, tone = 'primary', height = 6, showLabel = false }) => (
  <div className="v-bar" style={{ '--h': height + 'px' }}>
    <div className="v-bar-fill" style={{ width: Math.round(value * 100) + '%', background: `var(--${tone})` }} />
    {showLabel && <span className="v-num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(value * 100)}%</span>}
  </div>
);

// ── Section divider with caps label ───────────────────────────────────
const SectionLabel = ({ children, right, style }) => (
  <div className="v-section-label" style={style}>
    <span className="v-caps" style={{ color: 'var(--text-muted)' }}>{children}</span>
    {right}
  </div>
);

// ── Card shell ────────────────────────────────────────────────────────
const Card = ({ children, padded = true, hoverable = false, style, className = '' }) => (
  <div className={`v-card ${hoverable ? 'v-card-hover' : ''} ${className}`}
       style={{ padding: padded ? 16 : 0, ...style }}>{children}</div>
);

// ── Topographic decorative pattern (used in empty states + login) ─────
const TopoPattern = ({ width = 320, height = 200, opacity = 0.5, color = 'currentColor' }) => (
  <svg width={width} height={height} viewBox="0 0 320 200" fill="none" style={{ opacity }}>
    <defs>
      <pattern id="topo-pat" patternUnits="userSpaceOnUse" width="320" height="200">
        <path d="M-20 170 Q40 145 80 152 T180 142 T280 130 T340 122" stroke={color} strokeWidth="0.8" opacity="0.6"/>
        <path d="M-20 150 Q40 120 90 130 T200 118 T300 100 T340 96"  stroke={color} strokeWidth="0.8" opacity="0.5"/>
        <path d="M-20 130 Q50 100 100 108 T210 92 T310 76 T340 70"   stroke={color} strokeWidth="0.8" opacity="0.4"/>
        <path d="M-20 110 Q60 78 110 86 T220 68 T315 50 T340 44"    stroke={color} strokeWidth="0.8" opacity="0.3"/>
        <path d="M-20 90  Q70 58 120 64 T220 46 T310 30 T340 22"    stroke={color} strokeWidth="0.8" opacity="0.22"/>
      </pattern>
    </defs>
    <rect width="320" height="200" fill="url(#topo-pat)" />
  </svg>
);

// ── Kbd / shortcut chip ───────────────────────────────────────────────
const Kbd = ({ children }) => <kbd className="v-kbd-inline">{children}</kbd>;

// ── Styles (single global block) ──────────────────────────────────────
const VANTAGE_PRIMITIVE_CSS = `
.v-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
  color: #fff; font-weight: 600; font-family: var(--font-sans); letter-spacing: 0.02em; flex: 0 0 auto;
  font-feature-settings: 'cv11'; }
.v-avatar-ring { box-shadow: 0 0 0 2px var(--bg); }
.v-avatar-empty { background: var(--surface-2); color: var(--text-subtle); border: 1px dashed var(--border-strong); }
.v-avatar-extra { background: var(--surface-2); color: var(--text-muted); }
.v-avatar-stack { display: inline-flex; }
.v-avatar-stack > * + * { margin-left: calc(var(--av-size) * -0.32); }

.v-pri-bars { display: inline-flex; align-items: flex-end; gap: 1.5px; color: var(--text-subtle); padding: 1px; }
.v-pri-bar  { width: 2.5px; border-radius: 1px; }
.v-pri-tag  { display: inline-flex; align-items: center; gap: 4px; }

.v-status-pill { display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px 2px 6px; border-radius: 999px; background: color-mix(in oklab, var(--c) 12%, transparent);
  color: var(--c); font-size: 11.5px; font-weight: 500; line-height: 16px; }
.v-status-pill-compact { padding: 1px 6px 1px 5px; font-size: 10.5px; line-height: 14px; }

.v-badge { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 5px;
  font-size: 11px; font-weight: 500; line-height: 16px; }
.v-badge-neutral.v-badge-soft  { background: var(--surface-2); color: var(--text-muted); }
.v-badge-primary.v-badge-soft  { background: var(--primary-soft); color: var(--primary); }
.v-badge-accent.v-badge-soft   { background: var(--accent-soft);  color: var(--accent); }
.v-badge-success.v-badge-soft  { background: var(--success-soft); color: var(--success); }
.v-badge-warning.v-badge-soft  { background: var(--warning-soft); color: var(--warning); }
.v-badge-error.v-badge-soft    { background: var(--error-soft);   color: var(--error); }

.v-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 7px; border: 1px solid transparent;
  font-weight: 500; line-height: 1; cursor: default; user-select: none; transition: background .12s, border-color .12s, color .12s; }
.v-btn-md { padding: 7px 11px; font-size: 13px; }
.v-btn-sm { padding: 4px 8px; font-size: 12px; gap: 4px; }
.v-btn-primary    { background: var(--primary); color: #fff; }
.v-btn-primary:hover { background: var(--primary-hover); }
.v-btn-secondary  { background: var(--bg); color: var(--text); border-color: var(--border); box-shadow: var(--shadow-xs); }
.v-btn-secondary:hover { background: var(--surface); border-color: var(--border-strong); }
.v-btn-ghost      { background: transparent; color: var(--text); }
.v-btn-ghost:hover { background: var(--surface); }
.v-btn-accent     { background: var(--accent); color: #fff; }
.v-btn-danger     { background: var(--bg); color: var(--error); border-color: var(--border); }
.v-btn-danger:hover { background: var(--error-soft); }
.v-kbd { font-family: var(--font-mono); font-size: 10.5px; padding: 1px 5px; border-radius: 3px;
  background: rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); color: var(--text-muted); margin-left: 2px; }
.theme-dark .v-kbd { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.08); }

.v-iconbtn { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid transparent; border-radius: 6px; color: var(--text-muted);
  cursor: default; transition: background .12s, color .12s, border-color .12s; }
.v-iconbtn:hover, .v-iconbtn.is-active { background: var(--surface); color: var(--text); }
.v-iconbtn-bordered { border-color: var(--border); background: var(--bg); }
.v-iconbtn-bordered:hover { background: var(--surface); border-color: var(--border-strong); }

.v-bar { position: relative; width: 100%; height: var(--h, 6px); background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.v-bar-fill { position: absolute; inset: 0 auto 0 0; height: 100%; border-radius: 999px; transition: width .25s; }

.v-section-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }

.v-card { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; box-shadow: var(--shadow-xs); }
.v-card-hover:hover { border-color: var(--border-strong); }

.v-kbd-inline { font-family: var(--font-mono); font-size: 10.5px; padding: 1px 5px; border-radius: 3px;
  background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border); }

/* compact form inputs */
.v-input { width: 100%; height: 32px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); font: inherit; font-size: 13px; outline: none;
  transition: border-color .12s, box-shadow .12s; }
.v-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-softer); }
.v-input::placeholder { color: var(--text-subtle); }
.v-label { font-size: 12px; font-weight: 500; color: var(--text); display: block; margin-bottom: 6px; }

/* link */
.v-link { color: var(--primary); cursor: default; text-decoration: none; }
.v-link:hover { color: var(--primary-hover); }
`;

if (typeof document !== 'undefined' && !document.getElementById('vantage-primitive-styles')) {
  const s = document.createElement('style');
  s.id = 'vantage-primitive-styles';
  s.textContent = VANTAGE_PRIMITIVE_CSS;
  document.head.appendChild(s);
}

Object.assign(window, {
  Avatar, AvatarStack, PriorityBars, PriorityTag, StatusDot, StatusPill,
  Badge, Button, IconButton, ProgressBar, SectionLabel, Card, TopoPattern, Kbd,
  PRI, STATUS_LABEL,
});
