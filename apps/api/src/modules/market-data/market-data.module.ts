import { Module } from '@nestjs/common';

import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { BinanceKlinesService } from './binance-klines.service';

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, BinanceKlinesService],
  exports: [MarketDataService, BinanceKlinesService],
})
export class MarketDataModule {}
