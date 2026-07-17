import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';
import { chunkRange } from '../utils/date-range';

const KUCOIN_SPOT_BASE_URL = 'https://api.kucoin.com';
/** Futures live on a separate host with their own symbol namespace (e.g. spot "BTC-USDT" vs futures "XBTUSDTM"). */
const KUCOIN_FUTURES_BASE_URL = 'https://api-futures.kucoin.com';
const API_KEY_VERSION = '2';
const FILLS_LIMIT = '100';
const SUCCESS_CODE = '200000';
const AUTH_ERROR_CODES = new Set(['400001', '400003', '400004', '400005']);
/** KuCoin futures hard limit: startAt/endAt <= 7 days apart. Spot has no documented window cap. */
const FUTURES_MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Safety cap on paginated requests so a huge range/history can't hang the import. */
const MAX_PAGES = 30;

interface KucoinSpotFill {
  id: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  createdAt: number;
}

/** Same shape as the spot fill, except the id field is `tradeId` and the timestamp is in nanoseconds. */
interface KucoinFuturesFill {
  tradeId: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  tradeTime: number;
}

interface KucoinResponse<T> {
  code: string;
  msg?: string;
  data: T;
}

interface KucoinFuturesFillsPage {
  currentPage: number;
  pageSize: number;
  totalNum: number;
  totalPage: number;
  items: KucoinFuturesFill[];
}

/**
 * Thin, read-only wrapper over KuCoin's signed REST API. Only ever calls
 * account-read and fill-history endpoints — never order placement or
 * withdrawal. KuCoin requires a passphrase like OKX, but — unlike OKX —
 * the passphrase itself must be HMAC-SHA256-signed with the API secret
 * (not sent in plaintext), and every request needs a KC-API-KEY-VERSION
 * header (2, for current-generation API keys).
 */
@Injectable()
export class KucoinClientService implements ExchangeClient {
  /**
   * Spot fills require a symbol; futures technically don't, but treating the
   * whole client as symbol-required keeps the behavior simple and honest —
   * an "all symbols" import that silently only covered futures would be a
   * confusing partial result.
   */
  readonly supportsAllSymbolsFetch = false;

  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet(KUCOIN_SPOT_BASE_URL, '/api/v1/accounts', credentials, {});
  }

  /**
   * Spot and futures are entirely separate symbol namespaces on KuCoin (spot
   * "BTC-USDT" vs futures "XBTUSDTM"), unlike Binance/Bybit where the same
   * string spans both. Querying the wrong market for a given symbol just
   * returns an empty list, so it's safe to query both hosts and merge —
   * whichever one actually matches the symbol contributes fills.
   */
  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    if (!symbol) {
      throw new ServiceUnavailableException(
        'KuCoin requires a symbol per request — it has no way to list every pair at once',
      );
    }

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

  /** No documented max window for startAt/endAt on spot, so the range is passed through as a single window. */
  private async fetchSpotFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    const fills: NormalizedFill[] = [];
    let lastId: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params: Record<string, string> = { symbol, limit: FILLS_LIMIT };
      if (range) {
        params.startAt = String(range.from.getTime());
        params.endAt = String(range.to.getTime());
      }
      if (lastId) {
        params.lastId = lastId;
      }

      const response = await this.signedGet<{ items: KucoinSpotFill[] }>(
        KUCOIN_SPOT_BASE_URL,
        '/api/v1/hf/fills',
        credentials,
        params,
      );
      if (response.items.length === 0) break;

      fills.push(
        ...response.items.map((fill) => ({
          id: `spot:${fill.id}`,
          symbol: fill.symbol,
          price: Number(fill.price),
          qty: Number(fill.size),
          isBuyer: fill.side === 'buy',
          time: fill.createdAt,
        })),
      );

      if (response.items.length < Number(FILLS_LIMIT)) break;
      lastId = response.items[response.items.length - 1]?.id;
    }

    return fills;
  }

  private async fetchFuturesFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    const windows = range ? chunkRange(range.from, range.to, FUTURES_MAX_WINDOW_MS) : [undefined];
    const fills: NormalizedFill[] = [];

    for (const window of windows) {
      let currentPage = 1;
      let totalPage = 1;

      do {
        const params: Record<string, string> = { symbol, currentPage: String(currentPage) };
        if (window) {
          params.startAt = String(window.from.getTime());
          params.endAt = String(window.to.getTime());
        }

        const response = await this.signedGet<KucoinFuturesFillsPage>(
          KUCOIN_FUTURES_BASE_URL,
          '/api/v1/fills',
          credentials,
          params,
        );

        fills.push(
          ...response.items.map((fill) => ({
            id: `futures:${fill.tradeId}`,
            symbol: fill.symbol,
            price: Number(fill.price),
            qty: Number(fill.size),
            isBuyer: fill.side === 'buy',
            time: Math.floor(fill.tradeTime / 1_000_000),
          })),
        );

        totalPage = response.totalPage;
        currentPage += 1;
      } while (currentPage <= totalPage && currentPage <= MAX_PAGES);
    }

    return fills;
  }

  private async signedGet<T>(
    baseUrl: string,
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    if (!credentials.apiPassphrase) {
      throw new UnauthorizedException(
        'KuCoin requires an API passphrase in addition to key/secret',
      );
    }

    const query = new URLSearchParams(params);
    const queryString = query.toString();
    const requestPath = `${path}${queryString ? `?${queryString}` : ''}`;
    const timestamp = Date.now().toString();

    const signaturePayload = `${timestamp}GET${requestPath}`;
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(signaturePayload)
      .digest('base64');

    const encryptedPassphrase = createHmac('sha256', credentials.apiSecret)
      .update(credentials.apiPassphrase)
      .digest('base64');

    let response: globalThis.Response;

    try {
      response = await fetch(`${baseUrl}${requestPath}`, {
        headers: {
          'KC-API-KEY': credentials.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': API_KEY_VERSION,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach KuCoin');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('KuCoin rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`KuCoin API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as KucoinResponse<T>;

    if (payload.code !== SUCCESS_CODE) {
      if (AUTH_ERROR_CODES.has(payload.code)) {
        throw new UnauthorizedException('KuCoin rejected these API credentials');
      }

      throw new ServiceUnavailableException(
        `KuCoin API error (${payload.code}): ${payload.msg ?? 'unknown error'}`,
      );
    }

    return payload.data;
  }
}
