import { Module } from '@nestjs/common';

import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';

import { DatabaseModule } from '@/common/database/database.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';

import { TradeRepository } from './repositories/trade.repository';

@Module({
  imports: [DatabaseModule, PortfoliosModule],

  controllers: [TradesController],

  providers: [TradesService, TradeRepository],

  exports: [TradesService, TradeRepository],
})
export class TradesModule {}
