import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { BacktestsController } from './backtests.controller';
import { BacktestsService } from './backtests.service';
import { BinanceKlinesService } from './binance-klines.service';
import { BacktestRunRepository } from './repositories/backtest-run.repository';

@Module({
  imports: [DatabaseModule, BillingModule],

  controllers: [BacktestsController],

  providers: [BacktestsService, BinanceKlinesService, BacktestRunRepository],

  exports: [BacktestsService],
})
export class BacktestsModule {}
