import { PrismaClient, Role, ProjectStatus, TaskStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper: date relative to seed anchor point 2026-05-25
const D = (offsetDays: number): Date => {
  const d = new Date('2026-05-25T12:00:00.000Z');
  d.setDate(d.getDate() + offsetDays);
  return d;
};

async function main() {
  // The passwords below are public, so these accounts must never reach a deployed database.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo accounts with NODE_ENV=production.');
  }

  // ── Guard: skip if already seeded ──────────────────────────────────────────
  const existing = await prisma.user.count();
  if (existing > 1) {
    console.log('Database already seeded. Run with --force to re-seed (not implemented).');
    return;
  }

  // ── Organization ───────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme' },
  });

  // ── Password hashes ────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const userHash = await bcrypt.hash('Test123!', 12);

  // ── Users ──────────────────────────────────────────────────────────────────
  const henry = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'henry@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'henry@acme.com',
      passwordHash: adminHash,
      firstName: 'Henry',
      lastName: 'Quinn',
      role: Role.ADMIN,
    },
  });

  // Keep legacy admin@acme.com working too
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@acme.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });

  const sarah = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'sarah@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'sarah@acme.com',
      passwordHash: userHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: Role.PROJECT_MANAGER,
    },
  });

  const alex = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'alex@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'alex@acme.com',
      passwordHash: userHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: Role.DEVELOPER,
    },
  });

  const maya = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'maya@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'maya@acme.com',
      passwordHash: userHash,
      firstName: 'Maya',
      lastName: 'Patel',
      role: Role.DEVELOPER,
    },
  });

  const tom = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'tom@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'tom@acme.com',
      passwordHash: userHash,
      firstName: 'Tom',
      lastName: 'Brandt',
      role: Role.DEVELOPER,
    },
  });

  const priya = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'priya@acme.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'priya@acme.com',
      passwordHash: userHash,
      firstName: 'Priya',
      lastName: 'Nair',
      role: Role.DEVELOPER,
    },
  });

  // ── Projects ───────────────────────────────────────────────────────────────

  // 1. Customer Portal Redesign — ACTIVE but AT RISK (end date in the past)
  const portalProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Customer Portal Redesign',
      description: 'Full redesign of the customer-facing portal with modern UX and a new design system.',
      status: ProjectStatus.ACTIVE,
      startDate: D(-90),
      endDate: D(-10), // overdue end date → atRisk
    },
  });

  // 2. Mobile App v2.0 — ACTIVE, healthy-ish, upcoming milestone
  const mobileProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Mobile App v2.0',
      description: 'Native iOS and Android rewrite with offline-first architecture.',
      status: ProjectStatus.ACTIVE,
      startDate: D(-45),
      endDate: D(+67),
    },
  });

  // 3. API Modernization — ACTIVE, mostly done
  const apiProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'API Modernization',
      description: 'Migrate legacy REST endpoints to GraphQL and consolidate microservices.',
      status: ProjectStatus.ACTIVE,
      startDate: D(-120),
      endDate: D(+36),
    },
  });

  // 4. Internal Tools — ACTIVE, just started
  const toolsProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Internal Tools Dashboard',
      description: 'Centralised dashboard for ops, finance, and HR internal reporting.',
      status: ProjectStatus.ACTIVE,
      startDate: D(-7),
      endDate: D(+82),
    },
  });

  // 5. Legacy Migration — COMPLETED
  const legacyProject = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Legacy System Migration',
      description: 'Migrate data from the old on-premise system to the cloud.',
      status: ProjectStatus.COMPLETED,
      startDate: D(-180),
      endDate: D(-30),
    },
  });

  // ── Project Memberships ────────────────────────────────────────────────────
  const memberships = [
    // Customer Portal
    { projectId: portalProject.id, userId: henry.id, role: Role.ADMIN },
    { projectId: portalProject.id, userId: sarah.id, role: Role.PROJECT_MANAGER },
    { projectId: portalProject.id, userId: alex.id, role: Role.DEVELOPER },
    { projectId: portalProject.id, userId: maya.id, role: Role.DEVELOPER },
    // Mobile App
    { projectId: mobileProject.id, userId: henry.id, role: Role.ADMIN },
    { projectId: mobileProject.id, userId: sarah.id, role: Role.PROJECT_MANAGER },
    { projectId: mobileProject.id, userId: alex.id, role: Role.DEVELOPER },
    { projectId: mobileProject.id, userId: tom.id, role: Role.DEVELOPER },
    { projectId: mobileProject.id, userId: priya.id, role: Role.DEVELOPER },
    // API Modernization
    { projectId: apiProject.id, userId: henry.id, role: Role.ADMIN },
    { projectId: apiProject.id, userId: sarah.id, role: Role.PROJECT_MANAGER },
    { projectId: apiProject.id, userId: tom.id, role: Role.DEVELOPER },
    { projectId: apiProject.id, userId: maya.id, role: Role.DEVELOPER },
    // Internal Tools
    { projectId: toolsProject.id, userId: henry.id, role: Role.ADMIN },
    { projectId: toolsProject.id, userId: sarah.id, role: Role.PROJECT_MANAGER },
    { projectId: toolsProject.id, userId: priya.id, role: Role.DEVELOPER },
    // Legacy
    { projectId: legacyProject.id, userId: henry.id, role: Role.ADMIN },
    { projectId: legacyProject.id, userId: tom.id, role: Role.DEVELOPER },
    { projectId: legacyProject.id, userId: maya.id, role: Role.DEVELOPER },
  ];

  await prisma.projectMembership.createMany({ data: memberships });

  // ── Milestones ─────────────────────────────────────────────────────────────

  // Customer Portal milestones
  const portalM1 = await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: portalProject.id,
      title: 'Design System Complete',
      dueDate: D(-25),
      color: '#6366f1',
    },
  });
  const portalM2 = await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: portalProject.id,
      title: 'Beta Launch',
      dueDate: D(-5), // overdue milestone → atRisk
      color: '#f59e0b',
    },
  });
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: portalProject.id,
      title: 'Public Release',
      dueDate: D(+30),
      color: '#10b981',
    },
  });

  // Mobile App milestones (some upcoming in 14-day window)
  const mobileM1 = await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: mobileProject.id,
      title: 'Alpha Build',
      dueDate: D(-20),
      color: '#6366f1',
    },
  });
  const mobileM2 = await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: mobileProject.id,
      title: 'MVP Demo',
      dueDate: D(+7), // 7 days away — shows in PM upcoming widget
      color: '#f59e0b',
    },
  });
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: mobileProject.id,
      title: 'App Store Submission',
      dueDate: D(+60),
      color: '#10b981',
    },
  });

  // API Modernization milestones
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: apiProject.id,
      title: 'v2 API Release',
      dueDate: D(+13), // 13 days away — shows in PM upcoming widget
      color: '#6366f1',
    },
  });
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: apiProject.id,
      title: 'Legacy Deprecation',
      dueDate: D(+36),
      color: '#ef4444',
    },
  });

  // Internal Tools milestones
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: toolsProject.id,
      title: 'Design Approval',
      dueDate: D(+21),
      color: '#6366f1',
    },
  });

  // Legacy — all past
  await prisma.milestone.create({
    data: {
      organizationId: org.id,
      projectId: legacyProject.id,
      title: 'Final Cutover',
      dueDate: D(-32),
      color: '#10b981',
    },
  });

  // ── Tasks — Customer Portal (18 tasks: 10 DONE, 5 IN_PROGRESS, 2 TODO, 1 REVIEW) ─
  const pt1 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: alex.id, milestoneId: portalM1.id, title: 'Create new design tokens and CSS variables', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-85), dueDate: D(-60), position: 1 } });
  const pt2 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: maya.id, milestoneId: portalM1.id, title: 'Build component library (Button, Input, Card, Modal)', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-70), dueDate: D(-45), position: 2 } });
  const pt3 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: alex.id, milestoneId: portalM1.id, title: 'Document design system in Storybook', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-50), dueDate: D(-30), position: 3 } });
  const pt4 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Redesign dashboard homepage', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-40), dueDate: D(-20), position: 4 } });
  const pt5 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: alex.id, title: 'Implement new navigation and sidebar', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-35), dueDate: D(-18), position: 5 } });
  const pt6 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'User profile and settings pages', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-30), dueDate: D(-15), position: 6 } });
  const pt7 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: null, title: 'Billing and subscription management UI', status: TaskStatus.DONE, priority: Priority.CRITICAL, startDate: D(-25), dueDate: D(-12), position: 7 } });
  const pt8 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: alex.id, title: 'Notifications centre panel', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-20), dueDate: D(-10), position: 8 } });
  const pt9 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, milestoneId: portalM2.id, title: 'Mobile responsive layout — all pages', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-18), dueDate: D(-8), position: 9 } });
  const pt10 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: alex.id, milestoneId: portalM2.id, title: 'Cross-browser compatibility audit', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-12), dueDate: D(-5), position: 10 } });
  // IN_PROGRESS / overdue / at-risk tasks
  const pt11 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: alex.id, title: 'Performance optimisation and lazy loading', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-10), dueDate: D(-3), position: 11 } }); // overdue
  const pt12 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Accessibility audit (WCAG 2.1 AA)', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-8), dueDate: D(-1), position: 12 } }); // overdue
  const pt13 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: alex.id, title: 'Security review and CSP headers', status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, startDate: D(-5), dueDate: D(+3), position: 13 } });
  const pt14 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: null, title: 'E2E test suite for checkout flow', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-4), dueDate: D(+5), position: 14 } });
  const pt15 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Dark mode implementation', status: TaskStatus.IN_PROGRESS, priority: Priority.LOW, startDate: D(-3), dueDate: D(+7), position: 15 } });
  const pt16 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: henry.id, assigneeId: null, title: 'Analytics integration (Mixpanel)', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: D(+10), position: 16 } });
  const pt17 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: null, title: 'User acceptance testing (UAT)', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: D(+15), position: 17 } });
  const pt18 = await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Final content and copy review', status: TaskStatus.REVIEW, priority: Priority.LOW, dueDate: D(+4), position: 18 } });

  // Subtasks on pt13
  await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, parentTaskId: pt13.id, creatorId: henry.id, assigneeId: alex.id, title: 'Define Content Security Policy rules', status: TaskStatus.DONE, priority: Priority.HIGH, position: 1 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, parentTaskId: pt13.id, creatorId: henry.id, assigneeId: alex.id, title: 'Add rate-limiting headers to API', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, position: 2 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: portalProject.id, parentTaskId: pt13.id, creatorId: henry.id, assigneeId: null, title: 'Penetration test report', status: TaskStatus.TODO, priority: Priority.CRITICAL, position: 3 } });

  // ── Tasks — Mobile App (15 tasks: 5 DONE, 5 IN_PROGRESS, 3 TODO, 2 BACKLOG) ──
  const mt1 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: tom.id, milestoneId: mobileM1.id, title: 'Project scaffold — React Native + Expo', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-45), dueDate: D(-35), position: 1 } });
  const mt2 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: priya.id, milestoneId: mobileM1.id, title: 'Authentication screens (Login, Register, Forgot)', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-38), dueDate: D(-25), position: 2 } });
  const mt3 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: tom.id, milestoneId: mobileM1.id, title: 'Navigation structure and tab bar', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-30), dueDate: D(-20), position: 3 } });
  const mt4 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: priya.id, title: 'Offline-first data layer with SQLite', status: TaskStatus.DONE, priority: Priority.CRITICAL, startDate: D(-25), dueDate: D(-15), position: 4 } });
  const mt5 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: alex.id, title: 'Push notification integration', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-20), dueDate: D(-10), position: 5 } });
  // IN_PROGRESS
  const mt6 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: tom.id, milestoneId: mobileM2.id, title: 'Home feed and activity stream', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-8), dueDate: D(+5), position: 6 } });
  const mt7 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: priya.id, milestoneId: mobileM2.id, title: 'Task management screens', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-6), dueDate: D(+6), position: 7 } });
  const mt8 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: alex.id, milestoneId: mobileM2.id, title: 'Camera and file upload module', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, startDate: D(-4), dueDate: D(+8), position: 8 } });
  const mt9 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: tom.id, title: 'Search and filter UI', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, startDate: D(-3), dueDate: D(+10), position: 9 } });
  const mt10 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: null, title: 'Dark mode and theming', status: TaskStatus.IN_PROGRESS, priority: Priority.LOW, startDate: D(-2), dueDate: D(+12), position: 10 } });
  // TODO
  const mt11 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: null, title: 'Biometric authentication (FaceID / Fingerprint)', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: D(+20), position: 11 } });
  const mt12 = await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: null, title: 'App Store and Play Store assets', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: D(+45), position: 12 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: sarah.id, assigneeId: null, title: 'Beta testing with external users', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: D(+50), position: 13 } });
  // BACKLOG
  await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: null, title: 'Apple Watch companion app', status: TaskStatus.BACKLOG, priority: Priority.LOW, position: 14 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: mobileProject.id, creatorId: henry.id, assigneeId: null, title: 'Widget support for iOS home screen', status: TaskStatus.BACKLOG, priority: Priority.LOW, position: 15 } });

  // ── Tasks — API Modernization (12 tasks: 9 DONE, 2 IN_PROGRESS, 1 REVIEW) ──
  const at1 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'GraphQL schema design and documentation', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-115), dueDate: D(-100), position: 1 } });
  const at2 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Migrate /users endpoints to GraphQL', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-100), dueDate: D(-85), position: 2 } });
  const at3 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: tom.id, title: 'Migrate /projects endpoints to GraphQL', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-90), dueDate: D(-75), position: 3 } });
  const at4 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Migrate /tasks endpoints to GraphQL', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-80), dueDate: D(-65), position: 4 } });
  const at5 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'Authentication and authorisation middleware', status: TaskStatus.DONE, priority: Priority.CRITICAL, startDate: D(-70), dueDate: D(-55), position: 5 } });
  const at6 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Rate limiting and caching layer', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-60), dueDate: D(-45), position: 6 } });
  const at7 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: tom.id, title: 'Webhook system for third-party integrations', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-50), dueDate: D(-35), position: 7 } });
  const at8 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'API versioning strategy implementation', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-40), dueDate: D(-25), position: 8 } });
  const at9 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'OpenAPI / Swagger documentation', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-30), dueDate: D(-15), position: 9 } });
  // Still ongoing
  const at10 = await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: tom.id, title: 'Performance benchmarking and query optimisation', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-10), dueDate: D(+20), position: 10 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: sarah.id, assigneeId: maya.id, title: 'Deprecation notices and migration guide for v1', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, startDate: D(-5), dueDate: D(+25), position: 11 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: apiProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'Security penetration test sign-off', status: TaskStatus.REVIEW, priority: Priority.CRITICAL, dueDate: D(+12), position: 12 } });

  // ── Tasks — Internal Tools (10 tasks: 2 DONE, 3 IN_PROGRESS, 4 TODO, 1 BACKLOG) ──
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: henry.id, assigneeId: priya.id, title: 'Requirements gathering and stakeholder interviews', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-7), dueDate: D(-2), position: 1 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: henry.id, assigneeId: priya.id, title: 'Wireframes and UX prototype', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-5), dueDate: D(+1), position: 2 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: sarah.id, assigneeId: priya.id, title: 'Database schema for reporting data', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, startDate: D(-2), dueDate: D(+7), position: 3 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: sarah.id, assigneeId: null, title: 'Finance metrics dashboard (revenue, costs, burn rate)', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: D(+21), position: 4 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: sarah.id, assigneeId: null, title: 'HR headcount and attrition charts', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, dueDate: D(+21), position: 5 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: henry.id, assigneeId: null, title: 'OKR tracker integration', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: D(+35), position: 6 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: henry.id, assigneeId: null, title: 'Ops SLA and incident summary panel', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: D(+42), position: 7 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: sarah.id, assigneeId: null, title: 'Export to PDF and CSV reports', status: TaskStatus.TODO, priority: Priority.LOW, dueDate: D(+55), position: 8 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: sarah.id, assigneeId: null, title: 'Role-based access for internal dashboard', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: D(+30), position: 9 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: toolsProject.id, creatorId: henry.id, assigneeId: null, title: 'Slack integration for automated weekly digest', status: TaskStatus.BACKLOG, priority: Priority.LOW, position: 10 } });

  // ── Tasks — Legacy Migration (8 tasks: all DONE) ──────────────────────────
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'Audit and document legacy data model', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-180), dueDate: D(-160), position: 1 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Design data migration ETL pipeline', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-160), dueDate: D(-140), position: 2 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'Dry-run migration with anonymised data', status: TaskStatus.DONE, priority: Priority.CRITICAL, startDate: D(-140), dueDate: D(-120), position: 3 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Data validation and reconciliation scripts', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-120), dueDate: D(-100), position: 4 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'User data migration (customers)', status: TaskStatus.DONE, priority: Priority.CRITICAL, startDate: D(-100), dueDate: D(-80), position: 5 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Historical records archival', status: TaskStatus.DONE, priority: Priority.MEDIUM, startDate: D(-80), dueDate: D(-60), position: 6 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: tom.id, title: 'Smoke test in production environment', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-60), dueDate: D(-40), position: 7 } });
  await prisma.task.create({ data: { organizationId: org.id, projectId: legacyProject.id, creatorId: henry.id, assigneeId: maya.id, title: 'Decommission legacy servers', status: TaskStatus.DONE, priority: Priority.HIGH, startDate: D(-40), dueDate: D(-30), position: 8 } });

  // ── Task Dependencies ──────────────────────────────────────────────────────
  // Portal: Security review depends on E2E tests
  await prisma.taskDependency.create({ data: { taskId: pt13.id, dependsOnTaskId: pt14.id } });
  // Portal: Performance optimisation depends on accessibility audit
  await prisma.taskDependency.create({ data: { taskId: pt11.id, dependsOnTaskId: pt12.id } });
  // Mobile: camera module depends on home feed
  await prisma.taskDependency.create({ data: { taskId: mt8.id, dependsOnTaskId: mt6.id } });
  // Mobile: biometric auth depends on auth screens
  await prisma.taskDependency.create({ data: { taskId: mt11.id, dependsOnTaskId: mt2.id } });
  // API: performance benchmarking depends on query migration
  await prisma.taskDependency.create({ data: { taskId: at10.id, dependsOnTaskId: at4.id } });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('Organisation: Acme Corp (acme)\n');
  console.log('Login credentials:');
  console.log('  henry@acme.com     Admin123!  (Admin)');
  console.log('  admin@acme.com     Admin123!  (Admin — legacy)');
  console.log('  sarah@acme.com     Test123!   (Project Manager)');
  console.log('  alex@acme.com      Test123!   (Developer — has assigned tasks)');
  console.log('  maya@acme.com      Test123!   (Developer)');
  console.log('  tom@acme.com       Test123!   (Developer)');
  console.log('  priya@acme.com     Test123!   (Developer)\n');
  console.log('Projects seeded: 5');
  console.log('Tasks seeded: ~70 (with subtasks and dependencies)');
  console.log('Milestones seeded: 10 (3 upcoming within 14 days)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
