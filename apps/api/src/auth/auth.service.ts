import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour
const INVITE_EXPIRES_MS = 48 * 60 * 60 * 1000; // 48 hours

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress: string) {
    // Generic error — never reveal which field is wrong
    const invalidErr = new UnauthorizedException('Invalid email or password');

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), isActive: true },
      include: { organization: { select: { id: true, slug: true } } },
    });
    if (!user) throw invalidErr;

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw invalidErr;

    return this.issueTokens(user.id, user.organizationId, user.email, user.role, user.tokenVersion);
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(rawToken: string) {
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const sha = createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, organizationId: true, email: true, role: true, tokenVersion: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive');

    // Rotate atomically: delete old token and create new one in a single transaction
    return this.issueTokens(user.id, user.organizationId, user.email, user.role, user.tokenVersion, stored.id);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(rawToken: string) {
    if (!rawToken) return;
    const sha = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: sha } }).catch(() => null);
  }

  async logoutAll(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // ─── Forgot / Reset Password ─────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto, frontendUrl: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });
    // Always return 200 regardless — prevent email enumeration
    if (!user) return;

    const raw = randomBytes(32).toString('hex');
    const sha = createHash('sha256').update(raw).digest('hex');

    // Reuse invite_tokens table for password reset (same pattern)
    await this.prisma.inviteToken.create({
      data: {
        organizationId: user.organizationId,
        email: user.email,
        tokenHash: `reset:${sha}`,
        expiresAt: new Date(Date.now() + RESET_EXPIRES_MS),
      },
    });

    const resetUrl = `${frontendUrl}/reset-password?token=${raw}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const sha = createHash('sha256').update(dto.token).digest('hex');

    const record = await this.prisma.inviteToken.findFirst({
      where: { tokenHash: `reset:${sha}`, usedAt: null },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: record.email, organizationId: record.organizationId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Compute hash before acquiring the token claim — bcrypt is slow and must not hold a DB connection
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Atomically claim the token — concurrent resets get count=0 and are rejected gracefully
    const claimed = await this.prisma.inviteToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gte: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new BadRequestException('Reset link has already been used');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
  }

  // ─── Invite / Accept ──────────────────────────────────────────────────────────

  async createInvite(
    organizationId: string,
    email: string,
    role: string,
    inviterName: string,
    frontendUrl: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId, email: email.toLowerCase() } },
    });
    if (existing) throw new ConflictException('User already exists in this organization');

    const raw = randomBytes(32).toString('hex');
    const sha = createHash('sha256').update(raw).digest('hex');

    await this.prisma.inviteToken.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        tokenHash: sha,
        role: role as any,
        expiresAt: new Date(Date.now() + INVITE_EXPIRES_MS),
      },
    });

    const inviteUrl = `${frontendUrl}/accept-invite?token=${raw}`;
    await this.email.sendInvite(email, inviteUrl, inviterName);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const sha = createHash('sha256').update(dto.token).digest('hex');

    const record = await this.prisma.inviteToken.findFirst({
      where: { tokenHash: sha, usedAt: null },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invite link is invalid or has expired');
    }

    // Atomically claim the invite token before creating the user.
    // Concurrent requests both pass findFirst, but only one updateMany wins (count=1);
    // the loser gets count=0 and a graceful 400 instead of a Prisma P2002 crash.
    const claimed = await this.prisma.inviteToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gte: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new BadRequestException('Invite link has already been used');
    }

    const existing = await this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId: record.organizationId, email: record.email } },
    });
    if (existing) throw new ConflictException('Account already exists. Please log in.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        organizationId: record.organizationId,
        email: record.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: record.role,
        isActive: true,
      },
    });

    return this.issueTokens(user.id, user.organizationId, user.email, user.role, user.tokenVersion);
  }

  // ─── Token helpers ────────────────────────────────────────────────────────────

  private async issueTokens(
    userId: string,
    organizationId: string,
    email: string,
    role: string,
    tokenVersion: number,
    deleteTokenId?: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, role, organizationId, tokenVersion };
    const accessToken = this.jwt.sign(payload);

    const raw = randomBytes(32).toString('hex');
    const sha = createHash('sha256').update(raw).digest('hex');

    // Delete the old token and create the new one atomically so a mid-rotation
    // DB failure never leaves the user with no valid session.
    await this.prisma.$transaction(async (tx) => {
      if (deleteTokenId) {
        const deleted = await tx.refreshToken.deleteMany({ where: { id: deleteTokenId } });
        // count=0 means a concurrent refresh already rotated this token — reject the duplicate
        if (deleted.count === 0) throw new UnauthorizedException('Refresh token already rotated');
      }
      await tx.refreshToken.create({
        data: {
          userId,
          tokenHash: sha,
          expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
        },
      });
    });

    return { accessToken, refreshToken: raw };
  }
}
