import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Role, ProjectStatus } from '@vantage/types';

const PROJECT_SELECT = {
  id: true,
  key: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  members: {
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  },
  _count: { select: { tasks: { where: { parentTaskId: null } } } },
  tasks: { where: { status: 'DONE', parentTaskId: null }, select: { id: true } },
} as const;

function deriveKey(name: string): string {
  const letterWords = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);

  if (letterWords.length === 0) return 'PROJ';
  if (letterWords.length === 1) return letterWords[0].slice(0, 4).toUpperCase();

  const initials = letterWords.map((w) => w[0]).join('').slice(0, 5);
  return (initials.length >= 2 ? initials : letterWords[0].slice(0, 4)).toUpperCase();
}

async function resolveUniqueKey(
  tx: { project: { findFirst: (a: any) => Promise<any> } },
  organizationId: string,
  base: string,
): Promise<string> {
  for (let i = 0; i <= 99; i++) {
    const candidate = i === 0 ? base : base.slice(0, 4) + i;
    const existing = await tx.project.findFirst({ where: { organizationId, key: candidate } });
    if (!existing) return candidate;
  }
  return base + Date.now().toString().slice(-3);
}

function withProgress<T extends { _count: { tasks: number }; tasks: { id: string }[] }>(p: T) {
  const { _count, tasks: doneTasks, ...rest } = p;
  return {
    ...rest,
    progress: _count.tasks > 0 ? Math.round((doneTasks.length / _count.tasks) * 100) : 0,
  };
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(organizationId: string, dto: CreateProjectDto, creatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const baseKey = dto.key ?? deriveKey(dto.name);
      const key = await resolveUniqueKey(tx as any, organizationId, baseKey);

      const project = await tx.project.create({
        data: {
          organizationId,
          key,
          name: dto.name,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
        select: PROJECT_SELECT,
      });

      await tx.projectMembership.create({
        data: { projectId: project.id, userId: creatorId, role: Role.PROJECT_MANAGER },
      });

      return project;
    });
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  async list(organizationId: string, userId: string, userRole: Role) {
    const where =
      userRole === Role.DEVELOPER
        ? { organizationId, members: { some: { userId } } }
        : { organizationId };

    const projects = await this.prisma.project.findMany({
      where,
      select: PROJECT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return projects.map(withProgress);
  }

  // ─── Get by ID ────────────────────────────────────────────────────────────────

  async getById(organizationId: string, projectId: string, userId: string, userRole: Role) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: PROJECT_SELECT,
    });
    if (!project) throw new NotFoundException('Project not found');

    if (userRole === Role.DEVELOPER && !project.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('Not a project member');
    }

    return withProgress(project);
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
    userId: string,
    userRole: Role,
  ) {
    await this.assertAccess(organizationId, projectId, userId, userRole);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.status && { status: dto.status }),
      },
      select: PROJECT_SELECT,
    });
  }

  // ─── Archive ──────────────────────────────────────────────────────────────────

  async archive(organizationId: string, projectId: string, userId: string, userRole: Role) {
    await this.assertAccess(organizationId, projectId, userId, userRole, [
      Role.ADMIN,
      Role.PROJECT_MANAGER,
    ]);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ARCHIVED },
      select: PROJECT_SELECT,
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  async delete(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id: projectId } });
  }

  // ─── Members ──────────────────────────────────────────────────────────────────

  async addMember(
    organizationId: string,
    projectId: string,
    dto: AddMemberDto,
    requesterId: string,
    requesterRole: Role,
  ) {
    await this.assertAccess(organizationId, projectId, requesterId, requesterRole, [
      Role.ADMIN,
      Role.PROJECT_MANAGER,
    ]);

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, organizationId },
    });
    if (!user) throw new NotFoundException('User not found in organization');

    return this.prisma.projectMembership.upsert({
      where: { projectId_userId: { projectId, userId: dto.userId } },
      create: { projectId, userId: dto.userId, role: dto.role ?? Role.DEVELOPER },
      update: { role: dto.role ?? Role.DEVELOPER },
    });
  }

  async removeMember(
    organizationId: string,
    projectId: string,
    targetUserId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    await this.assertAccess(organizationId, projectId, requesterId, requesterRole, [
      Role.ADMIN,
      Role.PROJECT_MANAGER,
    ]);

    const membership = await this.prisma.projectMembership.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    await this.prisma.projectMembership.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
  }

  // ─── Stats ────────────────────────────────────────────────────────────────────

  async getStats(organizationId: string, projectId: string, userId: string, userRole: Role) {
    await this.getById(organizationId, projectId, userId, userRole);

    const tasks = await this.prisma.task.findMany({
      where: { projectId, organizationId },
      select: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }

    const total = tasks.length;
    const done = counts['DONE'] ?? 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, progress, counts };
  }

  // ─── Internal ─────────────────────────────────────────────────────────────────

  private async assertAccess(
    organizationId: string,
    projectId: string,
    userId: string,
    userRole: Role,
    allowedRoles: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.DEVELOPER],
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (userRole === Role.DEVELOPER) {
      const isMember = await this.prisma.projectMembership.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!isMember) throw new ForbiddenException('Not a project member');
    }
  }
}
