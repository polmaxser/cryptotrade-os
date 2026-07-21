import { donchian, rsi, sma } from './indicators';

describe('sma', () => {
  it('returns null until enough data exists, then the trailing average', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('handles a period equal to the series length', () => {
    expect(sma([2, 4, 6], 3)).toEqual([null, null, 4]);
  });
});

describe('rsi', () => {
  it("computes Wilder's RSI with the standard smoothing convention", () => {
    // Hand-computed: avgGain/avgLoss seeded from the first `period` changes
    // (simple average), then smoothed as (prevAvg*(period-1)+current)/period.
    expect(rsi([1, 2, 3, 2, 1], 2)).toEqual([null, null, 100, 50, 25]);
  });

  it('returns all nulls when there is not enough data for even one value', () => {
    expect(rsi([1, 2], 5)).toEqual([null, null]);
  });

  it('returns 100 when there have been no losses in the seed window', () => {
    const result = rsi([10, 11, 12, 13], 3);
    expect(result[3]).toBe(100);
  });
});

describe('donchian', () => {
  it('computes the highest-high/lowest-low over the preceding period, excluding the current bar', () => {
    const highs = [1, 3, 2, 5, 4];
    const lows = [1, 1, 1, 2, 3];

    expect(donchian(highs, lows, 2)).toEqual([
      { upper: null, lower: null },
      { upper: null, lower: null },
      { upper: 3, lower: 1 },
      { upper: 3, lower: 1 },
      { upper: 5, lower: 1 },
    ]);
  });
});
