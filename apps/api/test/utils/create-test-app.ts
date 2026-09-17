import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Response } from 'supertest';
import { AppModule } from '../../src/app.module';

/** Mirrors main.ts's bootstrap pipeline — e2e tests build the Nest app manually, so nothing here is applied automatically the way it is in production. */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/** supertest doesn't persist cookies like a browser — pull the refreshToken value out of a Set-Cookie header to replay on the next request. */
export function extractRefreshTokenCookie(response: Response): string {
  const rawCookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = rawCookies?.find((c) => c.startsWith('refreshToken='));

  if (!cookie) {
    throw new Error('No refreshToken cookie in response');
  }

  return cookie.split(';')[0]!;
}
