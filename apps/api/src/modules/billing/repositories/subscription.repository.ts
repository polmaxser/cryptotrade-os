import { Injectable } from '@nestjs/common';
import { Prisma, Subscription } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.SubscriptionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Subscription> {
    return (tx ?? this.prisma).subscription.create({
      data,
    });
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: {
        userId,
      },
    });
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: {
        stripeCustomerId,
      },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: {
        stripeSubscriptionId,
      },
    });
  }

  async update(id: string, data: Prisma.SubscriptionUncheckedUpdateInput): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: {
        id,
      },
      data,
    });
  }

  async updateByUserId(
    userId: string,
    data: Prisma.SubscriptionUncheckedUpdateInput,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: {
        userId,
      },
      data,
    });
  }
}
