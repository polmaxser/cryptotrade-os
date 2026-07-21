import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PromoCode,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@cryptotrade/database';

import { BillingService } from './billing.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PromoCodeRepository } from './repositories/promo-code.repository';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/common/database/prisma.service';

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    plan: SubscriptionPlan.PREMIUM,
    status: SubscriptionStatus.ACTIVE,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    userId: 'user-1',
    ...overrides,
  };
}

function promoCode(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'promo-1',
    code: 'WELCOME30',
    description: null,
    grantsPlan: SubscriptionPlan.PREMIUM,
    freeDays: 30,
    maxRedemptions: null,
    redemptionCount: 0,
    isActive: true,
    expiresAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildService(options: {
  subscription?: Subscription | null;
  portfolioCount?: number;
  tradeCount?: number;
}) {
  const subscriptionRepository = {
    findByUserId: jest.fn().mockResolvedValue(options.subscription ?? null),
  } as unknown as jest.Mocked<SubscriptionRepository>;

  const promoCodeRepository = {
    findByCode: jest.fn(),
    findRedemption: jest.fn(),
    redeem: jest.fn(),
  } as unknown as jest.Mocked<PromoCodeRepository>;

  const usersService = {} as UsersService;
  const stripeService = {} as never;
  const configService = {} as never;

  const prisma = {
    portfolio: { count: jest.fn().mockResolvedValue(options.portfolioCount ?? 0) },
    trade: { count: jest.fn().mockResolvedValue(options.tradeCount ?? 0) },
    subscription: { update: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({ subscription: { update: jest.fn() } });
    }),
  } as unknown as jest.Mocked<PrismaService>;

  const service = new BillingService(
    subscriptionRepository,
    promoCodeRepository,
    usersService,
    stripeService,
    configService,
    prisma,
  );

  return { service, subscriptionRepository, promoCodeRepository, prisma };
}

describe('BillingService — effective plan (lapse handling)', () => {
  it('treats a user with no subscription row as FREE', async () => {
    const { service } = buildService({ subscription: null });

    await expect(service.assertCanUseAiCoach('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('honors an active Premium subscription', async () => {
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).resolves.toBeUndefined();
  });

  it('keeps a canceled subscription active until its currentPeriodEnd', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: future,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).resolves.toBeUndefined();
  });

  it('downgrades a canceled subscription to FREE once currentPeriodEnd has passed', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: past,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('downgrades a canceled subscription with no currentPeriodEnd to FREE', async () => {
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: null,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('downgrades a past-due subscription to FREE once currentPeriodEnd has passed', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: past,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('only lapses CANCELED/PAST_DUE — a TRIALING plan stays active even with a past currentPeriodEnd', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { service } = buildService({
      subscription: subscription({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.TRIALING,
        currentPeriodEnd: past,
      }),
    });

    await expect(service.assertCanUseAiCoach('user-1')).resolves.toBeUndefined();
  });
});

describe('BillingService — usage limits', () => {
  it('blocks creating another portfolio once the FREE cap (1) is reached', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
      portfolioCount: 1,
    });

    await expect(service.assertCanCreatePortfolio('user-1')).rejects.toThrow(ConflictException);
  });

  it('allows creating a portfolio below the FREE cap', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
      portfolioCount: 0,
    });

    await expect(service.assertCanCreatePortfolio('user-1')).resolves.toBeUndefined();
  });

  it('never caps portfolios on STANDARD/PREMIUM regardless of count', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.STANDARD }),
      portfolioCount: 999,
    });

    await expect(service.assertCanCreatePortfolio('user-1')).resolves.toBeUndefined();
  });

  it('blocks a single trade once the FREE monthly cap (30) is reached', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
      tradeCount: 30,
    });

    await expect(service.assertCanCreateTrade('user-1')).rejects.toThrow(ConflictException);
  });

  it('rejects a bulk import that would cross the FREE monthly cap, citing remaining capacity', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
      tradeCount: 25,
    });

    await expect(service.assertCanImportTrades('user-1', 10)).rejects.toThrow(
      'Your Free plan allows 5 more trade(s) this month, but this import would add 10. Upgrade for unlimited trades.',
    );
  });

  it('allows a bulk import that lands exactly on the FREE monthly cap', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
      tradeCount: 25,
    });

    await expect(service.assertCanImportTrades('user-1', 5)).resolves.toBeUndefined();
  });

  it('never caps bulk imports on STANDARD/PREMIUM', async () => {
    const { service } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.PREMIUM }),
      tradeCount: 100_000,
    });

    await expect(service.assertCanImportTrades('user-1', 100_000)).resolves.toBeUndefined();
  });
});

describe('BillingService — Premium-only feature gates', () => {
  it.each([
    ['assertCanCreateWorkspace' as const],
    ['assertCanUseAiCoach' as const],
    ['assertCanUseAiReports' as const],
    ['assertCanUseStrategyBuilder' as const],
    ['assertCanUseEconomicCalendar' as const],
  ])('%s throws on FREE and STANDARD, passes on PREMIUM', async (method) => {
    const { service: onFree } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.FREE }),
    });
    await expect(onFree[method]('user-1')).rejects.toThrow(ForbiddenException);

    const { service: onStandard } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.STANDARD }),
    });
    await expect(onStandard[method]('user-1')).rejects.toThrow(ForbiddenException);

    const { service: onPremium } = buildService({
      subscription: subscription({ plan: SubscriptionPlan.PREMIUM }),
    });
    await expect(onPremium[method]('user-1')).resolves.toBeUndefined();
  });
});

describe('BillingService.redeemPromoCode', () => {
  it('rejects an unknown code', async () => {
    const { service, promoCodeRepository } = buildService({});
    promoCodeRepository.findByCode.mockResolvedValue(null);

    await expect(service.redeemPromoCode('user-1', 'NOPE')).rejects.toThrow(NotFoundException);
  });

  it('rejects an inactive code', async () => {
    const { service, promoCodeRepository } = buildService({});
    promoCodeRepository.findByCode.mockResolvedValue(promoCode({ isActive: false }));

    await expect(service.redeemPromoCode('user-1', 'WELCOME30')).rejects.toThrow(
      'This promo code is no longer active',
    );
  });

  it('rejects an expired code', async () => {
    const { service, promoCodeRepository } = buildService({});
    promoCodeRepository.findByCode.mockResolvedValue(
      promoCode({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(service.redeemPromoCode('user-1', 'WELCOME30')).rejects.toThrow(
      'This promo code has expired',
    );
  });

  it('rejects a code that has reached its redemption limit', async () => {
    const { service, promoCodeRepository } = buildService({});
    promoCodeRepository.findByCode.mockResolvedValue(
      promoCode({ maxRedemptions: 10, redemptionCount: 10 }),
    );

    await expect(service.redeemPromoCode('user-1', 'WELCOME30')).rejects.toThrow(
      'This promo code has reached its redemption limit',
    );
  });

  it('does not limit redemptions when maxRedemptions is null', async () => {
    const { service, promoCodeRepository, subscriptionRepository } = buildService({
      subscription: subscription(),
    });
    promoCodeRepository.findByCode.mockResolvedValue(
      promoCode({ maxRedemptions: null, redemptionCount: 5000 }),
    );
    promoCodeRepository.findRedemption.mockResolvedValue(null);
    subscriptionRepository.findByUserId.mockResolvedValue(subscription());

    await expect(service.redeemPromoCode('user-1', 'WELCOME30')).resolves.toBeDefined();
  });

  it('rejects a code the user has already redeemed', async () => {
    const { service, promoCodeRepository } = buildService({});
    promoCodeRepository.findByCode.mockResolvedValue(promoCode());
    promoCodeRepository.findRedemption.mockResolvedValue({
      promoCodeId: 'promo-1',
      userId: 'user-1',
      redeemedAt: new Date(),
    } as never);

    await expect(service.redeemPromoCode('user-1', 'WELCOME30')).rejects.toThrow(
      'You have already redeemed this promo code',
    );
  });

  it('extends from the existing currentPeriodEnd when it is still in the future, not from now', async () => {
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days out
    const { service, promoCodeRepository, subscriptionRepository, prisma } = buildService({
      subscription: subscription({ currentPeriodEnd: future }),
    });
    promoCodeRepository.findByCode.mockResolvedValue(promoCode({ freeDays: 30 }));
    promoCodeRepository.findRedemption.mockResolvedValue(null);
    subscriptionRepository.findByUserId.mockResolvedValue(
      subscription({ currentPeriodEnd: future }),
    );

    let capturedUpdate: { currentPeriodEnd: Date } | undefined;
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<void>) => {
        await fn({
          subscription: {
            update: jest.fn((args: { data: { currentPeriodEnd: Date } }) => {
              capturedUpdate = args.data;
            }),
          },
        });
      },
    );

    await service.redeemPromoCode('user-1', 'WELCOME30');

    const expected = new Date(future.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(capturedUpdate?.currentPeriodEnd).toEqual(expected);
  });
});
