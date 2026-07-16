import { Injectable } from '@nestjs/common';
import { CoachInsightPattern, JournalTagCategory } from '@cryptotrade/database';

import { CoachJournalTagInput, CoachTradeInput, PatternFinding } from './types/pattern-detection';

/** Below this many closed trades, every ratio is noise — skip detection entirely. */
const MIN_CLOSED_TRADES = 10;
const MAX_RELATED_TRADE_IDS = 10;

/**
 * Deterministic pattern detection over a user's trades/journal — no LLM here.
 * Each detector requires its own minimum sample size on top of MIN_CLOSED_TRADES
 * so a single-digit lucky/unlucky streak can't masquerade as a "pattern". Coach
 * text generation (turning a PatternFinding into human language) lives in
 * CoachLlmService — this file only produces numbers and trade references.
 */
@Injectable()
export class PatternDetectorService {
  detectAll(trades: CoachTradeInput[], journalRows: CoachJournalTagInput[]): PatternFinding[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED' && t.pnl !== null);

    if (closedTrades.length < MIN_CLOSED_TRADES) {
      return [];
    }

    const findings: PatternFinding[] = [];

    const revengeTrading = this.detectRevengeTrading(trades, closedTrades);
    if (revengeTrading) findings.push(revengeTrading);

    const holdingLosersTooLong = this.detectHoldingLosersTooLong(closedTrades);
    if (holdingLosersTooLong) findings.push(holdingLosersTooLong);

    const cuttingWinnersShort = this.detectCuttingWinnersShort(closedTrades);
    if (cuttingWinnersShort) findings.push(cuttingWinnersShort);

    const timeOfDayWeakness = this.detectTimeOfDayWeakness(closedTrades);
    if (timeOfDayWeakness) findings.push(timeOfDayWeakness);

    const tagCorrelation = this.detectTagCorrelation(closedTrades, journalRows);
    if (tagCorrelation) findings.push(tagCorrelation);

    const overtrading = this.detectOvertrading(trades, closedTrades);
    if (overtrading) findings.push(overtrading);

    const positionSizeInconsistency = this.detectPositionSizeInconsistency(closedTrades);
    if (positionSizeInconsistency) findings.push(positionSizeInconsistency);

    return findings;
  }

  /**
   * A losing trade followed, same UTC day, by a meaningfully larger trade —
   * averaged across all such pairs. Requires 5+ pairs so one bad day can't trigger it.
   */
  private detectRevengeTrading(
    allTrades: CoachTradeInput[],
    closedTrades: CoachTradeInput[],
  ): PatternFinding | null {
    const sorted = [...allTrades].sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
    const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0 && t.closedAt !== null);

    const pairs: { loss: CoachTradeInput; next: CoachTradeInput }[] = [];

    for (const loss of losses) {
      const lossDay = utcDateKey(loss.closedAt as Date);
      const next = sorted.find(
        (t) =>
          t.id !== loss.id &&
          t.openedAt.getTime() > (loss.closedAt as Date).getTime() &&
          utcDateKey(t.openedAt) === lossDay,
      );
      if (next) pairs.push({ loss, next });
    }

    if (pairs.length < 5) return null;

    const avgNotionalAll = average(allTrades.map(notional));
    const avgNotionalAfterLoss = average(pairs.map((p) => notional(p.next)));

    if (avgNotionalAll === 0) return null;

    const sizeRatio = avgNotionalAfterLoss / avgNotionalAll;
    if (sizeRatio < 1.5) return null;

    const relatedTradeIds = uniqueCapped(
      pairs.flatMap((p) => [p.loss.id, p.next.id]),
      MAX_RELATED_TRADE_IDS,
    );

    return {
      pattern: CoachInsightPattern.REVENGE_TRADING,
      metrics: {
        sampleSize: pairs.length,
        avgSizeAfterLoss: round(avgNotionalAfterLoss),
        avgSizeOverall: round(avgNotionalAll),
        sizeRatio: round(sizeRatio),
      },
      relatedTradeIds,
    };
  }

  /** Losers held far longer than the trader's own average hold time. */
  private detectHoldingLosersTooLong(closedTrades: CoachTradeInput[]): PatternFinding | null {
    const losers = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
    if (losers.length < 5) return null;

    const avgHoldAll = average(closedTrades.map(holdMinutes));
    const avgHoldLosers = average(losers.map(holdMinutes));

    if (avgHoldAll === 0 || avgHoldLosers < 1.6 * avgHoldAll) return null;

    const relatedTradeIds = [...losers]
      .sort((a, b) => holdMinutes(b) - holdMinutes(a))
      .slice(0, 8)
      .map((t) => t.id);

    return {
      pattern: CoachInsightPattern.HOLDING_LOSERS_TOO_LONG,
      metrics: {
        sampleSize: losers.length,
        avgHoldLosersMinutes: round(avgHoldLosers),
        avgHoldAllMinutes: round(avgHoldAll),
        ratio: round(avgHoldLosers / avgHoldAll),
      },
      relatedTradeIds,
    };
  }

  /** Winners closed far faster than the trader's own average hold time. */
  private detectCuttingWinnersShort(closedTrades: CoachTradeInput[]): PatternFinding | null {
    const winners = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
    if (winners.length < 5) return null;

    const avgHoldAll = average(closedTrades.map(holdMinutes));
    const avgHoldWinners = average(winners.map(holdMinutes));

    if (avgHoldAll === 0 || avgHoldWinners > 0.6 * avgHoldAll) return null;

    const relatedTradeIds = [...winners]
      .sort((a, b) => holdMinutes(a) - holdMinutes(b))
      .slice(0, 8)
      .map((t) => t.id);

    return {
      pattern: CoachInsightPattern.CUTTING_WINNERS_SHORT,
      metrics: {
        sampleSize: winners.length,
        avgHoldWinnersMinutes: round(avgHoldWinners),
        avgHoldAllMinutes: round(avgHoldAll),
        ratio: round(avgHoldWinners / avgHoldAll),
      },
      relatedTradeIds,
    };
  }

  /** Win rate meaningfully lower in one hour-of-day or day-of-week bucket. Reports the worst single bucket. */
  private detectTimeOfDayWeakness(closedTrades: CoachTradeInput[]): PatternFinding | null {
    const overallWinRate = winRate(closedTrades);

    const hourBuckets = groupBy(closedTrades, (t) => hourBucketLabel(t.openedAt));
    const weekdayBuckets = groupBy(closedTrades, (t) => weekdayLabel(t.openedAt));

    let worst: { label: string; type: 'hour' | 'weekday'; trades: CoachTradeInput[] } | null = null;
    let worstDeficit = 0;

    for (const [label, bucketTrades] of hourBuckets) {
      if (bucketTrades.length < 5) continue;
      const deficit = overallWinRate - winRate(bucketTrades);
      if (deficit > worstDeficit) {
        worstDeficit = deficit;
        worst = { label, type: 'hour', trades: bucketTrades };
      }
    }

    for (const [label, bucketTrades] of weekdayBuckets) {
      if (bucketTrades.length < 5) continue;
      const deficit = overallWinRate - winRate(bucketTrades);
      if (deficit > worstDeficit) {
        worstDeficit = deficit;
        worst = { label, type: 'weekday', trades: bucketTrades };
      }
    }

    if (!worst || worstDeficit < 0.2) return null;

    return {
      pattern: CoachInsightPattern.TIME_OF_DAY_WEAKNESS,
      metrics: {
        bucketType: worst.type,
        bucketLabel: worst.label,
        bucketWinRate: round(winRate(worst.trades) * 100),
        overallWinRate: round(overallWinRate * 100),
        sampleSize: worst.trades.length,
      },
      relatedTradeIds: worst.trades.slice(0, MAX_RELATED_TRADE_IDS).map((t) => t.id),
    };
  }

  /** Trades tagged with a given Emotion that consistently win less than the portfolio average. Reports the worst tag. */
  private detectTagCorrelation(
    closedTrades: CoachTradeInput[],
    journalRows: CoachJournalTagInput[],
  ): PatternFinding | null {
    const overallWinRate = winRate(closedTrades);
    const tradeById = new Map(closedTrades.map((t) => [t.id, t]));

    const byTag = new Map<string, CoachTradeInput[]>();

    for (const row of journalRows) {
      const trade = tradeById.get(row.tradeId);
      if (!trade) continue;

      for (const tag of row.tags) {
        if (tag.category !== JournalTagCategory.EMOTION) continue;
        const bucket = byTag.get(tag.name) ?? [];
        bucket.push(trade);
        byTag.set(tag.name, bucket);
      }
    }

    let worst: { tagName: string; trades: CoachTradeInput[] } | null = null;
    let worstDeficit = 0;

    for (const [tagName, bucketTrades] of byTag) {
      if (bucketTrades.length < 3) continue;
      const deficit = overallWinRate - winRate(bucketTrades);
      if (deficit > worstDeficit) {
        worstDeficit = deficit;
        worst = { tagName, trades: bucketTrades };
      }
    }

    if (!worst || worstDeficit < 0.25) return null;

    return {
      pattern: CoachInsightPattern.TAG_CORRELATION,
      metrics: {
        tagName: worst.tagName,
        tagWinRate: round(winRate(worst.trades) * 100),
        overallWinRate: round(overallWinRate * 100),
        sampleSize: worst.trades.length,
      },
      relatedTradeIds: worst.trades.slice(0, MAX_RELATED_TRADE_IDS).map((t) => t.id),
    };
  }

  /** A day with an outlier trade count (2+ std devs above the mean) where that day's win rate also dropped. */
  private detectOvertrading(
    allTrades: CoachTradeInput[],
    closedTrades: CoachTradeInput[],
  ): PatternFinding | null {
    const byDay = groupBy(allTrades, (t) => utcDateKey(t.openedAt));
    if (byDay.size < 5) return null;

    const counts = [...byDay.values()].map((day) => day.length);
    const meanCount = average(counts);
    const stddevCount = sampleStdDev(counts, meanCount);
    const threshold = meanCount + 2 * stddevCount;

    const overallWinRate = winRate(closedTrades);

    let worst: { date: string; trades: CoachTradeInput[]; dayWinRate: number } | null = null;

    for (const [date, dayTrades] of byDay) {
      if (dayTrades.length < 4 || dayTrades.length < threshold) continue;

      const dayClosed = dayTrades.filter((t) => t.status === 'CLOSED' && t.pnl !== null);
      if (dayClosed.length < 3) continue;

      const dayWinRate = winRate(dayClosed);
      if (dayWinRate > overallWinRate - 0.15) continue;

      if (!worst || dayTrades.length > worst.trades.length) {
        worst = { date, trades: dayTrades, dayWinRate };
      }
    }

    if (!worst) return null;

    return {
      pattern: CoachInsightPattern.OVERTRADING,
      metrics: {
        date: worst.date,
        tradeCount: worst.trades.length,
        avgDailyTradeCount: round(meanCount),
        winRateThatDay: round(worst.dayWinRate * 100),
        overallWinRate: round(overallWinRate * 100),
      },
      relatedTradeIds: worst.trades.slice(0, MAX_RELATED_TRADE_IDS).map((t) => t.id),
    };
  }

  /** Highly inconsistent position sizing with no relationship between size and outcome. */
  private detectPositionSizeInconsistency(closedTrades: CoachTradeInput[]): PatternFinding | null {
    const sizes = closedTrades.map(notional);
    const pnls = closedTrades.map((t) => t.pnl as number);

    const meanSize = average(sizes);
    if (meanSize === 0) return null;

    const cv = sampleStdDev(sizes, meanSize) / meanSize;
    const correlation = pearsonCorrelation(sizes, pnls);

    if (cv < 0.8 || Math.abs(correlation) >= 0.2) return null;

    const sortedBySize = [...closedTrades].sort((a, b) => notional(b) - notional(a));
    const relatedTradeIds = uniqueCapped(
      [...sortedBySize.slice(0, 3).map((t) => t.id), ...sortedBySize.slice(-3).map((t) => t.id)],
      8,
    );

    return {
      pattern: CoachInsightPattern.POSITION_SIZE_INCONSISTENCY,
      metrics: {
        sampleSize: closedTrades.length,
        coefficientOfVariation: round(cv),
        correlationWithPnl: round(correlation),
        avgSize: round(meanSize),
      },
      relatedTradeIds,
    };
  }
}

function notional(trade: CoachTradeInput): number {
  return trade.quantity * trade.entryPrice;
}

function holdMinutes(trade: CoachTradeInput): number {
  if (!trade.closedAt) return 0;
  return (trade.closedAt.getTime() - trade.openedAt.getTime()) / 60_000;
}

function winRate(trades: CoachTradeInput[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
  return wins / trades.length;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;

  const meanX = average(xs);
  const meanY = average(ys);

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - meanX;
    const dy = (ys[i] ?? 0) - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const NIGHT_BUCKET_LABEL = 'night (00-06 UTC)';

const HOUR_BUCKETS = [
  { label: NIGHT_BUCKET_LABEL, from: 0, to: 6 },
  { label: 'morning (06-12 UTC)', from: 6, to: 12 },
  { label: 'afternoon (12-18 UTC)', from: 12, to: 18 },
  { label: 'evening (18-24 UTC)', from: 18, to: 24 },
];

function hourBucketLabel(date: Date): string {
  const hour = date.getUTCHours();
  return HOUR_BUCKETS.find((b) => hour >= b.from && hour < b.to)?.label ?? NIGHT_BUCKET_LABEL;
}

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getUTCDay()] ?? WEEKDAY_LABELS[0];
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return map;
}

function uniqueCapped(ids: string[], max: number): string[] {
  return [...new Set(ids)].slice(0, max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
