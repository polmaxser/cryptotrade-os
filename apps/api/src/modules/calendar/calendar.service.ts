import { Injectable } from '@nestjs/common';

import { TradeRepository } from '@/modules/trades/repositories/trade.repository';

import { CalendarDaySummary } from './types/calendar-day-summary';

@Injectable()
export class CalendarService {
  constructor(private readonly tradeRepository: TradeRepository) {}

  async getMonthlyPnl(userId: string, month: string): Promise<CalendarDaySummary[]> {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    const from = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const trades = await this.tradeRepository.findClosedInRange(userId, from, to);

    const byDay = new Map<string, { pnl: number; tradeCount: number }>();

    for (const trade of trades) {
      if (trade.pnl === null || trade.closedAt === null) continue;

      const day = trade.closedAt.toISOString().slice(0, 10);
      const existing = byDay.get(day) ?? { pnl: 0, tradeCount: 0 };
      existing.pnl += Number(trade.pnl);
      existing.tradeCount += 1;
      byDay.set(day, existing);
    }

    return Array.from(byDay.entries())
      .map(([date, stats]) => ({
        date,
        pnl: roundToCents(stats.pnl),
        tradeCount: stats.tradeCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
