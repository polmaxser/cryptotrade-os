import { IsIn } from 'class-validator';
import { SubscriptionPlan } from '@cryptotrade/database';

const PAID_PLANS = [SubscriptionPlan.STANDARD, SubscriptionPlan.PREMIUM] as const;

export class CreateCheckoutSessionDto {
  @IsIn(PAID_PLANS)
  plan!: (typeof PAID_PLANS)[number];
}
