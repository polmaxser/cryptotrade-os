import { Candle } from '@/modules/market-data/types/candle';

import { simulate } from './simulator';
import { Signal } from './templates/signals';

function candle(openTime: number, close: number): Candle {
  return { openTime, open: close, high: close, low: close, close, volume: 0 };
}

describe('simulate', () => {
  it('returns a flat, empty result for no candles', () => {
    const result = simulate([], [], 1000, 0.1);

    expect(result.trades).toEqual([]);
    expect(result.equityCurve).toEqual([]);
    expect(result.summary).toEqual({
      totalTrades: 0,
      winRate: 0,
      totalPnlPercent: 0,
      profitFactor: null,
      maxDrawdownPercent: 0,
      finalEquity: 1000,
    });
  });

  it('produces exactly 0% PnL on a flat round trip with no fees', () => {
    const candles = [candle(1, 100), candle(2, 100)];
    const signal: Signal = [true, false];

    const result = simulate(candles, signal, 1000, 0);

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toMatchObject({ entryPrice: 100, exitPrice: 100, pnlPercent: 0 });
    expect(result.summary.finalEquity).toBe(1000);
    expect(result.summary.totalPnlPercent).toBe(0);
    expect(result.summary.profitFactor).toBeNull();
  });

  it('applies the fee on both entry and exit, dragging PnL below the gross result', () => {
    const candles = [candle(1, 100), candle(2, 100)];
    const signal: Signal = [true, false];

    // 0.1% fee charged on entry (1000 -> 999) and again on exit (999 -> 998.001,
    // rounded to 998) — a flat round trip loses ~0.2% purely to fees.
    const result = simulate(candles, signal, 1000, 0.1);

    expect(result.trades[0].pnlPercent).toBe(-0.1);
    expect(result.summary.finalEquity).toBe(998);
    expect(result.summary.totalPnlPercent).toBe(-0.2);
  });

  it('marks the open position to market bar-by-bar and tracks the resulting drawdown', () => {
    const candles = [candle(1, 100), candle(2, 90), candle(3, 120)];
    const signal: Signal = [true, true, false];

    const result = simulate(candles, signal, 1000, 0);

    // Mid-trade dip to 90 against a 100 entry is a 10% mark-to-market drawdown,
    // even though the trade eventually closes at a 20% gain.
    expect(result.equityCurve[1]?.equity).toBe(900);
    expect(result.summary.maxDrawdownPercent).toBe(10);
    expect(result.trades[0]).toMatchObject({ entryPrice: 100, exitPrice: 120, pnlPercent: 20 });
    expect(result.summary.finalEquity).toBe(1200);
    expect(result.summary.winRate).toBe(100);
  });

  it('force-closes a position still open on the final candle', () => {
    const candles = [candle(1, 100), candle(2, 110)];
    const signal: Signal = [true, true];

    const result = simulate(candles, signal, 1000, 0);

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toMatchObject({ exitTime: 2, exitPrice: 110, pnlPercent: 10 });
    expect(result.summary.finalEquity).toBe(1100);
  });

  it('computes profitFactor as gross profit over gross loss across winners and losers', () => {
    // Trade 1: 100 -> 120 (+20%). Trade 2: 120 -> 108 (-10%).
    const candles = [candle(1, 100), candle(2, 120), candle(3, 120), candle(4, 108)];
    const signal: Signal = [true, false, true, false];

    const result = simulate(candles, signal, 1000, 0);

    expect(result.trades).toHaveLength(2);
    expect(result.summary.winRate).toBe(50);
    expect(result.summary.profitFactor).toBe(2); // 20 / 10
  });
});
