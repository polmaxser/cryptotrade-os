import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './common/database/database.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { HealthModule } from './modules/health/health.module';
import { TradesModule } from './modules/trades/trades.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { BillingModule } from './modules/billing/billing.module';
import { JournalModule } from './modules/journal/journal.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotesModule } from './modules/notes/notes.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ExchangesModule } from './modules/exchanges/exchanges.module';
import { DeFiPositionsModule } from './modules/defi-positions/defi-positions.module';
import { NftHoldingsModule } from './modules/nft-holdings/nft-holdings.module';
import { AiCoachModule } from './modules/ai-coach/ai-coach.module';
import { AiReportsModule } from './modules/ai-reports/ai-reports.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    ScheduleModule.forRoot(),

    DatabaseModule,
    CryptoModule,
    HealthModule,
    UsersModule,
    AuthModule,
    PortfoliosModule,
    TradesModule,
    AnalyticsModule,
    WorkspacesModule,
    BillingModule,
    JournalModule,
    WatchlistModule,
    AlertsModule,
    NotesModule,
    CalendarModule,
    ExchangesModule,
    DeFiPositionsModule,
    NftHoldingsModule,
    AiCoachModule,
    AiReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
