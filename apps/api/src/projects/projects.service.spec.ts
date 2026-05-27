import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ProjectStatus } from '@vantage/types';

const makeProject = (overrides: Record<string, any> = {}) => ({
  id: 'p1',
  name: 'Alpha',
  description: null,
  status: ProjectStatus.ACTIVE,
  startDate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationId: 'org1',
  members: [{ id: 'm1', role: 'PROJECT_MANAGER', userId: 'u1', createdAt: new Date(), user: {} }],
  _count: { tasks: 4 },
  tasks: [{ id: 't1' }, { id: 't2' }], // 2 done → 50% progress
  ...overrides,
});

const makePrisma = () => ({
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  projectMembership: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(async (fn: any) => {
    if (typeof fn === 'function') {
      const tx = {
        project: { create: jest.fn() },
        projectMembership: { create: jest.fn() },
      };
      return fn(tx);
    }
    return Promise.all(fn);
  }),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a project and adds the creator as PROJECT_MANAGER in a transaction', async () => {
      const project = makeProject();
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          project: { create: jest.fn().mockResolvedValue(project) },
          projectMembership: { create: jest.fn().mockResolvedValue({}) },
        };
        const result = await fn(tx);
        expect(tx.projectMembership.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ userId: 'u1', role: Role.PROJECT_MANAGER }),
        });
        return result;
      });

      const dto = { name: 'Alpha' };
      const result = await service.create('org1', dto as any, 'u1');
      expect(result.id).toBe('p1');
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all org projects for ADMIN (no membership filter)', async () => {
      prisma.project.findMany.mockResolvedValue([makeProject()]);
      await service.list('org1', 'u1', Role.ADMIN);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org1' } }),
      );
    });

    it('filters by membership for DEVELOPER', async () => {
      prisma.project.findMany.mockResolvedValue([makeProject()]);
      await service.list('org1', 'u1', Role.DEVELOPER);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ members: { some: { userId: 'u1' } } }),
        }),
      );
    });

    it('computes progress from task counts', async () => {
      prisma.project.findMany.mockResolvedValue([makeProject({ _count: { tasks: 4 }, tasks: [{ id: 't1' }, { id: 't2' }] })]);
      const results = await service.list('org1', 'u1', Role.ADMIN);
      expect(results[0].progress).toBe(50);
    });

    it('returns 0% progress when there are no tasks', async () => {
      prisma.project.findMany.mockResolvedValue([makeProject({ _count: { tasks: 0 }, tasks: [] })]);
      const results = await service.list('org1', 'u1', Role.ADMIN);
      expect(results[0].progress).toBe(0);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('throws 404 when project is not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.getById('org1', 'p-missing', 'u1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when DEVELOPER is not a project member', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject({ members: [] }));
      await expect(service.getById('org1', 'p1', 'u1', Role.DEVELOPER)).rejects.toThrow(ForbiddenException);
    });

    it('returns project with progress for ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      const result = await service.getById('org1', 'p1', 'u1', Role.ADMIN);
      expect(result.id).toBe('p1');
      expect(result.progress).toBe(50);
    });

    it('returns project for DEVELOPER who is a member', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject({ members: [{ userId: 'u1' }] }));
      const result = await service.getById('org1', 'p1', 'u1', Role.DEVELOPER);
      expect(result.id).toBe('p1');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws 404 when project does not exist', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(
        service.update('org1', 'p-missing', { name: 'New' }, 'u1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when DEVELOPER tries to update', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      await expect(
        service.update('org1', 'p1', { name: 'New' }, 'u1', Role.DEVELOPER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates project fields for ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.project.update.mockResolvedValue(makeProject({ name: 'Updated' }));
      const result = await service.update('org1', 'p1', { name: 'Updated' }, 'u1', Role.ADMIN);
      expect(prisma.project.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });
  });

  // ── archive ────────────────────────────────────────────────────────────────

  describe('archive', () => {
    it('throws 403 when DEVELOPER tries to archive', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      await expect(service.archive('org1', 'p1', 'u1', Role.DEVELOPER)).rejects.toThrow(ForbiddenException);
    });

    it('sets project status to ARCHIVED for PROJECT_MANAGER', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.project.update.mockResolvedValue(makeProject({ status: ProjectStatus.ARCHIVED }));
      await service.archive('org1', 'p1', 'u1', Role.PROJECT_MANAGER);
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ProjectStatus.ARCHIVED } }),
      );
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws 404 when project is not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.delete('org1', 'p-missing')).rejects.toThrow(NotFoundException);
    });

    it('deletes the project when found', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.project.delete.mockResolvedValue({});
      await service.delete('org1', 'p1');
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  // ── addMember ──────────────────────────────────────────────────────────────

  describe('addMember', () => {
    const dto = { userId: 'u2' };

    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    });

    it('throws 404 when target user is not in the organization', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.addMember('org1', 'p1', dto as any, 'u1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts membership for a valid user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u2' });
      prisma.projectMembership.upsert.mockResolvedValue({ projectId: 'p1', userId: 'u2' });
      await service.addMember('org1', 'p1', dto as any, 'u1', Role.ADMIN);
      expect(prisma.projectMembership.upsert).toHaveBeenCalled();
    });

    it('throws 403 when DEVELOPER tries to add a member', async () => {
      await expect(
        service.addMember('org1', 'p1', dto as any, 'u1', Role.DEVELOPER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeMember ───────────────────────────────────────────────────────────

  describe('removeMember', () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    });

    it('throws 404 when membership does not exist', async () => {
      prisma.projectMembership.findUnique.mockResolvedValue(null);
      await expect(
        service.removeMember('org1', 'p1', 'u2', 'u1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes membership when it exists', async () => {
      prisma.projectMembership.findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u2' });
      prisma.projectMembership.delete.mockResolvedValue({});
      await service.removeMember('org1', 'p1', 'u2', 'u1', Role.ADMIN);
      expect(prisma.projectMembership.delete).toHaveBeenCalled();
    });
  });

  // ── getStats ───────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct task counts and progress', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.findMany.mockResolvedValue([
        { status: 'DONE' },
        { status: 'DONE' },
        { status: 'IN_PROGRESS' },
        { status: 'TODO' },
      ]);

      const stats = await service.getStats('org1', 'p1', 'u1', Role.ADMIN);

      expect(stats.total).toBe(4);
      expect(stats.progress).toBe(50);
      expect(stats.counts['DONE']).toBe(2);
      expect(stats.counts['IN_PROGRESS']).toBe(1);
      expect(stats.counts['TODO']).toBe(1);
    });

    it('returns 0% progress when project has no tasks', async () => {
      prisma.project.findFirst.mockResolvedValue(makeProject());
      prisma.task.findMany.mockResolvedValue([]);
      const stats = await service.getStats('org1', 'p1', 'u1', Role.ADMIN);
      expect(stats.total).toBe(0);
      expect(stats.progress).toBe(0);
    });
  });
});
