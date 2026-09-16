import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { CacheModule } from '@/common/cache/cache.module';
import { MarketDataModule } from '@/modules/market-data/market-data.module';
import { EconomicCalendarModule } from '@/modules/economic-calendar/economic-calendar.module';

import { MarketOverviewController } from './market-overview.controller';
import { MarketOverviewService } from './market-overview.service';
import { FearGreedService } from './sources/fear-greed.service';
import { YahooFinanceService } from './sources/yahoo-finance.service';
import { OkxDerivativesService } from './sources/okx-derivatives.service';
import { OnChainService } from './sources/onchain.service';
import { CryptoMarketService } from './sources/crypto-market.service';

@Module({
  imports: [DatabaseModule, CacheModule, MarketDataModule, EconomicCalendarModule],

  controllers: [MarketOverviewController],

  providers: [
    MarketOverviewService,
    FearGreedService,
    YahooFinanceService,
    OkxDerivativesService,
    OnChainService,
    CryptoMarketService,
  ],
})
export class MarketOverviewModule {}
