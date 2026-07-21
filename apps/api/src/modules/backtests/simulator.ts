import { Candle } from '@/modules/market-data/types/candle';

import { Signal } from './templates/signals';

export interface SimulatedTrade {
  side: 'LONG';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  /** Net of both entry and exit fees. */
  pnlPercent: number;
}

export interface EquityPoint {
  time: number;
  equity: number;
}

export interface BacktestSummary {
  totalTrades: number;
  winRate: number;
  totalPnlPercent: number;
  profitFactor: number | null;
  maxDrawdownPercent: number;
  finalEquity: number;
}

export interface SimulationResult {
  trades: SimulatedTrade[];
  equityCurve: EquityPoint[];
  summary: BacktestSummary;
}

interface OpenPosition {
  entryTime: number;
  entryPrice: number;
  /** Equity at the moment this position was opened (after the entry fee) — the base every trade's pnlPercent is measured against. */
  equityAtEntry: number;
}

/**
 * Single-position, long-only, always-fully-invested simulation: on a signal
 * flip to true it enters with 100% of current equity, flips to false it
 * exits entirely — no pyramiding, no partial sizing. That's a deliberate
 * MVP simplification (see docs/ai_coach.md-style scope notes elsewhere in
 * this codebase for the pattern): simple enough to reason about and audit,
 * not a claim that real position sizing wouldn't matter.
 */
export function simulate(
  candles: Candle[],
  signal: Signal,
  startingCapital: number,
  feePercent: number,
): SimulationResult {
  if (candles.length === 0) {
    return {
      trades: [],
      equityCurve: [],
      summary: {
        totalTrades: 0,
        winRate: 0,
        totalPnlPercent: 0,
        profitFactor: null,
        maxDrawdownPercent: 0,
        finalEquity: startingCapital,
      },
    };
  }

  const feeRate = feePercent / 100;
  const trades: SimulatedTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  let equity = startingCapital;
  let peak = startingCapital;
  let maxDrawdownPercent = 0;
  let position: OpenPosition | null = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;

    const wantLong = signal[i] ?? false;

    if (wantLong && !position) {
      equity *= 1 - feeRate;
      position = { entryTime: candle.openTime, entryPrice: candle.close, equityAtEntry: equity };
    } else if (!wantLong && position) {
      equity = closePosition(position, candle.close, feeRate);
      trades.push(buildTrade(position, candle.openTime, candle.close, equity));
      position = null;
    }

    const markedEquity = position
      ? position.equityAtEntry * (1 + (candle.close - position.entryPrice) / position.entryPrice)
      : equity;

    equityCurve.push({ time: candle.openTime, equity: round(markedEquity) });

    if (markedEquity > peak) peak = markedEquity;
    const drawdown = peak > 0 ? ((peak - markedEquity) / peak) * 100 : 0;
    if (drawdown > maxDrawdownPercent) maxDrawdownPercent = drawdown;
  }

  if (position) {
    const lastCandle = candles[candles.length - 1];
    if (lastCandle) {
      equity = closePosition(position, lastCandle.close, feeRate);
      trades.push(buildTrade(position, lastCandle.openTime, lastCandle.close, equity));
    }
  }

  const winners = trades.filter((t) => t.pnlPercent > 0);
  const losers = trades.filter((t) => t.pnlPercent < 0);
  const grossProfit = winners.reduce((sum, t) => sum + t.pnlPercent, 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnlPercent, 0));

  const summary: BacktestSummary = {
    totalTrades: trades.length,
    winRate: trades.length > 0 ? round((winners.length / trades.length) * 100) : 0,
    totalPnlPercent: round(((equity - startingCapital) / startingCapital) * 100),
    profitFactor: grossLoss > 0 ? round(grossProfit / grossLoss) : null,
    maxDrawdownPercent: round(maxDrawdownPercent),
    finalEquity: round(equity),
  };

  return { trades, equityCurve, summary };
}

function closePosition(position: OpenPosition, exitPrice: number, feeRate: number): number {
  const grossReturn = (exitPrice - position.entryPrice) / position.entryPrice;
  return position.equityAtEntry * (1 + grossReturn) * (1 - feeRate);
}

function buildTrade(
  position: OpenPosition,
  exitTime: number,
  exitPrice: number,
  equityAfterExit: number,
): SimulatedTrade {
  return {
    side: 'LONG',
    entryTime: position.entryTime,
    entryPrice: position.entryPrice,
    exitTime,
    exitPrice,
    pnlPercent: round(((equityAfterExit - position.equityAtEntry) / position.equityAtEntry) * 100),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
