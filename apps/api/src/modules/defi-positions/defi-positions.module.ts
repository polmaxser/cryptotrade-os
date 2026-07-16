import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';

import { DeFiPositionsController } from './defi-positions.controller';
import { DeFiPositionsService } from './defi-positions.service';
import { DeFiPositionRepository } from './repositories/defi-position.repository';

@Module({
  imports: [DatabaseModule, PortfoliosModule],

  controllers: [DeFiPositionsController],

  providers: [DeFiPositionsService, DeFiPositionRepository],

  exports: [DeFiPositionsService],
})
export class DeFiPositionsModule {}
