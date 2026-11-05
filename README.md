# Vantage

Vantage is a multi-tenant project management platform for IT and software teams. It has three roles (Admin, Project Manager and Developer) and covers tasks with subtasks and dependencies, a Kanban board, a read-only Gantt chart, comments, notifications, global search, role-specific dashboards and invite-only onboarding.

## Stack

| Area | Tools |
|---|---|
| Web (`apps/web`) | Next.js 16, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Zustand, dnd-kit |
| API (`apps/api`) | NestJS 11, Prisma 6, PostgreSQL 16, Resend |
| Shared (`packages/`) | TypeScript types and enums, ESLint and TypeScript config |
| Tooling | pnpm workspaces, Turborepo, Docker, Nginx, GitHub Actions |

## Run it locally

You need Node.js 24, pnpm 11.3.0 (`npm install -g pnpm@11.3.0`) and Docker.

```bash
pnpm install
pnpm setup:env                          # creates env files and a new JWT key pair
docker compose up -d postgres
pnpm --filter @vantage/api db:push      # creates the database schema
pnpm --filter @vantage/api db:seed      # loads demo data
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api |
| API docs (Swagger) | http://localhost:3001/docs |

Sign in with one of these demo accounts from the seed data:

| Role | Email | Password |
|---|---|---|
| Admin | `henry@acme.com` | `Admin123!` |
| Project Manager | `sarah@acme.com` | `Test123!` |
| Developer | `alex@acme.com` | `Test123!` |

Emails such as invites and password resets only send once `RESEND_API_KEY` in `apps/api/.env` holds a real [Resend](https://resend.com) key.

## Known issues

- **Unit tests:** 10 of 76 fail in `pnpm test`. The mocks in the auth, projects and tasks specs were not updated after the latest database changes to the API services.
- **Lint:** `pnpm lint` fails. The API config can't find `@eslint/js`, and the web app reports 23 errors and 6 warnings.
- **CI:** `.github/workflows/ci.yml` targets `main` and `develop`, but the default branch is `master`, so it doesn't run on pushes to `master`.
- **Database migrations:** the schema is applied with `prisma db push`, and the repository has no migration files. Add Prisma Migrate before running this in production.

## Documentation

- [Codebase guide](docs/CODEBASE_GUIDE.md): repository layout, environment variables and key decisions
- [Architecture](docs/ARCHITECTURE.md)
- [Product requirements](docs/PRD.md)
- [Deployment guide](docs/DEPLOYMENT_GUIDE.md) and [runbook](docs/RUNBOOK.md). The Docker Compose route they describe has not been tested.
- [Design handoff](docs/design-handoff/README.md): HTML reference for each screen, plus the design tokens

## Licence

This repository is public, but it has no open-source licence. You can read the code on GitHub. Please ask Henry Quaye before using, copying or redistributing it.
