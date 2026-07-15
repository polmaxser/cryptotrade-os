import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { MarketDataModule } from '@/modules/market-data/market-data.module';

import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { WatchlistItemRepository } from './repositories/watchlist-item.repository';

@Module({
  imports: [DatabaseModule, MarketDataModule],

  controllers: [WatchlistController],

  providers: [WatchlistService, WatchlistItemRepository],

  exports: [WatchlistService],
})
export class WatchlistModule {}
