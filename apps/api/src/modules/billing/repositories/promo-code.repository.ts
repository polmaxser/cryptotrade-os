import { Injectable } from '@nestjs/common';
import { Prisma, PromoCode, PromoCodeRedemption } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class PromoCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<PromoCode | null> {
    return this.prisma.promoCode.findUnique({
      where: {
        code,
      },
    });
  }

  async findRedemption(promoCodeId: string, userId: string): Promise<PromoCodeRedemption | null> {
    return this.prisma.promoCodeRedemption.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId,
          userId,
        },
      },
    });
  }

  async redeem(
    promoCodeId: string,
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<PromoCodeRedemption> {
    await tx.promoCode.update({
      where: {
        id: promoCodeId,
      },
      data: {
        redemptionCount: {
          increment: 1,
        },
      },
    });

    return tx.promoCodeRedemption.create({
      data: {
        promoCodeId,
        userId,
      },
    });
  }

  async create(data: Prisma.PromoCodeCreateInput): Promise<PromoCode> {
    return this.prisma.promoCode.create({
      data,
    });
  }
}
