import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { MarketDataModule } from '@/modules/market-data/market-data.module';

import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { PriceAlertRepository } from './repositories/price-alert.repository';

@Module({
  imports: [DatabaseModule, MarketDataModule],

  controllers: [AlertsController],

  providers: [AlertsService, PriceAlertRepository],

  exports: [AlertsService],
})
export class AlertsModule {}
