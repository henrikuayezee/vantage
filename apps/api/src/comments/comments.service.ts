import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { Role } from '@vantage/types';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async list(organizationId: string, taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId, organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async create(
    organizationId: string,
    taskId: string,
    body: string,
    authorId: string,
    userRole: Role,
    mentionedUserIds?: string[],
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { id: true, title: true, projectId: true, assigneeId: true, project: { select: { members: { select: { userId: true } } } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (
      userRole === Role.DEVELOPER &&
      !task.project.members.some((m) => m.userId === authorId) &&
      task.assigneeId !== authorId
    ) {
      throw new ForbiddenException('Not a project member');
    }

    // Strip HTML tags including unclosed/malformed ones (e.g. `<img onerror=... ` with no closing `>`)
    const sanitized = body.replace(/<[^>]*>?/g, '').trim();
    if (!sanitized) throw new BadRequestException('Comment cannot be empty');

    const comment = await this.prisma.comment.create({
      data: { organizationId, taskId, body: sanitized, authorId },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Notify assignee (if not the commenter)
    if (task.assigneeId && task.assigneeId !== authorId) {
      this.notifications.create({
        organizationId,
        userId: task.assigneeId,
        type: NotificationType.TASK_COMMENTED,
        taskId,
        message: `New comment on "${task.title}".`,
      }).catch((err) => this.logger.error('Failed to create TASK_COMMENTED notification', err));
    }

    // Notify mentioned users
    for (const mentionedId of new Set(mentionedUserIds ?? [])) {
      if (mentionedId === authorId || mentionedId === task.assigneeId) continue;
      this.notifications.create({
        organizationId,
        userId: mentionedId,
        type: NotificationType.TASK_MENTIONED,
        taskId,
        message: `You were mentioned in a comment on "${task.title}".`,
      }).catch((err) => this.logger.error('Failed to create TASK_MENTIONED notification', err));
    }

    return comment;
  }
}
