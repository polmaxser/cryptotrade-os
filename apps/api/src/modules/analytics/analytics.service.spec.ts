import { Prisma } from '@cryptotrade/database';

import { AnalyticsService } from './analytics.service';
import {
  ClosedTradeAnalyticsRow,
  TradeRepository,
} from '@/modules/trades/repositories/trade.repository';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';

function tradeRow(params: {
  pnl: number;
  entryPrice?: number;
  quantity?: number;
  stopLossPrice?: number | null;
  closedAt?: Date;
  openedAt?: Date;
}): ClosedTradeAnalyticsRow {
  return {
    pnl: new Prisma.Decimal(params.pnl),
    entryPrice: new Prisma.Decimal(params.entryPrice ?? 100),
    quantity: new Prisma.Decimal(params.quantity ?? 1),
    stopLossPrice: params.stopLossPrice != null ? new Prisma.Decimal(params.stopLossPrice) : null,
    closedAt: params.closedAt ?? new Date('2026-01-01'),
    openedAt: params.openedAt ?? new Date('2025-12-31'),
  };
}

function buildService(
  closedTrades: ClosedTradeAnalyticsRow[],
  counts: { open: number; closed: number },
) {
  const tradeRepository = {
    findClosedForAnalytics: jest.fn().mockResolvedValue(closedTrades),
    countByStatus: jest.fn().mockResolvedValue({
      open: counts.open,
      closed: counts.closed,
      total: counts.open + counts.closed,
    }),
  } as unknown as jest.Mocked<TradeRepository>;

  const portfoliosService = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<PortfoliosService>;

  return {
    service: new AnalyticsService(tradeRepository, portfoliosService),
    tradeRepository,
    portfoliosService,
  };
}

describe('AnalyticsService.getSummary', () => {
  it('computes totals, ROI, win rate, profit factor, expectancy, and avg win/loss', async () => {
    const { service } = buildService(
      [
        tradeRow({ pnl: 100, entryPrice: 50, quantity: 2 }), // cost 100
        tradeRow({ pnl: -40, entryPrice: 40, quantity: 1 }), // cost 40
        tradeRow({ pnl: 60, entryPrice: 30, quantity: 2 }), // cost 60
      ],
      { open: 2, closed: 3 },
    );

    const summary = await service.getSummary('user-1');

    expect(summary.totalPnl).toBe(120);
    expect(summary.roi).toBe(60); // 120 / 200 total cost * 100
    expect(summary.winRate).toBe(66.67); // 2 of 3 trades won
    expect(summary.totalTrades).toBe(5);
    expect(summary.openTrades).toBe(2);
    expect(summary.closedTrades).toBe(3);
    expect(summary.winningTrades).toBe(2);
    expect(summary.losingTrades).toBe(1);
    expect(summary.profitFactor).toBe(4); // 160 gross profit / 40 gross loss
    expect(summary.expectancy).toBe(40); // 120 / 3 trades
    expect(summary.avgWin).toBe(80); // 160 / 2 winners
    expect(summary.avgLoss).toBe(40); // 40 / 1 loser
  });

  it('returns safe defaults when there are no closed trades', async () => {
    const { service } = buildService([], { open: 1, closed: 0 });

    const summary = await service.getSummary('user-1');

    expect(summary.totalPnl).toBe(0);
    expect(summary.roi).toBe(0);
    expect(summary.winRate).toBe(0);
    expect(summary.profitFactor).toBeNull();
    expect(summary.expectancy).toBe(0);
    expect(summary.avgWin).toBe(0);
    expect(summary.avgLoss).toBe(0);
    expect(summary.rMultiple).toEqual({ average: null, sampleSize: 0 });
    expect(summary.maxDrawdown).toEqual({ amount: 0, percent: null });
    expect(summary.sharpeRatioPerTrade).toBeNull();
  });

  it('averages R-multiples only across trades with a usable stop-loss', async () => {
    const { service } = buildService(
      [
        tradeRow({ pnl: 50, entryPrice: 100, stopLossPrice: 90, quantity: 2 }), // risk 20, R = 2.5
        tradeRow({ pnl: -30, entryPrice: 100, stopLossPrice: 95, quantity: 3 }), // risk 15, R = -2
        tradeRow({ pnl: 20, entryPrice: 100, stopLossPrice: null }), // no stop-loss — skipped
        tradeRow({ pnl: 10, entryPrice: 100, stopLossPrice: 100 }), // zero risk — skipped
      ],
      { open: 0, closed: 4 },
    );

    const summary = await service.getSummary('user-1');

    expect(summary.rMultiple).toEqual({ average: 0.25, sampleSize: 2 });
  });

  it('tracks max drawdown in currency terms without a portfolio, and as a percent with one', async () => {
    const trades = [
      tradeRow({ pnl: 200, closedAt: new Date('2026-01-01') }),
      tradeRow({ pnl: -500, closedAt: new Date('2026-01-02') }),
      tradeRow({ pnl: 100, closedAt: new Date('2026-01-03') }),
    ];

    const { service: withoutPortfolio } = buildService(trades, { open: 0, closed: 3 });
    const noPortfolioSummary = await withoutPortfolio.getSummary('user-1');
    expect(noPortfolioSummary.maxDrawdown).toEqual({ amount: 500, percent: null });

    const { service: withPortfolio, portfoliosService } = buildService(trades, {
      open: 0,
      closed: 3,
    });
    portfoliosService.findOne.mockResolvedValue({
      startingBalance: new Prisma.Decimal(1000),
    } as never);
    const portfolioSummary = await withPortfolio.getSummary('user-1', 'portfolio-1');
    // Peak hits 1200 after the first trade; the -500 trade drags it down to
    // 700, a 500/1200 = 41.67% drawdown from that peak.
    expect(portfolioSummary.maxDrawdown).toEqual({ amount: 500, percent: 41.67 });
  });

  it('returns a null Sharpe ratio with fewer than two trades or zero variance', async () => {
    const { service: oneTrade } = buildService([tradeRow({ pnl: 10 })], { open: 0, closed: 1 });
    expect((await oneTrade.getSummary('user-1')).sharpeRatioPerTrade).toBeNull();

    const { service: identicalReturns } = buildService(
      [tradeRow({ pnl: 10, entryPrice: 100 }), tradeRow({ pnl: 10, entryPrice: 100 })],
      { open: 0, closed: 2 },
    );
    expect((await identicalReturns.getSummary('user-1')).sharpeRatioPerTrade).toBeNull();
  });

  it('computes the Sharpe ratio as mean over stddev of per-trade PnL%', async () => {
    const { service } = buildService(
      [
        tradeRow({ pnl: 10, entryPrice: 100, quantity: 1 }), // +10%
        tradeRow({ pnl: -5, entryPrice: 100, quantity: 1 }), // -5%
        tradeRow({ pnl: 15, entryPrice: 100, quantity: 1 }), // +15%
      ],
      { open: 0, closed: 3 },
    );

    const summary = await service.getSummary('user-1');

    expect(summary.sharpeRatioPerTrade).toBeCloseTo(0.64, 2);
  });

  it('scopes closed-trade queries to a date range without filtering open-trade counts by it', async () => {
    const { service, tradeRepository } = buildService([], { open: 3, closed: 0 });
    const range = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    await service.getSummary('user-1', undefined, range);

    expect(tradeRepository.findClosedForAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', closedAt: { gte: range.from, lte: range.to } }),
    );
    // countByStatus receives the range as a separate argument — it only
    // ever applies it to the CLOSED branch internally, never to OPEN counts.
    expect(tradeRepository.countByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      range,
    );
    const [whereArg] = tradeRepository.countByStatus.mock.calls[0] ?? [];
    expect(whereArg).not.toHaveProperty('closedAt');
  });

  it('scopes both open and closed counts to a strategyId equally', async () => {
    const { service, tradeRepository } = buildService([], { open: 1, closed: 1 });

    await service.getSummary('user-1', undefined, undefined, 'strategy-1');

    expect(tradeRepository.findClosedForAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ strategyId: 'strategy-1' }),
    );
    expect(tradeRepository.countByStatus).toHaveBeenCalledWith(
      expect.objectContaining({ strategyId: 'strategy-1' }),
      undefined,
    );
  });
});
