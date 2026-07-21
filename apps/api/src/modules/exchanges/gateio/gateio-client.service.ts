import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';
import { chunkRange } from '../utils/date-range';

const GATEIO_BASE_URL = 'https://api.gateio.ws';
const API_PREFIX = '/api/v4';
const PAGE_LIMIT = 1000;
/** Safety cap on paginated requests so a huge/unranged history can't hang the import. */
const MAX_PAGES = 30;
/** No documented per-request max window for Gate.io's ranged trade endpoints — chosen conservatively. */
const CHUNK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface GateioTotalBalance {
  total?: { amount?: string; currency?: string };
}

interface GateioSpotTrade {
  id: string;
  create_time_ms: string;
  currency_pair: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
}

interface GateioFuturesTrade {
  id: number;
  create_time: number;
  contract: string;
  /** Signed — positive is buy/long, negative is sell/short. */
  size: number;
  price: string;
}

/**
 * Thin, read-only wrapper over Gate.io's APIv4 signed REST API. Only ever
 * calls account-read and trade-history endpoints — never order placement or
 * withdrawal.
 *
 * Gate.io requires a symbol (currency_pair / contract) per request on both
 * its spot and futures trade-history endpoints, same as Binance — there's
 * no "every pair at once" call.
 */
@Injectable()
export class GateioClientService implements ExchangeClient {
  readonly supportsAllSymbolsFetch = false;

  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet('GET', '/spot/accounts', credentials, {});
  }

  /** wallet/total_balance already sums every account type (spot/margin/futures/...) converted to USDT. */
  async fetchBalance(credentials: ExchangeCredentials): Promise<number> {
    const response = await this.signedGet<GateioTotalBalance>(
      'GET',
      '/wallet/total_balance',
      credentials,
      { currency: 'USDT' },
    );

    return Number(response.total?.amount ?? 0);
  }

  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    if (!symbol) {
      throw new ServiceUnavailableException(
        'Gate.io requires a symbol per request — it has no way to list every pair at once',
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

  private async fetchSpotFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    const windows = range ? chunkRange(range.from, range.to, CHUNK_WINDOW_MS) : [undefined];
    const fills: NormalizedFill[] = [];

    for (const window of windows) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const params: Record<string, string> = {
          currency_pair: symbol,
          limit: String(PAGE_LIMIT),
          page: String(page),
        };
        if (window) {
          params.from = String(Math.floor(window.from.getTime() / 1000));
          params.to = String(Math.floor(window.to.getTime() / 1000));
        }

        const trades = await this.signedGet<GateioSpotTrade[]>(
          'GET',
          '/spot/my_trades',
          credentials,
          params,
        );
        if (trades.length === 0) break;

        fills.push(...trades.map(mapSpotFill));

        if (trades.length < PAGE_LIMIT) break;
      }
    }

    return fills;
  }

  private async fetchFuturesFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    const settle = settleCurrencyForContract(symbol);
    const windows = range ? chunkRange(range.from, range.to, CHUNK_WINDOW_MS) : [undefined];
    const fills: NormalizedFill[] = [];

    for (const window of windows) {
      let offset = 0;

      for (let page = 0; page < MAX_PAGES; page++) {
        const path = window
          ? `/futures/${settle}/my_trades_timerange`
          : `/futures/${settle}/my_trades`;
        const params: Record<string, string> = { contract: symbol, limit: String(PAGE_LIMIT) };
        if (window) {
          params.from = String(Math.floor(window.from.getTime() / 1000));
          params.to = String(Math.floor(window.to.getTime() / 1000));
        } else {
          params.offset = String(offset);
        }

        const trades = await this.signedGet<GateioFuturesTrade[]>('GET', path, credentials, params);
        if (trades.length === 0) break;

        fills.push(...trades.map(mapFuturesFill));

        if (trades.length < PAGE_LIMIT) break;
        offset += trades.length;
      }
    }

    return fills;
  }

  private async signedGet<T>(
    method: string,
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyHash = createHash('sha512').update('').digest('hex');

    const signaturePayload = [
      method,
      `${API_PREFIX}${path}`,
      queryString,
      bodyHash,
      timestamp,
    ].join('\n');
    const signature = createHmac('sha512', credentials.apiSecret)
      .update(signaturePayload)
      .digest('hex');

    let response: globalThis.Response;

    try {
      response = await fetch(
        `${GATEIO_BASE_URL}${API_PREFIX}${path}${queryString ? `?${queryString}` : ''}`,
        {
          headers: {
            KEY: credentials.apiKey,
            Timestamp: timestamp,
            SIGN: signature,
            Accept: 'application/json',
          },
        },
      );
    } catch {
      throw new ServiceUnavailableException('Could not reach Gate.io');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Gate.io rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Gate.io API error (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }
}

function mapSpotFill(fill: GateioSpotTrade): NormalizedFill {
  return {
    id: `spot:${fill.id}`,
    symbol: fill.currency_pair,
    price: Number(fill.price),
    qty: Number(fill.amount),
    isBuyer: fill.side === 'buy',
    time: Number(fill.create_time_ms),
  };
}

function mapFuturesFill(fill: GateioFuturesTrade): NormalizedFill {
  return {
    id: `futures:${fill.id}`,
    symbol: fill.contract,
    price: Number(fill.price),
    qty: Math.abs(fill.size),
    isBuyer: fill.size > 0,
    time: fill.create_time * 1000,
  };
}

/**
 * Gate.io futures contracts are named "{base}_{settle}" (e.g. "BTC_USDT"
 * settles in USDT, "BTC_USD" settles in BTC) — the settle currency is the
 * path segment every futures endpoint requires and is always derivable from
 * the contract name itself.
 */
function settleCurrencyForContract(contract: string): string {
  const parts = contract.split('_');
  return (parts[parts.length - 1] ?? 'usdt').toLowerCase();
}
