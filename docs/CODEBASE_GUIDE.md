# Codebase Guide
# Vantage — Project Management Platform
**Audience:** Mid-level developers inheriting or onboarding to this project
**Last Updated:** 2026-05-27

---

## 1. Repository Structure

```
vantage/                          ← monorepo root (Turborepo + pnpm workspaces)
├── apps/
│   ├── api/                      ← NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma     ← single source of truth for DB schema
│   │   │   ├── seed.ts           ← seeds demo organization, users, projects and tasks
│   │   │   └── migrations/       ← migration SQL files (auto-generated)
│   │   ├── src/
│   │   │   ├── main.ts           ← app bootstrap (global prefix, CORS, pipes)
│   │   │   ├── app.module.ts     ← root module wiring
│   │   │   ├── auth/             ← login, refresh, logout, invite, reset-password
│   │   │   ├── users/            ← user CRUD, admin user management
│   │   │   ├── projects/         ← project CRUD, members, stats, Gantt endpoint
│   │   │   ├── tasks/            ← task CRUD, status, position, subtasks, deps
│   │   │   ├── milestones/       ← milestone CRUD
│   │   │   ├── comments/         ← task comments + comment notifications
│   │   │   ├── notifications/    ← in-app notification engine + cron job
│   │   │   ├── search/           ← global search endpoint
│   │   │   ├── dashboard/        ← role-specific dashboard data endpoints
│   │   │   ├── email/            ← Resend email service (invite + reset templates)
│   │   │   ├── prisma/           ← PrismaService (global)
│   │   │   └── common/           ← guards, decorators, filters, interceptors
│   │   ├── .env.example          ← all required env vars documented
│   │   └── Dockerfile            ← multi-stage production Docker build
│   │
│   └── web/                      ← Next.js 16 frontend (App Router)
│       ├── app/
│       │   ├── (auth)/           ← login, forgot-password, reset-password, accept-invite
│       │   └── (app)/            ← protected routes (requires auth cookie)
│       │       ├── dashboard/    ← role-based home page
│       │       ├── projects/     ← project list + project detail (Tasks/Board/Gantt/Members)
│       │       ├── my-tasks/     ← developer's personal task view
│       │       ├── notifications/← full notification history page
│       │       ├── settings/     ← user profile settings
│       │       └── admin/        ← admin-only: user management
│       ├── components/
│       │   ├── layout/           ← AppShell, Sidebar, Topbar
│       │   ├── projects/         ← ProjectCard, CreateProjectModal, EditProjectModal, MembersPanel
│       │   ├── tasks/            ← TaskListView, KanbanBoard, TaskDrawer, TaskComments, CreateTaskModal
│       │   ├── dashboard/        ← AdminDashboard, PMDashboard, DeveloperDashboard, StatCard
│       │   ├── notifications/    ← NotificationsPanel
│       │   ├── search/           ← SearchModal
│       │   └── ui/               ← shadcn primitives + custom design-system components
│       ├── lib/
│       │   ├── api-client.ts     ← Axios instance with token refresh interceptor
│       │   └── api/              ← typed API call functions (tasks-api.ts, projects-api.ts, …)
│       ├── stores/
│       │   ├── auth-store.ts     ← Zustand: current user + tokens
│       │   └── ui-store.ts       ← Zustand: theme (dark/light) + sidebar state
│       ├── proxy.ts               ← Next.js proxy: redirect unauthenticated users
│       ├── next.config.ts        ← Next.js config: API proxy rewrites
│       └── .env.example          ← web-side env vars
│
├── packages/
│   ├── types/                    ← shared TypeScript types + enums (Role, TaskStatus, etc.)
│   └── config/                   ← shared ESLint + TypeScript base configs
│
├── nginx/
│   └── nginx.conf                ← reverse proxy: /api/* → api:3001, /* → web:3000
│
├── docker-compose.yml            ← local development: postgres + api + web + nginx
├── turbo.json                    ← Turborepo pipeline config
├── pnpm-workspace.yaml           ← pnpm workspace definition
└── .github/workflows/ci.yml      ← CI: lint + typecheck + build on push
```

---

## 2. Local Development Setup

### Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 24 | [nodejs.org](https://nodejs.org) |
| pnpm | 11.3.0 | `npm install -g pnpm@11.3.0` |
| Docker Desktop | Latest | [docker.com](https://docker.com) |

### First-time setup

```bash
# 1. Clone the repository
git clone https://github.com/henrikuayezee/vantage.git
cd vantage

# 2. Install all dependencies (monorepo-wide)
pnpm install

# 3. Create local env files, including a new JWT key pair
pnpm setup:env

# 4. Start the database (Docker Compose)
docker compose up postgres -d

# 5. Create the database schema
pnpm --filter @vantage/api db:push

# 6. Load the demo data
pnpm --filter @vantage/api db:seed

# 7. Start the full development stack
pnpm dev
```

The dev stack starts:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Swagger docs:** http://localhost:3001/docs

Demo login credentials are printed to the console during `db:seed`.

### Useful development commands

```bash
# Run all type checks across the monorepo
pnpm typecheck

# Run linting
pnpm lint

# Run all tests
pnpm test

# Run backend tests only
pnpm --filter @vantage/api test

# Run E2E tests (requires dev stack running)
pnpm --filter @vantage/web test:e2e

# Generate Prisma client after schema change
pnpm --filter @vantage/api db:generate

# Open Prisma Studio (DB browser)
pnpm --filter @vantage/api db:studio
```

---

## 3. Environment Variables

### Backend — `apps/api/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_PRIVATE_KEY` | ✅ | RSA-2048 private key (PEM format, `\n` escaped) |
| `JWT_PUBLIC_KEY` | ✅ | RSA-2048 public key (PEM format, `\n` escaped) |
| `JWT_ACCESS_EXPIRES_IN` | ✅ | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token TTL (e.g. `7d`) |
| `PORT` | ✅ | API port (default: `3001`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS + email links |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `EMAIL_FROM` | ✅ | Sender address (e.g. `Vantage <noreply@vantage.app>`) |

**Generating JWT keys:** `pnpm setup:env` does this for local development. To generate them by hand:
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```
Copy the contents of each file into the env var. When setting in a `.env` file, replace literal newlines with `\n`.

### Frontend — `apps/web/.env.local`

| Variable | Required | Description |
|---|---|---|
| `API_URL` | ✅ | Backend URL — server-side only (proxied by Next.js). Set to `http://localhost:3001` locally. |

The frontend never calls the API directly from the browser. All `/api/*` requests are proxied server-side by the Next.js rewrite rule in `next.config.ts`. This means `API_URL` is never exposed to the client.

---

## 4. Database Schema

The schema is managed with `prisma db push`, which syncs the database directly to `apps/api/prisma/schema.prisma`. The Docker entrypoint and `render.yaml` use the same command. The repository has no migration files.

```bash
# Sync the database after editing schema.prisma
pnpm --filter @vantage/api db:push

# Load the demo data
pnpm --filter @vantage/api db:seed
```

`db push` can drop data when a schema change is destructive, and it warns before doing so. Moving to Prisma Migrate is an open item before production use.

---

## 5. API Documentation (Swagger)

The backend auto-generates interactive API docs via `@nestjs/swagger`.

**Local:** http://localhost:3001/docs

Swagger is **disabled in production** (`NODE_ENV=production`) for security. To explore the API in production, run the docs locally against a production database snapshot, or use a REST client like Insomnia/Postman with the JWT token from a login response.

**Authentication in Swagger:**
1. Call `POST /api/auth/login` with valid credentials
2. Copy the `accessToken` from the response
3. Click the **Authorize** button (top right) in Swagger UI
4. Paste the token as `Bearer <token>`

---

## 6. Key Architectural Decisions

### Multi-tenancy
Every database query is scoped to `organizationId`, extracted from the JWT payload at auth time. There is no cross-tenant data access possible — the organization ID is set once at account creation and never changes.

### Authentication flow
- Login → RS256 JWT access token (15 min) + httpOnly refresh cookie (7 days)
- Access token stored in memory (Zustand auth store), never in localStorage
- Refresh token is SHA-256 hashed before storage; raw token only in the cookie
- Token rotation: each refresh issues a new pair; old refresh token is invalidated
- `tokenVersion` on the User model allows instant invalidation of all sessions

### Frontend API proxy
The Next.js frontend never makes direct cross-origin API calls. All `/api/*` requests from the browser hit the Next.js server, which proxies them to the NestJS backend using the `API_URL` environment variable. This eliminates CORS issues and keeps the backend URL server-side.

### Role model
Three roles: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`.
- Admins: full access to everything
- PMs: create/manage projects, create tasks, manage members
- Developers: read-only access to assigned projects; can update task status and post comments

Role enforcement happens at two layers:
1. **Backend:** `@Roles()` decorator + `RolesGuard` on every controller route
2. **Frontend:** `canCreate` / `isDeveloper` checks from the auth store gate all editing UI
