# Design Handoff: Vantage — Project Management Tool

## Overview

Vantage is a multi-tenant project management platform for IT and software teams. It has three user roles — **Admin**, **Project Manager**, and **Developer** — each with a distinct dashboard. It is modelled after Jira's interaction density and Notion's sidebar style.

This package contains **high-fidelity HTML design references** built in React + plain CSS. They are prototypes showing exact intended look, spacing, component anatomy, and interactions. Your task is to **recreate these designs in your real codebase** using your existing component library (shadcn/ui, as specified) and framework (React). Do not ship the HTML files directly — use them as pixel-accurate references.

---

## Fidelity

**High-fidelity.** All colours, font sizes, weights, spacing values, border radii, shadow definitions, component states (hover, active, focus, empty, loading), and interaction patterns are final and should be matched precisely. The dummy data is plausible but not real — replace with live API calls.

---

## How to view the reference

Open `Vantage.html` in a browser. It loads a pan/zoom design canvas with every screen laid out in labelled artboards. Use:
- **Scroll** to pan, **Ctrl/Cmd + scroll** to zoom
- **Click any artboard title** to focus it fullscreen, **Esc** to exit
- The **interactive app artboard** (top of canvas) is a live prototype — click sidebar nav, tabs, open task drawer, trigger ⌘K
- Toggle **Tweaks** (top-right toolbar) to switch role, route, theme, and sidebar state live

---

## Tech stack (locked by brief)

| Concern | Choice |
|---|---|
| Component library | shadcn/ui (customised to Vantage tokens) |
| Icons | Lucide React |
| Font | Geist Sans + Geist Mono (Google Fonts) |
| Auth | Email + password; SAML SSO; WebAuthn passkey |
| Both light and dark mode required | CSS custom properties (see `tokens.css`) |

---

## Design tokens

All tokens live in `tokens.css` as CSS custom properties on `:root` (light) and `.theme-dark` (dark). Wire them into your Tailwind config or shadcn theme.

### Light mode
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#FFFFFF` | Page background |
| `--surface` | `#F8FAFC` | Cards, panels |
| `--surface-2` | `#F1F5F9` | Hover tint, inner panels |
| `--border` | `#E2E8F0` | All borders |
| `--border-strong` | `#CBD5E1` | Focused, strong borders |
| `--text` | `#1E293B` | Primary text |
| `--text-muted` | `#64748B` | Secondary text, labels |
| `--text-subtle` | `#94A3B8` | Placeholder, fine print |
| `--primary` | `#0D7A75` | Brand, buttons, active states |
| `--primary-hover` | `#14B8A6` | Hover on primary |
| `--primary-soft` | `rgba(13,122,117,0.10)` | Active nav bg, tag bg |
| `--primary-softer` | `rgba(13,122,117,0.06)` | Focus ring tint |
| `--accent` | `#F97316` | Milestones, highlights |
| `--accent-soft` | `rgba(249,115,22,0.12)` | Accent badge bg |
| `--success` | `#16A34A` | Done status, positive |
| `--warning` | `#D97706` | At-risk, review |
| `--error` | `#DC2626` | Critical, overdue |
| `--p-critical` | `#DC2626` | Critical priority |
| `--p-high` | `#F97316` | High priority |
| `--p-medium` | `#F59E0B` | Medium priority |
| `--p-low` | `#64748B` | Low priority |
| `--status-backlog` | `#94A3B8` | Backlog column |
| `--status-todo` | `#6366F1` | To do column |
| `--status-progress` | `#0D7A75` | In progress column |
| `--status-review` | `#D97706` | Review column |
| `--status-done` | `#16A34A` | Done column |

### Dark mode (`.theme-dark`)
| Token | Value |
|---|---|
| `--bg` | `#0F172A` |
| `--surface` | `#1E293B` |
| `--surface-2` | `#273548` |
| `--border` | `#334155` |
| `--border-strong` | `#475569` |
| `--text` | `#F1F5F9` |
| `--text-muted` | `#94A3B8` |
| `--primary` | `#14B8A6` |
| `--accent` | `#FB923C` |

### Shadows
```css
--shadow-xs: 0 1px 0 rgba(15,23,42,0.04);
--shadow-sm: 0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04);
--shadow-md: 0 6px 16px -4px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05);
--shadow-lg: 0 18px 48px -12px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.06);
```

---

## Typography scale

Font stack: `'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
Mono stack: `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`

| Role | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| Page title | 22px | 600 | -0.015em | e.g. "Welcome back, Maya" |
| Section heading | 18px | 600 | -0.010em | e.g. project name |
| Widget title | 13.5–14px | 600 | -0.005em | Card header |
| Body / task title | 13px | 400 | normal | Main readable text |
| Label / meta | 12–12.5px | 500 | normal | Secondary UI labels |
| Mono IDs / timestamps | 11–12px | 400 | normal | Monospace; tabular-nums |
| Caps label | 10–11px | 600 | 0.06–0.09em | Uppercase section dividers |
| Fine print | 9.5–10.5px | 400 | normal | Tooltips, badges, status bar |

Global: `-webkit-font-smoothing: antialiased`, `font-feature-settings: 'cv11','ss01','ss03'`

---

## UI density (Jira-style, locked)

| Element | Spec |
|---|---|
| List row height | 36px (dense mode: 32px) |
| Sidebar nav item height | 32px |
| Board card padding | 8px 10px |
| Table cell padding | 9px 12px |
| Base font size | 13px |
| Card padding | 8–16px |
| Widget head padding | 14px 16px 10px |
| Topbar height | 52px |
| Target: 15–20 tasks visible without scroll | ✓ |

---

## Sidebar (Notion-style, locked)

- **Expanded width:** 240px · **Collapsed width:** 56px (icon-only)
- Background: `var(--bg)` (same as page background — not a grey panel)
- Right border only: `1px solid var(--border)` — no shadow
- **Active nav item:** `background: var(--primary-soft)`, `color: var(--primary)`, `font-weight: 500`, plus a **3px teal left border** (`background: var(--primary)`) pinned to the left edge, vertically inset 6px top/bottom, `border-radius: 0 3px 3px 0`
- Nav item height: 32px, border-radius: 6px, gap between icon and label: 9px
- **Pinned projects section:** shown below nav when expanded; each item is 28px tall, 12.5px, with a coloured 18×18 mark (project initial)
- **Footer:** user avatar + name + role tag + light/dark toggle segmented control; collapses to stacked avatar + theme icon
- Collapse handle: 16×36px tab on the right edge; appears only when collapsed
- Transition: `width 0.18s ease`

---

## Topbar

- Height: 52px, `border-bottom: 1px solid var(--border)`
- Decorative teal gradient line on bottom edge: `linear-gradient(90deg, transparent, var(--primary-softer) 30%, 70%, transparent)`
- Left: breadcrumb trail — `/` separated, last crumb bold, earlier crumbs muted
- Centre: fake search bar (triggers modal on click), max-width 420px, height 32px, `⌘K` kbd chip
- Right: context action buttons + notification bell with unread badge + user avatar

---

## Screens

### 1. Login (`/login`)
**Layout:** Two-column, 50/50. Left panel: brand mark + tagline quote + topo pattern bg. Right panel: centred auth card, max-width 360px.

**Left panel:**
- Background: `linear-gradient(135deg, var(--surface), var(--bg))`
- Topographic SVG overlay (faint contour lines), `color: var(--primary)`, `opacity: 0.5`
- Brand mark: PeakMark SVG (mountain peak with teal triangle + orange dot at summit) + "Vantage" wordmark, 18px/600
- Large quote in 26px/600/`-0.02em`, with decorative `"` in 64px Georgia, `color: var(--primary)`, `opacity: 0.5`
- Footer: version + SOC2 badges in 11px mono, `color: var(--text-muted)`

**Right panel fields:**
- "Work email" → `<input type="email">`, height 32px, border-radius 7px, focus ring: `border-color: var(--primary)` + `box-shadow: 0 0 0 3px var(--primary-softer)`
- Password with "Forgot?" link (right-aligned), eye-toggle icon button inside input
- "Keep me signed in" checkbox, `accent-color: var(--primary)`
- Primary CTA: full-width, height 38px, `background: var(--primary)`, `border-radius: 7px`
- Divider + two secondary SSO buttons (SAML / Passkey)

---

### 2. Reset password (`/reset-password`)
Same two-column layout. Right card: back link button, h1, body copy, single email input, submit button, informational callout box (lock icon + SAML note).

---

### 3. Accept invite (`/accept-invite/[token]`)
Same layout. Right card: invite banner (inviter avatar + org name), name input, password input with **password strength meter** (4-segment bar, colours from weak=error → strong=success), submit CTA, legal footer.

---

### 4. App shell
See sidebar and topbar sections above. The shell wraps all authenticated screens. Sidebar and topbar are persistent and sticky.

---

### 5. PM Dashboard

**KPI band:** 5-column grid of stat cards. Each card: caps label, large numeric value (22px/600/`-0.02em`), delta badge (mono, coloured), optional sparkline or 3px progress bar. Border: `1px solid var(--border)`, radius 9px, padding 12px 14px.

**Main grid:** `grid-template-columns: minmax(0,1fr) 360px; gap: 16px`

**Left column:**
1. **Portfolio table widget** — table with columns: Project (mark + name + badge + ID), Lead (avatar), Team (avatar stack), Progress (bar + %), Open (count), Due (date), → icon button. Thead: 11px caps, `background: var(--surface)`, sticky. Tbody row: 36px, hover `background: var(--surface)`.
2. **Unassigned tasks widget** — compact 34px rows: priority bars + status dot + task key + title + due date + "Assign" ghost button.

**Right column:**
1. **At-risk widget** — cards with `border-left: 3px solid var(--warning)`. Each card: project mark + name + "At risk" badge + progress bar + 2 reason rows (alert icon + text).
2. **Milestones widget** — vertical timeline: 1.5px vertical line (left 9px), each item has a diamond icon, title, project/date meta, days-remaining chip. Chip turns `warning-soft/warning` when ≤ 3 days.
3. **Activity feed** — rows: avatar + text (actor bold, target mono teal) + when mono. Hover: `background: var(--surface)`.

---

### 6. Developer Dashboard ("My work")

Same shell. **Two-column:** `minmax(0,1fr) 320px`.

**Left:** Three task-list widgets: "Due today", "Overdue", "Upcoming this week". Each is a flush list of 36px rows: priority bars + status dot + task key (70px mono) + title + milestone diamond + subtask count + comment count + due date + assignee avatar. Overdue tasks highlight due date in `var(--error)`.

**Right:** "My projects" (mini cards with progress bars), "Recently updated" (activity feed), "Focus" card (a highlighted card suggesting the single highest-priority open task with a "Start timer" CTA button).

---

### 7. Admin Dashboard

**6-column KPI band.** Then same two-column grid. Left: full portfolio table + delivery performance bar chart (14-week two-series bar: shipped teal bars overlapping planned grey bars, 140px tall). Right: at-risk widget + people mini-list (avatar + name + role mono + green online dot + "Invite teammates" dashed button).

---

### 8. Projects portfolio (`/projects`)

Full-page version of the portfolio table. 4 KPI cards at top. Table adds Status column. Above table: tab switcher (Active / All / Archived) + Filter + Group-by controls.

---

### 9. Project detail (`/projects/[id]`)

**Project header:**
- Top row: 38×38 coloured mark (project key initial, 8px radius) + project name (18px/600) + status badge + meta mono line. Right: avatar stack + Share button + New task button.
- Below: Tab bar (List / Board / Gantt) — active tab: `color: var(--primary)`, `border-bottom: 2px solid var(--primary)`. Tabs are 13px/500, 9px 12px padding, flush with the bottom of the header.
- Toolbar: filter pills ("Status: Any", "Assignee: Anyone", etc.) + More filters + Group-by button.

#### List view tab

Sticky column headers (11px caps, `background: var(--surface)`). Column widths:
`74px | minmax(220px,1fr) | 80px | 130px | 70px | 60px | 80px | 120px`

**Group headers** (`height: 32px`, `background: var(--surface-2)`): toggle chevron + status dot + status label + count + spacer + "Add task" ghost button.

**Task rows** (`height: 36px`, `border-bottom: 1px solid var(--border)`):
- Key: 11px mono, muted
- Title: truncated, with optional milestone diamond + dependency link icon + subtask count chip + comment count chip
- Priority: `PriorityTag` (bars + caps label, always both)
- Assignee: avatar + first name, or dashed "Assign" ghost button
- Due date: mono; late = `var(--error)`, due ≤ 2 days = `var(--warning)`
- Est: mono
- Updated: relative time, mono
- Status: `StatusPill` (coloured dot + label, pill background is colour-mix)

Active row (drawer open): `background: var(--primary-softer)` + `box-shadow: inset 3px 0 0 var(--primary)`.

#### Board view tab

5 columns, `grid-template-columns: repeat(5, minmax(240px,1fr))`, `gap: 12px`, `padding: 12px 28px`.

Each column (`background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 10px`):
- **Rail:** 2px solid line in the status colour
- **Head:** status dot + name (12px/600/caps) + count pill + icon buttons
- **Cards:** `background: var(--bg)`, `border-left: 3px solid var(--priority-color)`, `border-radius: 7px`, `box-shadow: var(--shadow-xs)`, `padding: 8px 10px 9px`
  - Card head: task key mono + optional milestone diamond + spacer + priority tag
  - Title: 12.5px, 1.35 line-height
  - Foot: subtask/comment/dep counts (mono, 10.5px) + due date + assignee avatar

#### Gantt view tab

Left pane (280px): sticky header + rows matching task list. Right pane: scrollable chart.

Chart header: month row (22px, sticky) + week row (22px).

Chart body:
- **Gridlines:** 1px border-colour vertical lines every day; bolder every 7 days
- **Today line:** 2px solid `var(--accent)` with "TODAY" label chip above
- **Task bars:** `height: 18px`, `border-radius: 4px`, coloured by priority with a semi-transparent fill + an inner progress fill. Click opens drawer.
- **Milestone diamonds:** `var(--accent)` diamond SVG icon + label chip
- **Dependency arrows:** dashed lines (`stroke-dasharray: 3 3`), `var(--text-muted)`, with arrowhead markers. L-shaped routing (horizontal from end of blocker → vertical → horizontal to start of dependent).

---

### 10. Task drawer

Slides in from the right. `width: 720px`, `max-width: 70%`. `border-left: 1px solid var(--border)`, `box-shadow: var(--shadow-lg)`.

**Header:** task key mono chip + link icon + status pill + milestone badge. Right: Watch, Attach, More icon buttons + divider + X close.

**Body:** Two-column: `minmax(0,1fr) 240px`.

**Left (main):**
- Title: 19px/600/`-0.01em`
- Description: prose + inline `<code>` chips (`background: var(--surface)`, `border: 1px solid var(--border)`, `padding: 1px 5px`, `border-radius: 4px`, mono font) + metadata grid (2-col, `background: var(--surface)`, 10px 12px padding, 7px radius)
- Subtasks: list of rows (16×16 checkbox, key mono, title, assignee avatar). Done items: `text-decoration: line-through`, `color: var(--text-muted)`. Checkbox checked: `background: var(--success)`.
- Dependencies: bordered rows with arrow/link icon prefix
- Comments: avatar + bubble (card with `background: var(--surface)`). Bubble head: bold author + mono timestamp.
- Composer: avatar + textarea box (focus ring: primary). Footer with toolbar icons + Comment button.

**Right (sidebar):** Stacked field rows, `border-bottom: 1px solid var(--border)`. Each: caps label + value. Fields: Assignee, Reporter, Priority, Status, Due date, Estimate (+ 3px progress bar), Sprint, Labels, Created.

---

### 11. Global search (`⌘K`)

Full-screen modal veil: `background: rgba(15,23,42,0.5)`, `backdrop-filter: blur(4px)`. Modal centred, `top: 92px`.

Modal (`width: 580px`, `border-radius: 12px`, `box-shadow: var(--shadow-lg)`):
- Input row: search icon + text input (15px) + Esc kbd chip
- Results: grouped by Projects, Tasks, People. Each group has a caps label. Items: 8px 16px padding, hover `background: var(--surface)`. Active item highlighted.
- Task items show: priority bars + status dot + key mono + title with highlighted match (mark element: `background: var(--primary-soft)`, `color: var(--primary)`) + sub-meta
- Footer: kbd shortcuts row + "N of M results" right-aligned

---

### 12. Notifications panel

Dropdown from bell icon, `width: 380px`, `border-radius: 12px`.

Header: title + unread count + tab switcher (All / Mentions / Watching) + "Mark all read" button.

Notification rows (`padding: 8px 14px`):
- Unread: `background: var(--primary-softer)` + blue dot on right edge
- Kind icon (20×20, coloured by kind: assigned=primary, mention=accent, due=error, review=warning)
- Actor avatar + text (actor bold, target key mono teal) + relative time
- Footer: "Open full inbox" link + "Notification settings" link

---

### 13. Settings · People (`/settings/users`)

Two-column: `220px | 1fr`. Left: settings sidebar nav with grouped sections (Account, Workspace, Developers). Active item: `background: var(--primary-soft)`, `color: var(--primary)`.

Right:
- Page head: title + sub copy + Bulk invite + Invite people buttons
- Search bar + Role filter + Status filter
- Users table: User (avatar + name + email), Role (badge), Projects (count), Last active (relative mono), Status (badge), overflow menu
- Pending rows: warning-soft background tint, Resend + Revoke action buttons

---

### 14. Empty states

All share the same shell: 96×96 glyph (topo pattern background + icon badge on top) + 17px/600 title + 13px body copy + CTA buttons.

| Empty state | Icon | CTA |
|---|---|---|
| No projects | Folder | "Create your first project" (primary) + "Browse templates" (secondary) + 3 template cards |
| No tasks (board) | Lightning | Ghost kanban columns with dashed-border ghost cards behind a centred modal card |
| No notifications | Inbox | 3-stat grid (Unread / Cleared today / Avg response) |
| No search results | Search | Query chips + syntax tip with kbd shortcuts |

---

### 15. Loading skeletons

**Pattern:** Animated shimmer via `background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 50%, var(--surface-2) 100%); background-size: 200%; animation: shimmer 1.6s linear infinite`.

Three patterns:
1. **Dashboard skeleton** — KPI row placeholders + widget shells with bar/row placeholders matching exact layout
2. **List skeleton** — sticky header placeholder + 2 group headers + 5 rows each, column widths matching list view
3. **Board skeleton** — 5 columns with 3–4 card skeletons each; column heads show live status labels

---

### 16. Mobile (390×844 reference)

Bottom navigation bar (5 tabs: Home, Inbox [badge], + FAB, Projects, Me). FAB: 44×44px, `background: var(--primary)`, `border-radius: 14px`, centred in nav.

Board view: single visible column + peek of next column (16px). Column header: status dot + label + count. Cards identical to desktop but slightly larger touch targets.

Device bezel: `border-radius: 32px`, `border: 6px solid #1a1a1a`, status bar with time + signal.

### 17. Tablet (834px portrait reference)

Sidebar collapses to 56px icon-only automatically. Single-column layout for dashboard widgets. Portfolio table drops Team and Estimate columns. KPI band becomes 3-column.

---

## Interactions and behaviour

| Interaction | Spec |
|---|---|
| ⌘K / Ctrl+K | Opens global search modal anywhere in app |
| Esc | Closes any open modal/drawer/panel |
| Sidebar collapse | Click handle or Sliders icon; width animates `0.18s ease` |
| Task row click | Opens task drawer without navigating away |
| Drawer close (X or Esc) | Slides out, list row deactivates |
| Kanban drag-and-drop | Optimistic update — card moves immediately, status updates in background |
| Board column card order | Draggable within and between columns |
| Notification bell | Toggles dropdown panel below topbar |
| Theme toggle | Switches `.theme-dark` class on root element; persisted to localStorage |
| Task status change | Updates both the task row and the Kanban column in real time |
| Sidebar active state | 3px left border on active item; updates on navigation |
| Topbar breadcrumbs | Reflect current route hierarchy; last crumb bold |

---

## Priority display (accessibility requirement — locked)

Priority must **always** be shown as both colour AND a label/icon — never colour alone.

Use the `PriorityTag` component pattern: a 4-bar chart indicator (bars grow in height, coloured bars = filled priority level) + a caps mono label ("CRIT", "HIGH", "MED", "LOW").

| Priority | Bar count | Colour | Label |
|---|---|---|---|
| CRITICAL | 4 | `#DC2626` | CRIT |
| HIGH | 3 | `#F97316` | HIGH |
| MEDIUM | 2 | `#F59E0B` | MED |
| LOW | 1 | `#64748B` | LOW |

---

## Data models (for reference — implement via your API layer)

```
Organizations
  └── Users (role: ADMIN | PROJECT_MANAGER | DEVELOPER)
  └── Projects
        └── ProjectMembers
        └── Tasks
              └── Subtasks (one level deep)
              └── TaskDependencies (many-to-many)
              └── Comments
        └── Milestones

Users
  └── Notifications
  └── AssignedTasks
```

Task statuses (map directly to Kanban columns): `BACKLOG → TODO → IN_PROGRESS → REVIEW → DONE`

---

## Files in this package

| File | Purpose |
|---|---|
| `Vantage.html` | **Main reference** — open in browser, pan/zoom canvas with all screens |
| `tokens.css` | All CSS custom property tokens (light + dark) |
| `data.js` | Plausible fake data (users, projects, tasks, comments, notifications) |
| `components/icons.jsx` | All Lucide-style icons used throughout the UI |
| `components/primitives.jsx` | Avatar, PriorityTag, StatusPill, Badge, Button, ProgressBar, etc. |
| `components/app-shell.jsx` | Sidebar + Topbar + AppFrame |
| `components/dashboards.jsx` | PM, Developer, Admin dashboards + shared widgets |
| `components/project-views.jsx` | List view, Board view, Gantt view, Task drawer |
| `components/aux-screens.jsx` | Search modal, Notifications panel, Settings, Auth screens |
| `components/empty-and-mobile.jsx` | Empty states, skeletons, mobile + tablet references |

---

## Open items / questions for the engineer

1. **Gantt start dates** — the design synthesises start dates as `due − estimate`. The real implementation needs explicit `startDate` on the Task model. Flag this to your PM.
2. **Drag-and-drop** — the board prototype is click-only. For production, recommend `@dnd-kit/core` with the sortable preset. The card moves optimistically on drop.
3. **Real-time** — the activity feed and task status updates should use your WebSocket/SSE layer for live updates.
4. **Toast / snackbar** — not yet designed. Recommended: a 320px card in the bottom-right corner, `box-shadow: var(--shadow-lg)`, 4s auto-dismiss, same tone system as badges (success / warning / error).
5. **Project detail — card grid variant** — the portfolio page currently uses a table. A card grid (3-col, `minmax(320px,1fr)`) may feel better for that context — confirm with PM.
6. **Responsive breakpoints** — 834px tablet portrait and 390px mobile are designed. Between 835–1279px, sidebar should auto-collapse. Below 835px, sidebar should be a drawer overlay (hamburger trigger).
7. **Gantt — dependency types** — the design shows FS (finish-to-start) only. If you need SS/FF/SF, the arrow routing will need updating.
