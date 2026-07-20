import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { UsersModule } from '@/modules/users/users.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { EconomicCalendarModule } from '@/modules/economic-calendar/economic-calendar.module';

import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminPromoCodesController } from './admin-promo-codes.controller';
import { AdminPromoCodesService } from './admin-promo-codes.service';
import { AdminEconomicEventsController } from './admin-economic-events.controller';
import { AdminEconomicEventsService } from './admin-economic-events.service';

@Module({
  imports: [DatabaseModule, UsersModule, BillingModule, EconomicCalendarModule],

  controllers: [AdminUsersController, AdminPromoCodesController, AdminEconomicEventsController],

  providers: [AdminUsersService, AdminPromoCodesService, AdminEconomicEventsService],
})
export class AdminModule {}
