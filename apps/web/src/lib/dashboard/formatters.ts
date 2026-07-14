export function formatCurrency(value: number, currency: string): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatSignedPnl(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value}`;
}

export function formatSignedCurrency(value: number, currency: string): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatCurrency(value, currency)}`;
}
