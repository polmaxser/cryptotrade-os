import { Injectable } from '@nestjs/common';
import { Prisma } from '@cryptotrade/database';

import { TradeRepository } from '@/modules/trades/repositories/trade.repository';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';

import { AnalyticsSummary } from './types/analytics-summary';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async getSummary(userId: string, portfolioId?: string): Promise<AnalyticsSummary> {
    if (portfolioId) {
      await this.portfoliosService.findOne(portfolioId, userId);
    }

    const where: Prisma.TradeWhereInput = {
      userId,
      ...(portfolioId ? { portfolioId } : {}),
    };

    const [closedTrades, counts] = await Promise.all([
      this.tradeRepository.findClosedForAnalytics(where),
      this.tradeRepository.countByStatus(where),
    ]);

    const tradesWithPnl = closedTrades.filter((trade) => trade.pnl !== null);

    const totalPnl = tradesWithPnl.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    const totalCost = tradesWithPnl.reduce(
      (sum, trade) => sum + Number(trade.entryPrice) * Number(trade.quantity),
      0,
    );

    const winningTrades = tradesWithPnl.filter((trade) => Number(trade.pnl) > 0).length;
    const losingTrades = tradesWithPnl.filter((trade) => Number(trade.pnl) < 0).length;

    return {
      totalPnl: roundToCents(totalPnl),
      roi: totalCost > 0 ? roundToCents((totalPnl / totalCost) * 100) : 0,
      winRate:
        tradesWithPnl.length > 0 ? roundToCents((winningTrades / tradesWithPnl.length) * 100) : 0,
      totalTrades: counts.total,
      openTrades: counts.open,
      closedTrades: counts.closed,
      winningTrades,
      losingTrades,
    };
  }
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
