import {
  formatCurrency,
  formatDecimal,
  formatPercent,
  formatSignedCurrency,
  formatSignedPnl,
} from './formatters';

describe('dashboard formatters', () => {
  it('formats currency with the given currency code', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('1,234.5 USD');
  });

  it('formats percent with 2 decimals by default', () => {
    expect(formatPercent(12.3456)).toBe('12.35%');
  });

  it('formats percent with a custom decimal count', () => {
    expect(formatPercent(12.3456, 0)).toBe('12%');
  });

  it('formats a decimal with 2 places by default', () => {
    expect(formatDecimal(3)).toBe('3.00');
  });

  it('prefixes positive PnL with a plus sign', () => {
    expect(formatSignedPnl(42)).toBe('+42');
  });

  it('does not add a plus sign for negative or zero PnL', () => {
    expect(formatSignedPnl(-42)).toBe('-42');
    expect(formatSignedPnl(0)).toBe('0');
  });

  it('prefixes positive signed currency with a plus sign', () => {
    expect(formatSignedCurrency(100, 'USD')).toBe('+100 USD');
  });

  it('does not prefix negative signed currency (the minus sign already reads correctly)', () => {
    expect(formatSignedCurrency(-100, 'USD')).toBe('-100 USD');
  });
});
