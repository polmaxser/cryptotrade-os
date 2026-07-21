import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { MarketDataModule } from '@/modules/market-data/market-data.module';

import { BacktestsController } from './backtests.controller';
import { BacktestsService } from './backtests.service';
import { BacktestRunRepository } from './repositories/backtest-run.repository';

@Module({
  imports: [DatabaseModule, BillingModule, MarketDataModule],

  controllers: [BacktestsController],

  providers: [BacktestsService, BacktestRunRepository],

  exports: [BacktestsService],
})
export class BacktestsModule {}
