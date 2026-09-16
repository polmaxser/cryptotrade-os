import { cn } from '@/lib/utils';

type GaugeProps = {
  value: number;
  min: number;
  max: number;
  /** 'green-high': low end reads as risk/fear (red), high end as calm/greed (green) — Fear & Greed. 'red-high' flips it — VIX, where high is the fear signal. */
  direction: 'green-high' | 'red-high';
  minLabel: string;
  maxLabel: string;
};

/**
 * A single-value scale meter — not a chart (no series, no axis to read
 * points off), just a labeled position on a fixed 0-100-style range. Status
 * colors (red/amber/green) are used for their reserved purpose here: the
 * position on the scale, not an identity.
 */
export function Gauge({ value, min, max, direction, minLabel, maxLabel }: GaugeProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const gradient =
    direction === 'green-high'
      ? 'linear-gradient(to right, rgb(239 68 68), rgb(245 158 11), rgb(16 185 129))'
      : 'linear-gradient(to right, rgb(16 185 129), rgb(245 158 11), rgb(239 68 68))';

  return (
    <div className="space-y-1.5">
      <div className="relative h-2.5 rounded-full" style={{ backgroundImage: gradient }}>
        <div
          className="border-background absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className={cn('text-muted-foreground flex justify-between text-xs')}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
