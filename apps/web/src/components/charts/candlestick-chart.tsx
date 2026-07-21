'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  createChart,
  CandlestickSeries,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@/types/candle';

const CHART_HEIGHT = 420;

const THEME_COLORS = {
  dark: { background: '#0f0f10', text: '#fafafa', border: '#29282b' },
  light: { background: '#ffffff', text: '#0a0a0b', border: '#e4e4e7' },
};

type CandlestickChartProps = {
  candles: Candle[];
};

function toSeriesData(candles: Candle[]): CandlestickData[] {
  return candles.map((candle) => ({
    time: Math.floor(candle.openTime / 1000) as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));
}

export function CandlestickChart({ candles }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { resolvedTheme } = useTheme();

  // Recreated only on theme change — lightweight-charts has no live
  // light/dark toggle, so this rebuilds the chart with the new palette and
  // re-applies whatever candles are current at that moment. Data-only
  // refreshes (new symbol/timeframe) are handled by the effect below
  // without tearing the chart down.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = resolvedTheme === 'light' ? THEME_COLORS.light : THEME_COLORS.dark;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: CHART_HEIGHT,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.border },
        horzLines: { color: colors.border },
      },
      timeScale: { borderColor: colors.border },
      rightPriceScale: { borderColor: colors.border },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#34d399',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#34d399',
      wickDownColor: '#f87171',
    });
    series.setData(toSeriesData(candles));
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [resolvedTheme]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(toSeriesData(candles));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="w-full" />;
}
