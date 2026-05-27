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

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
        status: { notIn: ['DONE'] },
        assigneeId: { not: null },
        parentTaskId: null,
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        assigneeId: true,
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      const alreadyNotified = await this.prisma.notification.count({
        where: {
          userId: task.assigneeId,
          taskId: task.id,
          type: NotificationType.TASK_DUE_SOON,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (alreadyNotified > 0) continue;

      await this.create({
        organizationId: task.organizationId,
        userId: task.assigneeId,
        type: NotificationType.TASK_DUE_SOON,
        taskId: task.id,
        message: `"${task.title}" is due within 24 hours.`,
      });
    }

    if (tasks.length > 0) {
      this.logger.log(`Due-soon notifications sent for ${tasks.length} task(s).`);
    }
  }
}
