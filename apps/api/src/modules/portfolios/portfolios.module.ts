import { Module } from '@nestjs/common';

import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { PortfolioRepository } from './repositories/portfolio.repository';

import { DatabaseModule } from '@/common/database/database.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [DatabaseModule, BillingModule],

  controllers: [PortfoliosController],

  providers: [PortfoliosService, PortfolioRepository],

  exports: [PortfoliosService, PortfolioRepository],
})
export class PortfoliosModule {}
