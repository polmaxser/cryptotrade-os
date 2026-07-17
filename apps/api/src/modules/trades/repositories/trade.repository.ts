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

  async findClosedInRange(userId: string, from: Date, to: Date): Promise<ClosedTradeCalendarRow[]> {
    return this.prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        closedAt: { gte: from, lte: to },
      },
      select: {
        pnl: true,
        closedAt: true,
      },
    });
  }

  async createMany(
    data: Prisma.TradeCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const result = await (tx ?? this.prisma).trade.createMany({ data });
    return result.count;
  }

  async deleteByExchangeConnectionAndSymbol(
    exchangeConnectionId: string,
    symbol: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const result = await (tx ?? this.prisma).trade.deleteMany({
      where: { exchangeConnectionId, symbol },
    });
    return result.count;
  }

  /**
   * All trades (any status) opened within a window — the shared input for AI
   * Coach pattern detection, which needs both closed-trade outcomes and raw
   * open/frequency data (e.g. revenge trading looks at the trade right after
   * a loss, regardless of whether it's closed yet).
   */
  async findForCoachAnalysis(userId: string, from: Date, to: Date): Promise<CoachTradeRow[]> {
    return this.prisma.trade.findMany({
      where: {
        userId,
        openedAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        quantity: true,
        entryPrice: true,
        pnl: true,
        status: true,
        openedAt: true,
        closedAt: true,
      },
      orderBy: {
        openedAt: 'asc',
      },
    });
  }

  /**
   * `closedAtRange` only narrows the CLOSED count — OPEN trades have no
   * closedAt, so applying the same range there would incorrectly zero them out.
   */
  async countByStatus(
    where: Prisma.TradeWhereInput,
    closedAtRange?: { from: Date; to: Date },
  ): Promise<TradeStatusCounts> {
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
          ...(closedAtRange
            ? { closedAt: { gte: closedAtRange.from, lte: closedAtRange.to } }
            : {}),
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

export interface ClosedTradeCalendarRow {
  pnl: Prisma.Decimal | null;
  closedAt: Date | null;
}

export interface TradeStatusCounts {
  open: number;
  closed: number;
  total: number;
}

export interface CoachTradeRow {
  id: string;
  symbol: string;
  side: string;
  quantity: Prisma.Decimal;
  entryPrice: Prisma.Decimal;
  pnl: Prisma.Decimal | null;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
}
