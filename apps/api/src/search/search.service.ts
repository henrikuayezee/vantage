import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vantage/types';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(organizationId: string, q: string, userId: string, userRole: Role) {
    const term = q.trim();
    if (!term) return { projects: [], tasks: [] };

    const memberFilter =
      userRole === Role.DEVELOPER
        ? { members: { some: { userId } } }
        : {};

    const [projects, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          organizationId,
          ...memberFilter,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, status: true, description: true },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          organizationId,
          parentTaskId: null,
          project: memberFilter,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          project: { select: { id: true, name: true } },
        },
        take: 10,
      }),
    ]);

    return { projects, tasks };
  }
}
