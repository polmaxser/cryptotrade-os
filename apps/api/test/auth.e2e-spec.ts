import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/database/prisma.service';
import { createTestApp, extractRefreshTokenCookie } from './utils/create-test-app';

/**
 * Exercises the full HTTP pipeline (guards, ValidationPipe, cookies, rate
 * limiting) end-to-end against a real Postgres + Redis — the layer unit
 * tests can't reach, since those construct services directly with mocked
 * dependencies rather than booting the whole app.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `e2e-auth-${Date.now()}@example.com`;
  const password = 'SuperSecret123!';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('rejects registration with a malformed body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('rejects registration with an unexpected extra field (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, isAdmin: true })
      .expect(400);
  });

  let accessToken: string;
  let refreshCookie: string;

  it('registers a new user and sets a refresh token cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'E2E Test' })
      .expect(201);

    expect(response.body.user.email).toBe(email);
    expect(typeof response.body.accessToken).toBe('string');

    accessToken = response.body.accessToken;
    refreshCookie = extractRefreshTokenCookie(response);
  });

  it('accepts the access token on a protected route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe(email);
  });

  it('rejects a garbage access token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('rotates the refresh token and rejects the old one on reuse (session-family revocation)', async () => {
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(201);

    const rotatedCookie = extractRefreshTokenCookie(refreshResponse);
    expect(rotatedCookie).not.toBe(refreshCookie);

    // Replaying the now-revoked original token should fail...
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    // ...and reuse detection should have revoked the whole session family,
    // so even the token that replaced it no longer works.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
  });

  it('logs in, then logout invalidates the refresh token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    const cookie = extractRefreshTokenCookie(loginResponse);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .expect(401);
  });

  it('throttles repeated login attempts', async () => {
    const attempts = Array.from({ length: 6 }, () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'definitely-wrong-password' }),
    );

    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r.status);

    expect(statuses).toContain(429);
  });
});
