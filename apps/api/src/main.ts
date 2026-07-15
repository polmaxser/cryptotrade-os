import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('BOOTSTRAP START');

  // rawBody: true keeps the unparsed request body available (req.rawBody)
  // alongside the normal parsed JSON — the Stripe webhook handler needs the
  // raw bytes to verify the signature, since HMAC breaks on re-serialized JSON.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);

  const port = configService.get<number>('API_PORT', 4000);
  const host = configService.get<string>('API_HOST', '0.0.0.0');
  const corsOrigin = configService.get<string>('api.corsOrigin', 'http://localhost:3000');

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port, host);

  console.log(`LISTENING ON ${host}:${port}`);

  process.on('exit', (code) => {
    console.log('PROCESS EXIT', code);
  });

  process.on('beforeExit', (code) => {
    console.log('BEFORE EXIT', code);
  });
}

bootstrap().catch(console.error);
