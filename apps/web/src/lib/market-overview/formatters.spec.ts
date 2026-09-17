import {
  formatBytes,
  formatCompactNumber,
  formatCompactUsd,
  formatHashRate,
  formatPrice,
  formatSignedPercent,
  timeUntil,
} from './formatters';

describe('market-overview formatters', () => {
  it('formats large USD amounts compactly', () => {
    expect(formatCompactUsd(2_600_000_000_000)).toBe('$2.60T');
    expect(formatCompactUsd(103_000_000)).toBe('$103.00M');
  });

  it('formats large plain numbers compactly', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M');
  });

  it('signs a positive percent with a plus and a negative one with a minus', () => {
    expect(formatSignedPercent(1.234)).toBe('+1.23%');
    expect(formatSignedPercent(-1.234)).toBe('-1.23%');
  });

  it('uses more decimals for low-priced assets than high-priced ones', () => {
    expect(formatPrice(75888)).toBe('$75,888.00');
    expect(formatPrice(2.5)).toBe('$2.5000');
    expect(formatPrice(0.5)).toBe('$0.500000');
  });

  it('scales byte counts up to the largest readable unit', () => {
    expect(formatBytes(500)).toBe('500.0 B');
    expect(formatBytes(2_500_000)).toBe('2.4 MB');
  });

  it('scales blockchain.info hash rate (reported in GH/s) up to the largest readable unit', () => {
    expect(formatHashRate(994_691_260_041)).toBe('994.7 EH/s');
  });

  it('computes whole days until a future date, tagging it as not past', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const future = '2026-01-04T00:00:00.000Z';
    expect(timeUntil(future, now)).toEqual({ days: 3, isPast: false });
  });

  it('tags a date in the past accordingly, still as a positive day count', () => {
    const now = new Date('2026-01-04T00:00:00.000Z');
    const past = '2026-01-01T00:00:00.000Z';
    expect(timeUntil(past, now)).toEqual({ days: 3, isPast: true });
  });
});
