import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(params: {
    organizationId: string;
    userId: string;
    type: NotificationType;
    taskId?: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data: params });
  }

  async findAll(organizationId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        message: true,
        isRead: true,
        createdAt: true,
        taskId: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });
  }

  async getUnreadCount(organizationId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { organizationId, userId, isRead: false },
    });
    return { count };
  }

  async markRead(organizationId: string, userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, organizationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { organizationId, userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ── Cron: notify assignees of tasks due within the next 24 hours ──────────
  @Cron(CronExpression.EVERY_HOUR)
  async notifyDueSoon() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
        status: { notIn: ['DONE'] },
        assigneeId: { not: null },
        parentTaskId: null,
      },
      select: { id: true, title: true, organizationId: true, assigneeId: true },
    });

    if (tasks.length === 0) return;

    // Batch-fetch already-notified task IDs in one query instead of N per-task COUNT calls
    const taskIds = tasks.map((t) => t.id);
    const recentlySent = await this.prisma.notification.findMany({
      where: { taskId: { in: taskIds }, type: NotificationType.TASK_DUE_SOON, createdAt: { gte: since } },
      select: { taskId: true },
    });
    const notifiedIds = new Set(recentlySent.map((n) => n.taskId));

    const toNotify = tasks.filter((t) => t.assigneeId && !notifiedIds.has(t.id));
    if (toNotify.length === 0) return;

    // Batch-insert all notifications in a single query
    await this.prisma.notification.createMany({
      data: toNotify.map((task) => ({
        organizationId: task.organizationId,
        userId: task.assigneeId!,
        type: NotificationType.TASK_DUE_SOON,
        taskId: task.id,
        message: `"${task.title}" is due within 24 hours.`,
      })),
    });

    this.logger.log(`Due-soon notifications sent for ${toNotify.length} task(s).`);
  }
}
