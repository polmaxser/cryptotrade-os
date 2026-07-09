import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('BOOTSTRAP START');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('API_PORT', 4000);
  const host = configService.get<string>('API_HOST', '0.0.0.0');

  app.setGlobalPrefix('api/v1');

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