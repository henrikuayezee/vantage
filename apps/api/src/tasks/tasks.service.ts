import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { Role, TaskStatus, ProjectStatus } from '@vantage/types';
import { NotificationType } from '@prisma/client';

const TASK_SELECT = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  position: true,
  startDate: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
  organizationId: true,
  parentTaskId: true,
  milestoneId: true,
  assigneeId: true,
  creatorId: true,
  assignee: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
  },
  creator: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  milestone: { select: { id: true, title: true, dueDate: true, color: true } },
  project: { select: { key: true } },
  _count: { select: { subTasks: true, comments: true } },
} as const;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Access helpers ───────────────────────────────────────────────────────────

  private async assertProjectAccess(
    organizationId: string,
    projectId: string,
    userId: string,
    userRole: Role,
    taskAssigneeId?: string | null,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true, members: { select: { userId: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (
      userRole === Role.DEVELOPER &&
      !project.members.some((m) => m.userId === userId) &&
      userId !== taskAssigneeId
    ) {
      throw new ForbiddenException('Not a project member');
    }
  }

  // ─── Tasks CRUD ───────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    projectId: string,
    dto: CreateTaskDto,
    creatorId: string,
    userRole: Role,
  ) {
    await this.assertProjectAccess(organizationId, projectId, creatorId, userRole);

    // Default position to end of list
    const maxPos = await this.prisma.task.aggregate({
      where: { projectId, organizationId, parentTaskId: null },
      _max: { position: true },
    });
    const position = dto.position ?? (maxPos._max.position ?? 0) + 1000;

    // Sequential number per project (covers both tasks and subtasks)
    const maxNum = await this.prisma.task.aggregate({
      where: { projectId, organizationId },
      _max: { number: true },
    });
    const number = (maxNum._max.number ?? 0) + 1;

    const task = await this.prisma.task.create({
      data: {
        organizationId,
        projectId,
        number,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        parentTaskId: dto.parentTaskId,
        milestoneId: dto.milestoneId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        position,
        creatorId,
      },
      select: TASK_SELECT,
    });

    if (dto.assigneeId && dto.assigneeId !== creatorId) {
      this.notifications.create({
        organizationId,
        userId: dto.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        taskId: task.id,
        message: `You have been assigned "${task.title}".`,
      }).catch((err) => this.logger.error('Failed to create TASK_ASSIGNED notification', err));
    }

    return task;
  }

  async list(
    organizationId: string,
    projectId: string,
    userId: string,
    userRole: Role,
    filters: {
      status?: string;
      priority?: string;
      assigneeId?: string;
      milestoneId?: string;
      overdue?: boolean;
      parentTaskId?: string | null;
      search?: string;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    },
  ) {
    await this.assertProjectAccess(organizationId, projectId, userId, userRole);

    const where: Record<string, unknown> = {
      organizationId,
      projectId,
      parentTaskId: filters.parentTaskId !== undefined ? filters.parentTaskId : null,
    };

    if (filters.status) where['status'] = filters.status;
    if (filters.priority) where['priority'] = filters.priority;
    if (filters.assigneeId) where['assigneeId'] = filters.assigneeId;
    if (filters.milestoneId) where['milestoneId'] = filters.milestoneId;
    if (filters.overdue) {
      where['dueDate'] = { lt: new Date() };
      where['status'] = { not: 'DONE' };
    }
    if (filters.search) where['title'] = { contains: filters.search, mode: 'insensitive' };

    const ALLOWED_SORT = new Set(['position', 'createdAt', 'dueDate', 'priority', 'title', 'status', 'number']);
    const sortField = ALLOWED_SORT.has(filters.sortBy ?? '') ? filters.sortBy! : 'position';
    const sortDir = filters.sortDir ?? 'asc';

    return this.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: { [sortField]: sortDir },
    });
  }

  async getById(
    organizationId: string,
    taskId: string,
    userId: string,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: {
        ...TASK_SELECT,
        subTasks: { select: TASK_SELECT },
        dependencies: {
          select: {
            id: true,
            dependsOn: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, task.projectId, userId, userRole, task.assigneeId);
    return task;
  }

  async update(
    organizationId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
    userRole: Role,
  ) {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { projectId: true, assigneeId: true, title: true, status: true },
    });
    if (!existing) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, existing.projectId, userId, userRole, existing.assigneeId);

    if (userRole === Role.DEVELOPER) {
      const restrictedFields = ['title', 'description', 'priority', 'assigneeId', 'milestoneId', 'startDate', 'dueDate'] as const;
      const hasRestricted = restrictedFields.some((f) => dto[f] !== undefined);
      if (hasRestricted) {
        throw new ForbiddenException('Developers may only update task status');
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.milestoneId !== undefined && { milestoneId: dto.milestoneId }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.position !== undefined && { position: dto.position }),
      },
      select: TASK_SELECT,
    });

    const newAssignee = dto.assigneeId;
    if (
      newAssignee &&
      newAssignee !== existing.assigneeId &&
      newAssignee !== userId
    ) {
      this.notifications.create({
        organizationId,
        userId: newAssignee,
        type: NotificationType.TASK_ASSIGNED,
        taskId,
        message: `You have been assigned "${existing.title}".`,
      }).catch((err) => this.logger.error('Failed to create TASK_ASSIGNED notification', err));
    }

    // Auto-complete the project when every task is DONE
    if (dto.status === TaskStatus.DONE) {
      const [total, done] = await Promise.all([
        this.prisma.task.count({ where: { projectId: existing.projectId, organizationId } }),
        this.prisma.task.count({ where: { projectId: existing.projectId, organizationId, status: TaskStatus.DONE } }),
      ]);
      if (total > 0 && total === done) {
        await this.prisma.project.updateMany({
          where: { id: existing.projectId, organizationId, status: { not: ProjectStatus.ARCHIVED } },
          data: { status: ProjectStatus.COMPLETED },
        });
        this.logger.log(`Project ${existing.projectId} auto-completed — all ${total} tasks done`);
      }
    }

    // Revert completed project to active when a task is moved out of DONE
    if (
      dto.status !== undefined &&
      dto.status !== TaskStatus.DONE &&
      existing.status === TaskStatus.DONE
    ) {
      await this.prisma.project.updateMany({
        where: { id: existing.projectId, organizationId, status: ProjectStatus.COMPLETED },
        data: { status: ProjectStatus.ACTIVE },
      });
      this.logger.log(`Project ${existing.projectId} reverted to active — task moved out of DONE`);
    }

    return updated;
  }

  async delete(organizationId: string, taskId: string, userId: string, userRole: Role) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, task.projectId, userId, userRole);
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  async updateStatus(
    organizationId: string,
    taskId: string,
    status: TaskStatus,
    userId: string,
    userRole: Role,
  ) {
    return this.update(organizationId, taskId, { status }, userId, userRole);
  }

  async updatePosition(
    organizationId: string,
    taskId: string,
    position: number,
    userId: string,
    userRole: Role,
  ) {
    return this.update(organizationId, taskId, { position }, userId, userRole);
  }

  async getSubTasks(
    organizationId: string,
    taskId: string,
    userId: string,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, task.projectId, userId, userRole);

    return this.prisma.task.findMany({
      where: { parentTaskId: taskId, organizationId },
      select: TASK_SELECT,
      orderBy: { position: 'asc' },
    });
  }

  // ─── Dependencies ─────────────────────────────────────────────────────────────

  async addDependency(
    organizationId: string,
    taskId: string,
    dependsOnTaskId: string,
    userId: string,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, task.projectId, userId, userRole);

    return this.prisma.taskDependency.upsert({
      where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
      create: { taskId, dependsOnTaskId },
      update: {},
    });
  }

  async removeDependency(
    organizationId: string,
    taskId: string,
    dependsOnTaskId: string,
    userId: string,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(organizationId, task.projectId, userId, userRole);

    await this.prisma.taskDependency.delete({
      where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    });
  }

  // ─── Gantt ────────────────────────────────────────────────────────────────────

  async getGanttData(
    organizationId: string,
    projectId: string,
    userId: string,
    userRole: Role,
  ) {
    await this.assertProjectAccess(organizationId, projectId, userId, userRole);
    const [tasks, milestones] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          projectId,
          organizationId,
          parentTaskId: null,
          OR: [{ startDate: { not: null } }, { dueDate: { not: null } }],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          startDate: true,
          dueDate: true,
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          dependencies: { select: { dependsOnTaskId: true } },
        },
        orderBy: [
          { startDate: { sort: 'asc', nulls: 'last' } },
          { dueDate: { sort: 'asc', nulls: 'last' } },
        ],
      }),
      this.prisma.milestone.findMany({
        where: { projectId, organizationId },
        orderBy: { dueDate: 'asc' },
      }),
    ]);
    return { tasks, milestones };
  }

  // ─── Milestones ───────────────────────────────────────────────────────────────

  async listMilestones(
    organizationId: string,
    projectId: string,
    userId: string,
    userRole: Role,
  ) {
    await this.assertProjectAccess(organizationId, projectId, userId, userRole);
    const milestones = await this.prisma.milestone.findMany({
      where: { projectId, organizationId },
      orderBy: { dueDate: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });

    const milestoneIds = milestones.map((m) => m.id);
    const doneCounts = milestoneIds.length > 0
      ? await this.prisma.task.groupBy({
          by: ['milestoneId'],
          where: { milestoneId: { in: milestoneIds }, status: TaskStatus.DONE },
          _count: { id: true },
        })
      : [];

    const doneByMilestone: Record<string, number> = Object.fromEntries(
      doneCounts.map((r) => [r.milestoneId as string, r._count.id]),
    );

    return milestones.map((m) => ({
      ...m,
      totalTasks: m._count.tasks,
      doneTasks: doneByMilestone[m.id] ?? 0,
    }));
  }

  async updateMilestone(
    organizationId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
    userId: string,
    userRole: Role,
  ) {
    const ms = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, organizationId },
      select: { projectId: true },
    });
    if (!ms) throw new NotFoundException('Milestone not found');
    await this.assertProjectAccess(organizationId, ms.projectId, userId, userRole);
    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
  }

  async createMilestone(
    organizationId: string,
    projectId: string,
    dto: CreateMilestoneDto,
    userId: string,
    userRole: Role,
  ) {
    await this.assertProjectAccess(organizationId, projectId, userId, userRole);
    return this.prisma.milestone.create({
      data: {
        organizationId,
        projectId,
        title: dto.title,
        dueDate: new Date(dto.dueDate),
        color: dto.color,
      },
    });
  }

  async deleteMilestone(
    organizationId: string,
    milestoneId: string,
    userId: string,
    userRole: Role,
  ) {
    const ms = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, organizationId },
      select: { projectId: true },
    });
    if (!ms) throw new NotFoundException('Milestone not found');
    await this.assertProjectAccess(organizationId, ms.projectId, userId, userRole);
    await this.prisma.milestone.delete({ where: { id: milestoneId } });
  }
}
