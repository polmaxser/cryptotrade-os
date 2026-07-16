import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const BYBIT_BASE_URL = 'https://api.bybit.com';
const RECV_WINDOW_MS = '10000';
const EXECUTION_LIMIT = '100';

interface BybitExecution {
  execId: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  execPrice: string;
  execQty: string;
  execTime: string;
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
  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet('/v5/user/query-api', credentials, {});
  }

  async fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]> {
    const response = await this.signedGet<{ list: BybitExecution[] }>(
      '/v5/execution/list',
      credentials,
      { category: 'spot', symbol, limit: EXECUTION_LIMIT },
    );

    return response.list.map((execution) => ({
      id: execution.execId,
      price: Number(execution.execPrice),
      qty: Number(execution.execQty),
      isBuyer: execution.side === 'Buy',
      time: Number(execution.execTime),
    }));
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
