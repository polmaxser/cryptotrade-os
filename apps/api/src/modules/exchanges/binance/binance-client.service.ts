import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';
import { chunkRange } from '../utils/date-range';

const BINANCE_SPOT_BASE_URL = 'https://api.binance.com';
/** USDⓈ-M futures live on an entirely separate host from spot, with their own endpoint — same HMAC scheme though. */
const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com';
const RECV_WINDOW_MS = '10000';
/** Binance hard limits: spot startTime/endTime <= 24h apart, futures <= 7 days. */
const SPOT_MAX_WINDOW_MS = 24 * 60 * 60 * 1000;
const FUTURES_MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Safety cap on fromId-walked pages when no explicit range is given. */
const MAX_PAGES = 30;
const PAGE_LIMIT = '1000';

interface BinanceSpotFill {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
}

/** Same shape as the spot fill, except the buyer flag is named `buyer` instead of `isBuyer`. */
interface BinanceFuturesFill {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  time: number;
  buyer: boolean;
}

/**
 * Thin, read-only wrapper over Binance's signed REST API. Only ever calls
 * account-read and trade-history endpoints — never order placement or
 * withdrawal, by design, since this feature only imports history.
 */
@Injectable()
export class BinanceClientService implements ExchangeClient {
  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet(BINANCE_SPOT_BASE_URL, '/api/v3/account', credentials, {});
  }

  /**
   * Spot and USDⓈ-M futures are separate accounts with separate trade logs on
   * Binance — a symbol like BTCUSDT can have history on either or both. We
   * query both and merge, prefixing ids by market since each is its own
   * sequential id space and could otherwise collide across the two. If
   * futures isn't enabled on the account, that call fails and spot alone is
   * returned rather than failing the whole import.
   */
  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    const [spotResult, futuresResult] = await Promise.allSettled([
      this.fetchSpotFills(credentials, symbol, range),
      this.fetchFuturesFills(credentials, symbol, range),
    ]);

    if (spotResult.status === 'rejected' && futuresResult.status === 'rejected') {
      throw spotResult.reason;
    }

    return [
      ...(spotResult.status === 'fulfilled' ? spotResult.value : []),
      ...(futuresResult.status === 'fulfilled' ? futuresResult.value : []),
    ];
  }

  private async fetchSpotFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    if (range) {
      const windows = chunkRange(range.from, range.to, SPOT_MAX_WINDOW_MS);
      const fills: NormalizedFill[] = [];

      for (const window of windows) {
        // startTime/endTime can't be combined with fromId, so a window with
        // more than PAGE_LIMIT fills only returns the first PAGE_LIMIT —
        // an acceptable edge case for retail-scale trading volume.
        const trades = await this.signedGet<BinanceSpotFill[]>(
          BINANCE_SPOT_BASE_URL,
          '/api/v3/myTrades',
          credentials,
          {
            symbol,
            limit: PAGE_LIMIT,
            startTime: String(window.from.getTime()),
            endTime: String(window.to.getTime()),
          },
        );
        fills.push(...trades.map(mapSpotFill));
      }

      return fills;
    }

    return this.walkByFromId<BinanceSpotFill>(
      BINANCE_SPOT_BASE_URL,
      '/api/v3/myTrades',
      credentials,
      symbol,
      mapSpotFill,
    );
  }

  private async fetchFuturesFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    if (range) {
      const windows = chunkRange(range.from, range.to, FUTURES_MAX_WINDOW_MS);
      const fills: NormalizedFill[] = [];

      for (const window of windows) {
        const trades = await this.signedGet<BinanceFuturesFill[]>(
          BINANCE_FUTURES_BASE_URL,
          '/fapi/v1/userTrades',
          credentials,
          {
            symbol,
            limit: PAGE_LIMIT,
            startTime: String(window.from.getTime()),
            endTime: String(window.to.getTime()),
          },
        );
        fills.push(...trades.map(mapFuturesFill));
      }

      return fills;
    }

    return this.walkByFromId<BinanceFuturesFill>(
      BINANCE_FUTURES_BASE_URL,
      '/fapi/v1/userTrades',
      credentials,
      symbol,
      mapFuturesFill,
    );
  }

  /**
   * No explicit range: fromId returns trades with id >= fromId, oldest first,
   * so starting at 0 and advancing fromId past the last-seen id on each page
   * walks the account's entire history for that symbol forward from the
   * beginning — up to a safety cap of MAX_PAGES (30,000 fills), rather than
   * silently returning only whatever the un-dated default happens to be.
   */
  private async walkByFromId<T extends { id: number }>(
    baseUrl: string,
    path: string,
    credentials: ExchangeCredentials,
    symbol: string,
    mapFill: (fill: T) => NormalizedFill,
  ): Promise<NormalizedFill[]> {
    const fills: NormalizedFill[] = [];
    let fromId = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      const trades = await this.signedGet<T[]>(baseUrl, path, credentials, {
        symbol,
        limit: PAGE_LIMIT,
        fromId: String(fromId),
      });
      if (trades.length === 0) break;

      fills.push(...trades.map(mapFill));

      if (trades.length < Number(PAGE_LIMIT)) break;
      fromId = Math.max(...trades.map((t) => t.id)) + 1;
    }

    return fills;
  }

  private async signedGet<T>(
    baseUrl: string,
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams({
      ...params,
      timestamp: Date.now().toString(),
      recvWindow: RECV_WINDOW_MS,
    });
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(query.toString())
      .digest('hex');
    query.set('signature', signature);

    let response: globalThis.Response;

    try {
      response = await fetch(`${baseUrl}${path}?${query.toString()}`, {
        headers: { 'X-MBX-APIKEY': credentials.apiKey },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach Binance');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Binance rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Binance API error (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }
}

function mapSpotFill(fill: BinanceSpotFill): NormalizedFill {
  return {
    id: `spot:${fill.id}`,
    price: Number(fill.price),
    qty: Number(fill.qty),
    isBuyer: fill.isBuyer,
    time: fill.time,
  };
}

function mapFuturesFill(fill: BinanceFuturesFill): NormalizedFill {
  return {
    id: `futures:${fill.id}`,
    price: Number(fill.price),
    qty: Number(fill.qty),
    isBuyer: fill.buyer,
    time: fill.time,
  };
}
