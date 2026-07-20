import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PromoCode, SubscriptionPlan, SubscriptionStatus } from '@cryptotrade/database';
import Stripe from 'stripe';

import { PrismaService } from '@/common/database/prisma.service';
import { UsersService } from '@/modules/users/users.service';

import { StripeService } from './stripe.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PromoCodeRepository } from './repositories/promo-code.repository';
import { PLAN_DEFINITIONS, getPlanLimits } from './types/plan-config';
import { SubscriptionSummary } from './types/subscription-summary';

const PAID_PLAN_PRICE_CONFIG_KEY: Record<'STANDARD' | 'PREMIUM', string> = {
  STANDARD: 'billing.stripePriceIdStandard',
  PREMIUM: 'billing.stripePriceIdPremium',
};

@Injectable()
export class BillingService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly promoCodeRepository: PromoCodeRepository,
    private readonly usersService: UsersService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createFreeSubscription(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.subscriptionRepository.create(
      {
        userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
      tx,
    );
  }

  async getMySubscription(userId: string): Promise<SubscriptionSummary> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = await this.getEffectivePlan(userId);

    const [portfolios, tradesThisMonth] = await Promise.all([
      this.getPortfolioCount(userId),
      this.getTradesThisMonthCount(userId),
    ]);

    return {
      plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      hasBillingAccount: Boolean(subscription.stripeCustomerId),
      limits: getPlanLimits(plan),
      usage: { portfolios, tradesThisMonth },
    };
  }

  async assertCanCreatePortfolio(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (limits.maxPortfolios === null) {
      return;
    }

    const count = await this.getPortfolioCount(userId);

    if (count >= limits.maxPortfolios) {
      throw new ConflictException(
        `Your ${PLAN_DEFINITIONS[plan].name} plan is limited to ${limits.maxPortfolios} portfolio(s). Upgrade to create more.`,
      );
    }
  }

  async assertCanCreateTrade(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (limits.maxTradesPerMonth === null) {
      return;
    }

    const count = await this.getTradesThisMonthCount(userId);

    if (count >= limits.maxTradesPerMonth) {
      throw new ConflictException(
        `Your ${PLAN_DEFINITIONS[plan].name} plan is limited to ${limits.maxTradesPerMonth} trades per month. Upgrade for unlimited trades.`,
      );
    }
  }

  /**
   * Bulk-import variant of assertCanCreateTrade — checked once for the whole
   * batch rather than per-trade, since a per-item check would be slow across
   * hundreds of imported trades and would reject the import mid-batch once
   * the cap is hit rather than failing clearly upfront.
   */
  async assertCanImportTrades(userId: string, additionalCount: number): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (limits.maxTradesPerMonth === null) {
      return;
    }

    const count = await this.getTradesThisMonthCount(userId);

    if (count + additionalCount > limits.maxTradesPerMonth) {
      const remaining = Math.max(0, limits.maxTradesPerMonth - count);
      throw new ConflictException(
        `Your ${PLAN_DEFINITIONS[plan].name} plan allows ${remaining} more trade(s) this month, but this import would add ${additionalCount}. Upgrade for unlimited trades.`,
      );
    }
  }

  async assertCanCreateWorkspace(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (!limits.canUseWorkspace) {
      throw new ForbiddenException(
        'Workspaces are available on the Premium plan. Upgrade to create one.',
      );
    }
  }

  async assertCanUseAiCoach(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (!limits.canUseAiCoach) {
      throw new ForbiddenException('AI Coach is available on the Premium plan. Upgrade to use it.');
    }
  }

  /** AI Reports ships on the same Premium tier as AI Coach (see docs/pricing.md) — same underlying limit, own call site for clarity. */
  async assertCanUseAiReports(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (!limits.canUseAiCoach) {
      throw new ForbiddenException(
        'AI Reports are available on the Premium plan. Upgrade to use it.',
      );
    }
  }

  async assertCanUseStrategyBuilder(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (!limits.canUseStrategyBuilder) {
      throw new ForbiddenException(
        'Strategy Builder is available on the Premium plan. Upgrade to use it.',
      );
    }
  }

  async assertCanUseEconomicCalendar(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    const limits = getPlanLimits(plan);

    if (!limits.canUseEconomicCalendar) {
      throw new ForbiddenException(
        'Economic Calendar is available on the Premium plan. Upgrade to use it.',
      );
    }
  }

  async createCheckoutSession(
    userId: string,
    plan: 'STANDARD' | 'PREMIUM',
  ): Promise<{ url: string }> {
    const stripe = this.stripeService.requireClient();

    const priceId = this.configService.get<string>(PAID_PLAN_PRICE_CONFIG_KEY[plan]);

    if (!priceId) {
      throw new ServiceUnavailableException(`No Stripe price is configured for the ${plan} plan`);
    }

    const user = await this.usersService.findAuthUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    let stripeCustomerId = subscription?.stripeCustomerId ?? undefined;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });

      stripeCustomerId = customer.id;

      await this.subscriptionRepository.updateByUserId(userId, { stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: this.configService.get<string>('billing.checkoutSuccessUrl', ''),
      cancel_url: this.configService.get<string>('billing.checkoutCancelUrl', ''),
      metadata: { userId, plan },
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL');
    }

    return { url: session.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const stripe = this.stripeService.requireClient();

    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No billing account found — subscribe to a paid plan first');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: this.configService.get<string>('billing.portalReturnUrl', ''),
    });

    return { url: session.url };
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.stripeService.webhookSecret;

    if (!webhookSecret) {
      throw new ServiceUnavailableException('Webhook secret is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.raw.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Invalid webhook signature: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  }

  async redeemPromoCode(userId: string, code: string): Promise<SubscriptionSummary> {
    const promoCode = await this.promoCodeRepository.findByCode(code.trim().toUpperCase());

    if (!promoCode) {
      throw new NotFoundException('Invalid promo code');
    }

    this.assertPromoCodeIsRedeemable(promoCode);

    const existingRedemption = await this.promoCodeRepository.findRedemption(promoCode.id, userId);

    if (existingRedemption) {
      throw new ConflictException('You have already redeemed this promo code');
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const base =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
        ? subscription.currentPeriodEnd
        : new Date();
    const currentPeriodEnd = new Date(base.getTime() + promoCode.freeDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await this.promoCodeRepository.redeem(promoCode.id, userId, tx);

      await tx.subscription.update({
        where: { userId },
        data: {
          plan: promoCode.grantsPlan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
        },
      });
    });

    return this.getMySubscription(userId);
  }

  private assertPromoCodeIsRedeemable(promoCode: PromoCode): void {
    if (!promoCode.isActive) {
      throw new ConflictException('This promo code is no longer active');
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      throw new ConflictException('This promo code has expired');
    }

    if (
      promoCode.maxRedemptions !== null &&
      promoCode.redemptionCount >= promoCode.maxRedemptions
    ) {
      throw new ConflictException('This promo code has reached its redemption limit');
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.client_reference_id ?? session.metadata?.userId;

    if (!userId) {
      return;
    }

    const stripeCustomerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const stripeSubscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (!stripeCustomerId || !stripeSubscriptionId) {
      return;
    }

    const plan = this.parsePlan(session.metadata?.plan) ?? SubscriptionPlan.STANDARD;

    await this.subscriptionRepository.updateByUserId(userId, {
      plan,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId,
      stripeSubscriptionId,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    const existing = await this.subscriptionRepository.findByStripeCustomerId(customerId);

    if (!existing) {
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.resolvePlanFromPriceId(priceId) ?? existing.plan;

    await this.subscriptionRepository.update(existing.id, {
      plan,
      status: this.mapStripeStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const existing = await this.subscriptionRepository.findByStripeSubscriptionId(subscription.id);

    if (!existing) {
      return;
    }

    await this.subscriptionRepository.update(existing.id, {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: false,
    });
  }

  private resolvePlanFromPriceId(priceId: string | undefined): SubscriptionPlan | null {
    if (!priceId) {
      return null;
    }

    if (priceId === this.configService.get<string>('billing.stripePriceIdStandard')) {
      return SubscriptionPlan.STANDARD;
    }

    if (priceId === this.configService.get<string>('billing.stripePriceIdPremium')) {
      return SubscriptionPlan.PREMIUM;
    }

    return null;
  }

  private parsePlan(value: string | undefined): SubscriptionPlan | null {
    if (value === SubscriptionPlan.STANDARD || value === SubscriptionPlan.PREMIUM) {
      return value;
    }

    return null;
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
      case 'incomplete_expired':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private async getEffectivePlan(userId: string): Promise<SubscriptionPlan> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      return SubscriptionPlan.FREE;
    }

    const isLapsed =
      (subscription.status === SubscriptionStatus.CANCELED ||
        subscription.status === SubscriptionStatus.PAST_DUE) &&
      (!subscription.currentPeriodEnd || subscription.currentPeriodEnd < new Date());

    return isLapsed ? SubscriptionPlan.FREE : subscription.plan;
  }

  private async getPortfolioCount(userId: string): Promise<number> {
    return this.prisma.portfolio.count({ where: { userId } });
  }

  private async getTradesThisMonthCount(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    return this.prisma.trade.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });
  }
}
