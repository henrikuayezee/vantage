// Vantage — plausible IT-team fake data.

window.VANTAGE_DATA = (() => {
  const users = [
    { id: 'u1', name: 'Maya Chen',        initials: 'MC', color: '#0D7A75', role: 'PROJECT_MANAGER', email: 'maya@acme.dev' },
    { id: 'u2', name: 'Diego Alvarez',    initials: 'DA', color: '#7C3AED', role: 'DEVELOPER',       email: 'diego@acme.dev' },
    { id: 'u3', name: 'Priya Raghavan',   initials: 'PR', color: '#DB2777', role: 'DEVELOPER',       email: 'priya@acme.dev' },
    { id: 'u4', name: 'Jonas Bekker',     initials: 'JB', color: '#0891B2', role: 'DEVELOPER',       email: 'jonas@acme.dev' },
    { id: 'u5', name: 'Sasha Volkov',     initials: 'SV', color: '#CA8A04', role: 'PROJECT_MANAGER', email: 'sasha@acme.dev' },
    { id: 'u6', name: 'Theo Park',        initials: 'TP', color: '#EA580C', role: 'DEVELOPER',       email: 'theo@acme.dev' },
    { id: 'u7', name: 'Aria Nakamura',    initials: 'AN', color: '#16A34A', role: 'ADMIN',           email: 'aria@acme.dev' },
    { id: 'u8', name: 'Ben Schwarzberg',  initials: 'BS', color: '#475569', role: 'DEVELOPER',       email: 'ben@acme.dev' },
  ];

  const projects = [
    { id: 'VG-AUTH',  key: 'AUTH',  name: 'Auth service refactor',     lead: 'u1', members: ['u1','u2','u3','u4'],     progress: 0.62, status: 'on-track',  health: 'good',     start: '2026-03-10', end: '2026-07-04', tasks: 47, open: 18, risk: 'low' },
    { id: 'VG-KAFKA', key: 'KAFKA', name: 'Kafka → Pub/Sub migration', lead: 'u5', members: ['u5','u4','u6','u8'],     progress: 0.38, status: 'at-risk',   health: 'at-risk',  start: '2026-02-01', end: '2026-08-22', tasks: 84, open: 51, risk: 'high' },
    { id: 'VG-BILL',  key: 'BILL',  name: 'Billing v3 rollout',        lead: 'u1', members: ['u1','u3','u7','u8'],     progress: 0.81, status: 'on-track',  health: 'good',     start: '2025-12-04', end: '2026-06-15', tasks: 62, open: 11, risk: 'low' },
    { id: 'VG-MOB',   key: 'MOB',   name: 'Mobile push notifications', lead: 'u5', members: ['u5','u2','u6'],          progress: 0.24, status: 'planning',  health: 'good',     start: '2026-04-20', end: '2026-09-30', tasks: 31, open: 24, risk: 'med' },
    { id: 'VG-OBS',   key: 'OBS',   name: 'Observability stack v2',    lead: 'u1', members: ['u1','u4','u6','u8','u2'],progress: 0.49, status: 'on-track',  health: 'good',     start: '2026-01-12', end: '2026-07-19', tasks: 56, open: 28, risk: 'low' },
    { id: 'VG-SOC2',  key: 'SOC2',  name: 'SOC 2 Type II readiness',   lead: 'u5', members: ['u5','u7','u3'],          progress: 0.93, status: 'on-track',  health: 'good',     start: '2025-10-01', end: '2026-06-01', tasks: 38, open: 4,  risk: 'low' },
    { id: 'VG-LATAM', key: 'LATAM', name: 'LATAM region launch',       lead: 'u1', members: ['u1','u3','u4','u5'],     progress: 0.15, status: 'at-risk',   health: 'at-risk',  start: '2026-03-25', end: '2026-10-01', tasks: 72, open: 64, risk: 'high' },
    { id: 'VG-DOC',   key: 'DOC',   name: 'Public API docs portal',    lead: 'u5', members: ['u5','u8','u2'],          progress: 0.71, status: 'on-track',  health: 'good',     start: '2026-02-14', end: '2026-06-30', tasks: 24, open: 8,  risk: 'low' },
  ];

  // Task statuses: BACKLOG → TODO → IN_PROGRESS → REVIEW → DONE
  // Project context for "current" project view = VG-AUTH
  const tasks = [
    { id: 'AUTH-104', project: 'VG-AUTH',  title: 'Replace JWT signing with KMS-backed rotation', status: 'IN_PROGRESS', priority: 'CRITICAL', assignee: 'u2', reporter: 'u1', due: '2026-05-26', updated: '4h ago',  subtasks: 4, done: 2, comments: 9, deps: 1, milestone: true,  est: 8,  spent: 5.5 },
    { id: 'AUTH-118', project: 'VG-AUTH',  title: 'Migrate session store to Redis cluster',       status: 'IN_PROGRESS', priority: 'HIGH',     assignee: 'u3', reporter: 'u1', due: '2026-05-24', updated: '20m ago', subtasks: 6, done: 4, comments: 12,deps: 2, milestone: false, est: 13, spent: 10  },
    { id: 'AUTH-121', project: 'VG-AUTH',  title: 'Add WebAuthn passkey enrollment flow',         status: 'REVIEW',      priority: 'HIGH',     assignee: 'u4', reporter: 'u1', due: '2026-05-25', updated: '1h ago',  subtasks: 3, done: 3, comments: 6, deps: 0, milestone: false, est: 5,  spent: 5.2 },
    { id: 'AUTH-125', project: 'VG-AUTH',  title: 'Deprecate /v1/login response shape',           status: 'TODO',        priority: 'MEDIUM',   assignee: 'u2', reporter: 'u1', due: '2026-05-29', updated: 'yesterday',subtasks: 2,done: 0, comments: 1, deps: 1, milestone: false, est: 3,  spent: 0   },
    { id: 'AUTH-126', project: 'VG-AUTH',  title: 'Rate-limit token endpoint per tenant',         status: 'TODO',        priority: 'MEDIUM',   assignee: 'u3', reporter: 'u1', due: '2026-05-30', updated: '2d ago',  subtasks: 0, done: 0, comments: 3, deps: 0, milestone: false, est: 5,  spent: 0   },
    { id: 'AUTH-128', project: 'VG-AUTH',  title: 'Audit log: signed events to Cloud Logging',    status: 'IN_PROGRESS', priority: 'HIGH',     assignee: 'u4', reporter: 'u1', due: '2026-06-02', updated: '3h ago',  subtasks: 5, done: 1, comments: 4, deps: 0, milestone: false, est: 8,  spent: 2   },
    { id: 'AUTH-131', project: 'VG-AUTH',  title: 'SCIM 2.0 provisioning endpoint',               status: 'BACKLOG',     priority: 'MEDIUM',   assignee: null, reporter: 'u1', due: '2026-06-12', updated: '5d ago',  subtasks: 0, done: 0, comments: 0, deps: 0, milestone: false, est: 13, spent: 0   },
    { id: 'AUTH-134', project: 'VG-AUTH',  title: 'Single sign-out across browser tabs',          status: 'REVIEW',      priority: 'LOW',      assignee: 'u2', reporter: 'u1', due: '2026-05-25', updated: '6h ago',  subtasks: 2, done: 2, comments: 2, deps: 0, milestone: false, est: 3,  spent: 3.5 },
    { id: 'AUTH-137', project: 'VG-AUTH',  title: 'Document threat model for refresh tokens',     status: 'DONE',        priority: 'LOW',      assignee: 'u3', reporter: 'u1', due: '2026-05-20', updated: '2d ago',  subtasks: 0, done: 0, comments: 1, deps: 0, milestone: false, est: 2,  spent: 1.5 },
    { id: 'AUTH-139', project: 'VG-AUTH',  title: 'CVE-2025-49812 — bump jose to 5.9',            status: 'DONE',        priority: 'CRITICAL', assignee: 'u4', reporter: 'u1', due: '2026-05-18', updated: '3d ago',  subtasks: 1, done: 1, comments: 8, deps: 0, milestone: false, est: 1,  spent: 1   },
    { id: 'AUTH-140', project: 'VG-AUTH',  title: 'Migrate password hashing to argon2id',         status: 'IN_PROGRESS', priority: 'HIGH',     assignee: 'u2', reporter: 'u1', due: '2026-06-04', updated: '1h ago',  subtasks: 4, done: 1, comments: 5, deps: 1, milestone: false, est: 8,  spent: 3   },
    { id: 'AUTH-142', project: 'VG-AUTH',  title: 'Sunset legacy OAuth callback URLs',            status: 'BACKLOG',     priority: 'LOW',      assignee: null, reporter: 'u1', due: '2026-06-20', updated: '1w ago',  subtasks: 0, done: 0, comments: 0, deps: 0, milestone: false, est: 5,  spent: 0   },
    { id: 'AUTH-145', project: 'VG-AUTH',  title: 'Magic link login for support staff',           status: 'TODO',        priority: 'MEDIUM',   assignee: 'u3', reporter: 'u1', due: '2026-06-08', updated: '4d ago',  subtasks: 1, done: 0, comments: 2, deps: 0, milestone: false, est: 3,  spent: 0   },
    { id: 'AUTH-147', project: 'VG-AUTH',  title: 'mTLS for service-to-service auth',             status: 'BACKLOG',     priority: 'HIGH',     assignee: null, reporter: 'u1', due: '2026-06-25', updated: '1w ago',  subtasks: 0, done: 0, comments: 0, deps: 0, milestone: true,  est: 13, spent: 0   },
    { id: 'AUTH-150', project: 'VG-AUTH',  title: 'Step-up auth for admin actions',               status: 'TODO',        priority: 'HIGH',     assignee: 'u4', reporter: 'u1', due: '2026-05-31', updated: 'yesterday',subtasks:3, done: 0, comments: 2, deps: 1, milestone: false, est: 5,  spent: 0   },
    { id: 'AUTH-153', project: 'VG-AUTH',  title: 'Login event analytics dashboard',              status: 'REVIEW',      priority: 'MEDIUM',   assignee: 'u3', reporter: 'u1', due: '2026-05-27', updated: '8h ago',  subtasks: 2, done: 2, comments: 3, deps: 0, milestone: false, est: 5,  spent: 4.8 },
    { id: 'AUTH-156', project: 'VG-AUTH',  title: 'Drop support for TLS 1.1 on auth endpoint',    status: 'DONE',        priority: 'MEDIUM',   assignee: 'u2', reporter: 'u1', due: '2026-05-15', updated: '1w ago',  subtasks: 0, done: 0, comments: 0, deps: 0, milestone: false, est: 1,  spent: 1   },
  ];

  // Subtasks for the "open" task in the drawer.
  const subtasks = [
    { id: 'AUTH-104.1', title: 'Spike: GCP KMS asymmetric signing perf',          done: true,  assignee: 'u2' },
    { id: 'AUTH-104.2', title: 'Wire signer abstraction behind feature flag',     done: true,  assignee: 'u2' },
    { id: 'AUTH-104.3', title: 'Key rotation cron + staged rollout',              done: false, assignee: 'u4' },
    { id: 'AUTH-104.4', title: 'Backfill kid claim on existing tokens',           done: false, assignee: 'u2' },
  ];

  const comments = [
    { id: 'c1', author: 'u3', when: '2d ago', text: 'KMS signing adds ~12ms p50 over local HMAC — fine for refresh, may need to cache for /verify hot path.' },
    { id: 'c2', author: 'u1', when: '1d ago', text: 'Agreed. @diego let\'s ship the signer behind a tenant-level flag first and watch p99 on tier-1 customers.' },
    { id: 'c3', author: 'u2', when: '4h ago', text: 'Flag is `auth.kms_signing` — currently rolled out to internal + 2 design partners. p99 looks normal.' },
  ];

  const notifications = [
    { id: 'n1', kind: 'assigned', actor: 'u1', target: 'AUTH-150', when: '12m', read: false, text: 'assigned you to' },
    { id: 'n2', kind: 'comment',  actor: 'u3', target: 'AUTH-118', when: '38m', read: false, text: 'commented on' },
    { id: 'n3', kind: 'mention',  actor: 'u5', target: 'KAFKA-22', when: '1h',  read: false, text: 'mentioned you in' },
    { id: 'n4', kind: 'due',      actor: null, target: 'AUTH-118', when: '3h',  read: true,  text: 'is due in 6 hours' },
    { id: 'n5', kind: 'review',   actor: 'u4', target: 'AUTH-121', when: '5h',  read: true,  text: 'requested your review on' },
    { id: 'n6', kind: 'comment',  actor: 'u7', target: 'AUTH-104', when: '1d',  read: true,  text: 'commented on' },
  ];

  const milestones = [
    { id: 'm1', project: 'VG-AUTH',  title: 'Passkey GA',                date: '2026-05-30', status: 'on-track' },
    { id: 'm2', project: 'VG-KAFKA', title: 'Cutover staging',           date: '2026-06-02', status: 'at-risk' },
    { id: 'm3', project: 'VG-BILL',  title: 'Self-serve plans live',     date: '2026-06-05', status: 'on-track' },
    { id: 'm4', project: 'VG-AUTH',  title: 'mTLS s2s pilot',            date: '2026-06-10', status: 'on-track' },
    { id: 'm5', project: 'VG-OBS',   title: 'OTel collector v2',         date: '2026-06-14', status: 'on-track' },
  ];

  const activity = [
    { id: 'a1', actor: 'u4', verb: 'moved',     target: 'AUTH-121', extra: 'to Review',          when: '8m' },
    { id: 'a2', actor: 'u3', verb: 'commented', target: 'AUTH-118', extra: null,                 when: '38m' },
    { id: 'a3', actor: 'u2', verb: 'created',   target: 'AUTH-156', extra: null,                 when: '1h' },
    { id: 'a4', actor: 'u5', verb: 'changed',   target: 'KAFKA-19', extra: 'priority to High',   when: '2h' },
    { id: 'a5', actor: 'u1', verb: 'assigned',  target: 'AUTH-150', extra: 'to Jonas',           when: '3h' },
    { id: 'a6', actor: 'u7', verb: 'closed',    target: 'SOC2-44',  extra: null,                 when: '4h' },
  ];

  return { users, projects, tasks, subtasks, comments, notifications, milestones, activity, byId: (id) => users.find(u => u.id === id) };
})();
