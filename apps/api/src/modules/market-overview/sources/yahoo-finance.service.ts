import { Injectable, Logger } from '@nestjs/common';

import { IndexQuote } from '../types/market-overview-data';

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/** Yahoo's unofficial (but widely relied-on) chart endpoint — no API key, but not an officially supported/documented API either. */
interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        regularMarketChangePercent: number;
      };
    }> | null;
    error: unknown;
  };
}

export const YAHOO_SYMBOLS = {
  sp500: '%5EGSPC',
  nasdaq: '%5EIXIC',
  dow: '%5EDJI',
  vix: '%5EVIX',
  dxy: 'DX-Y.NYB',
  us10y: '%5ETNX',
} as const;

/**
 * US equity/rates indices, no API key. Fetches every symbol independently
 * (Promise.allSettled at the call site) so one dead/renamed symbol doesn't
 * take the whole US-markets section down.
 */
@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);

  async fetchQuote(symbol: string): Promise<IndexQuote | null> {
    try {
      const response = await fetch(`${YAHOO_CHART_URL}/${symbol}?range=5d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!response.ok) throw new Error(`status ${response.status}`);

      const payload = (await response.json()) as YahooChartResponse;
      const meta = payload.chart.result?.[0]?.meta;
      if (!meta) throw new Error('no result in response');

      return {
        price: meta.regularMarketPrice,
        changePct: meta.regularMarketChangePercent,
      };
    } catch (err) {
      this.logger.warn(
        `Failed to fetch Yahoo Finance quote for ${symbol}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
