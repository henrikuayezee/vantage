import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { Role, ProjectStatus } from '@vantage/types';

// ── Shared mock factories ─────────────────────────────────────────────────────

const makeMockPrisma = () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
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
  project: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  projectMembership: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  milestone: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  taskDependency: { upsert: jest.fn(), delete: jest.fn() },
  comment: { findMany: jest.fn(), create: jest.fn() },
  $transaction: jest.fn().mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') {
      const tx = {
        project: { create: jest.fn() },
        projectMembership: { create: jest.fn() },
        user: { create: jest.fn(), update: jest.fn() },
        inviteToken: { update: jest.fn() },
        refreshToken: { deleteMany: jest.fn() },
      };
      return arg(tx);
    }
    return Promise.all(arg);
  }),
});

const mockEmail = {
  sendInvite: jest.fn(),
  sendPasswordReset: jest.fn(),
};

// ── Test data ─────────────────────────────────────────────────────────────────

const TEST_ORG_ID = 'org_test_001';
const TEST_USER_ID = 'user_admin_001';
const TEST_PROJECT_ID = 'proj_test_001';

const testAdminPayload = {
  sub: TEST_USER_ID,
  email: 'admin@acme.com',
  role: Role.ADMIN,
  organizationId: TEST_ORG_ID,
  tokenVersion: 1,
};

// ── App bootstrap helper ──────────────────────────────────────────────────────

async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: ReturnType<typeof makeMockPrisma>;
  jwtService: JwtService;
}> {
  const prisma = makeMockPrisma();

  // Every protected request validates the JWT token version via user.findUnique
  prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, isActive: true });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(EmailService)
    .useValue(mockEmail)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const jwtService = moduleFixture.get<JwtService>(JwtService);

  return { app, prisma, jwtService };
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof makeMockPrisma>;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Password1!', 4);
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply default JWT validation mock after clearAllMocks
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, isActive: true });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('returns 401 for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@acme.com', password: 'Password1!' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid email or password');
        });
    });

    it('returns 401 for wrong password', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: TEST_USER_ID, organizationId: TEST_ORG_ID,
        email: 'admin@acme.com', role: 'ADMIN', tokenVersion: 1,
        passwordHash,
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@acme.com', password: 'WrongPassword!' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid email or password');
        });
    });

    it('returns access token and sets httpOnly cookie on valid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: TEST_USER_ID, organizationId: TEST_ORG_ID,
        email: 'admin@acme.com', role: 'ADMIN', tokenVersion: 1,
        passwordHash,
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@acme.com', password: 'Password1!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.headers['set-cookie']).toBeDefined();
      const cookies = res.headers['set-cookie'] as string[];
      expect(cookies.some((c: string) => c.startsWith('vantage_refresh='))).toBe(true);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns 204 even when user does not exist (prevents email enumeration)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@acme.com' })
        .expect(204);
    });

    it('returns 204 and sends reset email when user exists', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: TEST_USER_ID, organizationId: TEST_ORG_ID, email: 'admin@acme.com',
      });
      prisma.inviteToken.create.mockResolvedValue({});
      mockEmail.sendPasswordReset.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@acme.com' })
        .expect(204);

      expect(mockEmail.sendPasswordReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Protected route without token', () => {
    it('returns 401 when Authorization header is absent', async () => {
      await request(app.getHttpServer())
        .get('/api/projects')
        .expect(401);
    });

    it('returns 401 when token is malformed', async () => {
      await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });
});

describe('Projects endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof makeMockPrisma>;
  let adminToken: string;
  let pmToken: string;
  let devToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    const jwtService = (app as any).get(JwtService);

    adminToken = jwtService.sign(testAdminPayload);
    pmToken = jwtService.sign({
      ...testAdminPayload, role: Role.PROJECT_MANAGER, sub: 'user_pm_001',
    });
    devToken = jwtService.sign({
      ...testAdminPayload, role: Role.DEVELOPER, sub: 'user_dev_001',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, isActive: true });
  });

  const makeProjectResponse = (overrides: Record<string, any> = {}) => ({
    id: TEST_PROJECT_ID,
    name: 'Alpha Project',
    description: null,
    status: ProjectStatus.ACTIVE,
    startDate: null,
    endDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organizationId: TEST_ORG_ID,
    members: [],
    _count: { tasks: 0 },
    tasks: [],
    ...overrides,
  });

  describe('GET /api/projects', () => {
    it('returns 200 with project list for ADMIN', async () => {
      prisma.project.findMany.mockResolvedValue([makeProjectResponse()]);

      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('progress', 0);
    });

    it('filters by membership for DEVELOPER role', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, isActive: true });

      await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${devToken}`)
        .expect(200);

      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('members');
    });
  });

  describe('POST /api/projects', () => {
    it('returns 403 when DEVELOPER tries to create a project', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${devToken}`)
        .send({ name: 'New Project' })
        .expect(403);
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('creates a project for ADMIN and returns it', async () => {
      const project = makeProjectResponse({ name: 'New Project' });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          project: { create: jest.fn().mockResolvedValue(project) },
          projectMembership: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Project' })
        .expect(201);

      expect(res.body).toHaveProperty('id', TEST_PROJECT_ID);
      expect(res.body).toHaveProperty('name', 'New Project');
    });

    it('creates a project for PROJECT_MANAGER and returns it', async () => {
      const project = makeProjectResponse({ name: 'PM Project' });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          project: { create: jest.fn().mockResolvedValue(project) },
          projectMembership: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: 'PM Project' })
        .expect(201);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns 404 when project does not exist', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/projects/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns project with progress for ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue(
        makeProjectResponse({ _count: { tasks: 2 }, tasks: [{ id: 't1' }] }),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/projects/${TEST_PROJECT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', TEST_PROJECT_ID);
      expect(res.body).toHaveProperty('progress', 50);
    });
  });

  describe('PATCH /api/projects/:id/archive', () => {
    it('returns 403 when DEVELOPER tries to archive', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: TEST_PROJECT_ID });

      await request(app.getHttpServer())
        .patch(`/api/projects/${TEST_PROJECT_ID}/archive`)
        .set('Authorization', `Bearer ${devToken}`)
        .expect(403);
    });

    it('archives project for ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: TEST_PROJECT_ID });
      prisma.project.update.mockResolvedValue(makeProjectResponse({ status: ProjectStatus.ARCHIVED }));

      const res = await request(app.getHttpServer())
        .patch(`/api/projects/${TEST_PROJECT_ID}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe(ProjectStatus.ARCHIVED);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('returns 403 when PROJECT_MANAGER tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/api/projects/${TEST_PROJECT_ID}`)
        .set('Authorization', `Bearer ${pmToken}`)
        .expect(403);
    });

    it('returns 204 on successful deletion by ADMIN', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: TEST_PROJECT_ID });
      prisma.project.delete.mockResolvedValue({});

      await request(app.getHttpServer())
        .delete(`/api/projects/${TEST_PROJECT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});

describe('Project stats endpoint (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof makeMockPrisma>;
  let adminToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    const jwtService = (app as any).get(JwtService);
    adminToken = jwtService.sign(testAdminPayload);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 1, isActive: true });
  });

  it('GET /api/projects/:id/stats returns correct counts and progress', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: TEST_PROJECT_ID, members: [],
      _count: { tasks: 0 }, tasks: [],
    });
    prisma.task.findMany.mockResolvedValue([
      { status: 'DONE' }, { status: 'DONE' }, { status: 'TODO' },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/api/projects/${TEST_PROJECT_ID}/stats`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.progress).toBe(67);
    expect(res.body.counts.DONE).toBe(2);
    expect(res.body.counts.TODO).toBe(1);
  });
});
