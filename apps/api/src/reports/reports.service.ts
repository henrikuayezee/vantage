import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(orgId: string) {
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

    const [tasksByStatus, tasksByPriority, recentDone] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { organizationId: orgId, parentTaskId: null },
        _count: { id: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { organizationId: orgId, parentTaskId: null },
        _count: { id: true },
      }),
      this.prisma.task.findMany({
        where: { organizationId: orgId, status: 'DONE', updatedAt: { gte: eightWeeksAgo } },
        select: { updatedAt: true },
      }),
    ]);

    // Build 8 weekly buckets (7-day windows, oldest first)
    const buckets: Array<{ week: string; completed: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const bucketEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const bucketStart = new Date(bucketEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const completed = recentDone.filter(
        (t) => t.updatedAt >= bucketStart && t.updatedAt < bucketEnd,
      ).length;
      buckets.push({ week: label, completed });
    }

    return {
      tasksByStatus: tasksByStatus.map((r) => ({ status: r.status, count: r._count.id })),
      tasksByPriority: tasksByPriority.map((r) => ({ priority: r.priority, count: r._count.id })),
      completionTrend: buckets,
    };
  }

  async getTeam(orgId: string) {
    const [users, completedCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId: orgId, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          _count: {
            select: {
              assignedTasks: {
                where: { organizationId: orgId, parentTaskId: null, status: { not: 'DONE' } },
              },
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.task.groupBy({
        by: ['assigneeId'],
        where: {
          organizationId: orgId,
          assigneeId: { not: null },
          status: 'DONE',
          parentTaskId: null,
        },
        _count: { id: true },
      }),
    ]);

    const completedByUser: Record<string, number> = Object.fromEntries(
      completedCounts.map((r) => [r.assigneeId as string, r._count.id]),
    );

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      avatarUrl: u.avatarUrl,
      role: u.role,
      open: u._count.assignedTasks,
      completed: completedByUser[u.id] ?? 0,
    }));
  }

  async getProjects(orgId: string) {
    const now = new Date();
    const projects = await this.prisma.project.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { tasks: { where: { parentTaskId: null } } } },
        tasks: {
          where: { parentTaskId: null },
          select: { status: true, dueDate: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => {
      const total = p._count.tasks;
      const done = p.tasks.filter((t) => t.status === 'DONE').length;
      const overdue = p.tasks.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== 'DONE',
      ).length;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        overdue,
      };
    });
  }
}
