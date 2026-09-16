export function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatSignedPercent(value: number, decimals = 2): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
}

export function formatPrice(value: number): string {
  const decimals = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Bytes -> the largest unit that keeps the number readable (mempool size is usually MB). */
export function formatBytes(value: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let scaled = value;

  while (scaled >= 1024 && unitIndex < units.length - 1) {
    scaled /= 1024;
    unitIndex++;
  }

  return `${scaled.toFixed(1)} ${units[unitIndex]}`;
}

/** blockchain.info reports hash rate in GH/s. */
export function formatHashRate(hashRateGhs: number): string {
  const unitsFromGh = ['GH/s', 'TH/s', 'PH/s', 'EH/s'];
  let scaled = hashRateGhs;
  let unitIndex = 0;

  while (scaled >= 1000 && unitIndex < unitsFromGh.length - 1) {
    scaled /= 1000;
    unitIndex++;
  }

  return `${scaled.toFixed(1)} ${unitsFromGh[unitIndex]}`;
}

export function timeUntil(iso: string, now = new Date()): { days: number; isPast: boolean } {
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  return { days: Math.abs(Math.round(diffMs / (24 * 60 * 60 * 1000))), isPast: diffMs < 0 };
}
