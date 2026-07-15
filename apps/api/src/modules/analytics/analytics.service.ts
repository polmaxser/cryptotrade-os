import { Injectable } from '@nestjs/common';
import { Prisma } from '@cryptotrade/database';

import {
  TradeRepository,
  ClosedTradeAnalyticsRow,
} from '@/modules/trades/repositories/trade.repository';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';

import { AnalyticsSummary, MaxDrawdownStats, RMultipleStats } from './types/analytics-summary';

type ClosedTradeWithPnl = ClosedTradeAnalyticsRow & { pnl: Prisma.Decimal };

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async getSummary(userId: string, portfolioId?: string): Promise<AnalyticsSummary> {
    const startingBalance = portfolioId
      ? await this.resolveStartingBalance(userId, portfolioId)
      : null;

    const where: Prisma.TradeWhereInput = {
      userId,
      ...(portfolioId ? { portfolioId } : {}),
    };

    const [closedTrades, counts] = await Promise.all([
      this.tradeRepository.findClosedForAnalytics(where),
      this.tradeRepository.countByStatus(where),
    ]);

    const tradesWithPnl = closedTrades.filter(hasPnl);

    const totalPnl = tradesWithPnl.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    const totalCost = tradesWithPnl.reduce(
      (sum, trade) => sum + Number(trade.entryPrice) * Number(trade.quantity),
      0,
    );

    const winners = tradesWithPnl.filter((trade) => Number(trade.pnl) > 0);
    const losers = tradesWithPnl.filter((trade) => Number(trade.pnl) < 0);

    const grossProfit = winners.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + Number(trade.pnl), 0));

    return {
      totalPnl: roundToCents(totalPnl),
      roi: totalCost > 0 ? roundToCents((totalPnl / totalCost) * 100) : 0,
      winRate:
        tradesWithPnl.length > 0 ? roundToCents((winners.length / tradesWithPnl.length) * 100) : 0,
      totalTrades: counts.total,
      openTrades: counts.open,
      closedTrades: counts.closed,
      winningTrades: winners.length,
      losingTrades: losers.length,
      profitFactor: grossLoss > 0 ? roundToCents(grossProfit / grossLoss) : null,
      expectancy: tradesWithPnl.length > 0 ? roundToCents(totalPnl / tradesWithPnl.length) : 0,
      avgWin: winners.length > 0 ? roundToCents(grossProfit / winners.length) : 0,
      avgLoss: losers.length > 0 ? roundToCents(grossLoss / losers.length) : 0,
      rMultiple: computeRMultiple(tradesWithPnl),
      maxDrawdown: computeMaxDrawdown(tradesWithPnl, startingBalance),
      sharpeRatioPerTrade: computeSharpeRatio(tradesWithPnl),
    };
  }

  private async resolveStartingBalance(
    userId: string,
    portfolioId: string,
  ): Promise<number | null> {
    const portfolio = await this.portfoliosService.findOne(portfolioId, userId);

    return portfolio.startingBalance !== null ? Number(portfolio.startingBalance) : null;
  }
}

function hasPnl(trade: ClosedTradeAnalyticsRow): trade is ClosedTradeWithPnl {
  return trade.pnl !== null;
}

function computeRMultiple(trades: ClosedTradeWithPnl[]): RMultipleStats {
  const rMultiples: number[] = [];

  for (const trade of trades) {
    if (trade.stopLossPrice === null) continue;

    const riskPerUnit = Math.abs(Number(trade.entryPrice) - Number(trade.stopLossPrice));
    if (riskPerUnit === 0) continue;

    const risk = riskPerUnit * Number(trade.quantity);
    rMultiples.push(Number(trade.pnl) / risk);
  }

  if (rMultiples.length === 0) {
    return { average: null, sampleSize: 0 };
  }

  const average = rMultiples.reduce((sum, value) => sum + value, 0) / rMultiples.length;

  return { average: roundToCents(average), sampleSize: rMultiples.length };
}

function computeMaxDrawdown(
  trades: ClosedTradeWithPnl[],
  startingBalance: number | null,
): MaxDrawdownStats {
  const ordered = [...trades].sort(
    (a, b) => (a.closedAt ?? a.openedAt).getTime() - (b.closedAt ?? b.openedAt).getTime(),
  );

  if (ordered.length === 0) {
    return { amount: 0, percent: startingBalance !== null ? 0 : null };
  }

  let cumulative = startingBalance ?? 0;
  let peak = cumulative;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  for (const trade of ordered) {
    cumulative += Number(trade.pnl);
    if (cumulative > peak) peak = cumulative;

    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdownAmount) maxDrawdownAmount = drawdown;

    if (startingBalance !== null && peak > 0) {
      const drawdownPercent = (drawdown / peak) * 100;
      if (drawdownPercent > maxDrawdownPercent) maxDrawdownPercent = drawdownPercent;
    }
  }

  return {
    amount: roundToCents(maxDrawdownAmount),
    percent: startingBalance !== null ? roundToCents(maxDrawdownPercent) : null,
  };
}

function computeSharpeRatio(trades: ClosedTradeWithPnl[]): number | null {
  const returns: number[] = [];

  for (const trade of trades) {
    const cost = Number(trade.entryPrice) * Number(trade.quantity);
    if (cost === 0) continue;

    returns.push((Number(trade.pnl) / cost) * 100);
  }

  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return null;

  return roundToCents(mean / stddev);
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
