import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const makePrisma = () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  inviteToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') return arg(makePrisma());
    return Promise.all(arg);
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  const mockJwt = { sign: jest.fn() };
  const mockConfig = { get: jest.fn() };
  const mockEmail = { sendPasswordReset: jest.fn(), sendInvite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto = { email: 'user@acme.com', password: 'Password1!' };

    it('throws 401 when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login(dto, '127.0.0.1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when password is incorrect', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(dto, '127.0.0.1')).rejects.toThrow(UnauthorizedException);
    });

    it('always returns the generic error message (prevents field enumeration)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      let err: any;
      try { await service.login(dto, '127.0.0.1'); } catch (e) { err = e; }
      expect(err.message).toBe('Invalid email or password');
    });

    it('returns access and refresh tokens on valid credentials', async () => {
      const user = {
        id: 'u1', organizationId: 'org1', email: 'user@acme.com',
        role: 'ADMIN', tokenVersion: 1, passwordHash: 'hash',
      };
      prisma.user.findFirst.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('access-token');
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(dto, '127.0.0.1');

      expect(result.accessToken).toBe('access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws 401 when no token provided', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when stored token not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 and cleans up expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', expiresAt: new Date(Date.now() - 1000),
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    });

    it('rotates token and returns fresh tokens on valid refresh', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', organizationId: 'org1', email: 'user@acme.com',
        role: 'ADMIN', tokenVersion: 1, isActive: true,
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('raw-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    });

    it('throws 401 when associated user is inactive', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: false });
      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('is a no-op when no token is provided', async () => {
      await service.logout('');
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the hashed refresh token', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      await service.logout('raw-token');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(1);
    });
  });

  // ── logoutAll ──────────────────────────────────────────────────────────────

  describe('logoutAll', () => {
    it('increments tokenVersion and removes all refresh tokens for the user', async () => {
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({});

      await service.logoutAll('u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });
  });

  // ── forgotPassword ─────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    const dto = { email: 'user@acme.com' };

    it('returns silently when user does not exist (prevents email enumeration)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.forgotPassword(dto, 'http://localhost')).resolves.toBeUndefined();
      expect(mockEmail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('creates a reset token and sends email when user exists', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1', organizationId: 'org1', email: 'user@acme.com',
      });
      prisma.inviteToken.create.mockResolvedValue({});
      mockEmail.sendPasswordReset.mockResolvedValue(undefined);

      await service.forgotPassword(dto, 'http://localhost');

      expect(prisma.inviteToken.create).toHaveBeenCalled();
      const createCall = prisma.inviteToken.create.mock.calls[0][0];
      expect(createCall.data.tokenHash).toMatch(/^reset:/);
      expect(mockEmail.sendPasswordReset).toHaveBeenCalledWith(
        'user@acme.com',
        expect.stringContaining('reset-password?token='),
      );
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    const dto = { token: 'raw-reset-token', password: 'NewPass1!' };

    it('throws 400 when reset token is not found', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when reset token is expired', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'user@acme.com', organizationId: 'org1',
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 404 when user is not found after valid token', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'user@acme.com', organizationId: 'org1',
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword(dto)).rejects.toThrow(NotFoundException);
    });

    it('hashes new password with 12 rounds and runs transaction on valid token', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'user@acme.com', organizationId: 'org1',
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({});
      prisma.inviteToken.update.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({});
      prisma.$transaction.mockImplementation((ops: Promise<any>[]) => Promise.all(ops));

      await service.resetPassword(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
    });
  });

  // ── createInvite ───────────────────────────────────────────────────────────

  describe('createInvite', () => {
    it('throws 409 when user already exists in the organization', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.createInvite('org1', 'existing@acme.com', 'DEVELOPER', 'Admin', 'http://localhost'),
      ).rejects.toThrow(ConflictException);
    });

    it('creates invite token and sends email for a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.inviteToken.create.mockResolvedValue({});
      mockEmail.sendInvite.mockResolvedValue(undefined);

      await service.createInvite('org1', 'new@acme.com', 'DEVELOPER', 'Admin', 'http://localhost');

      expect(prisma.inviteToken.create).toHaveBeenCalled();
      expect(mockEmail.sendInvite).toHaveBeenCalledWith(
        'new@acme.com',
        expect.stringContaining('accept-invite?token='),
        'Admin',
      );
    });
  });

  // ── acceptInvite ───────────────────────────────────────────────────────────

  describe('acceptInvite', () => {
    const dto = { token: 'invite-token', password: 'Pass1!', firstName: 'Jane', lastName: 'Doe' };

    it('throws 400 when invite token is not found or already used', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue(null);
      await expect(service.acceptInvite(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when invite token is expired', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'jane@acme.com', organizationId: 'org1', role: 'DEVELOPER',
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.acceptInvite(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 409 when account already exists for the email', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'jane@acme.com', organizationId: 'org1', role: 'DEVELOPER',
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(service.acceptInvite(dto)).rejects.toThrow(ConflictException);
    });

    it('creates user account and returns tokens on a valid invite', async () => {
      prisma.inviteToken.findFirst.mockResolvedValue({
        id: 'inv1', email: 'jane@acme.com', organizationId: 'org1', role: 'DEVELOPER',
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const createdUser = {
        id: 'u2', organizationId: 'org1', email: 'jane@acme.com',
        role: 'DEVELOPER', tokenVersion: 0,
      };
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          inviteToken: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      mockJwt.sign.mockReturnValue('access-token');
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.acceptInvite(dto);

      expect(result.accessToken).toBe('access-token');
      expect(typeof result.refreshToken).toBe('string');
    });
  });
});
