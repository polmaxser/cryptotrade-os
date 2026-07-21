import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

import { Candle } from './types/candle';

const BINANCE_BASE_URL = 'https://api.binance.com';
const PAGE_LIMIT = 1000;
/** Safety cap so a very wide range/fine timeframe can't hang a request or blow up compute — rejected upfront, not silently truncated. */
const MAX_CANDLES = 5000;

/** ms per Binance kline interval — used to validate a requested range won't exceed MAX_CANDLES before fetching anything. */
const INTERVAL_MS: Record<string, number> = {
  '1m': 60_000,
  '3m': 3 * 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '2h': 2 * 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '6h': 6 * 60 * 60_000,
  '8h': 8 * 60 * 60_000,
  '12h': 12 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '3d': 3 * 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
};

export const SUPPORTED_TIMEFRAMES = Object.keys(INTERVAL_MS);

interface BinanceKline extends Array<string | number> {
  0: number; // open time
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
  5: string; // volume
  6: number; // close time
}

/**
 * Thin, read-only wrapper over Binance's public (unauthenticated) klines
 * endpoint — the historical-candle data source for backtesting. No API key
 * needed since /api/v3/klines is public market data, not account data.
 */
@Injectable()
export class BinanceKlinesService {
  async fetchCandles(symbol: string, timeframe: string, from: Date, to: Date): Promise<Candle[]> {
    const intervalMs = INTERVAL_MS[timeframe];
    if (!intervalMs) {
      throw new BadRequestException(
        `Unsupported timeframe "${timeframe}" — supported: ${SUPPORTED_TIMEFRAMES.join(', ')}`,
      );
    }

    const estimatedCandles = Math.ceil((to.getTime() - from.getTime()) / intervalMs);
    if (estimatedCandles > MAX_CANDLES) {
      throw new BadRequestException(
        `This period at ${timeframe} would need ~${estimatedCandles} candles, over the ${MAX_CANDLES} limit — narrow the date range or use a larger timeframe.`,
      );
    }

    const candles: Candle[] = [];
    let cursor = from.getTime();
    const end = to.getTime();

    while (cursor < end) {
      const batch = await this.fetchPage(symbol, timeframe, cursor, end);
      if (batch.length === 0) break;

      candles.push(...batch);

      const lastOpenTime = batch[batch.length - 1]?.openTime ?? cursor;
      const nextCursor = lastOpenTime + intervalMs;
      if (nextCursor <= cursor) break;
      cursor = nextCursor;

      if (batch.length < PAGE_LIMIT) break;
    }

    return candles;
  }

  private async fetchPage(
    symbol: string,
    timeframe: string,
    startTime: number,
    endTime: number,
  ): Promise<Candle[]> {
    const query = new URLSearchParams({
      symbol,
      interval: timeframe,
      startTime: String(startTime),
      endTime: String(endTime),
      limit: String(PAGE_LIMIT),
    });

    let response: globalThis.Response;

    try {
      response = await fetch(`${BINANCE_BASE_URL}/api/v3/klines?${query.toString()}`);
    } catch {
      throw new ServiceUnavailableException('Could not reach Binance market data');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(`Binance rejected the request (${response.status}): ${body}`);
    }

    const raw = (await response.json()) as BinanceKline[];

    return raw.map((kline) => ({
      openTime: kline[0],
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5]),
    }));
  }
}
