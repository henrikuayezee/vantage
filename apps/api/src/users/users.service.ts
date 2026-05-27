import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@vantage/types';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  organizationId: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  // ─── Profile ──────────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};

    if (dto.firstName) data['firstName'] = dto.firstName;
    if (dto.lastName) data['lastName'] = dto.lastName;
    if (dto.avatarUrl !== undefined) data['avatarUrl'] = dto.avatarUrl;

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('currentPassword is required to set a new password');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!user) throw new NotFoundException('User not found');

      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');

      data['passwordHash'] = await bcrypt.hash(dto.newPassword, 12);
      data['tokenVersion'] = { increment: 1 };
    }

    return this.prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
  }

  // ─── Admin — User List ────────────────────────────────────────────────────────

  async listUsers(organizationId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { organizationId },
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  // ─── Admin — Invite ───────────────────────────────────────────────────────────

  async inviteUser(organizationId: string, dto: InviteUserDto, inviterName: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    await this.auth.createInvite(
      organizationId,
      dto.email,
      dto.role ?? Role.DEVELOPER,
      inviterName,
      frontendUrl,
    );
  }

  // ─── Admin — Update user ─────────────────────────────────────────────────────

  async updateUser(organizationId: string, targetUserId: string, dto: UpdateUserDto, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new ForbiddenException('Cannot modify your own role or status');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { organizationId: true },
    });
    if (!target || target.organizationId !== organizationId) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: dto,
      select: USER_SELECT,
    });
  }

  // ─── Admin — Delete user ──────────────────────────────────────────────────────

  async deleteUser(organizationId: string, targetUserId: string, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { organizationId: true },
    });
    if (!target || target.organizationId !== organizationId) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id: targetUserId } });
  }
}
