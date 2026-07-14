import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { TradesModule } from './modules/trades/trades.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    TradesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
