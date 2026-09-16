import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { sma, rsi } from '@/modules/backtests/indicators';

import {
  BreadthData,
  CryptoMarketCapData,
  DominanceData,
  MarketMover,
  TechnicalReadout,
} from '../types/market-overview-data';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const BREADTH_UNIVERSE_SIZE = 100;
const TOP_MOVERS_COUNT = 3;
/**
 * `/market_chart`, not `/ohlc` — CoinGecko's OHLC endpoint only accepts a
 * fixed set of `days` values (1/7/14/30/90/180/365) and switches to 4-day
 * candles past 30 days, which would silently make "SMA50/SMA200" span 200/800
 * days instead of the expected 50/200. `/market_chart` auto-selects daily
 * granularity for any `days` over 90 on the free tier, so this is both a
 * valid request and actually daily bars. 250 gives enough history for a
 * 200-period SMA plus warm-up.
 */
const DAILY_HISTORY_DAYS = 250;

interface CoinGeckoGlobal {
  data: {
    total_market_cap: { usd: number };
    market_cap_change_percentage_24h_usd: number;
    market_cap_percentage: { btc: number; eth: number };
  };
}

interface CoinGeckoMarketCoin {
  symbol: string;
  name: string;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
}

@Injectable()
export class CryptoMarketService {
  private readonly logger = new Logger(CryptoMarketService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchGlobal(): Promise<{
    marketCap: CryptoMarketCapData;
    dominance: DominanceData;
  } | null> {
    try {
      const payload = await this.getJson<CoinGeckoGlobal>('/global');

      return {
        marketCap: {
          totalUsd: payload.data.total_market_cap.usd,
          change24hPct: payload.data.market_cap_change_percentage_24h_usd,
        },
        dominance: {
          btcPct: payload.data.market_cap_percentage.btc,
          ethPct: payload.data.market_cap_percentage.eth,
        },
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch CoinGecko /global: ${(err as Error).message}`);
      return null;
    }
  }

  async fetchBreadth(): Promise<BreadthData | null> {
    try {
      const coins = await this.getJson<CoinGeckoMarketCoin[]>(
        `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${BREADTH_UNIVERSE_SIZE}&page=1&price_change_percentage=24h`,
      );

      const withChange = coins.filter((c) => c.price_change_percentage_24h !== null);
      const greenCount = withChange.filter((c) => c.price_change_percentage_24h! > 0).length;

      const sorted = [...withChange].sort(
        (a, b) => b.price_change_percentage_24h! - a.price_change_percentage_24h!,
      );

      const toMover = (c: CoinGeckoMarketCoin): MarketMover => ({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        change24hPct: c.price_change_percentage_24h!,
      });

      return {
        greenCount,
        totalCount: withChange.length,
        topGainers: sorted.slice(0, TOP_MOVERS_COUNT).map(toMover),
        topLosers: sorted.slice(-TOP_MOVERS_COUNT).reverse().map(toMover),
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch CoinGecko market breadth: ${(err as Error).message}`);
      return null;
    }
  }

  async fetchStablecoinMarketCap(): Promise<number | null> {
    try {
      const coins = await this.getJson<CoinGeckoMarketCoin[]>(
        `/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=250&page=1`,
      );

      return coins.reduce((sum, c) => sum + (c.market_cap ?? 0), 0);
    } catch (err) {
      this.logger.warn(`Failed to fetch stablecoin market cap: ${(err as Error).message}`);
      return null;
    }
  }

  /** Throws on failure (rather than falling back to a null-filled readout) so the caller's own tracking sees this as a failed source, same as every other fetch here. */
  async fetchTechnicals(
    coinId: string,
    priceUsd: number,
    change24hPct: number,
  ): Promise<TechnicalReadout> {
    const chart = await this.getJson<{ prices: [number, number][] }>(
      `/coins/${coinId}/market_chart?vs_currency=usd&days=${DAILY_HISTORY_DAYS}`,
    );

    const closes = chart.prices.map(([, price]) => price);
    const sma50Series = sma(closes, 50);
    const sma200Series = sma(closes, 200);
    const rsiSeries = rsi(closes, 14);

    const sma50 = sma50Series[sma50Series.length - 1] ?? null;
    const sma200 = sma200Series[sma200Series.length - 1] ?? null;
    const rsi14 = rsiSeries[rsiSeries.length - 1] ?? null;

    let trend: TechnicalReadout['trend'] = null;
    if (sma50 !== null && sma200 !== null) {
      if (priceUsd > sma50 && priceUsd > sma200) trend = 'ABOVE_BOTH';
      else if (priceUsd < sma50 && priceUsd < sma200) trend = 'BELOW_BOTH';
      else trend = 'MIXED';
    }

    return { priceUsd, change24hPct, rsi14, sma50, sma200, trend };
  }

  /**
   * CoinGecko's free public rate limit is tight enough that a handful of
   * calls made back-to-back (this module makes several per refresh) can
   * trip a 429 — retried once after a short wait, which usually clears it
   * since the limit resets per-minute. An optional demo API key (free,
   * self-service signup) raises the limit if configured.
   */
  private async getJson<T>(path: string): Promise<T> {
    const apiKey = this.configService.get<string>('coinGecko.apiKey');
    const headers: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

    let response = await fetch(`${COINGECKO_BASE_URL}${path}`, { headers });

    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 8000));
      response = await fetch(`${COINGECKO_BASE_URL}${path}`, { headers });
    }

    if (!response.ok) throw new Error(`status ${response.status}`);
    return response.json() as Promise<T>;
  }
}
