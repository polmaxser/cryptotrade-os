import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';

import { NftHoldingsController } from './nft-holdings.controller';
import { NftHoldingsService } from './nft-holdings.service';
import { NftHoldingRepository } from './repositories/nft-holding.repository';

@Module({
  imports: [DatabaseModule, PortfoliosModule],

  controllers: [NftHoldingsController],

  providers: [NftHoldingsService, NftHoldingRepository],

  exports: [NftHoldingsService],
})
export class NftHoldingsModule {}
