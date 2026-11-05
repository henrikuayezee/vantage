# Architecture Document
# Vantage — Project Management Platform
**Version:** 1.2  
**Last Updated:** 2026-05-27  
**Status:** Implemented — All phases complete

---

## 1. System Overview

The platform is a full-stack, multi-tenant web application composed of three primary layers:

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                      │
│              Next.js 16 (App Router) + React             │
│          Tailwind CSS + shadcn/ui (custom theme)         │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / REST API
┌─────────────────────────▼───────────────────────────────┐
│                      BACKEND API                         │
│                  NestJS + TypeScript                     │
│         JWT Auth │ REST API │ Swagger Docs               │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
┌────────────▼──────────┐  ┌─────────▼──────────────────┐
│      PostgreSQL        │  │       Resend (Email)        │
│   (via Prisma ORM)    │  │  Invitations + Pwd Reset    │
└───────────────────────┘  └────────────────────────────┘
```

---

## 2. Technology Stack (Detailed)

### 2.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x (App Router) | React framework, routing, SSR/SSG |
| TypeScript | 5.x | Type safety across all frontend code |
| Tailwind CSS | 4.x | Utility-first styling with CSS variable design tokens |
| shadcn/ui | Latest | Accessible component primitives (customized) |
| TanStack Query | v5 | Server state management, caching, polling |
| Zustand | 5.x | Client-side global state (auth, UI state) |
| @dnd-kit | 6.x | Drag and drop for Kanban board |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| Lucide React | Latest | Icon library |
| date-fns | 4.x | Date formatting and calculations |

### 2.2 Backend

| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11.x | Node.js framework with DI and modules |
| TypeScript | 5.x | Type safety |
| Prisma | 6.x | ORM and database migrations |
| PostgreSQL | 16.x | Primary relational database |
| bcrypt | Latest | Password hashing (12 rounds) |
| jsonwebtoken | Latest | RS256 JWT creation and verification |
| class-validator | Latest | DTO input validation |
| class-transformer | Latest | DTO serialization |
| @nestjs/swagger | Latest | Auto-generated API docs (disabled in production) |
| nest-winston | 1.x | Structured logging (JSON in production, pretty in dev) |
| Resend SDK | Latest | Transactional email delivery |

### 2.3 Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Application containerization |
| Docker Compose | Local development orchestration |
| Nginx | Reverse proxy, SSL termination |
| GitHub Actions | CI/CD pipeline |
| AWS / DigitalOcean | Cloud hosting |

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
/app
  /(auth)
    /login
    /reset-password
    /accept-invite/[token]
  /(dashboard)
    /dashboard          ← role-based home screen
    /projects
      /[id]
        /board          ← Kanban
        /list           ← List view
        /gantt          ← Gantt chart
        /settings       ← Project settings
    /tasks/[id]         ← Task detail / drawer
    /notifications
    /settings
      /profile
      /organization
      /users            ← Admin only
  /api                  ← Next.js API routes (thin proxy or unused if direct API calls)

/components
  /ui                   ← shadcn base components
  /layout               ← Sidebar, TopNav, PageWrapper
  /projects             ← ProjectCard, ProjectForm, etc.
  /tasks                ← TaskCard, TaskDrawer, TaskForm, etc.
  /kanban               ← KanbanBoard, KanbanColumn, KanbanCard
  /gantt                ← GanttWrapper, GanttBar, GanttMilestone
  /dashboard            ← DashboardWidgets per role
  /notifications        ← NotificationBell, NotificationPanel
  /comments             ← CommentThread, CommentInput
  /search               ← GlobalSearchModal, SearchResult

/lib
  /api.ts               ← Axios/fetch wrapper with auth headers
  /auth.ts              ← Auth helpers, token management
  /utils.ts             ← Shared utilities
  /hooks                ← Custom hooks (useProjects, useTasks, etc.)
  /types                ← Shared TypeScript types and interfaces

/store
  /auth.store.ts        ← Zustand: current user, token, role
  /ui.store.ts          ← Zustand: sidebar state, modal state

/styles
  /globals.css          ← Tailwind base + custom CSS variables
  /theme.css            ← impactailabs color tokens
```

### 3.2 Routing & Access Control

- Routes under `/(dashboard)` require authentication
- Role checks are enforced at the component level using the auth store
- Unauthorized access redirects to `/login`
- Admin-only pages (user management) render a 403 if accessed by other roles

### 3.3 Data Fetching Strategy

- All server state managed by **TanStack Query**
- Queries are invalidated on mutation success (e.g., create task → invalidate task list)
- Kanban board uses **optimistic updates**: the card moves in the UI immediately; the server call happens in the background; on failure the card snaps back with an error toast
- Background polling: Kanban board polls every 30 seconds to sync changes from other users
- Notifications bell polls every 60 seconds for unread count

### 3.4 Design System — Vantage Theme

**Pixel reference:** `design_handoff_vantage/Vantage.html` — open in browser, pan/zoom canvas. All screens are final and high-fidelity. Match exactly.  
**Component files:** `design_handoff_vantage/components/` — primitives, app-shell, dashboards, project-views, aux-screens, empty-and-mobile.  
**Token file:** `design_handoff_vantage/tokens.css` — source of truth for all CSS custom properties. Wire into Tailwind config directly.  
**Font:** Geist Sans + Geist Mono (Google Fonts). Stack: `'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.  
**Dark mode:** `.theme-dark` class on root element. Persisted to localStorage.

### CSS Tokens (from `tokens.css` — do not deviate)

**Light mode (`:root`):**
```css
--bg: #FFFFFF;            --surface: #F8FAFC;       --surface-2: #F1F5F9;
--border: #E2E8F0;        --border-strong: #CBD5E1;
--text: #1E293B;          --text-muted: #64748B;    --text-subtle: #94A3B8;
--primary: #0D7A75;       --primary-hover: #14B8A6;
--primary-soft: rgba(13,122,117,0.10);  --primary-softer: rgba(13,122,117,0.06);
--accent: #F97316;        --accent-soft: rgba(249,115,22,0.12);
--success: #16A34A;       --warning: #D97706;       --error: #DC2626;
--p-critical: #DC2626;    --p-high: #F97316;        --p-medium: #F59E0B;   --p-low: #64748B;
--status-backlog: #94A3B8; --status-todo: #6366F1;  --status-progress: #0D7A75;
--status-review: #D97706; --status-done: #16A34A;
--shadow-xs: 0 1px 0 rgba(15,23,42,0.04);
--shadow-sm: 0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04);
--shadow-md: 0 6px 16px -4px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05);
--shadow-lg: 0 18px 48px -12px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.06);
```

**Dark mode (`.theme-dark`):**
```css
--bg: #0F172A;            --surface: #1E293B;       --surface-2: #273548;
--border: #334155;        --border-strong: #475569;
--text: #F1F5F9;          --text-muted: #94A3B8;    --text-subtle: #64748B;
--primary: #14B8A6;       --primary-hover: #2DD4BF;
--primary-soft: rgba(20,184,166,0.14);  --primary-softer: rgba(20,184,166,0.08);
--accent: #FB923C;        --success: #22C55E;       --warning: #F59E0B;    --error: #EF4444;
--p-critical: #EF4444;    --p-high: #FB923C;        --p-medium: #F59E0B;   --p-low: #94A3B8;
--status-backlog: #64748B; --status-todo: #818CF8;  --status-progress: #14B8A6;
--status-review: #F59E0B; --status-done: #22C55E;
```

### Typography Scale

| Role | Size | Weight | Letter-spacing |
|---|---|---|---|
| Page title | 22px | 600 | -0.015em |
| Section heading | 18px | 600 | -0.010em |
| Widget title | 13.5–14px | 600 | -0.005em |
| Body / task title | 13px | 400 | normal |
| Label / meta | 12–12.5px | 500 | normal |
| Mono IDs / timestamps | 11–12px | 400 | normal (tabular-nums) |
| Caps label | 10–11px | 600 | 0.06–0.09em (uppercase) |
| Fine print | 9.5–10.5px | 400 | normal |

Global: `-webkit-font-smoothing: antialiased`, `font-feature-settings: 'cv11','ss01','ss03'`

### UI Density (Jira-style — locked)

| Element | Spec |
|---|---|
| List row height | 36px (dense: 32px) |
| Sidebar nav item height | 32px |
| Board card padding | 8px 10px |
| Table cell padding | 9px 12px |
| Base font size | 13px |
| Topbar height | 52px |
| Target | 15–20 tasks visible without scroll |

### Sidebar (Notion-style — locked)

- Width: 240px expanded / 56px collapsed (icon only). Transition: `width 0.18s ease`
- Background: `var(--bg)` — same as page, not a grey panel
- Border: `1px solid var(--border)` right side only — no shadow
- **Active item:** `background: var(--primary-soft)`, `color: var(--primary)`, `font-weight: 500` + 3px teal left border tab (inset 6px top/bottom, `border-radius: 0 3px 3px 0`)
- Nav item: height 32px, border-radius 6px, icon-to-label gap 9px
- Pinned projects section: 28px items, coloured 18×18 project initial mark
- Footer: avatar + name + role + light/dark toggle segmented control
- Collapse handle: 16×36px tab on right edge, visible only when collapsed

### Topbar

- Height 52px, `border-bottom: 1px solid var(--border)`
- Decorative teal gradient line on bottom edge
- Left: breadcrumb (last crumb bold, earlier crumbs muted)
- Centre: search bar (triggers `⌘K` modal), max-width 420px, height 32px
- Right: context actions + notification bell (unread badge) + user avatar

### Priority Display (accessibility — locked)

Always color AND label. Never color alone. Use `PriorityTag` pattern: 4-bar chart indicator + caps mono label.

| Priority | Bars filled | Color | Label |
|---|---|---|---|
| CRITICAL | 4 | `var(--p-critical)` | CRIT |
| HIGH | 3 | `var(--p-high)` | HIGH |
| MEDIUM | 2 | `var(--p-medium)` | MED |
| LOW | 1 | `var(--p-low)` | LOW |

### Screens Inventory (all in `Vantage.html`)

| # | Screen | Route |
|---|---|---|
| 1 | Login | `/login` |
| 2 | Reset password | `/reset-password` |
| 3 | Accept invite | `/accept-invite/[token]` |
| 4 | App shell | all authenticated routes |
| 5 | PM Dashboard | `/dashboard` (PM role) |
| 6 | Developer Dashboard | `/dashboard` (Developer role) |
| 7 | Admin Dashboard | `/dashboard` (Admin role) |
| 8 | Projects portfolio | `/projects` |
| 9 | Project — List view | `/projects/[id]` (List tab) |
| 10 | Project — Board view | `/projects/[id]` (Board tab) |
| 11 | Project — Gantt view | `/projects/[id]` (Gantt tab) |
| 12 | Task drawer | Overlay on any project view |
| 13 | Global search | `⌘K` modal, any route |
| 14 | Notifications panel | Bell dropdown, any route |
| 15 | Settings — People | `/settings/users` |
| 16 | Empty states | No projects / no tasks / no notifications / no search results |
| 17 | Loading skeletons | Dashboard / List / Board patterns |
| 18 | Mobile reference | 390×844px |
| 19 | Tablet reference | 834px portrait |

### Open Design Items (from designer — action required during build)

1. **Task `startDate` field** — Gantt synthesises start as `due − estimate`. Add explicit `startDate` to Task model in schema and API.
2. **Toast / snackbar** — not yet designed. Use: 320px card, bottom-right, `shadow-lg`, 4s auto-dismiss, success/warning/error tones.
3. **Portfolio card grid variant** — table is designed; a 3-col card grid may be preferred. Confirm before building.
4. **Responsive breakpoints** — 835–1279px: sidebar auto-collapses to 56px. Below 835px: sidebar becomes drawer overlay with hamburger trigger.
5. **Dependency arrow types** — only finish-to-start (FS) is designed. SS/FF/SF would require routing updates.

---

## 4. Backend Architecture

### 4.1 Project Structure

```
/src
  /auth
    auth.module.ts
    auth.controller.ts     ← login, refresh, reset-password
    auth.service.ts
    jwt.strategy.ts
    jwt-refresh.strategy.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts

  /users
    users.module.ts
    users.controller.ts    ← profile, invite, user management
    users.service.ts
    dto/

  /organizations
    organizations.module.ts
    organizations.controller.ts
    organizations.service.ts

  /projects
    projects.module.ts
    projects.controller.ts
    projects.service.ts
    dto/

  /tasks
    tasks.module.ts
    tasks.controller.ts
    tasks.service.ts
    dto/

  /comments
    comments.module.ts
    comments.controller.ts
    comments.service.ts

  /notifications
    notifications.module.ts
    notifications.controller.ts
    notifications.service.ts

  /search
    search.module.ts
    search.controller.ts
    search.service.ts

  /email
    email.module.ts
    email.service.ts       ← Resend integration

  /activity
    activity.module.ts
    activity.service.ts    ← Logs all significant actions

  /prisma
    prisma.module.ts
    prisma.service.ts      ← PrismaClient singleton

  /common
    /decorators            ← CurrentUser, Roles, OrgId
    /filters               ← Global exception filter
    /interceptors          ← Response transform, logging
    /pipes                 ← Validation pipe
    /guards                ← Shared guards

  main.ts                  ← Bootstrap, Swagger setup, global pipes
```

### 4.2 API Design

**Base URL:** `https://api.yourdomain.com/v1`

**Auth endpoints:**
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/accept-invite
```

**User endpoints:**
```
GET    /users/me
PATCH  /users/me
GET    /users              (Admin only)
POST   /users/invite       (Admin only)
PATCH  /users/:id          (Admin only)
DELETE /users/:id          (Admin only)
```

**Project endpoints:**
```
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
PATCH  /projects/:id/archive
GET    /projects/:id/members
POST   /projects/:id/members
DELETE /projects/:id/members/:userId
GET    /projects/:id/stats
```

**Task endpoints:**
```
GET    /projects/:id/tasks
POST   /projects/:id/tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
PATCH  /tasks/:id/status
PATCH  /tasks/:id/position
GET    /tasks/:id/subtasks
POST   /tasks/:id/dependencies
DELETE /tasks/:id/dependencies/:dependsOnId
```

**Comment endpoints:**
```
GET    /tasks/:id/comments
POST   /tasks/:id/comments
```

**Notification endpoints:**
```
GET    /notifications
PATCH  /notifications/:id/read
POST   /notifications/read-all
GET    /notifications/unread-count
```

**Search endpoint:**
```
GET    /search?q=:query
```

**Gantt endpoint:**
```
GET    /projects/:id/gantt
```

### 4.3 Authentication Flow

```
1. User submits email + password
2. Server validates credentials, checks organization membership
3. Server issues:
   - Access Token (JWT, 15min expiry)
   - Refresh Token (JWT, 7 days expiry, stored in httpOnly cookie)
4. Client stores access token in memory (not localStorage)
5. On 401 response, client auto-calls /auth/refresh using cookie
6. New access token issued; original request retried
7. On logout, refresh token invalidated server-side
```

### 4.4 Multi-Tenancy Strategy

- Every request from an authenticated user carries their `organizationId` (embedded in JWT payload)
- All database queries are scoped with `WHERE organization_id = :orgId`
- A custom `@OrgId()` decorator extracts this from the JWT for use in services
- No query ever runs without an organization scope — enforced at the service layer

### 4.5 Authorization (RBAC)

- Roles: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`
- `@Roles()` decorator + `RolesGuard` enforces role checks on controller methods
- Project-level membership is checked separately (a PM can only modify projects they belong to)
- Admin bypasses project-level membership checks (sees all projects in the org)

---

## 5. Database Schema

### 5.1 Entity Relationship Overview

```
Organizations ──< Users
Organizations ──< Projects
Projects ──< ProjectMembers >── Users
Projects ──< Tasks
Projects ──< Milestones
Tasks ──< Tasks (self-ref: parent_task_id)
Tasks ──< TaskDependencies
Tasks ──< Comments
Users ──< Notifications
Users ──< ActivityLogs
```

### 5.2 Full Schema (Prisma SDL)

```prisma
model Organization {
  id         String    @id @default(uuid())
  name       String
  slug       String    @unique
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  users      User[]
  projects   Project[]
  activities ActivityLog[]
}

model User {
  id             String       @id @default(uuid())
  organizationId String
  email          String
  passwordHash   String
  firstName      String
  lastName       String
  avatarUrl      String?
  role           Role         @default(DEVELOPER)
  isActive       Boolean      @default(true)
  tokenVersion   Int          @default(0)  // incremented to invalidate all active sessions
  invitedAt      DateTime?
  joinedAt       DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  projectMembers ProjectMember[]
  assignedTasks  Task[]       @relation("Assignee")
  reportedTasks  Task[]       @relation("Reporter")
  comments       Comment[]
  notifications  Notification[]
  activities     ActivityLog[]
  inviteTokens   InviteToken[]

  @@unique([organizationId, email])
}

enum Role {
  ADMIN
  PROJECT_MANAGER
  DEVELOPER
}

model InviteToken {
  id             String    @id @default(uuid())
  organizationId String
  email          String
  tokenHash      String    @unique  // bcrypt hash of the raw token; raw token is emailed once, never stored
  role           Role
  invitedById    String
  expiresAt      DateTime
  usedAt         DateTime?
  createdAt      DateTime  @default(now())

  invitedBy      User      @relation(fields: [invitedById], references: [id])
}

model Project {
  id             String        @id @default(uuid())
  organizationId String
  name           String
  description    String?
  status         ProjectStatus @default(ACTIVE)
  startDate      DateTime
  endDate        DateTime
  createdById    String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization   Organization  @relation(fields: [organizationId], references: [id])
  members        ProjectMember[]
  tasks          Task[]
  milestones     Milestone[]
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String   // "manager" | "developer"
  joinedAt  DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
}

model Task {
  id             String     @id @default(uuid())
  projectId      String
  parentTaskId   String?    // null = top-level task; set = subtask
  title          String
  description    String?
  assigneeId     String?
  reporterId     String
  status         TaskStatus @default(BACKLOG)
  priority       Priority   @default(MEDIUM)
  startDate      DateTime?
  dueDate        DateTime?
  isMilestone    Boolean    @default(false)
  position       Int        @default(0)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  project        Project    @relation(fields: [projectId], references: [id])
  parentTask     Task?      @relation("Subtasks", fields: [parentTaskId], references: [id])
  subtasks       Task[]     @relation("Subtasks")
  assignee       User?      @relation("Assignee", fields: [assigneeId], references: [id])
  reporter       User       @relation("Reporter", fields: [reporterId], references: [id])
  comments       Comment[]
  dependencies   TaskDependency[] @relation("DependentTask")
  dependents     TaskDependency[] @relation("DependsOnTask")
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model TaskDependency {
  id            String @id @default(uuid())
  taskId        String  // This task...
  dependsOnId   String  // ...cannot start until this one is done

  task          Task   @relation("DependentTask", fields: [taskId], references: [id])
  dependsOn     Task   @relation("DependsOnTask", fields: [dependsOnId], references: [id])

  @@unique([taskId, dependsOnId])
}

model Milestone {
  id          String    @id @default(uuid())
  projectId   String
  title       String
  dueDate     DateTime
  isCompleted Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  project     Project   @relation(fields: [projectId], references: [id])
}

model Comment {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task      Task     @relation(fields: [taskId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model Notification {
  id          String           @id @default(uuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  entityType  String           // "task" | "project" | "comment"
  entityId    String
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id])
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_COMMENTED
  TASK_DUE_SOON
}

model ActivityLog {
  id             String   @id @default(uuid())
  organizationId String
  userId         String?
  action         String   // e.g. "task.created", "task.status_changed"
  entityType     String
  entityId       String
  metadata       Json?    // before/after state, extra context
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User?        @relation(fields: [userId], references: [id])
}
```

---

## 6. Security Architecture

| Concern | Approach |
|---|---|
| Password storage | bcrypt with salt rounds = 12 |
| Password complexity | Minimum 8 characters; must include at least one uppercase letter, one number, and one special character. Enforced via Zod on frontend and class-validator on backend — both must pass |
| Access tokens | JWT, 15-minute expiry, signed with RS256 |
| Refresh tokens | JWT, 7-day expiry, httpOnly cookie, rotated on use |
| Token storage | Access token held in memory only (Zustand store) — never written to localStorage or sessionStorage |
| Session invalidation | Users table carries a `tokenVersion` integer field. On account deactivation (or forced logout by Admin), `tokenVersion` is incremented. Every JWT payload includes the version at issue time; any token with a mismatched version is rejected immediately — no waiting for expiry |
| Input validation | class-validator on all DTOs; Zod on all frontend forms |
| SQL injection | Prevented by Prisma ORM (parameterized queries) |
| XSS | Next.js escapes output; rich text sanitized with DOMPurify before save |
| CSRF | SameSite=Strict cookies; origin check on API |
| Rate limiting | NestJS throttler on auth endpoints (5 attempts / 15 min) |
| HTTPS | Enforced at Nginx level; HSTS header set |
| Multi-tenant isolation | organizationId scoped to every DB query |
| Secrets | Environment variables only; never committed to git |
| Invite token generation | Tokens generated with `crypto.randomBytes(32).toString('hex')` — cryptographically secure, not UUID or Math.random |
| Invite token storage | Only the bcrypt hash of the token is stored in the database; the raw token is sent in the email once and never stored in plain text |
| Auth error messages | Login always returns `"Invalid email or password"` regardless of which field is wrong — no information leakage about whether an email exists in the system |
| Security headers | Nginx sets the following on every response: `X-Frame-Options: DENY` (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` that restricts scripts to self + CDN origins only |

---

## 7. Infrastructure & Deployment

### 7.1 Repository Structure
The project uses a **monorepo** with the following top-level layout:

```
/vantage
  /apps
    /web          ← Next.js frontend
    /api          ← NestJS backend
  /packages
    /types        ← Shared TypeScript types (used by both apps)
    /config       ← Shared ESLint, Prettier, TypeScript base configs
  docker-compose.yml
  turbo.json
  package.json    ← Root workspace (npm/pnpm workspaces)
```

Tooling: **Turborepo** for task orchestration (build, lint, test run in parallel across apps).

### 7.2 Docker Compose (Local Development)
No cloud hosting is required to build or run Vantage. Everything runs locally via Docker Compose.

```yaml
services:
  frontend:    # Next.js dev server (port 3000)
  backend:     # NestJS dev server (port 3001)
  postgres:    # PostgreSQL 16 (port 5432)
  nginx:       # Reverse proxy (port 80)
```

A single `docker-compose up` command starts the full stack. Cloud hosting (AWS or DigitalOcean) is only needed at Phase 9 deployment — that decision is deferred until then.

### 7.3 Production Topology
```
CloudFlare DNS
     │
     ▼
Nginx (SSL termination)
     │
     ├──▶ /         → Next.js (port 3000)
     └──▶ /api/*    → NestJS  (port 3001)
               │
               └──▶ PostgreSQL (managed DB)
```

### 7.4 CI/CD Pipeline (GitHub Actions)

**On Pull Request:**
1. Lint (ESLint + Prettier)
2. Type check (tsc --noEmit)
3. Unit tests (Jest)
4. Build check

**On Merge to Main:**
1. All PR checks
2. Docker build and push to registry
3. Deploy to staging
4. Run integration tests
5. Manual approval gate
6. Deploy to production

### 7.5 Environment Variables

```
# Backend
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
RESEND_API_KEY=
APP_URL=
CORS_ORIGIN=

# Frontend
NEXT_PUBLIC_API_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## 8. Performance Considerations

| Area | Strategy |
|---|---|
| Database queries | Prisma query optimization; indexes on foreign keys and frequently filtered columns |
| API responses | Pagination on all list endpoints (default 50, max 100) |
| Frontend caching | TanStack Query caches responses; stale-while-revalidate pattern |
| Images | Next.js Image component with automatic optimization |
| Bundle size | Dynamic imports for heavy components (Gantt chart) |
| Polling | TanStack Query `refetchInterval` — scoped only to active views |

---

## 9. Key Database Indexes

```sql
-- Users: lookup by email within org
CREATE INDEX idx_users_org_email ON users(organization_id, email);

-- Tasks: all tasks for a project
CREATE INDEX idx_tasks_project ON tasks(project_id);

-- Tasks: all tasks for an assignee
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);

-- Tasks: subtask lookup
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Notifications: unread count per user
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Activity logs: per org
CREATE INDEX idx_activity_org ON activity_logs(organization_id, created_at DESC);
```

---

## 10. Accessibility

- All interactive elements are keyboard accessible
- ARIA labels on icon-only buttons
- Color is never the sole conveyor of meaning (priority uses both color and text/icon)
- Focus rings visible at all times
- Minimum 4.5:1 contrast ratio for all text (WCAG 2.1 AA)
- Screen reader tested on NVDA (Windows) and VoiceOver (Mac)
