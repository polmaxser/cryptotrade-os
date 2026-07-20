import { Module } from '@nestjs/common';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PromoCodeRepository } from './repositories/promo-code.repository';

import { DatabaseModule } from '@/common/database/database.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],

  controllers: [BillingController],

  providers: [BillingService, StripeService, SubscriptionRepository, PromoCodeRepository],

  exports: [BillingService, SubscriptionRepository, PromoCodeRepository],
})
export class BillingModule {}
