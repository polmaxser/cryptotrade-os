import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

export interface CoinPrice {
  usd: number;
  usd24hChange: number;
}

interface CachedEntry<T> {
  data: T;
  expiresAt: number;
}

interface CoinGeckoSearchResponse {
  coins: Array<{ id: string; name: string; symbol: string; thumb: string }>;
}

type CoinGeckoPriceResponse = Record<string, { usd?: number; usd_24h_change?: number }>;

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const PRICE_CACHE_TTL_MS = 30 * 1000;
const SEARCH_RESULT_LIMIT = 10;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly searchCache = new Map<string, CachedEntry<CoinSearchResult[]>>();
  private readonly priceCache = new Map<string, CachedEntry<CoinPrice>>();

  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    const key = query.trim().toLowerCase();
    const cached = this.searchCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const response = await this.fetchJson<CoinGeckoSearchResponse>(
      `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`,
    );

    const results = response.coins.slice(0, SEARCH_RESULT_LIMIT).map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      thumb: coin.thumb,
    }));

    this.searchCache.set(key, { data: results, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });

    return results;
  }

  async getPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
    const uniqueIds = Array.from(new Set(coinIds));
    const result: Record<string, CoinPrice> = {};
    const idsToFetch: string[] = [];

    for (const id of uniqueIds) {
      const cached = this.priceCache.get(id);

      if (cached && cached.expiresAt > Date.now()) {
        result[id] = cached.data;
      } else {
        idsToFetch.push(id);
      }
    }

    if (idsToFetch.length > 0) {
      const response = await this.fetchJson<CoinGeckoPriceResponse>(
        `${COINGECKO_BASE_URL}/simple/price?ids=${idsToFetch.map(encodeURIComponent).join(',')}&vs_currencies=usd&include_24hr_change=true`,
      );

      for (const id of idsToFetch) {
        const entry = response[id];
        if (!entry || entry.usd === undefined) continue;

        const price: CoinPrice = { usd: entry.usd, usd24hChange: entry.usd_24h_change ?? 0 };
        result[id] = price;
        this.priceCache.set(id, { data: price, expiresAt: Date.now() + PRICE_CACHE_TTL_MS });
      }
    }

    return result;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    let response: globalThis.Response;

    try {
      response = await fetch(url);
    } catch {
      throw new ServiceUnavailableException('Could not reach the market data provider');
    }

    if (!response.ok) {
      this.logger.warn(`CoinGecko request failed: ${response.status} ${url}`);
      throw new ServiceUnavailableException('Market data provider returned an error');
    }

    return response.json() as Promise<T>;
  }
}
