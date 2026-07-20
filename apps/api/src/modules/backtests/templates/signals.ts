import { BadRequestException } from '@nestjs/common';
import { BacktestTemplate } from '@cryptotrade/database';

import { Candle } from '../types/candle';
import { donchian, rsi, sma } from '../indicators';

/**
 * Every template reduces to the same shape: a boolean "should be long right
 * now" per bar. The simulator (see simulator.ts) turns that into actual
 * entries/exits — templates never touch position/PnL logic directly.
 */
export type Signal = boolean[];

const TEMPLATE_PARAM_SPECS: Record<BacktestTemplate, string[]> = {
  MA_CROSSOVER: ['fastPeriod', 'slowPeriod'],
  RSI_THRESHOLD: ['period', 'oversold', 'overbought'],
  DONCHIAN_BREAKOUT: ['period'],
};

/** Throws a clear 400 if a required numeric param is missing — checked once, up front, before any candle fetch. */
export function validateTemplateParams(
  template: BacktestTemplate,
  params: Record<string, number>,
): void {
  const required = TEMPLATE_PARAM_SPECS[template];
  const missing = required.filter(
    (key) => typeof params[key] !== 'number' || Number.isNaN(params[key]),
  );

  if (missing.length > 0) {
    throw new BadRequestException(
      `${template} requires numeric params: ${required.join(', ')} — missing/invalid: ${missing.join(', ')}`,
    );
  }

  if (
    template === 'MA_CROSSOVER' &&
    requireNumber(params, 'fastPeriod') >= requireNumber(params, 'slowPeriod')
  ) {
    throw new BadRequestException('fastPeriod must be less than slowPeriod');
  }

  if (template === 'RSI_THRESHOLD') {
    const oversold = requireNumber(params, 'oversold');
    const overbought = requireNumber(params, 'overbought');
    if (oversold < 0 || overbought > 100 || oversold >= overbought) {
      throw new BadRequestException('oversold must be < overbought, both within 0-100');
    }
  }
}

export function computeSignal(
  template: BacktestTemplate,
  candles: Candle[],
  params: Record<string, number>,
): Signal {
  switch (template) {
    case 'MA_CROSSOVER':
      return maCrossoverSignal(candles, params);
    case 'RSI_THRESHOLD':
      return rsiThresholdSignal(candles, params);
    case 'DONCHIAN_BREAKOUT':
      return donchianBreakoutSignal(candles, params);
  }
}

/** validateTemplateParams already confirmed this key exists as a number — this just satisfies noUncheckedIndexedAccess. */
function requireNumber(params: Record<string, number>, key: string): number {
  return params[key] ?? 0;
}

function maCrossoverSignal(candles: Candle[], params: Record<string, number>): Signal {
  const closes = candles.map((c) => c.close);
  const fast = sma(closes, requireNumber(params, 'fastPeriod'));
  const slow = sma(closes, requireNumber(params, 'slowPeriod'));

  return candles.map((_, i) => {
    const f = fast[i];
    const s = slow[i];
    return f !== null && f !== undefined && s !== null && s !== undefined && f > s;
  });
}

/** Enters long on an RSI cross up through `oversold` (momentum recovering), exits once RSI exceeds `overbought`. */
function rsiThresholdSignal(candles: Candle[], params: Record<string, number>): Signal {
  const closes = candles.map((c) => c.close);
  const values = rsi(closes, requireNumber(params, 'period'));
  const oversold = requireNumber(params, 'oversold');
  const overbought = requireNumber(params, 'overbought');

  const signal: Signal = new Array(candles.length).fill(false);
  let inPosition = false;

  for (let i = 0; i < candles.length; i++) {
    const value = values[i];
    if (value === null || value === undefined) {
      signal[i] = false;
      continue;
    }

    const previous = values[i - 1];

    if (!inPosition && value > oversold && (previous ?? value) <= oversold) {
      inPosition = true;
    } else if (inPosition && value > overbought) {
      inPosition = false;
    }

    signal[i] = inPosition;
  }

  return signal;
}

/** Classic Donchian/Turtle breakout: long above the N-bar high, flat below the N-bar low. */
function donchianBreakoutSignal(candles: Candle[], params: Record<string, number>): Signal {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const channel = donchian(highs, lows, requireNumber(params, 'period'));

  const signal: Signal = new Array(candles.length).fill(false);
  let inPosition = false;

  for (let i = 0; i < candles.length; i++) {
    const bar = channel[i];
    if (!bar || bar.upper === null || bar.lower === null) {
      signal[i] = false;
      continue;
    }

    const close = candles[i]?.close ?? 0;
    if (!inPosition && close > bar.upper) inPosition = true;
    else if (inPosition && close < bar.lower) inPosition = false;

    signal[i] = inPosition;
  }

  return signal;
}
