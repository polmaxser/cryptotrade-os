import { Injectable } from '@nestjs/common';
import { Portfolio, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

export type PortfolioWithTradeCount = Portfolio & {
  _count: {
    trades: number;
  };
};

const WITH_TRADE_COUNT = {
  include: {
    _count: {
      select: {
        trades: true,
      },
    },
  },
} as const;

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<PortfolioWithTradeCount[]> {
    return this.prisma.portfolio.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      ...WITH_TRADE_COUNT,
    });
  }

  async findById(id: string): Promise<PortfolioWithTradeCount | null> {
    return this.prisma.portfolio.findUnique({
      where: {
        id,
      },
      ...WITH_TRADE_COUNT,
    });
  }

  async findDefaultForUser(userId: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async create(
    data: Prisma.PortfolioUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Portfolio> {
    return (tx ?? this.prisma).portfolio.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PortfolioUncheckedUpdateInput): Promise<Portfolio> {
    return this.prisma.portfolio.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string): Promise<Portfolio> {
    return this.prisma.portfolio.delete({
      where: {
        id,
      },
    });
  }

  async unsetDefaultForUser(userId: string, exceptId?: string): Promise<void> {
    await this.prisma.portfolio.updateMany({
      where: {
        userId,
        isDefault: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: {
        isDefault: false,
      },
    });
  }

  async countTrades(portfolioId: string): Promise<number> {
    return this.prisma.trade.count({
      where: {
        portfolioId,
      },
    });
  }
}
