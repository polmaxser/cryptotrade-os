import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';
import { chunkRange } from '../utils/date-range';

const BYBIT_BASE_URL = 'https://api.bybit.com';
const RECV_WINDOW_MS = '10000';
const EXECUTION_LIMIT = '100';
/** Bybit hard limit: endTime - startTime <= 7 days per request. */
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Safety cap on paginated requests per category so one huge range can't hang the import. */
const MAX_PAGES_PER_CATEGORY = 30;

/** spot + USDT/USDC-margined perpetuals — inverse (coin-margined) contracts are out of scope for now. */
const EXECUTION_CATEGORIES = ['spot', 'linear'] as const;

interface BybitExecution {
  execId: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  execPrice: string;
  execQty: string;
  execTime: string;
}

interface BybitExecutionList {
  list: BybitExecution[];
  nextPageCursor: string;
}

interface BybitResponse<T> {
  retCode: number;
  retMsg: string;
  result: T;
}

/**
 * Thin, read-only wrapper over Bybit's V5 signed REST API. Only ever calls
 * account-read and execution-history endpoints — never order placement or
 * withdrawal. Bybit signals errors both via HTTP status (401/403 for auth
 * failures) and via a retCode field in the JSON body (retCode !== 0 for
 * application-level errors like a bad signature) — both are checked here,
 * since relying on just one would miss some failure modes.
 */
@Injectable()
export class BybitClientService implements ExchangeClient {
  readonly supportsAllSymbolsFetch = true;

  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet('/v5/user/query-api', credentials, {});
  }

  /**
   * A symbol like BTCUSDT can trade under both the spot and linear (perpetual
   * futures) categories on Bybit — same string, different market. We query
   * both and merge, rather than guessing which one the trader meant. If one
   * category is unavailable for the account (e.g. derivatives not enabled),
   * that call is skipped rather than failing the whole import — only if
   * every category fails do we surface the error. `symbol` can be omitted
   * entirely — Bybit returns executions across every pair in that case.
   */
  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    const settled = await Promise.allSettled(
      EXECUTION_CATEGORIES.map((category) =>
        this.fetchCategoryFills(credentials, symbol, category, range),
      ),
    );

    const fulfilledCount = settled.filter((result) => result.status === 'fulfilled').length;

    if (fulfilledCount === 0) {
      const firstRejection = settled.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      throw firstRejection?.reason ?? new ServiceUnavailableException('Bybit fills request failed');
    }

    return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }

  /** Walks 7-day chunks (or the exchange's un-dated default window) and fully paginates each via cursor. */
  private async fetchCategoryFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    category: (typeof EXECUTION_CATEGORIES)[number],
    range: FillsRange | undefined,
  ): Promise<NormalizedFill[]> {
    const windows = range ? chunkRange(range.from, range.to, MAX_WINDOW_MS) : [undefined];
    const fills: NormalizedFill[] = [];

    for (const window of windows) {
      let cursor: string | undefined;
      let pages = 0;

      do {
        const params: Record<string, string> = { category, limit: EXECUTION_LIMIT };
        if (symbol) {
          params.symbol = symbol;
        }
        if (window) {
          params.startTime = String(window.from.getTime());
          params.endTime = String(window.to.getTime());
        }
        if (cursor) {
          params.cursor = cursor;
        }

        const response = await this.signedGet<BybitExecutionList>(
          '/v5/execution/list',
          credentials,
          params,
        );

        fills.push(
          ...response.list.map((execution) => ({
            id: `${category}:${execution.execId}`,
            symbol: execution.symbol,
            price: Number(execution.execPrice),
            qty: Number(execution.execQty),
            isBuyer: execution.side === 'Buy',
            time: Number(execution.execTime),
          })),
        );

        cursor = response.nextPageCursor || undefined;
        pages += 1;
      } while (cursor && pages < MAX_PAGES_PER_CATEGORY);
    }

    return fills;
  }

  private async signedGet<T>(
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    const timestamp = Date.now().toString();

    const signaturePayload = `${timestamp}${credentials.apiKey}${RECV_WINDOW_MS}${queryString}`;
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(signaturePayload)
      .digest('hex');

    let response: globalThis.Response;

    try {
      response = await fetch(`${BYBIT_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`, {
        headers: {
          'X-BAPI-API-KEY': credentials.apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': RECV_WINDOW_MS,
          'X-BAPI-SIGN': signature,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach Bybit');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Bybit rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Bybit API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as BybitResponse<T>;

    if (payload.retCode !== 0) {
      if (payload.retCode === 10003 || payload.retCode === 10004) {
        throw new UnauthorizedException('Bybit rejected these API credentials');
      }

      throw new ServiceUnavailableException(
        `Bybit API error (${payload.retCode}): ${payload.retMsg}`,
      );
    }

    return payload.result;
  }
}
