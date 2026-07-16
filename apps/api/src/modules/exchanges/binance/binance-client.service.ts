import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const BINANCE_BASE_URL = 'https://api.binance.com';
const RECV_WINDOW_MS = '10000';

interface BinanceFill {
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

/**
 * Thin, read-only wrapper over Binance's signed REST API. Only ever calls
 * account-read and trade-history endpoints — never order placement or
 * withdrawal, by design, since this feature only imports history.
 */
@Injectable()
export class BinanceClientService implements ExchangeClient {
  async testConnection(apiKey: string, apiSecret: string): Promise<void> {
    await this.signedGet('/api/v3/account', apiKey, apiSecret, {});
  }

  async fetchFills(apiKey: string, apiSecret: string, symbol: string): Promise<NormalizedFill[]> {
    const fills = await this.signedGet<BinanceFill[]>('/api/v3/myTrades', apiKey, apiSecret, {
      symbol,
      limit: '1000',
    });

    return fills.map((fill) => ({
      id: String(fill.id),
      price: Number(fill.price),
      qty: Number(fill.qty),
      isBuyer: fill.isBuyer,
      time: fill.time,
    }));
  }

  private async signedGet<T>(
    path: string,
    apiKey: string,
    apiSecret: string,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams({
      ...params,
      timestamp: Date.now().toString(),
      recvWindow: RECV_WINDOW_MS,
    });
    const signature = createHmac('sha256', apiSecret).update(query.toString()).digest('hex');
    query.set('signature', signature);

    let response: globalThis.Response;

    try {
      response = await fetch(`${BINANCE_BASE_URL}${path}?${query.toString()}`, {
        headers: { 'X-MBX-APIKEY': apiKey },
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
