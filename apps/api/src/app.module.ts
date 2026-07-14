import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { TradesModule } from './modules/trades/trades.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

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
    PortfoliosModule,
    TradesModule,
    AnalyticsModule,
    WorkspacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
