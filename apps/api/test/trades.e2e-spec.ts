import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/common/database/prisma.service';
import { createTestApp } from './utils/create-test-app';

/**
 * Confirms cross-user ownership is actually enforced through the real HTTP
 * pipeline — a unit test on TradesService.assertOwnership only proves the
 * check exists, not that the controller/guard chain actually reaches it for
 * a real request from a different user's token.
 */
describe('Trade ownership (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userAEmail = `e2e-trades-a-${Date.now()}@example.com`;
  const userBEmail = `e2e-trades-b-${Date.now()}@example.com`;
  const password = 'SuperSecret123!';

  let tokenA: string;
  let tokenB: string;
  let tradeIdOwnedByA: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const registerA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: userAEmail, password })
      .expect(201);
    tokenA = registerA.body.accessToken;

    const registerB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: userBEmail, password })
      .expect(201);
    tokenB = registerB.body.accessToken;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 50000,
        quantity: 0.1,
        openedAt: new Date().toISOString(),
      })
      .expect(201);

    tradeIdOwnedByA = createResponse.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [userAEmail, userBEmail] } } });
    await app.close();
  });

  it('lets the owner read their own trade', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/trades/${tradeIdOwnedByA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it("blocks a different user from reading another user's trade", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/trades/${tradeIdOwnedByA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it("blocks a different user from deleting another user's trade", async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/trades/${tradeIdOwnedByA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it("does not include another user's trades in the list endpoint", async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/trades')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(response.body.items).toHaveLength(0);
    expect(response.body.total).toBe(0);
  });
});
