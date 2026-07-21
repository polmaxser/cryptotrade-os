import { BadRequestException } from '@nestjs/common';

import { Candle } from '@/modules/market-data/types/candle';

import { computeSignal, validateTemplateParams } from './signals';

function candle(openTime: number, close: number, high = close, low = close): Candle {
  return { openTime, open: close, high, low, close, volume: 0 };
}

describe('validateTemplateParams', () => {
  it('throws when a required MA_CROSSOVER param is missing', () => {
    expect(() => validateTemplateParams('MA_CROSSOVER', { fastPeriod: 9 })).toThrow(
      BadRequestException,
    );
  });

  it('throws when MA_CROSSOVER fastPeriod is not less than slowPeriod', () => {
    expect(() => validateTemplateParams('MA_CROSSOVER', { fastPeriod: 21, slowPeriod: 9 })).toThrow(
      BadRequestException,
    );
  });

  it('accepts valid MA_CROSSOVER params', () => {
    expect(() =>
      validateTemplateParams('MA_CROSSOVER', { fastPeriod: 9, slowPeriod: 21 }),
    ).not.toThrow();
  });

  it('throws when RSI_THRESHOLD oversold is not less than overbought', () => {
    expect(() =>
      validateTemplateParams('RSI_THRESHOLD', { period: 14, oversold: 70, overbought: 30 }),
    ).toThrow(BadRequestException);
  });

  it('throws when RSI_THRESHOLD levels are outside 0-100', () => {
    expect(() =>
      validateTemplateParams('RSI_THRESHOLD', { period: 14, oversold: -5, overbought: 70 }),
    ).toThrow(BadRequestException);
  });

  it('accepts valid RSI_THRESHOLD params', () => {
    expect(() =>
      validateTemplateParams('RSI_THRESHOLD', { period: 14, oversold: 30, overbought: 70 }),
    ).not.toThrow();
  });

  it('throws when DONCHIAN_BREAKOUT is missing its period', () => {
    expect(() => validateTemplateParams('DONCHIAN_BREAKOUT', {})).toThrow(BadRequestException);
  });

  it('accepts valid DONCHIAN_BREAKOUT params', () => {
    expect(() => validateTemplateParams('DONCHIAN_BREAKOUT', { period: 20 })).not.toThrow();
  });
});

describe('computeSignal — MA_CROSSOVER', () => {
  it('goes long once the fast MA is above the slow MA, flat once it drops back below', () => {
    // fastPeriod 1 makes the fast MA equal the close itself; slowPeriod 2 is
    // a trailing 2-bar average — both already covered in isolation by
    // indicators.spec.ts, so this only exercises the fast > slow composition.
    const candles = [candle(1, 10), candle(2, 20), candle(3, 10), candle(4, 20)];

    const signal = computeSignal('MA_CROSSOVER', candles, { fastPeriod: 1, slowPeriod: 2 });

    expect(signal).toEqual([false, true, false, true]);
  });
});

describe('computeSignal — RSI_THRESHOLD', () => {
  it('enters on a real cross up through oversold and exits the bar RSI crosses overbought', () => {
    // closes chosen (period=2) so RSI dips to 0, then climbs through 40,
    // then past 90, then falls back — hand-traced against Wilder's smoothing.
    const candles = [
      candle(1, 10),
      candle(2, 9),
      candle(3, 8),
      candle(4, 15),
      candle(5, 20),
      candle(6, 12),
    ];

    const signal = computeSignal('RSI_THRESHOLD', candles, {
      period: 2,
      oversold: 40,
      overbought: 90,
    });

    expect(signal).toEqual([false, false, false, true, false, false]);
  });

  it('stays flat while RSI has no value yet', () => {
    const candles = [candle(1, 10), candle(2, 11)];

    const signal = computeSignal('RSI_THRESHOLD', candles, {
      period: 14,
      oversold: 30,
      overbought: 70,
    });

    expect(signal).toEqual([false, false]);
  });
});

describe('computeSignal — DONCHIAN_BREAKOUT', () => {
  it('goes long on a close above the prior-N-bar high, flat on a close below the prior-N-bar low', () => {
    const candles = [
      candle(1, 1, 1, 1),
      candle(2, 3, 3, 1),
      candle(3, 2, 2, 1),
      candle(4, 4, 5, 2),
      candle(5, 0, 4, 3),
    ];

    const signal = computeSignal('DONCHIAN_BREAKOUT', candles, { period: 2 });

    expect(signal).toEqual([false, false, false, true, false]);
  });
});
