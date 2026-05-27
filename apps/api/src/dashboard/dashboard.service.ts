import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TASK_MINI = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  parentTaskId: true,
  project: { select: { id: true, name: true } },
  parentTask: { select: { id: true, title: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
} as const;

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDeveloperData(userId: string, orgId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [assignedTasks, completedThisWeek] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          organizationId: orgId,
          assigneeId: userId,
          status: { not: 'DONE' },
        },
        select: TASK_MINI,
        orderBy: [{ parentTaskId: { sort: 'asc', nulls: 'first' } }, { dueDate: { sort: 'asc', nulls: 'last' } }],
        take: 50,
      }),
      this.prisma.task.count({
        where: {
          organizationId: orgId,
          assigneeId: userId,
          status: 'DONE',
          updatedAt: { gte: weekAgo },
        },
      }),
    ]);

    return {
      assignedTasks,
      overdueCount: assignedTasks.filter((t) => t.dueDate && t.dueDate < now).length,
      dueThisWeekCount: assignedTasks.filter(
        (t) => t.dueDate && t.dueDate >= now && t.dueDate <= in7Days,
      ).length,
      completedThisWeek,
    };
  }

  async getPmData(orgId: string) {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [projects, upcomingMilestones, unassignedCount, totalTasks, doneTasks] =
      await Promise.all([
        this.prisma.project.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            name: true,
            status: true,
            endDate: true,
            updatedAt: true,
            members: { select: { userId: true } },
            _count: { select: { tasks: { where: { parentTaskId: null } } } },
            tasks: {
              where: { status: 'DONE', parentTaskId: null },
              select: { id: true },
            },
            milestones: { select: { id: true, dueDate: true }, orderBy: { dueDate: 'asc' } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.milestone.findMany({
          where: {
            organizationId: orgId,
            dueDate: { gte: now, lte: in14Days },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            color: true,
            project: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
        this.prisma.task.count({
          where: {
            organizationId: orgId,
            assigneeId: null,
            status: { not: 'DONE' },
            parentTaskId: null,
          },
        }),
        this.prisma.task.count({
          where: { organizationId: orgId, parentTaskId: null },
        }),
        this.prisma.task.count({
          where: { organizationId: orgId, status: 'DONE' },
        }),
      ]);

    const projectsWithMeta = projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      endDate: p.endDate,
      updatedAt: p.updatedAt,
      memberCount: p.members.length,
      taskCount: p._count.tasks,
      progress:
        p._count.tasks > 0 ? Math.round((p.tasks.length / p._count.tasks) * 100) : 0,
      atRisk: p.milestones.some((m) => m.dueDate < now) || (p.endDate && p.endDate < now && p.status === 'ACTIVE'),
    }));

    return {
      projects: projectsWithMeta,
      upcomingMilestones,
      unassignedCount,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      atRiskCount: projectsWithMeta.filter((p) => p.atRisk).length,
    };
  }

  async getAdminData(orgId: string) {
    const now = new Date();

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      overdueTasks,
      doneTasks,
      totalUsers,
      activeUsers,
      recentProjects,
    ] = await Promise.all([
      this.prisma.project.count({ where: { organizationId: orgId } }),
      this.prisma.project.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      this.prisma.task.count({ where: { organizationId: orgId, parentTaskId: null } }),
      this.prisma.task.count({
        where: {
          organizationId: orgId,
          parentTaskId: null,
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      this.prisma.task.count({
        where: { organizationId: orgId, status: 'DONE' },
      }),
      this.prisma.user.count({ where: { organizationId: orgId } }),
      this.prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.project.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          _count: { select: { tasks: { where: { parentTaskId: null } } } },
          tasks: { where: { status: 'DONE', parentTaskId: null }, select: { id: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        overdueTasks,
        totalUsers,
        activeUsers,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      recentProjects: recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        updatedAt: p.updatedAt,
        taskCount: p._count.tasks,
        progress:
          p._count.tasks > 0 ? Math.round((p.tasks.length / p._count.tasks) * 100) : 0,
      })),
    };
  }
}
