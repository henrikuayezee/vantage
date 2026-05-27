import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, TaskStatus } from '@vantage/types';
import { NotificationType } from '@prisma/client';

const makeTask = (overrides: Record<string, any> = {}) => ({
  id: 'task1',
  title: 'Fix login bug',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1000,
  startDate: null,
  dueDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  projectId: 'p1',
  organizationId: 'org1',
  parentTaskId: null,
  milestoneId: null,
  assigneeId: null,
  creatorId: 'u1',
  assignee: null,
  creator: { id: 'u1', firstName: 'Admin', lastName: 'User', avatarUrl: null },
  milestone: null,
  _count: { subTasks: 0, comments: 0 },
  ...overrides,
});

const makeProject = (memberIds: string[] = ['u1']) => ({
  id: 'p1',
  members: memberIds.map((userId) => ({ userId })),
});

const makePrisma = () => ({
  project: { findFirst: jest.fn() },
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  milestone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  taskDependency: {
    upsert: jest.fn(),
    delete: jest.fn(),
  },
});

describe('TasksService', () => {
  let service: TasksService;
  let prisma: ReturnType<typeof makePrisma>;
  const mockNotifications = { create: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { title: 'Fix login bug', status: 'TODO' as any, priority: 'MEDIUM' as any };

    it('throws 404 when the project is not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.create('org1', 'p1', dto, 'u1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when DEVELOPER is not a project member', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject(['other-user']));
      await expect(
        service.create('org1', 'p1', dto, 'u1', Role.DEVELOPER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a task without sending notification when no assignee', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.aggregate.mockResolvedValue({ _max: { position: 1000 } });
      prisma.task.create.mockResolvedValue(makeTask());

      await service.create('org1', 'p1', dto, 'u1', Role.ADMIN);

      expect(prisma.task.create).toHaveBeenCalled();
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('fires TASK_ASSIGNED notification when assignee differs from creator', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.aggregate.mockResolvedValue({ _max: { position: null } });
      const task = makeTask({ assigneeId: 'u2' });
      prisma.task.create.mockResolvedValue(task);

      await service.create('org1', 'p1', { ...dto, assigneeId: 'u2' }, 'u1', Role.ADMIN);

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          type: NotificationType.TASK_ASSIGNED,
          taskId: task.id,
        }),
      );
    });

    it('does NOT fire notification when creator assigns to themselves', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.aggregate.mockResolvedValue({ _max: { position: 1000 } });
      prisma.task.create.mockResolvedValue(makeTask({ assigneeId: 'u1' }));

      await service.create('org1', 'p1', { ...dto, assigneeId: 'u1' }, 'u1', Role.ADMIN);

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('uses position + 1000 when no existing tasks', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.aggregate.mockResolvedValue({ _max: { position: null } });
      prisma.task.create.mockResolvedValue(makeTask({ position: 1000 }));

      await service.create('org1', 'p1', dto, 'u1', Role.ADMIN);

      const createCall = prisma.task.create.mock.calls[0][0];
      expect(createCall.data.position).toBe(1000);
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    const baseFilters = {};

    it('throws 403 when DEVELOPER is not a project member', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject(['other-user']));
      await expect(
        service.list('org1', 'p1', 'u1', Role.DEVELOPER, baseFilters),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns tasks with default filters applied', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.findMany.mockResolvedValue([makeTask()]);

      const results = await service.list('org1', 'p1', 'u1', Role.ADMIN, baseFilters);

      expect(results).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org1', projectId: 'p1', parentTaskId: null }),
        }),
      );
    });

    it('applies status filter when provided', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.findMany.mockResolvedValue([]);

      await service.list('org1', 'p1', 'u1', Role.ADMIN, { status: 'IN_PROGRESS' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'IN_PROGRESS' }),
        }),
      );
    });

    it('applies overdue filter when provided', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.findMany.mockResolvedValue([]);

      await service.list('org1', 'p1', 'u1', Role.ADMIN, { overdue: true });

      const call = prisma.task.findMany.mock.calls[0][0];
      expect(call.where.dueDate).toEqual({ lt: expect.any(Date) });
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('throws 404 when task is not found', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.getById('org1', 'task-missing', 'u1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when DEVELOPER is not a project member', async () => {
      prisma.task.findFirst.mockResolvedValue(makeTask({ subTasks: [], dependencies: [] }));
      prisma.project.findFirst.mockResolvedValue(makeProject(['other-user']));
      await expect(service.getById('org1', 'task1', 'u1', Role.DEVELOPER)).rejects.toThrow(ForbiddenException);
    });

    it('returns the task with subTasks and dependencies for ADMIN', async () => {
      prisma.task.findFirst.mockResolvedValue(makeTask({ subTasks: [], dependencies: [] }));
      prisma.project.findFirst.mockResolvedValue(makeProject());

      const result = await service.getById('org1', 'task1', 'u1', Role.ADMIN);
      expect(result.id).toBe('task1');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const dto = { title: 'Updated title' };

    it('throws 404 when task does not exist', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.update('org1', 'task-missing', dto, 'u1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('updates task fields for authorized user', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1', assigneeId: null, title: 'Old title' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.update.mockResolvedValue(makeTask({ title: 'Updated title' }));

      const result = await service.update('org1', 'task1', dto, 'u1', Role.ADMIN);
      expect(result.title).toBe('Updated title');
    });

    it('fires TASK_ASSIGNED notification when assignee changes and is not the updater', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1', assigneeId: 'u2', title: 'Task' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.update.mockResolvedValue(makeTask({ assigneeId: 'u3' }));

      await service.update('org1', 'task1', { assigneeId: 'u3' }, 'u1', Role.ADMIN);

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u3', type: NotificationType.TASK_ASSIGNED }),
      );
    });

    it('does NOT fire notification when updater assigns to themselves', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1', assigneeId: null, title: 'Task' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.update.mockResolvedValue(makeTask({ assigneeId: 'u1' }));

      await service.update('org1', 'task1', { assigneeId: 'u1' }, 'u1', Role.ADMIN);

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });

    it('does NOT fire notification when assignee is unchanged', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1', assigneeId: 'u2', title: 'Task' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.update.mockResolvedValue(makeTask({ assigneeId: 'u2' }));

      await service.update('org1', 'task1', { assigneeId: 'u2' }, 'u1', Role.ADMIN);

      expect(mockNotifications.create).not.toHaveBeenCalled();
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws 404 when task does not exist', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.delete('org1', 'task-missing', 'u1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('deletes the task when found and access is valid', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.delete.mockResolvedValue({});

      await service.delete('org1', 'task1', 'u1', Role.ADMIN);
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task1' } });
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('delegates to update() with the new status', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1', assigneeId: null, title: 'Task' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.update.mockResolvedValue(makeTask({ status: 'DONE' }));

      const result = await service.updateStatus('org1', 'task1', TaskStatus.DONE, 'u1', Role.ADMIN);
      expect(result.status).toBe('DONE');
    });
  });

  // ── addDependency ──────────────────────────────────────────────────────────

  describe('addDependency', () => {
    it('throws 404 when task is not found', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(
        service.addDependency('org1', 'task-missing', 'dep1', 'u1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts dependency for valid task', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.taskDependency.upsert.mockResolvedValue({});

      await service.addDependency('org1', 'task1', 'dep1', 'u1', Role.ADMIN);

      expect(prisma.taskDependency.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId_dependsOnTaskId: { taskId: 'task1', dependsOnTaskId: 'dep1' } },
        }),
      );
    });
  });

  // ── removeDependency ───────────────────────────────────────────────────────

  describe('removeDependency', () => {
    it('deletes dependency for valid task', async () => {
      prisma.task.findFirst.mockResolvedValue({ projectId: 'p1' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.taskDependency.delete.mockResolvedValue({});

      await service.removeDependency('org1', 'task1', 'dep1', 'u1', Role.ADMIN);

      expect(prisma.taskDependency.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId_dependsOnTaskId: { taskId: 'task1', dependsOnTaskId: 'dep1' } },
        }),
      );
    });
  });

  // ── milestones ─────────────────────────────────────────────────────────────

  describe('createMilestone', () => {
    it('throws 403 when DEVELOPER is not a project member', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject(['other-user']));
      await expect(
        service.createMilestone('org1', 'p1', { title: 'v1', dueDate: '2026-12-01' }, 'u1', Role.DEVELOPER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates milestone for authorized user', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      const milestone = { id: 'ms1', title: 'v1', dueDate: new Date('2026-12-01') };
      prisma.milestone.create.mockResolvedValue(milestone);

      const result = await service.createMilestone(
        'org1', 'p1', { title: 'v1', dueDate: '2026-12-01' }, 'u1', Role.ADMIN,
      );
      expect(result.id).toBe('ms1');
    });
  });

  describe('deleteMilestone', () => {
    it('throws 404 when milestone does not exist', async () => {
      prisma.milestone.findFirst.mockResolvedValue(null);
      await expect(
        service.deleteMilestone('org1', 'ms-missing', 'u1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes milestone when found', async () => {
      prisma.milestone.findFirst.mockResolvedValue({ id: 'ms1', projectId: 'p1' });
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.milestone.delete.mockResolvedValue({});

      await service.deleteMilestone('org1', 'ms1', 'u1', Role.ADMIN);
      expect(prisma.milestone.delete).toHaveBeenCalledWith({ where: { id: 'ms1' } });
    });
  });
});
