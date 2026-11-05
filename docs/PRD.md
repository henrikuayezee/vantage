# Product Requirements Document
# Vantage — Project Management Platform
**Version:** 2.1  
**Last Updated:** 2026-05-22  
**Status:** Approved for Development

---

## 1. Product Overview

### Product Summary
A web-based project management platform designed to help IT and software teams manage multiple projects efficiently. The platform provides task management, Kanban boards, timeline views, milestones, task dependencies, Gantt chart visualization, role-based dashboards, and in-app notifications.

The platform is inspired by Asana Premium but focused specifically on software and technical project execution workflows. It is designed to be multi-tenant, supporting multiple organizations on a single deployment.

### Product Name
**Vantage** — named for the superior position it gives teams over their projects: complete visibility across every workflow, timeline, and angle of delivery.

### Design Language
Vantage's UI is built on four decisions:

1. **Theme:** Adapted from the [impactailabs.com](https://impactailabs.com) identity — deep teal primary, warm orange accent, professional sans-serif typography. Both **light and dark modes** are supported with a user-controlled toggle.
2. **Sidebar:** [Notion-style](https://notion.so) — white/light background (dark: deep slate), clean text navigation, subtle left-border active indicator, collapsible project list, no heavy chrome.
3. **Density:** [Jira-style](https://atlassian.com/jira) — compact layouts, information-dense cards and tables, tight spacing. Maximum data visible per screen without sacrificing clarity.
4. **UX Reference:** Jira is the primary interaction pattern reference for issue/task flows, filters, list views, and board behavior.

---

## 2. Product Vision
To provide a centralized, multi-tenant project execution platform that improves collaboration, delivery speed, visibility, and accountability across IT and software development projects — lightweight enough to onboard quickly, powerful enough to replace enterprise tools.

---

## 3. Product Objectives

1. Enable teams to manage multiple IT projects simultaneously across organizations
2. Improve project visibility through Kanban, List, and Gantt views
3. Track project timelines, milestones, and task dependencies
4. Improve collaboration between project managers and developers
5. Reduce project delivery delays through visibility and accountability
6. Provide a lightweight but powerful alternative to complex enterprise PM tools
7. Surface role-specific information immediately on login through tailored dashboards
8. Support organizational scalability with multi-tenant architecture

---

## 4. Target Users

### Primary Users

**Admin**
Responsible for platform administration, organization setup, and user management. Has full visibility across all projects.

**Project Manager**
Responsible for project planning, task assignment, milestone tracking, and delivery. Sees only projects they manage.

**Developer**
Responsible for executing assigned tasks and updating task statuses. Sees tasks assigned to them and the projects they belong to.

---

## 5. User Roles & Permissions

| Feature | Admin | Project Manager | Developer |
|---|---|---|---|
| Create Projects | Yes | Yes | No |
| Edit Projects | Yes | Yes | No |
| Delete Projects | Yes | No | No |
| Archive Projects | Yes | Yes | No |
| Create Tasks | Yes | Yes | No |
| Create Subtasks | Yes | Yes | No |
| Assign Tasks | Yes | Yes | No |
| Update Task Status | Yes | Yes | Yes |
| View Gantt Chart | Yes | Yes | Yes |
| View Kanban Board | Yes | Yes | Yes |
| View List View | Yes | Yes | Yes |
| Add Comments | Yes | Yes | Yes |
| Manage Users | Yes | No | No |
| Invite Users | Yes | No | No |
| View All Projects | Yes | No | No |
| View Admin Dashboard | Yes | No | No |
| View PM Dashboard | No | Yes | No |
| View My Work Dashboard | No | No | Yes |
| Manage Organization | Yes | No | No |

---

## 6. Multi-Tenancy

The platform is built as a multi-tenant system from the ground up. Each **Organization** is a completely isolated workspace. All data (projects, users, tasks, comments) belongs to an organization.

- A single deployment supports multiple organizations
- Users belong to one organization
- Admins manage their organization's users and settings
- There is no cross-organization data visibility

---

## 7. User Onboarding

- There is **no public self-registration**
- An Admin creates user accounts and the system sends an **email invitation** with a one-time secure link
- The invited user clicks the link, sets their password, and completes their profile
- Invite links expire after **72 hours**
- Admins can resend invitations
- Email service: **Resend**

---

## 8. Core Features

### 8.1 Authentication & User Management

**Features**
1. Secure email/password login
2. JWT-based session management with refresh tokens
3. Password reset via email (Resend)
4. User invitation system (Admin only)
5. Role-based access control
6. User profile management (name, avatar, email)
7. Session expiry and re-authentication

### 8.2 Organization Management

**Features**
1. Organization profile (name, slug)
2. Admin manages organization settings
3. All projects, users, and data scoped to organization

### 8.3 Project Management

**Features**
1. Create, edit, archive projects
2. Assign project members (PM + developers)
3. Set project start and end dates
4. Track project progress (auto-calculated: completed tasks / total tasks)
5. View all projects in portfolio dashboard

**Project Fields**
| Field | Type | Notes |
|---|---|---|
| Project Name | Text | Required |
| Description | Rich text | Optional |
| Start Date | Date | Required |
| End Date | Date | Required |
| Status | Enum | Active, Archived, Completed |
| Team Members | Array | Users assigned to this project |
| Progress | Calculated | % of tasks completed |
| Created By | User | Auto-assigned |

### 8.4 Task Management

**Features**
1. Create tasks and subtasks (one level deep — no recursive nesting)
2. Assign tasks to team members
3. Set task priority (Low, Medium, High, Critical)
4. Set start and due dates
5. Add task dependencies (task B cannot start until task A is done)
6. Mark tasks as milestones
7. Update task status
8. Filter and sort tasks (by assignee, priority, status, due date)
9. Overdue and due-soon visual indicators
10. Subtasks roll up progress to parent task

**Task Fields**
| Field | Type | Notes |
|---|---|---|
| Title | Text | Required |
| Description | Rich text | Optional |
| Parent Task | Task reference | Optional — makes this a subtask |
| Assignee | User | Optional |
| Reporter | User | Auto-assigned to creator |
| Status | Enum | Backlog, To Do, In Progress, Review, Done |
| Priority | Enum | Low, Medium, High, Critical |
| Start Date | Date | Optional |
| Due Date | Date | Optional |
| Dependency | Task reference | Optional — blocks this task on another |
| Milestone | Boolean | Flags task as a milestone |
| Position | Integer | Used for ordering within Kanban column |

**Kanban Columns (fixed for MVP)**
1. Backlog
2. To Do
3. In Progress
4. Review
5. Done

### 8.5 Task List View

A sortable, filterable table view of all tasks in a project.

**Features**
1. View all tasks in a flat or grouped list
2. Group by status, assignee, or priority
3. Sort by due date, priority, creation date
4. Inline status update
5. Filter by assignee, priority, status, milestone, overdue
6. Quick-create task from list

### 8.6 Kanban Board

**Features**
1. Drag and drop tasks between columns
2. Optimistic UI updates (card moves instantly; syncs to server in background)
3. Background polling every 30 seconds to sync other users' changes
4. Quick task editing from card (open drawer without navigating away)
5. Priority color indicators on cards
6. Overdue badge on cards
7. Subtask count indicator on parent task cards

### 8.7 Gantt Chart

**Features**
1. Timeline visualization of all project tasks
2. Task duration bars (start date to due date)
3. Dependency lines between tasks
4. Milestone diamond indicators
5. Project timeline overview (zoom: day / week / month)
6. Read-only for MVP (no drag-to-reschedule)

**MVP Scope**
- Simple timelines
- Simple finish-to-start dependencies
- No advanced resource planning
- Only parent-level tasks shown (subtasks excluded from Gantt)

### 8.8 Task Comments

**Features**
1. Threaded comments on tasks
2. Timestamped entries
3. Comment history (cannot delete own comments in MVP)
4. Triggers in-app notification to task assignee

### 8.9 In-App Notifications

**Features**
1. Notification bell icon in the top navigation bar with unread badge count
2. Dropdown notification panel showing recent notifications
3. Mark as read / mark all as read
4. Notification triggers:
   - Task assigned to you
   - Someone comments on a task you are assigned to
   - A task you own is due within 24 hours
5. Clicking a notification navigates to the relevant task

**Out of scope for MVP:** Email notifications (Phase 2)

### 8.10 Global Search

**Features**
1. Search bar accessible from any page (keyboard shortcut: `Ctrl+K` / `Cmd+K`)
2. Searches across projects and tasks within the user's organization
3. Results grouped by type (Projects, Tasks)
4. Click result to navigate directly

---

## 9. Role-Specific Dashboards

### 9.1 Developer Dashboard — "My Work"
Shown immediately on login for Developers.

- **My Tasks Today** — tasks due today, sorted by priority
- **Upcoming** — tasks due this week
- **Overdue** — overdue tasks with urgency indicator
- **Recently Updated** — tasks I've worked on recently
- **My Projects** — list of projects I'm a member of

### 9.2 Project Manager Dashboard
Shown immediately on login for Project Managers.

- **Project Portfolio** — all managed projects with progress bars and status
- **At-Risk Projects** — projects with overdue milestones or tasks
- **Upcoming Milestones** — milestones due in the next 14 days across all projects
- **Unassigned Tasks** — tasks with no assignee across all projects
- **Team Activity** — recent task status changes by team members

### 9.3 Admin Dashboard
Shown immediately on login for Admins.

- **Organization Overview** — total projects, users, tasks
- **All Projects** — company-wide project list with status and progress
- **Overdue Projects** — projects past their end date
- **User Management** — quick access to invite/manage users
- **Delivery Performance** — simple stats (on-time vs overdue projects)

---

## 10. User Stories

### Authentication
- As an Admin, I want to securely log in so I can manage the organization.
- As a Project Manager, I want to log in and see my project portfolio immediately.
- As a Developer, I want to log in and see my assigned tasks immediately so I can start work quickly.
- As an Admin, I want to invite users via email so I control who joins the platform.
- As a new user, I want to accept an email invite and set my password so I can get started.

### Projects
- As an Admin, I want to create and manage multiple projects for different teams.
- As a Project Manager, I want to define project timelines so delivery stays on schedule.
- As a Project Manager, I want to assign developers to projects so responsibilities are clearly defined.
- As a Project Manager, I want to see auto-calculated project progress so I don't have to track it manually.
- As an Admin, I want to archive completed projects to keep the workspace clean.

### Tasks
- As a Project Manager, I want to create tasks and subtasks so work can be broken into manageable pieces.
- As a Project Manager, I want to set dependencies between tasks so the team understands execution order.
- As a Project Manager, I want to mark tasks as milestones so major checkpoints are visible.
- As a Developer, I want to update my task status so the project reflects actual progress.
- As a Developer, I want to filter tasks by priority and due date so I can focus on what matters most.

### Kanban
- As a Project Manager, I want to drag tasks across columns to track workflow visually.
- As a Developer, I want to see my tasks on a Kanban board so I can prioritize my day.

### Gantt
- As a Project Manager, I want to see timelines in a Gantt chart to monitor deadlines and dependencies.
- As an Admin, I want visibility into all project timelines to monitor company-wide delivery.

### Comments & Notifications
- As a Developer, I want to comment on tasks to communicate blockers or updates.
- As a Project Manager, I want to see task discussions in one place so communication stays centralized.
- As a Developer, I want to be notified when I'm assigned a task so I don't miss it.
- As a Project Manager, I want to be notified when someone comments on my tasks.

### Search & Navigation
- As any user, I want to search for any project or task quickly from anywhere in the app.

---

## 11. Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Users must authenticate securely via email/password |
| FR2 | Admin must invite users via email; no public self-registration |
| FR3 | System must support multiple organizations (multi-tenant) |
| FR4 | System must support multiple projects per organization |
| FR5 | Projects must support multiple tasks and one level of subtasks |
| FR6 | Tasks must support finish-to-start dependencies |
| FR7 | Tasks must support milestone flagging |
| FR8 | System must provide Kanban board view with drag and drop |
| FR9 | System must provide Gantt chart view with dependencies |
| FR10 | System must provide List view with filter and sort |
| FR11 | Users must be able to comment on tasks |
| FR12 | Developers must update task statuses |
| FR13 | System must provide role-specific dashboards on login |
| FR14 | System must provide in-app notifications |
| FR15 | System must support global search across projects and tasks |
| FR16 | Project progress must be auto-calculated |

---

## 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Pages load within 3 seconds on standard broadband |
| Security | JWT authentication with refresh tokens; bcrypt password hashing; HTTPS only |
| Scalability | Support 1,000+ projects and 10,000+ tasks per organization |
| Availability | 99.5% uptime target |
| Responsiveness | Fully responsive — desktop, tablet, mobile |
| Browser Support | Chrome, Edge, Safari, Firefox (latest 2 versions) |
| Accessibility | WCAG 2.1 AA compliance |
| Multi-tenancy | Full data isolation between organizations |

---

## 13. Database Entities

| Table | Purpose |
|---|---|
| Organizations | Multi-tenant root entity |
| Users | Platform users scoped to an organization |
| InviteTokens | One-time email invite links |
| Projects | Projects within an organization |
| ProjectMembers | Users assigned to a project and their role within it |
| Tasks | Tasks (and subtasks via parent_task_id) |
| TaskDependencies | Finish-to-start dependencies between tasks |
| Milestones | Milestone markers on a project |
| Comments | Threaded comments on tasks |
| Notifications | In-app notification records per user |
| ActivityLogs | Audit trail of all significant actions |

---

## 14. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui (customized to impactailabs theme)
- **Data Fetching:** TanStack Query (React Query v5)
- **State Management:** Zustand
- **Drag & Drop:** @dnd-kit
- **Gantt Chart:** Frappe Gantt or custom-built with SVG
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts/Stats:** Recharts

### Backend
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **ORM:** Prisma
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger (auto-generated)

### Database
- **Primary:** PostgreSQL

### Email
- **Service:** Resend (invitations, password reset)

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Hosting:** AWS or DigitalOcean
- **CI/CD:** GitHub Actions
- **Reverse Proxy:** Nginx

---

## 15. MVP Success Metrics

The MVP is successful when:
1. Teams can create and manage multiple active projects
2. Project managers can visualize timelines in Kanban, List, and Gantt views
3. Developers land on a "My Work" view and update task progress without friction
4. Teams reduce communication gaps through centralized task comments
5. Admins can invite users and see organization-wide delivery visibility
6. Users receive notifications for key events without checking manually
7. Any user can find any project or task in under 5 seconds via search

---

## 16. Future Roadmap

### Phase 2
1. Email notifications
2. File attachments on tasks
3. Activity feed (per project)
4. Sprint planning
5. Workload management (capacity view per developer)
6. Real-time WebSocket updates on Kanban

### Phase 3
1. AI-assisted project planning
2. Predictive delivery analytics
3. GitHub integration (link commits/PRs to tasks)
4. Slack integration
5. Client portal (read-only project view for external stakeholders)
6. Time tracking
7. Reporting & exports (PDF/CSV)
