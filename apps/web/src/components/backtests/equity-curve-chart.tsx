import type { EquityPoint } from '@/types/backtest';

type EquityCurveChartProps = {
  points: EquityPoint[];
};

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 8;

/** Lightweight inline SVG — no charting dependency for a single polyline. */
export function EquityCurveChart({ points }: EquityCurveChartProps) {
  if (points.length < 2) {
    return null;
  }

  const values = points.map((p) => p.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (WIDTH - PADDING * 2) / (points.length - 1);

  const path = points
    .map((point, i) => {
      const x = PADDING + i * stepX;
      const y = PADDING + (HEIGHT - PADDING * 2) * (1 - (point.equity - min) / range);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const isUp = firstPoint && lastPoint ? lastPoint.equity >= firstPoint.equity : true;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Equity curve"
    >
      <path d={path} fill="none" stroke={isUp ? '#34d399' : '#f87171'} strokeWidth={2} />
    </svg>
  );
}
