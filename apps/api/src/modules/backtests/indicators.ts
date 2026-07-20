/**
 * Pure indicator functions over a price series. Each returns an array the
 * same length as the input, with `null` for indices that don't have enough
 * preceding data yet — callers align by index against the candle array.
 */

export function sma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);

  let windowSum = 0;
  for (let i = 0; i < values.length; i++) {
    windowSum += values[i] ?? 0;
    if (i >= period) {
      windowSum -= values[i - period] ?? 0;
    }
    if (i >= period - 1) {
      result[i] = windowSum / period;
    }
  }

  return result;
}

/** Wilder's RSI — the standard smoothing convention (not a simple average of a rolling window). */
export function rsi(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    if (change >= 0) avgGain += change;
    else avgLoss += -change;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = rsiFromAverages(avgGain, avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = rsiFromAverages(avgGain, avgLoss);
  }

  return result;
}

function rsiFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface DonchianChannel {
  upper: number | null;
  lower: number | null;
}

/** Highest high / lowest low over the *preceding* `period` bars (excludes the current bar, so a breakout can be detected against it). */
export function donchian(highs: number[], lows: number[], period: number): DonchianChannel[] {
  const result: DonchianChannel[] = new Array(highs.length).fill(null).map(() => ({
    upper: null,
    lower: null,
  }));

  for (let i = period; i < highs.length; i++) {
    let upper = -Infinity;
    let lower = Infinity;

    for (let j = i - period; j < i; j++) {
      const h = highs[j] ?? -Infinity;
      const l = lows[j] ?? Infinity;
      if (h > upper) upper = h;
      if (l < lower) lower = l;
    }

    result[i] = { upper, lower };
  }

  return result;
}
