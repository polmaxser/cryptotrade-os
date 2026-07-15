import { Injectable } from '@nestjs/common';
import { Prisma, Trade } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class TradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<Trade[]> {
    return this.prisma.trade.findMany({
      where: {
        userId,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<Trade | null> {
    return this.prisma.trade.findUnique({
      where: {
        id,
      },
    });
  }

  async create(data: Prisma.TradeUncheckedCreateInput): Promise<Trade> {
    return this.prisma.trade.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TradeUncheckedUpdateInput): Promise<Trade> {
    return this.prisma.trade.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string): Promise<Trade> {
    return this.prisma.trade.delete({
      where: {
        id,
      },
    });
  }

  async findClosedForAnalytics(where: Prisma.TradeWhereInput): Promise<ClosedTradeAnalyticsRow[]> {
    return this.prisma.trade.findMany({
      where: {
        ...where,
        status: 'CLOSED',
      },
      select: {
        pnl: true,
        entryPrice: true,
        quantity: true,
        stopLossPrice: true,
        closedAt: true,
        openedAt: true,
      },
    });
  }

  async countByStatus(where: Prisma.TradeWhereInput): Promise<TradeStatusCounts> {
    const [open, closed] = await Promise.all([
      this.prisma.trade.count({
        where: {
          ...where,
          status: 'OPEN',
        },
      }),
      this.prisma.trade.count({
        where: {
          ...where,
          status: 'CLOSED',
        },
      }),
    ]);

    return {
      open,
      closed,
      total: open + closed,
    };
  }
}

export interface ClosedTradeAnalyticsRow {
  pnl: Prisma.Decimal | null;
  entryPrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  stopLossPrice: Prisma.Decimal | null;
  closedAt: Date | null;
  openedAt: Date;
}

export interface TradeStatusCounts {
  open: number;
  closed: number;
  total: number;
}
