import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/email/email.service';

const mockPrisma = { $connect: jest.fn(), $disconnect: jest.fn() };
const mockEmail = { sendInvite: jest.fn(), sendPasswordReset: jest.fn() };

describe('App health check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(EmailService)
      .useValue(mockEmail)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api returns 401 (global JwtAuthGuard is active)', async () => {
    await request(app.getHttpServer()).get('/api').expect(401);
  });
});
