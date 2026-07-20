import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { EconomicCalendarController } from './economic-calendar.controller';
import { EconomicCalendarService } from './economic-calendar.service';
import { EconomicEventRepository } from './repositories/economic-event.repository';

@Module({
  imports: [DatabaseModule, BillingModule],

  controllers: [EconomicCalendarController],

  providers: [EconomicCalendarService, EconomicEventRepository],

  exports: [EconomicCalendarService],
})
export class EconomicCalendarModule {}
