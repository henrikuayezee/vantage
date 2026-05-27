import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
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

    const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
    // We store the hash — need to find by comparing. Since we can't query by hash,
    // we embed the userId in the cookie as well.
    // Instead: find all tokens for userId, compare each. We embed userId in a separate cookie.
    // Simpler approach: store a lookup identifier (first 16 bytes) alongside the hash.
    // Architecture decision: store sha256 of token as tokenHash (cheaper than bcrypt for lookup).
    // We use SHA-256 for refresh token storage (fast lookup), bcrypt only for passwords.
    const { createHash } = await import('crypto');
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

    // Rotate — delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(user.id, user.organizationId, user.email, user.role, user.tokenVersion);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(rawToken: string) {
    if (!rawToken) return;
    const { createHash } = await import('crypto');
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
    const { createHash } = await import('crypto');
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
    const { createHash } = await import('crypto');
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

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.inviteToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
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
    const { createHash } = await import('crypto');
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
    const { createHash } = await import('crypto');
    const sha = createHash('sha256').update(dto.token).digest('hex');

    const record = await this.prisma.inviteToken.findFirst({
      where: { tokenHash: sha, usedAt: null },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invite link is invalid or has expired');
    }

    const existing = await this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId: record.organizationId, email: record.email } },
    });
    if (existing) throw new ConflictException('Account already exists. Please log in.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
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
      await tx.inviteToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      return created;
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
  ) {
    const payload: JwtPayload = { sub: userId, email, role, organizationId, tokenVersion };
    const accessToken = this.jwt.sign(payload);

    const raw = randomBytes(32).toString('hex');
    const { createHash } = await import('crypto');
    const sha = createHash('sha256').update(raw).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    return { accessToken, refreshToken: raw };
  }
}
